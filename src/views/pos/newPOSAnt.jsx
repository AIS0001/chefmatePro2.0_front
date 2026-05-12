import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layout,
  Row,
  Col,
  Card,
  Button,
  InputNumber,
  Space,
  message,
  Empty,
  Modal,
  Input,
  Tag,
  Spin,
  Alert,
  Typography,
} from "antd";
import {
  DeleteOutlined,
  PrinterOutlined,
  ShoppingCartOutlined,
  PlusOutlined,
  MinusOutlined,
  ClearOutlined,
  ArrowLeftOutlined,
  TableOutlined,
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
import CheckBillModalAnt from "../../components/Modals/CheckBillModalAnt";
import getMax from "../../functions/getMax";
import { getUserName } from "../../functions/storageUtils";
import updateData from "../../functions/updateData";
import { getNextSetupDate } from "../../utils/setupDateUtils";
import { printKOT as printKOTThermal } from "../../services/thermalPrinter";
import { baseURL } from "../../index";
import "./newPOS.css";

const { Text } = Typography;

const { Content } = Layout;
const POS_CURRENCY = "฿";

const IMAGE_BASE_URL = (process.env.REACT_APP_IMAGE_BASE_URL || baseURL || "").replace(/\/+$/, "");
const INLINE_PLACEHOLDER_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><rect width="240" height="240" rx="22" fill="#eaf2ff"/><g fill="none" stroke="#8fb3e3" stroke-width="10"><rect x="40" y="52" width="160" height="136" rx="14"/><path d="M62 164l36-42 30 28 24-22 26 36"/></g><circle cx="92" cy="96" r="11" fill="#8fb3e3"/></svg>'
)}`;

const buildItemImageUrl = (imageRef) => {
  if (!imageRef) return null;

  const raw = String(imageRef).trim();
  if (!raw) return null;

  if (/^https?:\/\//i.test(raw)) return raw;

  // If backend already returns uploads path, use it directly (with optional base URL).
  if (/^\/?uploads\//i.test(raw)) {
    const normalized = raw.startsWith("/") ? raw : `/${raw}`;
    return IMAGE_BASE_URL ? `${IMAGE_BASE_URL}${normalized}` : normalized;
  }

  // Convert windows path separators and keep only file name when full path is returned.
  const normalizedRaw = raw.replace(/\\/g, "/");
  const fileName = normalizedRaw.includes("/")
    ? normalizedRaw.substring(normalizedRaw.lastIndexOf("/") + 1)
    : normalizedRaw;

  const sanitizedName = encodeURI(fileName.replace(/^\/+/, ""));
  if (!IMAGE_BASE_URL) return `/uploads/${sanitizedName}`;
  return `${IMAGE_BASE_URL}/uploads/${sanitizedName}`;
};

const getItemImageRef = (item) => {
  if (!item) return null;
  return (
    item.filename ||
    item.file_name ||
    item.image_filename ||
    item.image_name ||
    item.image_url ||
    item.path ||
    item.image ||
    item.image_path ||
    item.filepath ||
    item.file_path ||
    null
  );
};

export default function NewPOSAnt() {
  const navigate = useNavigate();
  const itemCodeInputRef = useRef(null);
  const quickQtyInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tables, setTables] = useState([]);
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
  const [quickItemCode, setQuickItemCode] = useState("");
  const [quickQty, setQuickQty] = useState(1);

  const currentDate = format(new Date(), "yyyy-MM-dd");

  // Initialize data on mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Refresh tables when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      // console.log("Refreshing tables due to refreshTrigger:", refreshTrigger);
      fetchData("tablelist", setTables, "id", {}).catch(err => {
        console.error("Error refreshing tables:", err);
      });
    }
  }, [refreshTrigger]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [cats, subs, rawItemsData, tablesList] = await Promise.all([
        fetchData("categories", null, "id", {}),
        fetchData("subcategory", null, "id", {}),
        fetchDataFromTwoTables("items", "item_images", "id", "product_id", null, "t1.id", {}),
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
      
      // console.log(`โ… Loaded ${itemsData.length} valid items (filtered out orphaned records)`);
      
      // console.log('๐“ Fetched items data:', itemsData);
      // console.log('๐” Sample items:', itemsData?.slice(0, 5).map(item => ({
        // id: item.id,
        // name: item.iname,
        // isstockable: item.isstockable
      // })));
      
      // Check for "Black Label" specifically
      const blackLabel = itemsData?.find(item => item.iname?.toLowerCase().includes('black label'));
      if (blackLabel) {
        // console.log('๐ฅ Found Black Label in items:', {
          // id: blackLabel.id,
          // name: blackLabel.iname,
          // isstockable: blackLabel.isstockable,
          // catid: blackLabel.catid
        // });
      }
      
      setCategories(cats || []);
      setSubCategories(subs || []);
      setItems(itemsData || []);
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
    setSelectedSubCategory(null);
  };

  const handleSubCategorySelect = (subCatId) => {
    setSelectedSubCategory((prev) => (prev === subCatId ? null : subCatId));
  };

  const focusItemCodeInput = () => {
    requestAnimationFrame(() => {
      if (itemCodeInputRef.current?.focus) {
        itemCodeInputRef.current.focus();
      }
      if (itemCodeInputRef.current?.input?.select) {
        itemCodeInputRef.current.input.select();
      }
    });
  };

  const focusQuickQtyInput = () => {
    requestAnimationFrame(() => {
      if (quickQtyInputRef.current?.focus) {
        quickQtyInputRef.current.focus();
      }
    });
  };

  const findItemByQuickCode = (rawCode) => {
    const normalizedCode = String(rawCode || "").trim().toLowerCase();
    if (!normalizedCode) return null;

    return (
      (items || []).find((item) => {
        const lookupValues = [
          item?.barcode,
          item?.item_code,
          item?.code,
          item?.id,
          item?.iname,
        ];

        return lookupValues.some((value) => {
          if (value === null || value === undefined) return false;
          return String(value).trim().toLowerCase() === normalizedCode;
        });
      }) || null
    );
  };

  const handleQuickAddByCode = async () => {
    const code = String(quickItemCode || "").trim();
    if (!code) {
      message.error("Enter item code or barcode");
      focusItemCodeInput();
      return;
    }

    const quantityToAdd = Math.max(Number(quickQty) || 1, 1);
    let matchedItem = findItemByQuickCode(code);

    if (!matchedItem) {
      try {
        const [byItemCode, byBarcode, byId] = await Promise.all([
          fetchData("items", null, "id", { item_code: code }),
          fetchData("items", null, "id", { barcode: code }),
          fetchData("items", null, "id", { id: code }),
        ]);

        matchedItem =
          byItemCode?.[0] ||
          byBarcode?.[0] ||
          byId?.[0] ||
          null;
      } catch (error) {
        console.error("Error fetching item by code:", error);
      }
    }

    if (!matchedItem) {
      message.error("Item not found for this code");
      focusItemCodeInput();
      return;
    }

    await addToCartWithUnit(matchedItem, null, quantityToAdd);
    setQuickItemCode("");
    setQuickQty(1);
    focusItemCodeInput();
  };

  const getItemsByCategory = () => {
    if (!selectedCategory) return [];

    const categoryItems = items.filter(
      (item) => parseInt(item.catid) === parseInt(selectedCategory)
    );

    if (!selectedSubCategory) return categoryItems;

    return categoryItems.filter(
      (item) => parseInt(item.subcatid) === parseInt(selectedSubCategory)
    );
  };

  const getSubCategoriesByCategory = () => {
    if (!selectedCategory) return [];

    const resolveSubcategoryParentId = (sub) =>
      sub?.cat_id ?? sub?.catid ?? sub?.category_id ?? sub?.categoryid ?? sub?.category ?? sub?.cat ?? null;

    const resolveSubcategoryName = (sub) =>
      sub?.name ?? sub?.subcat ?? sub?.subcategory ?? sub?.subcategory_name ?? sub?.sname ?? null;

    const filteredSubs = (subCategories || []).filter((sub) => {
      const parentCategoryId = resolveSubcategoryParentId(sub);
      return parseInt(parentCategoryId) === parseInt(selectedCategory);
    });

    if (filteredSubs.length > 0) {
      return filteredSubs.map((sub) => ({
        ...sub,
        name: resolveSubcategoryName(sub) || `Subcategory ${sub.id}`,
      }));
    }

    const uniqueSubcatIds = [...new Set(
      (items || [])
        .filter((item) => parseInt(item.catid) === parseInt(selectedCategory))
        .map((item) => item.subcatid)
        .filter((id) => id !== null && id !== undefined && String(id).trim() !== "")
    )];

    return uniqueSubcatIds.map((id) => ({
      id,
      name: `Subcategory ${id}`,
    }));
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
    // console.log('๐’ handleAddToCart called with item:', {
      // id: item.id,
      // name: item.iname,
      // isstockable: item.isstockable,
      // fullItem: item
    // });
    
    // Check if item is stockable and has multiple units
    if (item.isstockable === 1 || item.isstockable === "1") {
      // console.log(`โ… Item ${item.iname} is stockable, fetching units for product ID ${item.id}`);
      const units = await fetchUnits(item.id);
      
      // console.log(`๐“ฆ Fetched ${units.length} units for ${item.iname}:`, units);
      
      if (units.length > 1) {
        // Show unit selection modal
        // console.log(`๐“ฑ Showing unit selection modal for ${item.iname} (ID: ${item.id})`);
        setSelectedItem(item);
        setAvailableUnits(units);
        setUnitSelectionModal(true);
        return;
      }
    }
    
    // No units or single unit - add directly
    // console.log(`โ• Adding ${item.iname} (ID: ${item.id}) directly to cart (no unit selection)`);
    addToCartWithUnit(item, null);
  };

  // Add item to cart with selected unit
  const addToCartWithUnit = async (item, selectedUnit, quantityToAdd = 1) => {
    const selectedUnitId = selectedUnit?.id ?? selectedUnit?.unit_id ?? null;
    const safeQuantity = Math.max(Number(quantityToAdd) || 1, 1);
    // console.log('๐๏ธ addToCartWithUnit called:', {
      // itemId: item.id,
      // itemName: item.iname,
      // selectedUnit: selectedUnit,
      // selectedUnitId: selectedUnitId
    // });
    
    setCart((prevCart) => {
      const existingItem = prevCart.find((i) => i.id === item.id && i.unitId === selectedUnitId);

      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.id === item.id && cartItem.unitId === selectedUnitId
            ? { ...cartItem, quantity: cartItem.quantity + safeQuantity }
            : cartItem
        );
      }

      const price = selectedUnit?.selling_price || parseFloat(item.offerprice || 0);
      const taxRate = parseFloat(item.tax || 0);
      // Tax is included in price - calculate tax portion: tax = price * (taxRate / (100 + taxRate))
      const taxAmount = price * (taxRate / (100 + taxRate));

      const cartItem = {
        id: item.id, // Always store PRODUCT ID, not variant ID
        productId: item.id, // Explicitly store product ID
        name: item.iname,
        quantity: safeQuantity,
        price: price,
        taxRate: taxRate,
        taxAmount: taxAmount,
        discount: 0,
        unitId: selectedUnitId, // Unit ID from product_units table
        unitName: selectedUnit?.unit_name || item.unit || "Pc",
        mlCapacity: selectedUnit?.ml_capacity || null,
        // For variant-based stock deduction (separate from unit)
        variantId: null, // Will be set when using product_variants API
        variantName: selectedUnit?.unit_name || null,
        quantityInBaseUnit: selectedUnit?.conversion_factor || 1,
      };

      return [...prevCart, cartItem];
    });
    
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
          // console.log(`๐” Checking stockability for item ID ${productId}: ${item.name}`);
          
          // Get the product details to check if it's stockable
          const productResponse = await axios.get(`/stock/fetchdata/items/id/${productId}`, headers);
          // console.log(`๐“ฆ Product API Response for ${item.name}:`, productResponse.data);
          
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
            console.error(`โ Product not found for ID ${productId}. API returned:`, productResponse.data);
            console.error(`โ ๏ธ Item details from cart:`, item);
            console.error(`๐’ก This item may have been deleted from the database. Please check if ID ${productId} exists in the items table.`);
            return {
              success: false,
              error: `Product ID ${productId} not found in database. Item may have been deleted.`,
              itemName: item.name
            };
          }
          
          // console.log(`๐“ Product details for ${item.name}:`, {
            // id: product.id,
            // isstockable: product.isstockable,
            // type: typeof product.isstockable,
            // unit: product.unit
          // });
          
          // Skip non-stockable items (check for 0, "0", false, null, undefined)
          const isStockable = product.isstockable === 1 || product.isstockable === "1" || product.isstockable === true;
          
          if (!isStockable) {
            // console.log(`โญ๏ธ Skipping non-stockable item: ${item.name} (isstockable: ${product.isstockable})`);
            return { success: true, skipped: true };
          }
          
          // console.log(`โ… Item ${item.name} is stockable, proceeding with deduction...`);
          
          // Get unit ID - use from cart if available, otherwise fetch unit with stock
          let unitId = item.unitId;
          
          // Keep the exact sale unit selected in cart (e.g. 30ML/60ML peg).
          // Only resolve from stock levels when unitId is absent.
          if (!unitId) {
            try {
              const stockLevelResponse = await axios.get(
                `/stock/level/${productId}`,
                headers
              );

              // console.log(`๐“ Stock levels for ${item.name}:`, stockLevelResponse.data);

              if (stockLevelResponse.data?.success && stockLevelResponse.data?.data && Array.isArray(stockLevelResponse.data.data)) {
                const stockLevels = stockLevelResponse.data.data;
                let selectedUnit = null;

                // For items without selected unit in cart, prefer base unit with stock
                selectedUnit = stockLevels.find(s =>
                  (s.unit_type === 'BASE' || s.is_base_unit === 1) &&
                  parseFloat(s.available_quantity || 0) >= item.quantity
                );

                if (!selectedUnit) {
                  selectedUnit = stockLevels.find(s =>
                    parseFloat(s.available_quantity || 0) >= item.quantity
                  );
                }

                if (!selectedUnit) {
                  selectedUnit = stockLevels.find(s =>
                    parseFloat(s.available_quantity || 0) > 0
                  );
                }

                if (selectedUnit) {
                  unitId = selectedUnit.unit_id;
                  // console.log(`โ… Using resolved unit ${unitId} (${selectedUnit.unit_name}) for ${item.name}`);
                }
              }
            } catch (unitError) {
              console.error(`Error fetching stock levels for product ${productId}:`, unitError);
            }
          } else {
            // console.log(`โ… Using cart-selected unit ${unitId} for ${item.name}`);
          }

          if (!unitId) {
            return {
              success: false,
              error: `No unit configured for ${item.name}. Please re-add item from menu and select a serving size.`,
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
            
            // console.log(`๐“ค Sending variant-based stock deduction for ${item.name} (${item.variantName}):`, variantPayload);
            
            response = await axios.post(
              `/stock/remove-variant`,
              variantPayload,
              headers
            );
            
            // console.log(`โ… Stock deducted via variant for ${item.name}:`, response.data);
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
            
            // console.log(`๐“ค Sending stock deduction request for ${item.name}:`, stockPayload);
            
            response = await axios.post(
              `/stock/remove`,
              stockPayload,
              headers
            );
            
            // console.log(`โ… Stock deducted for ${item.name}:`, response.data);
          }
          
          return { success: true, data: response.data };
          
        } catch (itemError) {
          console.error(`โ Error deducting stock for item ${item.name}:`, itemError);
          console.error(`โ Error response:`, itemError.response?.data);
          console.error(`โ Error status:`, itemError.response?.status);
          
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
      
      // console.log(`๐“ Stock Deduction Results:`, {
        // total: results.length,
        // success: successCount,
        // skipped: skipped.length,
        // failed: failures.length
      // });
      
      if (failures.length > 0) {
        const failedItems = failures.map(f => `${f.itemName}: ${f.error}`).join(', ');
        message.error(`Stock deduction failed: ${failedItems}`, 10);
        console.error('Stock deduction failures:', failures);
        return false;
      }
      
      if (skipped.length > 0) {
        // console.log(`โน๏ธ ${skipped.length} non-stockable item(s) skipped`);
      }
      
      if (successCount > 0) {
        setStockDeducted(true);
        message.success(`โ… Stock deducted for ${successCount} item(s)`);
        // console.log(`โ… Successfully deducted stock for ${successCount} items`);
        return true;
      } else if (skipped.length === results.length) {
        // All items were skipped - no stock items in cart
        // console.log('โน๏ธ No stockable items in cart - skipping stock deduction');
        message.info('Order saved (no stockable items)');
        return true;
      }
      
      return true;
      
    } catch (error) {
      console.error("โ Error in deductStock:", error);
      message.error(`Failed to deduct stock: ${error.response?.data?.message || error.message}`);
      return false;
    }
  };

  // HTML thermal KOT fallback (used when ESC/POS agent is not configured)
  const printKOTHtmlFallback = (kotData) => {
    const newWindow = window.open('', '_blank', 'width=400,height=600');
    if (!newWindow) return;
    const itemRows = (kotData.items || [])
      .map(
        (item) =>
          `<tr><td style="padding:2px 4px;font-size:20px;">${item.item_name}</td><td style="padding:2px 4px;text-align:right;font-size:20px;">${item.quantity}</td></tr>`
      )
      .join('');
    newWindow.document.write(`
      <html>
        <head>
          <style>
            body { font-family: monospace; width: 80mm; margin: 0; padding: 6px; font-size: 20px; }
            h2 { text-align: center; margin: 4px 0; font-size: 22px; }
            .divider { border-top: 1px dashed #000; margin: 6px 0; }
            table { width: 100%; border-collapse: collapse; }
            th { text-align: left; font-size: 20px; border-bottom: 1px solid #000; }
            th:last-child { text-align: right; }
            td:last-child { text-align: right; }
          </style>
        </head>
        <body>
          <h2>KOT</h2>
          <div class="divider"></div>
          <div style="font-size:20px;"><strong>Table:</strong> ${kotData.table || '-'}</div>
          <div style="font-size:20px;"><strong>Order #:</strong> ${kotData.orderNumber || '-'}</div>
          <div style="font-size:20px;"><strong>Time:</strong> ${new Date().toLocaleTimeString()}</div>
          <div class="divider"></div>
          <table>
            <thead><tr><th>Item</th><th>Qty</th></tr></thead>
            <tbody>${itemRows}</tbody>
          </table>
          <div class="divider"></div>
        </body>
      </html>
    `);
    newWindow.document.close();
    newWindow.onload = () => { newWindow.print(); newWindow.close(); };
  };

  // Send KOT via ESC/POS thermal printer
  const handleSendKOT = async () => {
    if (!selectedTable) {
      message.error('Please select a table!');
      return;
    }

    if (cart.length === 0) {
      message.error('Cart is empty!');
      return;
    }

    let processingMsgClose = null;
    try {
      setLoading(true);
      processingMsgClose = message.loading('Processing order...', 0);

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
        // console.log("โ… ORDER SAVED SUCCESSFULLY");
        processingMsgClose();
        message.success(response.data.message || 'Order saved successfully');
        setKotPrinted(true);

        // Deduct stock from inventory
        const stockDeductionSuccess = await deductStock(currentOrderNumber);
        if (stockDeductionSuccess) {
          // console.log('โ… Stock deducted successfully');
          setStockDeducted(true);
        } else {
          message.warning('Order saved but stock deduction failed. Please check manually.');
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
          showSuccessMessage: false,
          showErrorMessage: false
        });

        if (printResult) {
          // console.log('โ… KOT sent to thermal printer successfully');
          message.success('Order saved, stock deducted, and KOT sent to thermal printer!');
        } else {
          // ESC/POS not configured or failed - fall back to HTML thermal KOT
          printKOTHtmlFallback(kotData);
          message.info('ESC/POS printer not configured. KOT printed via browser.');
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
          // console.log("KOT ESC/POS sent successfully, table status updated to RUNNING, data refreshed...");
        }).catch((err) => {
          console.error("Error updating table status:", err);
        });

        // Reset form after successful KOT
        setTimeout(() => {
          resetPOS();
        }, 1500);
        
      } else {
        processingMsgClose();
        message.error("Failed to save the order!");
      }
    } catch (error) {
      console.error('โ Error in handleSendKOT:', error);
      if (processingMsgClose) processingMsgClose();
      
      // Check if it's a network/connection error
      if (error.message === 'Failed to fetch' || error.message.includes('Network') || error.code === 'ERR_NETWORK') {
        message.error('โ ๏ธ Connection error! Check your network and printer server.');
      } else {
        message.error('Error: ' + (error.response?.data?.message || error.message || 'Unknown error'));
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
        // console.log("Printing ESCPOS receipt for Bill:", billResponse.data.bill_id);
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
  };

  const totals = calculateTotals();

  const categoryButtons = categories.map((cat) => (
    <Button
      key={cat.id}
      size="large"
      onClick={() => handleCategorySelect(cat.id)}
      className="pos-category-strip__button"
      style={{
        backgroundColor: selectedCategory === cat.id ? "#d8e7da" : "#eef3ee",
        color: "#24312c",
        borderColor: selectedCategory === cat.id ? "#b6cab9" : "#d6dccf",
        fontWeight: selectedCategory === cat.id ? 700 : 600,
      }}
    >
      {cat.name}
    </Button>
  ));

  return (
    <Layout className="soft-pos-theme pos-shell pos-ant-blue" style={{ minHeight: "100vh" }}>
      <Header title="POS - Stock Managed System" />

      <Content className="pos-main-content">
        <Spin spinning={loading}>
          <Row className="pos-category-strip-row" style={{ marginTop: 6 }}>
            <Col span={24}>
              <div className="pos-category-strip">
                <div className="pos-category-strip__scroller">
                  {categoryButtons.length > 0 ? (
                    categoryButtons
                  ) : (
                    <span className="pos-category-strip__empty">No categories available</span>
                  )}
                </div>
                <div className="pos-category-strip__actions">
                  <Button
                    className="pos-top-action-btn pos-top-action-btn--display"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate(-1)}
                    title="Back"
                  />
                  <Button
                    className="pos-top-action-btn pos-top-action-btn--table"
                    icon={<TableOutlined />}
                    onClick={showTableSelection}
                    title="Select Table"
                  >
                    {selectedTable && <span className="pos-float-btn__badge">1</span>}
                  </Button>
                  <Button
                    className="pos-top-action-btn pos-top-action-btn--home"
                    icon={<CheckCircleOutlined />}
                    onClick={showCheckBill}
                    title="Check Bill"
                  />
                </div>
              </div>
            </Col>
          </Row>

          <Row gutter={12} style={{ marginTop: 4 }}>
            <Col xs={24} md={6} lg={4} className="pos-subcategory-col">
              <Card
                title="Subcategories"
                className="pos-panel-surface"
                bodyStyle={{ padding: 8 }}
                style={{ borderRadius: 14, minHeight: "calc(100vh - 250px)" }}
              >
                <div style={{ maxHeight: "calc(100vh - 320px)", overflowY: "auto", padding: 2 }}>
                  <Space direction="vertical" size={6} style={{ width: "100%" }}>
                    {selectedCategory ? (
                      getSubCategoriesByCategory().length > 0 ? (
                        getSubCategoriesByCategory().map((sub) => (
                          <Button
                            key={sub.id}
                            block
                            onClick={() => handleSubCategorySelect(sub.id)}
                            style={{
                              minHeight: 38,
                              fontWeight: selectedSubCategory === sub.id ? 700 : 600,
                              color: "#24312c",
                              borderColor: selectedSubCategory === sub.id ? "#bccfbe" : "#ddd5c9",
                              backgroundColor: selectedSubCategory === sub.id ? "#edf4ed" : "#f7f3ed",
                            }}
                          >
                            {sub.name || `Subcategory ${sub.id}`}
                          </Button>
                        ))
                      ) : (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No subcategories" />
                      )
                    ) : (
                      categories.length > 0 ? (
                        categories.map((cat) => (
                          <Button
                            key={cat.id}
                            block
                            onClick={() => handleCategorySelect(cat.id)}
                            style={{
                              minHeight: 38,
                              fontWeight: 600,
                              color: "#24312c",
                              borderColor: "#ddd5c9",
                              backgroundColor: "#f7f3ed",
                            }}
                          >
                            {cat.name}
                          </Button>
                        ))
                      ) : (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No category" />
                      )
                    )}
                    {selectedSubCategory && (
                        <Button
                          block
                          onClick={() => setSelectedSubCategory(null)}
                          style={{
                            minHeight: 38,
                            fontWeight: 600,
                            color: "#24312c",
                            borderColor: "#d4c7b0",
                            backgroundColor: "#fff7eb",
                          }}
                        >
                          Show All Items
                        </Button>
                    )}
                  </Space>
                </div>
              </Card>
            </Col>

            <Col xs={24} md={12} lg={14} className="pos-items-col">
              <Card
                title="Items"
                className="pos-panel-surface"
                bodyStyle={{ padding: 10 }}
                style={{ borderRadius: 14, minHeight: "calc(100vh - 250px)" }}
              >
                <div style={{ maxHeight: "calc(100vh - 320px)", overflowY: "auto", paddingBottom: 8 }}>
                  {selectedCategory ? (
                    <Row gutter={[10, 10]}>
                      {getItemsByCategory().map((item) => {
                        const qtyInCart = cart
                          .filter((cartItem) => cartItem.id === item.id)
                          .reduce((acc, cartItem) => acc + Number(cartItem.quantity || 0), 0);

                        return (
                          <Col xs={12} sm={8} md={8} lg={6} xl={4} key={item.id}>
                            <Card
                              hoverable
                              onClick={() => handleAddToCart(item)}
                              className="pos-menu-card"
                              bodyStyle={{ padding: 10 }}
                              style={{
                                cursor: "pointer",
                                borderRadius: 14,
                                border: "1px solid #ded4c5",
                                backgroundColor: "#fffdf9",
                                minHeight: 210,
                                position: "relative",
                              }}
                            >
                              {qtyInCart > 0 && <span className="pos-menu-qty-badge">{qtyInCart}</span>}
                              <div className="pos-menu-image-wrap" style={{ marginBottom: 10 }}>
                                {getItemImageRef(item) ? (
                                  <img
                                    alt={item.iname}
                                    src={buildItemImageUrl(getItemImageRef(item))}
                                    className="pos-menu-image"
                                    onError={(e) => {
                                      e.currentTarget.onerror = null;
                                      e.currentTarget.src = INLINE_PLACEHOLDER_IMAGE;
                                    }}
                                  />
                                ) : (
                                  <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#7e8a84",
                                    fontWeight: 600,
                                    fontSize: 12,
                                  }}>
                                    No image
                                  </div>
                                )}
                              </div>
                              <div className="pos-menu-content">
                                <h5 className="pos-menu-name">{item.iname || "N/A"}</h5>
                                <div className="pos-menu-meta">
                                  <span className="pos-menu-price">{POS_CURRENCY} {parseFloat(item.offerprice || 0).toFixed(2)}</span>
                                </div>
                              </div>
                            </Card>
                          </Col>
                        );
                      })}
                    </Row>
                  ) : (
                    <div className="pos-empty-state">
                      <strong>No items available</strong>
                      <span>Choose a category to load the menu for this station.</span>
                    </div>
                  )}
                </div>
              </Card>
            </Col>

            <Col xs={24} md={6} lg={6} className="pos-order-summary-col">
              <Card
                title={selectedTable ? `Table ${selectedTable}` : "Order"}
                className="pos-panel-surface"
                bodyStyle={{ padding: 8 }}
                style={{ borderRadius: 14, minHeight: "calc(100vh - 250px)" }}
              >
                <div className="pos-quick-add-card">
                  <div className="pos-quick-add-card__title">Quick Add Item</div>
                  <Input
                    ref={itemCodeInputRef}
                    value={quickItemCode}
                    placeholder="Item Code / Barcode"
                    size="small"
                    style={{ marginBottom: 8 }}
                    onChange={(event) => setQuickItemCode(event.target.value)}
                    onPressEnter={(event) => {
                      event.preventDefault();
                      focusQuickQtyInput();
                    }}
                  />
                  <InputNumber
                    ref={quickQtyInputRef}
                    min={1}
                    value={quickQty}
                    size="small"
                    style={{ width: "100%", marginBottom: 4 }}
                    onChange={(value) => setQuickQty(value || 1)}
                    onKeyDown={async (event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        await handleQuickAddByCode();
                      }
                    }}
                  />
                  <small className="pos-quick-add-card__hint">Press Enter to move to quantity, then Enter again to add.</small>
                </div>

                <div style={{ maxHeight: "calc(100vh - 470px)", overflowY: "auto", paddingRight: 2 }}>
                  {cart.length > 0 ? (
                    cart.map((item, index) => (
                      <div
                        key={`${item.id}-${item.unitId || "base"}-${index}`}
                        className="pos-cart-line"
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}
                      >
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#24312c", lineHeight: 1.25 }}>
                          {item.name} x {item.quantity} = {POS_CURRENCY} {(item.quantity * item.price).toFixed(2)}
                        </div>
                        <Space.Compact>
                          <Button size="small" icon={<MinusOutlined />} onClick={() => updateCartItem(item.id, item.quantity - 1, item.unitId)} />
                          <Button size="small" icon={<PlusOutlined />} onClick={() => updateCartItem(item.id, item.quantity + 1, item.unitId)} />
                          <Button danger size="small" icon={<DeleteOutlined />} onClick={() => removeCartItem(item.id, item.unitId)} />
                        </Space.Compact>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: 8, fontSize: 12, color: "#1f2b26", fontWeight: 600 }}>
                      Your cart is empty.
                    </div>
                  )}
                </div>

                {(kotPrinted || stockDeducted) && (
                  <Space direction="vertical" size={8} style={{ width: "100%" }}>
                    {kotPrinted && <Alert type="success" message="KOT Printed & Stock Deducted" showIcon />}
                    {stockDeducted && <Alert type="success" message="Stock Deducted from Inventory" showIcon />}
                  </Space>
                )}
              </Card>
            </Col>
          </Row>

          <div className="pos-bottom-bar">
            <div className="pos-bottom-top-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10, borderBottom: "1px solid #ddd5c9", paddingBottom: 10 }}>
              <div className="pos-total-label">
                Total: <span>{POS_CURRENCY} {totals.grandTotal.toFixed(2)}</span>
              </div>
              <div className="pos-bottom-actions">
                <Button
                  className="pos-btn-main pos-btn-kot"
                  type="primary"
                  icon={<PrinterOutlined />}
                  onClick={handleSendKOT}
                  loading={loading}
                  disabled={cart.length === 0}
                >
                  KOT
                </Button>
                <Button className="pos-btn-main pos-btn-clear" icon={<ClearOutlined />} onClick={resetPOS} danger>
                  Clear Cart
                </Button>
              </div>
            </div>

            <Space wrap className="pos-bottom-secondary-actions">
              <Button className="pos-btn-secondary" onClick={() => navigate(-1)}>Back</Button>
              <Button className="pos-btn-secondary" onClick={refreshTables} loading={loading}>Refresh</Button>
              <Button className="pos-btn-secondary" onClick={showCheckBill}>Check Bill</Button>
              <Button className="pos-btn-secondary" onClick={handleSendESCPOS} disabled={cart.length === 0}>Print Bill</Button>
              <Button className="pos-btn-secondary pos-btn-secondary-danger" danger onClick={() => navigate("/logout")}>Logout</Button>
            </Space>
          </div>
        </Spin>
      </Content>

      {/* Table Selection Modal */}
      <TableSelectionModal
        isOpen={tableSelectionModal}
        onClose={() => setTableSelectionModal(false)}
        tables={tables}
        onTableSelect={handleTableClick}
        selectedTable={selectedTable}
      />

      <CheckBillModalAnt
        isOpen={checkBillModal}
        customer={selectedCustomer}
        uptableList={selectedTable}
        refreshTrigger={refreshTrigger}
        onClose={() => setCheckBillModal(false)}
      />

      {/* Unit/Variant Selection Modal - Ant Design */}
      <Modal
        title={(
          <Space direction="vertical" size={0}>
            <Space size={8}>
              <ShoppingCartOutlined style={{ color: "#1677ff" }} />
              <Text strong style={{ fontSize: 18 }}>Choose Your Serving Size</Text>
            </Space>
            {selectedItem && (
              <Text type="secondary" style={{ marginLeft: 24 }}>
                {selectedItem.iname}
              </Text>
            )}
          </Space>
        )}
        open={unitSelectionModal}
        onCancel={() => setUnitSelectionModal(false)}
        footer={null}
        width={600}
        styles={{ body: { padding: 20 } }}
        centered
      >
        {selectedItem && (
          <div>
            {loadingUnits ? (
              <div style={{ textAlign: "center", padding: "56px 0" }}>
                <Spin size="large" tip="Loading serving sizes..." />
              </div>
            ) : availableUnits.length > 0 ? (
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                {availableUnits.map((unit) => {
                  const isPopular = unit.unit_type === "DERIVED" && unit.ml_capacity <= 60;
                  const isBase = unit.unit_type === "BASE" || unit.is_base_unit === 1;

                  return (
                    <Card
                      key={unit.id ?? unit.unit_id}
                      hoverable
                      onClick={() => addToCartWithUnit(selectedItem, unit)}
                      className={`variant-card ${isPopular ? "variant-card--popular" : ""}`}
                      bodyStyle={{ padding: "18px 20px" }}
                    >
                      {isPopular && (
                        <div className="variant-card__popular-pill">
                          <StarFilled style={{ fontSize: 10 }} /> POPULAR
                        </div>
                      )}
                      <Row align="middle" justify="space-between" gutter={16}>
                        <Col flex="auto">
                          <Space direction="vertical" size={6}>
                            <Space size={8} wrap>
                              <Text strong style={{ fontSize: 18 }}>
                                {unit.unit_name}
                              </Text>
                              {unit.ml_capacity && <Tag color="blue">{unit.ml_capacity}ML</Tag>}
                              {isBase && <Tag color="green">FULL SIZE</Tag>}
                            </Space>
                            {unit.conversion_factor && unit.conversion_factor !== 1 && (
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {(1 / unit.conversion_factor).toFixed(2)} servings per bottle
                              </Text>
                            )}
                          </Space>
                        </Col>
                        <Col>
                          <Space direction="vertical" size={0} align="end">
                            <Text strong style={{ fontSize: 28, color: "#1677ff", lineHeight: 1 }}>
                              เธฟ{parseFloat(unit.selling_price || 0).toFixed(2)}
                            </Text>
                            {unit.purchase_price && unit.purchase_price !== unit.selling_price && (
                              <Text type="secondary" delete>
                                เธฟ{parseFloat(unit.purchase_price).toFixed(2)}
                              </Text>
                            )}
                          </Space>
                        </Col>
                      </Row>
                    </Card>
                  );
                })}

                <Alert
                  type="info"
                  showIcon
                  icon={<CheckCircleOutlined />}
                  message="Click on any option to add to cart"
                />
              </Space>
            ) : (
              <Empty description="No serving sizes configured for this item" style={{ padding: "52px 0" }} />
            )}
          </div>
        )}
      </Modal>

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
