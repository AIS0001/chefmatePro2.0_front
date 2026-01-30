import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layout,
  Row,
  Col,
  Card,
  Button,
  Table,
  InputNumber,
  Select,
  Drawer,
  Space,
  message,
  Statistic,
  Divider,
  Empty,
  Modal,
  Form,
  Input,
  Tag,
  Spin,
  Alert,
  Typography,
} from "antd";
import {
  DeleteOutlined,
  PrinterOutlined,
  SaveOutlined,
  ShoppingCartOutlined,
  PlusOutlined,
  MinusOutlined,
  ClearOutlined,
  ArrowLeftOutlined,
  TableOutlined,
  UserOutlined,
  CheckCircleOutlined,
  StarFilled,
} from "@ant-design/icons";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { format } from "date-fns";
import { getHeaders } from "../../utility/getHeader";
import fetchData from "../../functions/fetchData";
import fetchDataFromTwoTables from "../../functions/fetchdatawithTwoTables";
import Header from "../../components/Header";
import TableSelectionModal from "../../components/Modals/TableSelectionModal";
import CheckBillModal from "../../components/Modals/CheckBillModal";
import getMax from "../../functions/getMax";
import { getUserName } from "../../functions/storageUtils";
import updateData from "../../functions/updateData";
import { getNextSetupDate } from "../../utils/setupDateUtils";
import { printKOT as printKOTThermal } from "../../services/thermalPrinter";
import "./newPOS.css";

const { Title, Text } = Typography;

const { Sider, Content } = Layout;
const { Option } = Select;

export default function NewPOSAnt() {
  const baseURL = 'http://localhost:4402';
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tables, setTables] = useState([]);
  const [showItemDrawer, setShowItemDrawer] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [billForm] = Form.useForm();
  const [discountType, setDiscountType] = useState("fixed");
  const [discountValue, setDiscountValue] = useState(0);
  const [roundOff, setRoundOff] = useState(0);
  const [paymentMode, setPaymentMode] = useState("Cash");

  // Stock deduction states
  const [kotPrinted, setKotPrinted] = useState(false);
  const [stockDeducted, setStockDeducted] = useState(false);
  
  // Table selection modal
  const [tableSelectionModal, setTableSelectionModal] = useState(false);
  
  // Check Bill modal
  const [checkBillModal, setCheckBillModal] = useState(false);
  
  // Unit selection modal
  const [unitSelectionModal, setUnitSelectionModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [availableUnits, setAvailableUnits] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  
  // Order number and refresh states
  const [maxNumber, setMaxNumber] = useState(0);
  const [selectedTableCategory, setSelectedTableCategory] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const currentDate = format(new Date(), "yyyy-MM-dd");

  // Initialize data on mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Refresh tables when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log("Refreshing tables due to refreshTrigger:", refreshTrigger);
      fetchData("tablelist", setTables, "id", {}).catch(err => {
        console.error("Error refreshing tables:", err);
      });
    }
  }, [refreshTrigger]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [cats, rawItemsData, custs, tablesList] = await Promise.all([
        fetchData("categories", null, "id", {}),
        fetchDataFromTwoTables("items", "item_images", "id", "product_id", null, "t1.id", {}),
        fetchData("customers", null, "id", {}),
        fetchData("tablelist", null, "id", {}),
      ]);
      
      // Map items to ensure we're using the ID from items table, not item_images table
      // The join returns item_images.id, but we need items.id (which is in product_id field)
      // Also filter out orphaned records (where product doesn't exist in items table)
      const itemsData = rawItemsData
        ?.filter(item => item.iname && item.product_id) // Filter out orphaned records
        ?.map(item => ({
          ...item,
          id: item.product_id || item.id  // Use product_id from items table instead of id from item_images
        })) || [];
      
      console.log(`✅ Loaded ${itemsData.length} valid items (filtered out orphaned records)`);
      
      console.log('📊 Fetched items data:', itemsData);
      console.log('🔍 Sample items:', itemsData?.slice(0, 5).map(item => ({
        id: item.id,
        name: item.iname,
        isstockable: item.isstockable
      })));
      
      // Check for "Black Label" specifically
      const blackLabel = itemsData?.find(item => item.iname?.toLowerCase().includes('black label'));
      if (blackLabel) {
        console.log('🥃 Found Black Label in items:', {
          id: blackLabel.id,
          name: blackLabel.iname,
          isstockable: blackLabel.isstockable,
          catid: blackLabel.catid
        });
      }
      
      setCategories(cats || []);
      setItems(itemsData || []);
      setCustomers(custs || []);
      setTables(tablesList || []);
      
      // Get max order number
      await getMax("orders", setMaxNumber, "userid", getUserName(), "order_number");
    } catch (error) {
      console.error("Error fetching initial data:", error);
      toast.error("Failed to load POS data");
    } finally {
      setLoading(false);
    }
  };

  const showTableSelection = () => {
    setTableSelectionModal(true);
  };

  const showCheckBill = () => {
    setCheckBillModal(true);
  };

  const refreshTables = async () => {
    try {
      setLoading(true);
      const tablesList = await fetchData("tablelist", null, "id", {});
      setTables(tablesList || []);
      message.success('Tables refreshed successfully');
    } catch (error) {
      console.error("Error refreshing tables:", error);
      toast.error("Failed to refresh tables");
    } finally {
      setLoading(false);
    }
  };

  const handleTableClick = (tableNumber, tableCategoryId) => {
    setSelectedTable(tableNumber);
    setSelectedTableCategory(tableCategoryId);
    setTableSelectionModal(false);
    message.success(`Table ${tableNumber} selected`);
  };

  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId);
    setShowItemDrawer(true);
  };

  const getItemsByCategory = () => {
    if (!selectedCategory) return [];
    return items.filter((item) => item.catid === selectedCategory);
  };

  // Fetch available units for a product
  const fetchUnits = async (productId) => {
    try {
      setLoadingUnits(true);
      const headers = getHeaders();
      const response = await axios.get(`/stock/units/${productId}`, headers);
      
      if (response.data && response.data.data && response.data.data.length > 0) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching units:', error);
      return [];
    } finally {
      setLoadingUnits(false);
    }
  };

  // Handle item click - show unit selection if multiple units exist
  const handleAddToCart = async (item) => {
    console.log('🛒 handleAddToCart called with item:', {
      id: item.id,
      name: item.iname,
      isstockable: item.isstockable,
      fullItem: item
    });
    
    // Check if item is stockable and has multiple units
    if (item.isstockable === 1 || item.isstockable === "1") {
      console.log(`✅ Item ${item.iname} is stockable, fetching units for product ID ${item.id}`);
      const units = await fetchUnits(item.id);
      
      console.log(`📦 Fetched ${units.length} units for ${item.iname}:`, units);
      
      if (units.length > 1) {
        // Show unit selection modal
        console.log(`📱 Showing unit selection modal for ${item.iname} (ID: ${item.id})`);
        setSelectedItem(item);
        setAvailableUnits(units);
        setUnitSelectionModal(true);
        return;
      }
    }
    
    // No units or single unit - add directly
    console.log(`➕ Adding ${item.iname} (ID: ${item.id}) directly to cart (no unit selection)`);
    addToCartWithUnit(item, null);
  };

  // Add item to cart with selected unit
  const addToCartWithUnit = (item, selectedUnit) => {
    console.log('🛍️ addToCartWithUnit called:', {
      itemId: item.id,
      itemName: item.iname,
      selectedUnit: selectedUnit,
      selectedUnitId: selectedUnit?.id
    });
    
    const existingItem = cart.find((i) => i.id === item.id && i.unitId === selectedUnit?.id);

    if (existingItem) {
      console.log(`♻️ Item ${item.iname} already in cart, updating quantity`);
      updateCartItem(item.id, existingItem.quantity + 1, selectedUnit?.id);
    } else {
      const price = selectedUnit?.selling_price || parseFloat(item.offerprice || 0);
      const taxRate = parseFloat(item.tax || 0);
      // Tax is included in price - calculate tax portion: tax = price * (taxRate / (100 + taxRate))
      const taxAmount = price * (taxRate / (100 + taxRate));
      
      const cartItem = {
        id: item.id, // Always store PRODUCT ID, not variant ID
        productId: item.id, // Explicitly store product ID
        name: item.iname,
        quantity: 1,
        price: price,
        taxRate: taxRate,
        taxAmount: taxAmount,
        discount: 0,
        unitId: selectedUnit?.id || null, // Unit ID from product_units table
        unitName: selectedUnit?.unit_name || item.unit || "Pc",
        mlCapacity: selectedUnit?.ml_capacity || null,
        // For variant-based stock deduction (separate from unit)
        variantId: null, // Will be set when using product_variants API
        variantName: selectedUnit?.unit_name || null,
        quantityInBaseUnit: selectedUnit?.conversion_factor || 1,
      };
      
      console.log('✅ Adding new item to cart:', cartItem);
      setCart([...cart, cartItem]);
    }
    
    const unitText = selectedUnit ? ` (${selectedUnit.unit_name})` : '';
    message.success(`${item.iname}${unitText} added to cart`);
    setUnitSelectionModal(false);
  };

  const updateCartItem = (itemId, quantity, unitId = null) => {
    if (quantity <= 0) {
      removeCartItem(itemId, unitId);
      return;
    }
    setCart(
      cart.map((item) =>
        item.id === itemId && (unitId === null || item.unitId === unitId)
          ? { ...item, quantity }
          : item
      )
    );
  };

  const removeCartItem = (itemId, unitId = null) => {
    setCart(
      cart.filter(
        (item) => !(item.id === itemId && (unitId === null || item.unitId === unitId))
      )
    );
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalTax = 0;

    cart.forEach((item) => {
      const itemTotal = item.quantity * item.price;
      subtotal += itemTotal;
      // Tax is already included in price, just extract the tax portion
      totalTax += item.quantity * item.taxAmount;
    });

    let discount = 0;
    if (discountType === "fixed") {
      discount = discountValue;
    } else {
      discount = (subtotal * discountValue) / 100;
    }

    const beforeRound = subtotal - discount;
    const grandTotal = beforeRound + roundOff;

    return {
      subtotal,
      totalTax,
      discount,
      beforeRound,
      roundOff,
      grandTotal,
    };
  };

  // Deduct stock from inventory
  const deductStock = async (billId) => {
    try {
      const headers = getHeaders();
      
      // Filter only stockable items and prepare deduction requests
      const stockDeductionPromises = cart.map(async (item) => {
        try {
          // Use productId if available, fallback to id
          const productId = item.productId || item.id;
          console.log(`🔍 Checking stockability for item ID ${productId}: ${item.name}`);
          
          // Get the product details to check if it's stockable
          const productResponse = await axios.get(`/stock/fetchdata/items/id/${productId}`, headers);
          console.log(`📦 Product API Response for ${item.name}:`, productResponse.data);
          
          // Handle response structure from the endpoint
          let product = null;
          if (productResponse.data?.success && productResponse.data?.data && Array.isArray(productResponse.data.data)) {
            product = productResponse.data.data[0]; // {success: true, data: []}
          } else if (productResponse.data?.data && Array.isArray(productResponse.data.data) && productResponse.data.data.length > 0) {
            product = productResponse.data.data[0]; // data: [...]
          } else if (Array.isArray(productResponse.data) && productResponse.data.length > 0) {
            product = productResponse.data[0]; // Direct array
          } else if (productResponse.data?.id) {
            product = productResponse.data; // Single object
          }
          
          if (!product) {
            console.error(`❌ Product not found for ID ${productId}. API returned:`, productResponse.data);
            console.error(`⚠️ Item details from cart:`, item);
            console.error(`💡 This item may have been deleted from the database. Please check if ID ${productId} exists in the items table.`);
            return {
              success: false,
              error: `Product ID ${productId} not found in database. Item may have been deleted.`,
              itemName: item.name
            };
          }
          
          console.log(`📋 Product details for ${item.name}:`, {
            id: product.id,
            isstockable: product.isstockable,
            type: typeof product.isstockable,
            unit: product.unit
          });
          
          // Skip non-stockable items (check for 0, "0", false, null, undefined)
          const isStockable = product.isstockable === 1 || product.isstockable === "1" || product.isstockable === true;
          
          if (!isStockable) {
            console.log(`⏭️ Skipping non-stockable item: ${item.name} (isstockable: ${product.isstockable})`);
            return { success: true, skipped: true };
          }
          
          console.log(`✅ Item ${item.name} is stockable, proceeding with deduction...`);
          
          // Get unit ID - use from cart if available, otherwise fetch unit with stock
          let unitId = item.unitId;
          
          // Always check stock levels to ensure selected unit has stock (or find alternative unit)
          try {
            // Get stock levels to find which unit has available stock
            const stockLevelResponse = await axios.get(
              `/stock/level/${productId}`,
              headers
            );
            
            console.log(`📊 Stock levels for ${item.name}:`, stockLevelResponse.data);
            
            if (stockLevelResponse.data?.success && stockLevelResponse.data?.data && Array.isArray(stockLevelResponse.data.data)) {
              const stockLevels = stockLevelResponse.data.data;
              
              // Find unit with available stock
              let selectedUnit = null;
              
              if (unitId) {
                // If unit was pre-selected from cart, check if it has stock
                selectedUnit = stockLevels.find(s => 
                  parseInt(s.unit_id) === parseInt(unitId) && 
                  parseFloat(s.available_quantity || 0) >= item.quantity
                );
                
                if (selectedUnit) {
                  console.log(`✅ Using pre-selected unit ${unitId} (${selectedUnit.unit_name}) with ${selectedUnit.available_quantity} available for ${item.name}`);
                } else {
                  console.warn(`⚠️ Pre-selected unit ${unitId} doesn't have sufficient stock. Finding alternative...`);
                  // Fall back to finding any unit with stock
                  selectedUnit = stockLevels.find(s => 
                    parseFloat(s.available_quantity || 0) >= item.quantity
                  );
                  
                  if (selectedUnit) {
                    unitId = selectedUnit.unit_id;
                    console.log(`✅ Switched to unit ${unitId} (${selectedUnit.unit_name}) with ${selectedUnit.available_quantity} available`);
                  }
                }
              } else {
                // No pre-selected unit, find one with stock
                // First try to find BASE unit with stock
                selectedUnit = stockLevels.find(s => 
                  (s.unit_type === 'BASE' || s.is_base_unit === 1) && 
                  parseFloat(s.available_quantity || 0) >= item.quantity
                );
                
                // If no BASE unit with stock, find any unit with sufficient stock
                if (!selectedUnit) {
                  selectedUnit = stockLevels.find(s => 
                    parseFloat(s.available_quantity || 0) >= item.quantity
                  );
                }
                
                // If still no unit found, try any unit with any stock
                if (!selectedUnit) {
                  selectedUnit = stockLevels.find(s => 
                    parseFloat(s.available_quantity || 0) > 0
                  );
                }
                
                if (selectedUnit) {
                  unitId = selectedUnit.unit_id;
                  console.log(`✅ Using unit ${unitId} (${selectedUnit.unit_name}) with ${selectedUnit.available_quantity} available for ${item.name}`);
                }
              }
              
              if (!selectedUnit) {
                throw new Error(`No units with available stock found for product ${item.id}`);
              }
            } else {
              throw new Error(`No stock levels found for product ${productId}`);
            }
          } catch (unitError) {
            console.error(`Error fetching stock levels for product ${productId}:`, unitError);
            return {
              success: false,
              error: `Unable to verify stock for ${item.name}. Please try again.`,
              itemName: item.name
            };
          }
          
          // Deduct stock using variant-based API if variant is selected
          let response;
          
          if (item.variantId) {
            // Use variant-based deduction for serving sizes (30ML, 60ML, etc.)
            const variantPayload = {
              productId: parseInt(item.productId || item.id),
              variantId: parseInt(item.variantId),
              quantity: parseFloat(item.quantity),
              referenceId: parseInt(billId),
              notes: `Sale - Order #${billId} - Table: ${selectedTable || "Walk-in"} - ${item.variantName}`,
            };
            
            console.log(`📤 Sending variant-based stock deduction for ${item.name} (${item.variantName}):`, variantPayload);
            
            response = await axios.post(
              "/stock/remove-variant",
              variantPayload,
              headers
            );
            
            console.log(`✅ Stock deducted via variant for ${item.name}:`, response.data);
          } else {
            // Use standard stock deduction for regular items
            const stockPayload = {
              productId: parseInt(item.productId || item.id),
              unitId: parseInt(unitId),
              quantity: parseFloat(item.quantity),
              referenceType: "SALE",
              referenceId: parseInt(billId),
              notes: `Sale - Order #${billId} - Table: ${selectedTable || "Walk-in"}`,
            };
            
            console.log(`📤 Sending stock deduction request for ${item.name}:`, stockPayload);
            
            response = await axios.post(
              "/stock/remove",
              stockPayload,
              headers
            );
            
            console.log(`✅ Stock deducted for ${item.name}:`, response.data);
          }
          
          return { success: true, data: response.data };
          
        } catch (itemError) {
          console.error(`❌ Error deducting stock for item ${item.name}:`, itemError);
          console.error(`❌ Error response:`, itemError.response?.data);
          console.error(`❌ Error status:`, itemError.response?.status);
          
          const errorMessage = itemError.response?.data?.message || itemError.message;
          
          // Check for specific error types
          if (itemError.response?.status === 400) {
            if (errorMessage.includes('Insufficient stock')) {
              return { 
                success: false, 
                error: `Insufficient stock for ${item.name}`,
                itemName: item.name 
              };
            } else if (errorMessage.includes('No stock available for this unit')) {
              return { 
                success: false, 
                error: `No stock configured for ${item.name}. Please add stock in inventory first.`,
                itemName: item.name 
              };
            }
          }
          
          return { 
            success: false, 
            error: errorMessage || `Failed to deduct stock for ${item.name}`,
            itemName: item.name 
          };
        }
      });

      const results = await Promise.all(stockDeductionPromises);
      
      // Check if any deductions failed
      const failures = results.filter(r => r.success === false);
      const skipped = results.filter(r => r.skipped === true);
      const successCount = results.filter(r => r.success && !r.skipped).length;
      
      console.log(`📊 Stock Deduction Results:`, {
        total: results.length,
        success: successCount,
        skipped: skipped.length,
        failed: failures.length
      });
      
      if (failures.length > 0) {
        const failedItems = failures.map(f => `${f.itemName}: ${f.error}`).join(', ');
        message.error(`Stock deduction failed: ${failedItems}`, 10);
        console.error('Stock deduction failures:', failures);
        return false;
      }
      
      if (skipped.length > 0) {
        console.log(`ℹ️ ${skipped.length} non-stockable item(s) skipped`);
      }
      
      if (successCount > 0) {
        setStockDeducted(true);
        message.success(`✅ Stock deducted for ${successCount} item(s)`);
        console.log(`✅ Successfully deducted stock for ${successCount} items`);
        return true;
      } else if (skipped.length === results.length) {
        // All items were skipped - no stock items in cart
        console.log('ℹ️ No stockable items in cart - skipping stock deduction');
        message.info('Order saved (no stockable items)');
        return true;
      }
      
      return true;
      
    } catch (error) {
      console.error("❌ Error in deductStock:", error);
      message.error(`Failed to deduct stock: ${error.response?.data?.message || error.message}`);
      return false;
    }
  };

  // Send KOT via ESC/POS thermal printer
  const handleSendKOT = async () => {
    if (!selectedTable) {
      toast.error('Please select a table!');
      return;
    }

    if (cart.length === 0) {
      toast.error('Cart is empty!');
      return;
    }

    try {
      setLoading(true);
      toast.info('Processing order...');

      // Get the next setup date
      const setupDate = await getNextSetupDate();
      const totals = calculateTotals();

      // Get order number (using maxNumber from state)
      const currentOrderNumber = maxNumber || Date.now();

      // Prepare order items early for faster processing
      const orderItems = cart.map(item => ({
        order_number: currentOrderNumber,
        table_number: selectedTable,
        item_name: item.name,
        quantity: parseFloat(item.quantity.toFixed(2)),
        price: parseFloat(item.price),
        total_amount: parseFloat((item.price * item.quantity).toFixed(2)),
        status: "1",
        uom: item.uom || "",
        weight_based: item.weight === "weight" ? 1 : 0,
        setup_date: setupDate,
        // Add category information for reporting
        category_id: item.categoryId || null,
        category_name: item.categoryName || null,
        subcategory_id: item.subcategoryId || null,
        // Add table category for filtering
        table_cat_id: selectedTableCategory || null,
      }));

      const headers = getHeaders();

      // Save order data in parallel
      const [response, response1] = await Promise.all([
        axios.post(`/insertdata/orders`, {
          userid: getUserName(),
          order_number: currentOrderNumber,
          table_number: selectedTable,
          total_amount: totals.grandTotal,
          status: "1",
        }, headers),
        
        axios.post(`/insertdatabulk/order_items`, {
          items: orderItems
        }, headers)
      ]);

      if (response1.data.success) {
        console.log("✅ ORDER SAVED SUCCESSFULLY");
        toast.success(response.data.message);
        setKotPrinted(true);

        // Deduct stock from inventory
        const stockDeductionSuccess = await deductStock(currentOrderNumber);
        if (stockDeductionSuccess) {
          console.log('✅ Stock deducted successfully');
          setStockDeducted(true);
        } else {
          toast.warning('Order saved but stock deduction failed. Please check manually.');
        }

        // Prepare KOT data with variant information
        const kotData = {
          table: selectedTable,
          orderNumber: currentOrderNumber,
          timestamp: new Date().toISOString(),
          items: cart.map(item => {
            // Include variant info in item name if available
            let itemName = item.name;
            if (item.variantName && item.mlCapacity) {
              itemName = `${item.name} (${item.mlCapacity}ML - ${item.variantName})`;
            } else if (item.variantName) {
              itemName = `${item.name} (${item.variantName})`;
            } else if (item.mlCapacity) {
              itemName = `${item.name} (${item.mlCapacity}ML)`;
            }
            
            return {
              item_name: itemName,
              quantity: parseFloat(item.quantity.toFixed(2))
            };
          }),
          total: totals.grandTotal.toFixed(2)
        };

        // Print KOT using thermal printer service
        const printResult = await printKOTThermal(kotData, {
          showSuccessMessage: false, // We'll show custom message
          showErrorMessage: false    // We'll handle errors here
        });

        if (printResult) {
          console.log('✅ KOT sent to thermal printer successfully');
          toast.success('Order saved, stock deducted, and KOT sent to thermal printer!');
        } else {
          toast.warning('Order saved and stock deducted but KOT print failed. Check printer.');
        }
        
        // Clear cart after successful operations
        setCart([]);
        
        // Update table status to 1 (running/occupied) and refresh data
        Promise.all([
          updateData("tablelist", { status: 1 }, { name: selectedTable }),
          fetchData("tablelist", setTables, "id", {}),
          getMax("orders", setMaxNumber, "userid", getUserName(), "order_number")
        ]).then(() => {
          setRefreshTrigger(prev => prev + 1);
          console.log("KOT ESC/POS sent successfully, table status updated to RUNNING, data refreshed...");
        }).catch((err) => {
          console.error("Error updating table status:", err);
        });

        // Reset form after successful KOT
        setTimeout(() => {
          resetPOS();
        }, 1500);
        
      } else {
        toast.error("Failed to save the order!");
      }
    } catch (error) {
      console.error('❌ Error in handleSendKOT:', error);
      
      // Check if it's a network/connection error
      if (error.message === 'Failed to fetch' || error.message.includes('Network') || error.code === 'ERR_NETWORK') {
        toast.error('⚠️ Connection error! Check your network and printer server.', {
          autoClose: 5000
        });
      } else {
        toast.error('Error: ' + (error.response?.data?.message || error.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Send ESCPOS (Thermal Printer)
  const handleSendESCPOS = async () => {
    if (cart.length === 0) {
      message.warning("Cart is empty");
      return;
    }

    try {
      setLoading(true);

      // If stock hasn't been deducted yet, deduct it now
      if (!stockDeducted) {
        const stockDeducted = await deductStock(Date.now());
        if (!stockDeducted) {
          return;
        }
      }

      // Create bill
      const totals = calculateTotals();
      const headers = getHeaders();
      
      const billData = {
        customer_id: selectedCustomer || null,
        tablenumber: selectedTable || 0,
        subtotal: totals.subtotal,
        subtotal_afterdiscount: totals.subtotal - totals.discount,
        tax: totals.totalTax,
        discount_type: discountType,
        discount_value: discountValue,
        round_off: roundOff,
        grand_total: totals.grandTotal,
        payment_mode: paymentMode,
        status: "Paid",
        setup_date: currentDate,
      };

      const billResponse = await axios.post(
        "/savebill",
        billData,
        headers
      );

      if (billResponse.data.success) {
        message.success("Bill saved successfully");
        
        // Print receipt
        console.log("Printing ESCPOS receipt for Bill:", billResponse.data.bill_id);
        toast.success("Receipt sent to printer");

        // Reset POS
        setTimeout(() => {
          resetPOS();
        }, 2000);
      }
    } catch (error) {
      console.error("Error in ESCPOS:", error);
      toast.error(`Failed to save bill: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetPOS = () => {
    setCart([]);
    setSelectedCustomer(null);
    setSelectedTable(null);
    setDiscountValue(0);
    setDiscountType("fixed");
    setRoundOff(0);
    setPaymentMode("Cash");
    setKotPrinted(false);
    setStockDeducted(false);
    setShowItemDrawer(false);
  };

  const cartColumns = [
    {
      title: "Item",
      dataIndex: "name",
      key: "name",
      width: "40%",
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{name}</div>
          {record.unitName && (
            <Tag color="cyan" size="small" style={{ marginTop: 4 }}>
              {record.unitName}
              {record.mlCapacity && ` (${record.mlCapacity}ML)`}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Qty",
      dataIndex: "quantity",
      key: "quantity",
      width: "15%",
      render: (qty, record) => (
        <Space>
          <Button
            size="small"
            icon={<MinusOutlined />}
            onClick={() => updateCartItem(record.id, qty - 1)}
          />
          <span>{qty}</span>
          <Button
            size="small"
            icon={<PlusOutlined />}
            onClick={() => updateCartItem(record.id, qty + 1)}
          />
        </Space>
      ),
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      width: "15%",
      render: (price) => `฿${parseFloat(price || 0).toFixed(2)}`,
    },
    {
      title: "Total",
      key: "total",
      width: "15%",
      render: (_, record) => `฿${(parseFloat(record.quantity || 0) * parseFloat(record.price || 0)).toFixed(2)}`,
    },
    {
      title: "Action",
      key: "action",
      width: "15%",
      render: (_, record) => (
        <Button
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => removeCartItem(record.id)}
        />
      ),
    },
  ];

  const totals = calculateTotals();

  const categoryButtons = categories.map((cat) => (
    <Button
      key={cat.id}
      block
      size="large"
      onClick={() => handleCategorySelect(cat.id)}
      style={{
        marginBottom: 8,
        backgroundColor:
          selectedCategory === cat.id ? "#1890ff" : "#e6f4ff",
        color: selectedCategory === cat.id ? "white" : "#0050b3",
        border: "none",
        fontWeight: selectedCategory === cat.id ? "600" : "500",
        transition: "all 0.3s ease"
      }}
    >
      {cat.name}
    </Button>
  ));

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header title="POS - Stock Managed System" />
      <Layout>
        {/* Categories Sidebar */}
        <Sider width={150} style={{ background: "#f0f5ff", overflow: "auto" }}>
          <div style={{ padding: 16 }}>
            <Space direction="vertical" style={{ width: "100%" }}>
              {categoryButtons}
            </Space>
          </div>
        </Sider>

        {/* Main Content */}
        <Content style={{ padding: 16, backgroundColor: "#f5f7fa" }}>
          <Spin spinning={loading}>
            <div style={{ marginBottom: 16 }}>
              <Button 
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(-1)}
                type="text"
                size="large"
              >
                Back
              </Button>
            </div>
            <Row gutter={16}>
              {/* Items Grid */}
              <Col xs={24} sm={24} md={16}>
                <Card 
                  title="Select Items" 
                  bordered={false}
                  style={{ 
                    backgroundColor: "#ffffff",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)"
                  }}
                >
                  {selectedCategory ? (
                    <Row gutter={[12, 12]}>
                      {getItemsByCategory().map((item) => (
                        <Col xs={12} sm={8} md={6} lg={4} key={item.id}>
                          <Card
                            hoverable
                            onClick={() => handleAddToCart(item)}
                            style={{ 
                              cursor: "pointer",
                              backgroundColor: "#fafbfc",
                              borderColor: "#e6f4ff",
                              transition: "all 0.3s ease"
                            }}
                            cover={
                              item.filename ? (
                                <img
                                  alt={item.iname}
                                  src={`${baseURL}/uploads/${item.filename}`}
                                  style={{
                                    height: 100,
                                    objectFit: "cover",
                                    backgroundColor: "#f0f2f5",
                                    cursor: "pointer"
                                  }}
                                  onError={(e) => {
                                    e.target.src = `${baseURL}/uploads/placeholder.jpg`;
                                  }}
                                />
                              ) : null
                            }
                          >
                            <div style={{ 
                              fontSize: 12,
                              fontWeight: "500",
                              marginBottom: 6,
                              color: "#262626",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis"
                            }}>
                              {item.iname || "N/A"} <span style={{color: '#ff4d4f', fontSize: 10}}>#{item.id}</span>
                            </div>
                            <div style={{ 
                              fontSize: 14, 
                              fontWeight: "bold",
                              color: "#1890ff",
                              marginBottom: 6
                            }}>
                              ฿{parseFloat(item.offerprice || 0).toFixed(2)}
                            </div>
                            <Tag color="cyan" style={{ fontSize: 10 }}>{item.unit || "Pc"}</Tag>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  ) : (
                    <Empty description="Select a category to view items" />
                  )}
                </Card>
              </Col>

              {/* Cart & Checkout */}
              <Col xs={24} sm={24} md={8}>
                <Card 
                  title={<ShoppingCartOutlined />} 
                  bordered={false}
                  style={{ 
                    backgroundColor: "#ffffff",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)"
                  }}
                >
                  {/* Customer & Table Selection */}
                  <Form layout="vertical" style={{ marginBottom: 16 }}>
                    <Form.Item label={<span><UserOutlined /> Customer</span>} style={{ marginBottom: 12 }}>
                      <Select
                        placeholder="Select customer (optional)"
                        value={selectedCustomer}
                        onChange={setSelectedCustomer}
                        allowClear
                        style={{ backgroundColor: "#f5f7fa" }}
                        suffixIcon={<UserOutlined />}
                      >
                        {customers.map((cust) => (
                          <Option key={cust.id} value={cust.id}>
                            {cust.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item label={<span><TableOutlined /> Table</span>} style={{ marginBottom: 12 }}>
                      <Space.Compact style={{ width: '100%' }}>
                        <Input
                          value={selectedTable ? `Table ${selectedTable}` : ''}
                          placeholder="No table selected"
                          readOnly
                          style={{ backgroundColor: "#f5f7fa" }}
                        />
                        <Button 
                          type="primary" 
                          icon={<TableOutlined />}
                          onClick={showTableSelection}
                        >
                          Select
                        </Button>
                        {selectedTable && (
                          <Button 
                            danger
                            onClick={() => setSelectedTable(null)}
                          >
                            Clear
                          </Button>
                        )}
                      </Space.Compact>
                    </Form.Item>
                  </Form>

                  <Divider />

                  {/* Cart Items */}
                  <div style={{ maxHeight: 300, overflow: "auto" }}>
                    <Table
                      columns={cartColumns}
                      dataSource={cart}
                      pagination={false}
                      size="small"
                      rowKey="id"
                    />
                  </div>

                  <Divider />

                  {/* Totals */}
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="Subtotal"
                        value={totals.subtotal}
                        precision={2}
                        prefix="฿"
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Tax"
                        value={totals.totalTax}
                        precision={2}
                        prefix="฿"
                      />
                    </Col>
                  </Row>

                  <Row gutter={16} style={{ marginTop: 16 }}>
                    <Col span={12}>
                      <Form layout="vertical">
                        <Form.Item label="Discount Type" style={{ marginBottom: 0 }}>
                          <Select
                            value={discountType}
                            onChange={setDiscountType}
                            style={{ backgroundColor: "#f5f7fa" }}
                          >
                            <Option value="fixed">Fixed</Option>
                            <Option value="percentage">Percentage</Option>
                          </Select>
                        </Form.Item>
                      </Form>
                    </Col>
                    <Col span={12}>
                      <Form layout="vertical">
                        <Form.Item label="Discount Value" style={{ marginBottom: 0 }}>
                          <InputNumber
                            min={0}
                            value={discountValue}
                            onChange={setDiscountValue}
                            style={{ width: "100%", backgroundColor: "#f5f7fa" }}
                          />
                        </Form.Item>
                      </Form>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="Discount"
                        value={totals.discount}
                        precision={2}
                        prefix="฿"
                      />
                    </Col>
                    <Col span={12}>
                      <Form layout="vertical">
                        <Form.Item label="Round Off" style={{ marginBottom: 0 }}>
                          <InputNumber
                            value={roundOff}
                            onChange={setRoundOff}
                            style={{ width: "100%", backgroundColor: "#f5f7fa" }}
                          />
                        </Form.Item>
                      </Form>
                    </Col>
                  </Row>

                  <Row gutter={16} style={{ marginTop: 16, marginBottom: 16 }}>
                    <Col span={24}>
                      <Statistic
                        title="Grand Total"
                        value={totals.grandTotal}
                        precision={2}
                        prefix="฿"
                        valueStyle={{ color: "#52c41a", fontSize: 24 }}
                      />
                    </Col>
                  </Row>

                  {/* Payment Mode */}
                  <Form layout="vertical" style={{ marginBottom: 16 }}>
                    <Form.Item label="Payment Mode" style={{ marginBottom: 0 }}>
                      <Select 
                        value={paymentMode} 
                        onChange={setPaymentMode}
                        style={{ backgroundColor: "#f5f7fa" }}
                      >
                        <Option value="Cash">Cash</Option>
                        <Option value="Card">Card</Option>
                        <Option value="QR Code">QR Code</Option>
                        <Option value="Credit">Credit</Option>
                      </Select>
                    </Form.Item>
                  </Form>

                  {/* Action Buttons */}
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Alert
                      type="info"
                      message="Stock will be automatically deducted when KOT or Bill is sent"
                      showIcon
                    />

                    <Button
                      type="primary"
                      icon={<PrinterOutlined />}
                      block
                      size="large"
                      onClick={handleSendKOT}
                      loading={loading}
                      disabled={cart.length === 0}
                    >
                      Send KOT (Deduct Stock)
                    </Button>

                    <Button
                      type="primary"
                      block
                      size="large"
                      onClick={refreshTables}
                      loading={loading}
                      style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
                    >
                      🔄 Refresh Tables
                    </Button>

                    <Button
                      type="default"
                      icon={<PrinterOutlined />}
                      block
                      size="large"
                      onClick={showCheckBill}
                      style={{ backgroundColor: '#ffc107', borderColor: '#ffc107', color: '#000' }}
                    >
                      💰 Check Bill
                    </Button>

                    <Button
                      danger
                      icon={<ClearOutlined />}
                      block
                      onClick={resetPOS}
                    >
                      Clear All
                    </Button>
                  </Space>

                  {kotPrinted && (
                    <Alert
                      type="success"
                      message="KOT Printed & Stock Deducted"
                      style={{ marginTop: 16 }}
                    />
                  )}

                  {stockDeducted && (
                    <Alert
                      type="success"
                      message="Stock Deducted from Inventory"
                      style={{ marginTop: 16 }}
                    />
                  )}
                </Card>
              </Col>
            </Row>
          </Spin>
        </Content>
      </Layout>

      {/* Table Selection Modal */}
      <TableSelectionModal
        isOpen={tableSelectionModal}
        onClose={() => setTableSelectionModal(false)}
        tables={tables}
        onTableSelect={handleTableClick}
        selectedTable={selectedTable}
      />

      <CheckBillModal
        isOpen={checkBillModal}
        customer={selectedCustomer}
        uptableList={selectedTable}
        refreshTrigger={refreshTrigger}
        onClose={() => setCheckBillModal(false)}
      />

      {/* Unit/Variant Selection Modal - Sleek Ant Design UI */}
      <Modal
        title={null}
        open={unitSelectionModal}
        onCancel={() => setUnitSelectionModal(false)}
        footer={null}
        width={600}
        styles={{ body: { padding: 0 } }}
        centered
      >
        {selectedItem && (
          <div>
            {/* Header Section */}
            <div style={{ 
              padding: '24px 24px 16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShoppingCartOutlined style={{ fontSize: 24 }} />
                  <Title level={4} style={{ margin: 0, color: 'white' }}>
                    Choose Your Serving Size
                  </Title>
                </div>
                <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.95)', fontWeight: 500 }}>
                  {selectedItem.iname}
                </Text>
              </Space>
            </div>
            
            {/* Content Section */}
            <div style={{ padding: 24 }}>
              {loadingUnits ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <Spin size="large" tip="Loading serving sizes..." />
                </div>
              ) : availableUnits.length > 0 ? (
                <Row gutter={[16, 16]}>
                  {availableUnits.map((unit, index) => {
                    const isPopular = unit.unit_type === 'DERIVED' && unit.ml_capacity <= 60;
                    const isBase = unit.unit_type === 'BASE' || unit.is_base_unit === 1;
                    
                    return (
                      <Col span={24} key={unit.id}>
                        <Card
                          hoverable
                          onClick={() => addToCartWithUnit(selectedItem, unit)}
                          style={{
                            cursor: 'pointer',
                            border: isPopular ? '2px solid #52c41a' : '2px solid #f0f0f0',
                            borderRadius: 12,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            position: 'relative',
                            overflow: 'visible',
                            background: isPopular ? '#f6ffed' : 'white'
                          }}
                          bodyStyle={{ padding: '20px 24px' }}
                          className="variant-card"
                        >
                          {isPopular && (
                            <div style={{
                              position: 'absolute',
                              top: -10,
                              right: 16,
                              background: '#52c41a',
                              color: 'white',
                              padding: '4px 12px',
                              borderRadius: 12,
                              fontSize: 12,
                              fontWeight: 600,
                              boxShadow: '0 2px 8px rgba(82, 196, 26, 0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}>
                              <StarFilled style={{ fontSize: 10 }} />
                              POPULAR
                            </div>
                          )}
                          
                          <Row align="middle" justify="space-between">
                            <Col flex="auto">
                              <Space direction="vertical" size={8}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                  <Text style={{ 
                                    fontSize: 18, 
                                    fontWeight: 600, 
                                    color: '#1f1f1f'
                                  }}>
                                    {unit.unit_name}
                                  </Text>
                                  
                                  {unit.ml_capacity && (
                                    <Tag 
                                      color="blue" 
                                      style={{ 
                                        borderRadius: 6,
                                        padding: '2px 10px',
                                        fontSize: 13,
                                        fontWeight: 500
                                      }}
                                    >
                                      {unit.ml_capacity}ML
                                    </Tag>
                                  )}
                                  
                                  {isBase && (
                                    <Tag 
                                      color="green"
                                      style={{ 
                                        borderRadius: 6,
                                        padding: '2px 10px',
                                        fontSize: 11,
                                        fontWeight: 500
                                      }}
                                    >
                                      FULL SIZE
                                    </Tag>
                                  )}
                                </div>
                                
                                {unit.conversion_factor && unit.conversion_factor !== 1 && (
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    {(1 / unit.conversion_factor).toFixed(2)} servings per bottle
                                  </Text>
                                )}
                              </Space>
                            </Col>
                            
                            <Col>
                              <Space direction="vertical" size={2} align="end">
                                <div style={{ 
                                  fontSize: 24, 
                                  fontWeight: 700, 
                                  color: '#1890ff',
                                  lineHeight: 1
                                }}>
                                  ฿{parseFloat(unit.selling_price || 0).toFixed(2)}
                                </div>
                                {unit.purchase_price && unit.purchase_price !== unit.selling_price && (
                                  <div style={{ 
                                    fontSize: 13, 
                                    color: '#bfbfbf',
                                    textDecoration: 'line-through',
                                    lineHeight: 1
                                  }}>
                                    ฿{parseFloat(unit.purchase_price).toFixed(2)}
                                  </div>
                                )}
                              </Space>
                            </Col>
                          </Row>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              ) : (
                <Empty 
                  description={
                    <span style={{ color: '#8c8c8c' }}>
                      No serving sizes configured for this item
                    </span>
                  }
                  style={{ padding: '60px 0' }}
                />
              )}
            </div>
            
            {/* Footer Hint */}
            {availableUnits.length > 0 && (
              <div style={{ 
                padding: '16px 24px',
                background: '#fafafa',
                borderTop: '1px solid #f0f0f0',
                textAlign: 'center'
              }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <CheckCircleOutlined style={{ marginRight: 4 }} />
                  Click on any option to add to cart
                </Text>
              </div>
            )}
          </div>
        )}
      </Modal>
      
      <style jsx>{`
        .variant-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(24, 144, 255, 0.12) !important;
          border-color: #1890ff !important;
        }
      `}</style>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </Layout>
  );
}
