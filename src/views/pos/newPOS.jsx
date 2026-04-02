import React, { useEffect, useState, useRef } from "react";
import { Link,useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { getHeaders } from "../../utility/getHeader";
import fetchDataFromTwoTables from "../../functions/fetchdatawithTwoTables";
import { format } from "date-fns";
import CardComponent from "../../components/cards/CardComponent";
// import Header from "../../components/Header"; // ✅ Removed Header import
// import Layout from "../../layout/Layout"; // ✅ Removed Layout import
import fetchData from "../../functions/fetchData";
import { Textfield } from "../../components/Buttons/Textfield";
import getMax from "../../functions/getMax";
import getRunningTable from "../../functions/getRunningTable";
import { getUserName } from "../../functions/storageUtils";
import updateData from "../../functions/updateData";
import CheckBillModal from "../../components/Modals/CheckBillModal";
import TableSelectionModal from "../../components/Modals/TableSelectionModal";
import ReprintKOTModal from "../../components/Modals/ReprintKOTModal";
import { baseURL } from "../../index"; // Import baseURL from index.js
import ReprintKOTOrderModal from "../../components/Modals/ReprintKOTOrderModal";
import { FaEdit, FaTrash, FaPrint, FaTable, FaHome, FaDesktop, FaEye } from "react-icons/fa"; // ✅ Added icons
import ESCPosAutoDetectButton from "../../components/ESCPosAutoDetectButton"; // ✅ Import ESC/POS auto-detect printer button
import customerDisplayManager from "../../services/CustomerDisplayManager"; // ✅ Import customer display manager
import { getNextSetupDate } from "../../utils/setupDateUtils"; // ✅ Import setup date utility
import "./newPOS.css"; // ✅ Import POS styles


//const itemPrices = Array.from({ length: 9 }, (_, index) => 100 + index * 50);
export default function NewPOS() {
  //console.log("NewPOS Component: Component is rendering...");
  
  const LOCAL_PRINT_AGENT_URL =
    process.env.REACT_APP_LOCAL_PRINT_AGENT_URL || "http://127.0.0.1:5010"; // Local printing agent endpoint
  //  const baseURL = 'https://www.balibeachcluapi.livecloudnet.com';
  //const baseURL = 'https://www.chefmateapi.cloudnetsoftwares.com';
   
  let currentDate = format(new Date(), "yyyy-MM-dd");

  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [quickItemCode, setQuickItemCode] = useState("");
  const [lastAddedAt, setLastAddedAt] = useState(0);
  const itemCodeInputRef = useRef(null);
  const [quickQty, setQuickQty] = useState("1");
  const [total, setTotal] = useState(0);
  const [maxNumber, setmaxNumber] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [Tablelist, settableList] = useState(null);
  const [TotalTablelist, setTotaltablelist] = useState([]); // Initialize as empty array instead of 0

  const [selectedContract, setSelectedContract] = useState(null);
  const [tableshowModal, settableShowModal] = useState(false);
  const [tableSelectionModal, setTableSelectionModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Add refresh trigger state

  // Reprint KOT states
  const [reprintModalOpen, setReprintModalOpen] = useState(false);
  const [reprintOrderModalOpen, setReprintOrderModalOpen] = useState(false);
  const [reprintTable, setReprintTable] = useState("");
  const [reprintOrderNumbers, setReprintOrderNumbers] = useState([]);
  const [reprintOrderNumber, setReprintOrderNumber] = useState(null);
  const [reprintOrderField, setReprintOrderField] = useState("order_number");
  const [reprintItems, setReprintItems] = useState([]);
  const [reprintLoadingOrders, setReprintLoadingOrders] = useState(false);
  const [reprintLoadingItems, setReprintLoadingItems] = useState(false);

  // ✅ Customer Display States
  const [isCustomerDisplayOpen, setIsCustomerDisplayOpen] = useState(false);

  const [companyInfo, setCompanyInfo] = useState({});

  const resolveCompanyName = () => {
    const profileName =
      companyInfo?.name ||
      companyInfo?.company_name ||
      companyInfo?.companyName ||
      companyInfo?.shop_name;
    const storedShopName = localStorage.getItem("shop_name") || sessionStorage.getItem("shop_name");

    return (profileName || storedShopName || "Restaurant").trim();
  };

  // ✅ Draggable Action Card States
  const [actionCardPos, setActionCardPos] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const actionCardRef = React.useRef(null);

  // Position the action card at bottom-right on mount
  useEffect(() => {
    const cardWidth = actionCardRef.current?.offsetWidth || 340;
    const cardHeight = actionCardRef.current?.offsetHeight || 220;
    const x = Math.max(window.innerWidth - cardWidth - 20, 20);
    const y = Math.max(window.innerHeight - cardHeight - 20, 20);
    setActionCardPos({ x, y });
  }, []);

  const showtableBillDetails = (contract) => {
    // setSelectedContract(contract);
    // fetchData("tablelist", setTotaltablelist, "id", {  });
    settableShowModal(true);
  };

  const showTableSelection = () => {
    setTableSelectionModal(true);
  };

  const showReprintKOT = () => {
    setReprintModalOpen(true);
  };

  const closeReprintKOT = () => {
    setReprintModalOpen(false);
    setReprintOrderModalOpen(false);
    setReprintTable("");
    setReprintOrderNumbers([]);
    setReprintOrderNumber(null);
    setReprintOrderField("order_number");
    setReprintItems([]);
    setReprintLoadingOrders(false);
    setReprintLoadingItems(false);
  };

  const [tableStatus, setTableStatus] = useState(
    Array.from({ length: 20 }, () => "vacant") // Default all tables to "vacant"
  );
  const navigate = useNavigate();

  const getDashboardPath = () => {
    const userType = (localStorage.getItem("usertype") || sessionStorage.getItem("usertype") || "").toLowerCase();
    if (userType === "cashier") return "/dashboard/cashier";
    if (userType === "account") return "/dashboard/account";
    if (userType === "manager") return "/dashboard/admin";
    return "/dashboard";
  };

  const navigateToDashboard = () => {
    navigate(getDashboardPath());
  };

  // Navigate to login when token is invalid/expired
  const handleAuthError = (error) => {
    const message = (error?.response?.data?.message || error?.message || '').toLowerCase();
    if (error?.response?.status === 401 || message.includes('invalid or expired token')) {
      toast.error('Session expired. Please login again.');
      navigate('/login');
      return true;
    }
    return false;
  };

  const columns = [
    { label: "Product Id", field: "product_id" },
    { label: "Image", field: "filename" },
    { label: "Photo", field: "path" },
  ];

  // Fetch subcategories when a category is clicked
  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId); // Keep track of selected category
    // Fetch subcategories using fetchData function
    fetchData("subcategory", setSubcategories, "id", { cat_id: categoryId });
  };
  // Add this state for tracking the order number and selected table
  const [orderNumber, setOrderNumber] = useState(1);  // Starts with 1 or fetched from the backend
  const [selectedTable, setSelectedTable] = useState(null); // Table selection
  const [selectedTableCategory, setSelectedTableCategory] = useState(null); // Table category ID
  // Handle table selection
  const handleTableClick = (tableNumber, tableCategoryId ) => {
    // console.log("handleTableClick called with:", { tableNumber, tableCategoryId });
    // console.log("Table category ID type:", typeof tableCategoryId);
    // console.log("Table category ID value:", tableCategoryId);
    
    // Ensure category ID is an integer
    let finalCategoryId = null;
    if (tableCategoryId !== null && tableCategoryId !== undefined && tableCategoryId !== '') {
      finalCategoryId = typeof tableCategoryId === 'number' ? tableCategoryId : parseInt(tableCategoryId, 10);
      if (isNaN(finalCategoryId)) {
        finalCategoryId = null;
      }
    }
    
    // Temporary workaround: If no category ID is provided, try to derive it from table name
    if (!finalCategoryId) {
      // You can add logic here to map table names to category IDs
      // For example, if tables 1-5 are in category 1, tables 6-10 are in category 2, etc.
      const tableNum = parseInt(tableNumber.replace(/\D/g, '')) || 0;
      if (tableNum >= 1 && tableNum <= 5) {
        finalCategoryId = 1; // Dining Area
      } else if (tableNum >= 6 && tableNum <= 10) {
        finalCategoryId = 2; // VIP Area  
      } else {
        finalCategoryId = 1; // Default to category 1
      }
     // console.log("Applied fallback category ID:", finalCategoryId, "for table:", tableNumber);
    }
    
    //console.log("Final category ID to store:", finalCategoryId, typeof finalCategoryId);
    
    // Find the selected table object for debugging
    const selectedTableObject = TotalTablelist.find(table => table.name === tableNumber);
   // console.log("Selected table object:", selectedTableObject);
    
    setSelectedTable(tableNumber);
    setSelectedTableCategory(finalCategoryId);
    toast.success(`Selected Table: ${tableNumber}${finalCategoryId ? ` (Category ID: ${finalCategoryId})` : ' (No Category ID)'}`);
  };

  const updateInvoiceNumber = async (orderId, invoiceNumber) => {
    try {
      // Step 1: Update the orders table
      await axios.put(baseURL`/${orderId}`, {
        invoice_number: invoiceNumber,
      });

      // Step 2: Update the order_items table associated with this order
      await axios.put(baseURL`/order_items`, {
        order_id: orderId,
        invoice_number: invoiceNumber,
      });

      toast.success("Invoice number updated successfully!");
    } catch (error) {
      console.error("Error updating invoice number:", error);
      if (handleAuthError(error)) return;
      toast.error("Failed to update invoice number.");
    }
  };

  // Print Order (Save to MySQL)
  const handleBillHistory = async () => {
    navigate(`/reports/billhistory`);
  };

  // ✅ Customer Display Control Functions
  const openCustomerDisplay = () => {
    customerDisplayManager.openCustomerDisplay();
    setIsCustomerDisplayOpen(true);
    
    // Send initial company info
    if (companyInfo && Object.keys(companyInfo).length > 0) {
      customerDisplayManager.updateCompanyInfo(companyInfo);
    }
    
    // Send current cart if it exists
    if (cart.length > 0) {
      customerDisplayManager.updateCart(cart, total);
    }
    
    toast.success("Customer display opened!");
  };

  const closeCustomerDisplay = () => {
    customerDisplayManager.closeCustomerDisplay();
    setIsCustomerDisplayOpen(false);
    toast.info("Customer display closed!");
  };

  const toggleCustomerDisplay = () => {
    if (isCustomerDisplayOpen) {
      closeCustomerDisplay();
    } else {
      openCustomerDisplay();
    }
  };

  const resolveItemGroup = (item) => {
    return item?.item_type || item?.item_group || item?.itemgroup || item?.itemGroup || item?.group_name || null;
  };

  const resolveCategoryId = (item) => {
    return item?.catid || item?.category_id || item?.cat_id || null;
  };

  const resolveSubcategoryId = (item) => {
    return item?.subcatid || item?.subcategory_id || item?.subcat_id || null;
  };

  const resolveCategoryName = (item) => {
    const directName = item?.category_name || item?.cat_name || null;
    if (directName) return directName;

    const categoryId = resolveCategoryId(item);
    if (!categoryId) return null;

    const matched = categories.find((cat) => String(cat.id) === String(categoryId));
    return matched?.name || null;
  };



  // Fetch items when a subcategory is clicked
  const handleSubcategoryClick = async (subcategoryId) => {
    try {
      //console.log("Fetching items for subcategory:", subcategoryId);
      
      // Clear data first to show loading state
      setData([]);
      
      // Only call fetchDataFromTwoTables to get items with images
      // Don't pass setData here, we'll handle it manually after validation
      const response1 = await fetchDataFromTwoTables("items", "item_images", "id", "product_id", null, "t1.id", { subcatid: subcategoryId });
      
      // console.log("Fetched items with images:", response1);
      // console.log("Response type:", typeof response1);
      // console.log("Is array:", Array.isArray(response1));
      
      // Validate and set the data
      if (response1 && Array.isArray(response1) && response1.length > 0) {
        setData(response1);
      //  console.log(`Successfully loaded ${response1.length} items`);
      } else {
        console.warn("No items found for subcategory:", subcategoryId);
       // console.log("Response1 value:", response1);
        setData([]);
        // Optional: Show a toast message to user
        toast.info("No items found for this subcategory");
      }
    } catch (error) {
     // console.error("Error fetching items for subcategory:", error);
     // console.error("Error details:", error.response?.data || error.message);
      if (handleAuthError(error)) return;
      setData([]); // Clear data on error
      toast.error("Failed to load items for this subcategory: " + (error.response?.data?.message || error.message));
    }
  };



  // Add item to the cart
  const addItemToOrder1 = (index, item) => {

    const existingItemIndex = cart.findIndex(cartItem => cartItem.id === item.id);
    const updatedCart = [...cart];

    if (existingItemIndex !== -1) {
      updatedCart[existingItemIndex].quantity += 1; // Increase quantity
    } else {
      updatedCart.push({
        ...item,
        quantity: 1, // Initial quantity set to 1
      });
    }

    setCart(updatedCart);
    updateTotal(updatedCart);
  };
const addItemToOrder = (index, item) => {
  const isWeightBased = item.weight === "weight";
//console.log("weight:"+item.weight);
  let qty = 1;

  if (isWeightBased) {
    const input = prompt("Enter weight in grams (e.g. 150, 250, 500, 1000):", "250");
    const grams = parseFloat(input);

    if (isNaN(grams) || grams <= 0) {
      toast.error("Invalid weight entered");
      return;
    }

    qty = grams / 1000; // Convert grams to kg
  }

  const existingItemIndex = cart.findIndex(cartItem => cartItem.id === item.id);
  const updatedCart = [...cart];

  if (existingItemIndex !== -1) {
    updatedCart[existingItemIndex].quantity += qty;
  } else {
    updatedCart.push({
      ...item,
      quantity: qty,
      uom: item.uom || "",
      subtotal: item.offerprice,   // initial subtotal = 1 x price
      tax: item.tax || 0,  //right now no need for local shop
      tax_amount: ( ((item.tax || 0)) * item.offerprice / 100 ).toFixed(2),  //calculate tax value included
      // Add category information to cart item
      category_id: resolveCategoryId(item),
      category_name: resolveCategoryName(item),
      subcategory_id: resolveSubcategoryId(item),
      item_group: resolveItemGroup(item),
    });
  }

  setCart(updatedCart);
  updateTotal(updatedCart);
  setQuickItemCode("");
  setLastAddedAt(Date.now());
};

  const focusItemCodeInput = () => {
    requestAnimationFrame(() => {
      if (itemCodeInputRef.current) {
        itemCodeInputRef.current.focus();
        itemCodeInputRef.current.select();
      }
    });
    setTimeout(() => {
      if (itemCodeInputRef.current) {
        itemCodeInputRef.current.focus();
        itemCodeInputRef.current.select();
      }
    }, 0);
  };

  useEffect(() => {
    if (lastAddedAt && itemCodeInputRef.current) {
      focusItemCodeInput();
    }
  }, [lastAddedAt]);

  // Quick add by item code / barcode
  const addItemByCode = async (code, qty = 1) => {
    const normalizedCode = (code || "").trim();
    if (!normalizedCode) {
      toast.error("Enter item code or barcode");
      return;
    }

    const quantityToAdd = Math.max(Number(qty) || 1, 1);

    let item = (data || []).find((i) => {
      return (
        `${i.barcode || ""}` === normalizedCode ||
        `${i.item_code || ""}` === normalizedCode ||
        `${i.id || ""}` === normalizedCode
      );
    });

    if (!item) {
      try {
        const byItemCode = await fetchData("items", null, "id", { item_code: normalizedCode });
        if (byItemCode && byItemCode.length > 0) {
          item = byItemCode[0];
        }
      } catch (error) {
        console.error("Error fetching item by code:", error);
      }
    }

    if (!item) {
      try {
        const byId = await fetchData("items", null, "id", { id: normalizedCode });
        if (byId && byId.length > 0) {
          item = byId[0];
        }
      } catch (error) {
        console.error("Error fetching item by id:", error);
      }
    }

    if (!item) {
      toast.error("Item not found for this code");
      return;
    }

    const updatedCart = [...cart];
    const existingIndex = updatedCart.findIndex((c) => c.id === item.id);

    if (existingIndex !== -1) {
      updatedCart[existingIndex].quantity += quantityToAdd;
    } else {
      updatedCart.push({
        ...item,
        quantity: quantityToAdd,
        uom: item.uom || "",
        subtotal: item.offerprice,
        tax: item.tax || 0,
        tax_amount: (((item.tax || 0) * item.offerprice) / 100).toFixed(2),
        category_id: resolveCategoryId(item),
        category_name: resolveCategoryName(item),
        subcategory_id: resolveSubcategoryId(item),
        item_group: resolveItemGroup(item),
      });
    }

    setCart(updatedCart);
    updateTotal(updatedCart);
    toast.success("Item added");
  };


  // Decrease item quantity
  const decreaseItemQuantity1 = (index) => {
    const updatedCart = [...cart];
    if (updatedCart[index].quantity > 1) {
      updatedCart[index].quantity -= 1;
    } else {
      updatedCart.splice(index, 1); // Remove item if quantity is 0
    }
    setCart(updatedCart);
    updateTotal(updatedCart);
  };

  // Increase item quantity
  const increaseItemQuantity1 = (index) => {
    const updatedCart = [...cart];
    updatedCart[index].quantity += 1;
    setCart(updatedCart);
    updateTotal(updatedCart);
  };
const formatQuantity = (item) => {
  // Check if item is weight-based (either by weight property or quantity_type)
  const isWeightBased = item.weight === "weight" || item.quantity_type === "weight";
  
  if (isWeightBased) {
    // For weight-based items, show in grams
    const grams = (item.quantity * 1000).toFixed(0);
    return `${grams}g`;
  } else {
    // For regular items, show as integer or decimal if needed
    return item.quantity % 1 === 0 ? `${item.quantity}` : `${item.quantity.toFixed(2)}`;
  }
};

// Helper function to format quantity for display in cart
const formatQuantityForDisplay = (item) => {
  const formattedQty = formatQuantity(item);
  const isWeightBased = item.weight === "weight" || item.quantity_type === "weight";
  
  if (isWeightBased) {
    return `${formattedQty} (${item.quantity.toFixed(3)}kg)`;
  }
  return formattedQty;
};
  // Update total price and sync with customer display
  const updateTotal = (cart) => {
    const newTotal = cart.reduce(
      (acc, item) => acc + item.quantity * item.offerprice,
      0
    );
    setTotal(newTotal);
    
    // ✅ Update customer display in real-time
    if (customerDisplayManager.isDisplayConnected()) {
      customerDisplayManager.updateCart(cart, newTotal);
    }
  };
const increaseItemQuantity = (index) => {
  const updatedCart = [...cart];
  const step = updatedCart[index].quantity_type === "weight" ? 0.25 : 1;
  updatedCart[index].quantity += step;
  setCart(updatedCart);
  updateTotal(updatedCart);
};

const decreaseItemQuantity = (index) => {
  const updatedCart = [...cart];
  const step = updatedCart[index].quantity_type === "weight" ? 0.25 : 1;
  updatedCart[index].quantity -= step;
  if (updatedCart[index].quantity <= 0) {
    updatedCart.splice(index, 1);
  }
  setCart(updatedCart);
  updateTotal(updatedCart);
};

  //delete order
  const handleDeleteOrder = async () => {
    setCart([]);
    setTotal(0);
    
    // ✅ Clear customer display
    if (customerDisplayManager.isDisplayConnected()) {
      customerDisplayManager.updateCart([], 0);
    }
  }

  //Print KOT to thermal printers via print server

  const printKOT = async (orderItems) => {
    try {
      const kotData = {
        table: selectedTable,
        items: orderItems,
        orderNumber: maxNumber,
        total: total,
        timestamp: new Date().toLocaleString()
      };

      // Send to print server (running on localhost:5000)
      const response = await fetch('http://localhost:5000/print-kot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(kotData)
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`KOT printed successfully! ${result.message}`);
       // console.log('Print details:', result.details);
      } else {
        toast.error(`Print failed: ${result.error}`);
        console.error('Print error:', result.details);
        
        // Fallback to browser print if print server fails
        fallbackPrint(orderItems);
      }
    } catch (error) {
      console.error('Error connecting to print server:', error);
      toast.error('Print server unavailable. Using fallback...');
      
      // Fallback to browser print
      fallbackPrint(orderItems);
    }
  };

  // Fallback browser print method
  const fallbackPrint = (orderItems) => {
    let kotContent = `\nKITCHEN ORDER TICKET (KOT)\n`;
    kotContent += `Table: ${selectedTable}\n`;
    kotContent += `Order #: ${maxNumber}\n`;
    kotContent += `--------------------------------\n`;
  
    orderItems.forEach((item) => {
      kotContent += `${item.item_name} x ${item.quantity || 0}\n`;
    });
  
    kotContent += `--------------------------------\n`;
    kotContent += `Date: ${new Date().toLocaleString()}\n`;
    kotContent += `Total: ฿ ${total.toFixed(2)}\n`;
  
    const newWindow = window.open("", "_blank");
    newWindow.document.write(`<pre style="font-family: monospace; font-size: 12px;">${kotContent}</pre>`);
    newWindow.document.close();
    newWindow.print();
    newWindow.close();
  };

  const normalizePrinterLocation = (location) =>
    String(location || '').trim().toLowerCase();

  const isCashierLocation = (location) =>
    normalizePrinterLocation(location).includes('cashier');

  const isKitchenLocation = (location) =>
    normalizePrinterLocation(location).includes('kitchen');

  const triggerCashierKotFallbackPrint = (orderItems = [], kotData = {}, reasonText = '') => {
    const fallbackItems = Array.isArray(orderItems) && orderItems.length > 0
      ? orderItems
      : (Array.isArray(kotData?.items) ? kotData.items : []);

    if (fallbackItems.length === 0) {
      return;
    }

    if (reasonText) {
      console.warn('[KOT] Cashier ESC/POS fallback:', reasonText);
    }

    toast.warning('Cashier KOT printer issue detected. Falling back to Windows thermal print.');

    windowPrintKOTByGroup(fallbackItems, {
      tableNumber: kotData?.table || kotData?.table_number || selectedTable,
      orderNumber: kotData?.order_number || kotData?.orderNumber || maxNumber,
      totalAmount: parseFloat(kotData?.total || total || 0) || 0,
      shishaStartTime: kotData?.shishaStartTime || null,
    });
  };

  const sendEscPosKotCommand = async (kotData = {}) => {
    let normalizedItems = [];
    try {
      // Get user UUID for printer lookup
      const userUuid = localStorage.getItem('user_uuid');
      
      if (!userUuid) {
        triggerCashierKotFallbackPrint(
          normalizedItems,
          {
            ...kotData,
            table: kotData?.table || kotData?.table_number,
            order_number: kotData?.order_number || kotData?.orderNumber || maxNumber,
            total: kotData?.total,
          },
          'User UUID unavailable for ESC/POS routing. Using cashier fallback print.'
        );
        toast.error('User UUID not found. Please login again.');
        return false;
      }

      // Normalize items for KOT
      normalizedItems = (Array.isArray(kotData?.items) ? kotData.items : []).map((item, idx) => {
        const normalized = {
          item_name: item?.item_name || item?.iname || item?.name || "Item",
          quantity: parseFloat(item?.quantity || item?.qty || 0) || 0,
          price: parseFloat(item?.price || item?.offerprice || 0) || 0,
          item_group: resolveItemGroup(item),
          item_type: item?.item_type || item?.itemType || resolveItemGroup(item),
          special_instructions: item?.special_instructions || item?.notes || ''
        };
        return normalized;
      });

      let printerConfigs = [];

      // 🔍 Get all active printers for this machine UUID and print KOT to all of them.
      try {
        const allPrinterResponse = await axios.get(
          `/printer/config`,
          getHeaders()
        );

        const allPrinters = Array.isArray(allPrinterResponse?.data?.data)
          ? allPrinterResponse.data.data
          : [];

        const attachedToUuid = allPrinters.filter(
          (p) => String(p?.machine_uuid || '') === String(userUuid)
        );

        if (allPrinterResponse?.data?.success && attachedToUuid.length > 0) {
          const seen = new Set();
          printerConfigs = attachedToUuid.filter((p) => {
            const key = `${p?.printer_ip || ''}:${p?.printer_port || 9100}`;
            if (!p?.printer_ip || seen.has(key)) {
              return false;
            }
            seen.add(key);
            return true;
          });

          console.log('✅ Using printer configs for KOT:', printerConfigs.map((p) => ({
            terminal_id: p?.terminal_id,
            machine_uuid: p?.machine_uuid,
            location: p?.location,
            printer_ip: p?.printer_ip,
            printer_port: p?.printer_port || 9100
          })));
        } else {
          triggerCashierKotFallbackPrint(
            normalizedItems,
            {
              ...kotData,
              table: kotData?.table || kotData?.table_number,
              order_number: kotData?.order_number || kotData?.orderNumber || maxNumber,
              total: kotData?.total,
            },
            'No printer configs matched this machine UUID. Using cashier fallback print.'
          );
          toast.error('No printer configuration found for this machine UUID.');
          return false;
        }

      } catch (configError) {
        triggerCashierKotFallbackPrint(
          normalizedItems,
          {
            ...kotData,
            table: kotData?.table || kotData?.table_number,
            order_number: kotData?.order_number || kotData?.orderNumber || maxNumber,
            total: kotData?.total,
          },
          configError?.message || 'Failed to fetch printer config. Using cashier fallback print.'
        );
        if (configError.response?.status === 404) {
          toast.error('❌ No printer configuration found for this machine UUID.');
        } else {
          toast.error('Failed to fetch printer configuration.');
        }
        console.error('Printer config error:', configError);
        return false;
      }

      // Prepare KOT payload for local agent direct print (frontend -> local machine agent).
      const kotPayload = {
        jobId: `kot-${kotData?.order_number || maxNumber}-${Date.now()}`,
        table: kotData?.table || kotData?.table_number,
        items: normalizedItems,
        heading: 'KITCHEN KOT',
        total: parseFloat(kotData?.total || 0) || 0,
        timestamp: kotData?.timestamp || new Date().toLocaleString(),
        machine_uuid: userUuid,
        companyName: resolveCompanyName()
      };

      let cashierFallbackTriggered = false;
      const cashierPrinterConfigs = printerConfigs.filter((config) =>
        isCashierLocation(config?.location || 'kitchen')
      );

      if (cashierPrinterConfigs.length === 0) {
        cashierFallbackTriggered = true;
        triggerCashierKotFallbackPrint(
          normalizedItems,
          {
            ...kotData,
            table: kotData?.table || kotData?.table_number,
            order_number: kotData?.order_number || kotData?.orderNumber || maxNumber,
            total: kotData?.total,
          },
          'No cashier printer configured for this device. Using Windows thermal fallback for cashier copy.'
        );
      }

      // Direct local print trigger to each attached printer (no backend relay for printing).
      const printSettledResults = await Promise.allSettled(
        printerConfigs.map(async (printerConfig) => {
          const localAgentPayload = {
            printer_ip: printerConfig.printer_ip,
            printer_port: printerConfig.printer_port || 9100,
            terminal_id: printerConfig.terminal_id || 'KITCHEN',
            location: printerConfig.location || 'kitchen',
            type: 'KOT',
            data: kotPayload,
            ...kotPayload,
            printerIp: printerConfig.printer_ip,
            printerPort: printerConfig.printer_port || 9100,
            target: printerConfig.location || 'kitchen'
          };

          const printResponse = await axios.post(
            `${LOCAL_PRINT_AGENT_URL}/print-kot`,
            localAgentPayload,
            {
              timeout: 15000,
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );

          return {
            terminal_id: printerConfig.terminal_id,
            printer_ip: printerConfig.printer_ip,
            location: normalizePrinterLocation(printerConfig.location || 'kitchen'),
            success: !!printResponse?.data?.success,
            message: printResponse?.data?.message || ''
          };
        })
      );

      const printResults = printSettledResults.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        }

        const printerConfig = printerConfigs[index] || {};
        const errorMessage =
          result.reason?.response?.data?.message ||
          result.reason?.message ||
          'Print request failed';

        return {
          terminal_id: printerConfig.terminal_id,
          printer_ip: printerConfig.printer_ip,
          location: normalizePrinterLocation(printerConfig.location || 'kitchen'),
          success: false,
          message: errorMessage,
        };
      });

      const cashierResults = printResults.filter((result) => isCashierLocation(result.location));
      const cashierConfigured = cashierResults.length > 0;
      const cashierSuccessCount = cashierResults.filter((result) => result.success).length;

      if (cashierConfigured && cashierSuccessCount === 0) {
        cashierFallbackTriggered = true;
        triggerCashierKotFallbackPrint(
          normalizedItems,
          {
            ...kotData,
            table: kotData?.table || kotData?.table_number,
            order_number: kotData?.order_number || kotData?.orderNumber || maxNumber,
            total: kotData?.total,
          },
          'No cashier ESC/POS printer accepted the KOT job.'
        );
      }

      const okCount = printResults.filter((r) => r.success).length;
      if (okCount === 0) {
        const kitchenConfigured = printerConfigs.some(
          (config) => isKitchenLocation(config?.location || 'kitchen')
        );

        if (cashierFallbackTriggered && !kitchenConfigured) {
          toast.info('KOT printed via cashier fallback thermal print.');
          return true;
        }

        throw new Error('Print job failed for all attached printers');
      }

      if (okCount < printResults.length) {
        toast.warning(`KOT printed on ${okCount}/${printResults.length} attached printers.`);
      }

      return true;

    } catch (error) {
      triggerCashierKotFallbackPrint(
        normalizedItems,
        {
          ...kotData,
          table: kotData?.table || kotData?.table_number,
          order_number: kotData?.order_number || kotData?.orderNumber || maxNumber,
          total: kotData?.total,
        },
        error?.message || 'ESC/POS KOT request failed; using cashier fallback print.'
      );

      let errorMessage = 'Failed to print KOT';
      if (error.response?.status === 404) {
        errorMessage = 'No kitchen printer configured for your device.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Local agent failed to process print request.';
      } else if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        errorMessage = 'Cannot connect to local print agent. Please start local print service.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
      return false;
    }
  };

  // Complete ESC/POS order workflow: Save -> Print -> Clear
  const handleESCPosOrderFlow = async (kotData = {}) => {
    if (!selectedTable) {
      toast.error('Please select a table!');
      return false;
    }

    if (cart.length === 0) {
      toast.error('Cart is empty!');
      return false;
    }

    try {
      toast.info('Processing order...');

      // Get the next setup date
      const setupDate = await getNextSetupDate();

      // Prepare order items for database
      const orderItems = cart.map(item => ({
        order_number: maxNumber,
        table_number: selectedTable,
        item_name: item.iname,
        item_group: resolveItemGroup(item),
        quantity: parseFloat(item.quantity.toFixed(2)),
        price: parseFloat(item.offerprice),
        total_amount: parseFloat((item.offerprice * item.quantity).toFixed(2)),
        status: "1",
        uom: item.uom || "",
        weight_based: item.weight === "weight" ? 1 : 0,
        setup_date: setupDate,
        category_id: resolveCategoryId(item),
        category_name: resolveCategoryName(item),
        subcategory_id: resolveSubcategoryId(item),
        table_cat_id: selectedTableCategory || null,
      }));

      // Step 1: Save order data to database
      const [response, response1] = await Promise.all([
        axios.post(`/insertdata/orders`, {
          userid: getUserName(),
          order_number: maxNumber,
          table_number: selectedTable,
          total_amount: total,
          status: "1",
        }, getHeaders()),
        
        axios.post(`/insertdatabulk/order_items`, {
          items: orderItems
        }, getHeaders())
      ]);

      if (response1.data.success) {
        console.log("✅ ORDER SAVED SUCCESSFULLY");
        toast.success(response.data.message);

        // Step 2: Send KOT print command
        const printResult = await sendEscPosKotCommand(kotData);

        if (printResult) {
          console.log('✅ KOT ESC/POS command sent successfully');
          toast.success('Order saved and KOT sent to printer!');
        } else {
          toast.warning('Order saved but KOT command failed.');
        }

        // Step 3: Clear cart
        setCart([]);
        setTotal(0);

        // Step 4: Update table status and refresh data
        Promise.all([
          updateData("tablelist", { status: '1' }, { name: selectedTable }),
          loadTablesForSelection(),
          getRunningTable("orders", settableList),
          getMax("orders", setmaxNumber, "userid", getUserName(), "order_number")
        ]).then(() => {
          setRefreshTrigger(prev => prev + 1);
          console.log("Order processed and data refreshed...");
        });

        return printResult;
      } else {
        toast.error("Failed to save the order!");
        return false;
      }
    } catch (error) {
      console.error('❌ Error in handleESCPosOrderFlow:', error);
      if (handleAuthError(error)) return false;
      
      if (error.message === 'Failed to fetch' || error.message.includes('Network') || error.code === 'ERR_NETWORK') {
        toast.error('⚠️ Connection error! Check your network.', {
          autoClose: 5000
        });
      } else {
        toast.error('Error: ' + (error.response?.data?.message || error.message || 'Unknown error'));
      }
      return false;
    }
  };

  
  // Window print KOT function - Optimized for speed
  const windowPrintKOT = (orderItems, kotHeader = 'KOT', options = {}) => {
    const tableNumber = options?.tableNumber ?? selectedTable;
    const orderNumber = options?.orderNumber ?? maxNumber;
    const timingInfo = options?.timingInfo || null;

    const computedTotal = (orderItems || []).reduce((sum, item) => {
      const itemTotal = parseFloat(item.total_amount || item.total_price || 0);
      const fallback = parseFloat(item.price || 0) * parseFloat(item.quantity || 0);
      return sum + (Number.isFinite(itemTotal) && itemTotal > 0 ? itemTotal : fallback);
    }, 0);
    const totalAmount = Number.isFinite(parseFloat(options?.totalAmount))
      ? parseFloat(options.totalAmount)
      : computedTotal;

    // Show immediate feedback
    toast.success("Preparing KOT...");
    
    // Create KOT content
    let kotContent = `
      <div style="font-family: 'Courier New', monospace; max-width: 320px; margin: 0 auto; padding: 16px;">
        <div style="text-align: center; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 8px;">
          <h2 style="margin: 0; font-size: 18px;">${kotHeader}</h2>
        </div>
        
        <div style="margin-bottom: 10px; font-size: 14px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span><strong>Table:</strong> ${tableNumber}</span>
            <span><strong>Order #:</strong> ${orderNumber}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span><strong>Date:</strong> ${new Date().toLocaleDateString()}</span>
            <span><strong>Time:</strong> ${new Date().toLocaleTimeString()}</span>
          </div>
          ${timingInfo ? `
          <div style="margin-top: 4px; border-top: 1px dashed #000; padding-top: 4px;">
            ${timingInfo.slipLabel ? `
            <div style="text-align: center; font-weight: bold; margin-bottom: 4px;">
              ${timingInfo.slipLabel}
            </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span><strong>Shisha:</strong></span>
              <span>${timingInfo.itemName || '-'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span><strong>Start Time:</strong></span>
              <span>${timingInfo.startTime || '-'}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span><strong>End Time:</strong></span>
              <span>${timingInfo.endTime || '-'}</span>
            </div>
          </div>
          ` : ''}
        </div>
        
        <div style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 5px 0;">
          <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 3px; font-size: 15px;">
            <span>Item</span>
            <span>Qty</span>
          </div>
    `;

    // Add items to KOT
    orderItems.forEach((item) => {
      const isWeightBased = item.weight_based === 1;
      const qtyDisplay = isWeightBased ? `${((item.quantity || 0) * 1000).toFixed(0)}g` : (item.quantity || 0).toString();
      
      kotContent += `
        <div style="display: flex; justify-content: space-between; margin-bottom: 2px; padding: 1px 0; font-size: 15px;">
          <span style="flex: 1; padding-right: 5px;">${item.item_name}</span>
          <span style="min-width: 30px; text-align: right;">${qtyDisplay}</span>
        </div>
      `;
    });

    kotContent += `
        </div>
        
        <div style="margin-top: 8px; text-align: center; border-top: 1px dashed #000; padding-top: 5px;">
          <div style="margin-bottom: 5px; font-size: 15px;">
            <strong>Total: ฿ ${totalAmount.toFixed(2)}</strong>
          </div>
          <div style="font-size: 11px; color: #666;">
            ${new Date().toLocaleString()}
          </div>
        </div>

        ${timingInfo ? `
        <div style="text-align: center; margin-top: 6px; font-size: 12px; font-weight: bold; border-top: 1px dashed #000; padding-top: 5px;">
          Remark: Valid for 60 minute only
        </div>
        ` : ''}
        
        <div style="text-align: center; margin-top: 8px; font-size: 11px; color: #666;">
          <p style="margin: 0;">Thank you!</p>
        </div>
      </div>
    `;

    // Create and open print window immediately
    const printWindow = window.open("", "_blank", "width=480,height=700");
    
    if (printWindow) {
      // Write content immediately
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${kotHeader} - Table ${tableNumber}</title>
          <style>
            @media print {
              body { margin: 0; }
              @page { margin: 0.2in; size: 4in 6in; }
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.35;
              color: #000;
              background: #fff;
            }
          </style>
        </head>
        <body>
          ${kotContent}
        </body>
        </html>
      `);
      
      printWindow.document.close();
      
      // Auto-close window after printing with multiple strategies
      printWindow.focus();
      
      // Strategy 1: Listen for afterprint event (when available)
      if (printWindow.addEventListener) {
        printWindow.addEventListener('afterprint', () => {
          setTimeout(() => {
            printWindow.close();
          }, 100);
        });
      }
      
      // Strategy 2: Monitor window focus to detect print dialog closure
      let printDialogClosed = false;
      const checkPrintDialog = () => {
        if (!printDialogClosed && printWindow && !printWindow.closed) {
          setTimeout(() => {
            if (printWindow && !printWindow.closed) {
              printWindow.close();
            }
          }, 2000); // Close after 2 seconds if still open
        }
      };
      
      printWindow.addEventListener('focus', () => {
        if (!printDialogClosed) {
          printDialogClosed = true;
          setTimeout(() => {
            if (printWindow && !printWindow.closed) {
              printWindow.close();
            }
          }, 500);
        }
      });
      
      // Strategy 3: Print and set auto-close timer
      printWindow.print();
      
      // Fallback: Force close after 3 seconds regardless
      setTimeout(() => {
        if (printWindow && !printWindow.closed) {
          printWindow.close();
        }
      }, 3000);
      
      // Start monitoring
      checkPrintDialog();
      
      toast.success("KOT sent to printer!");
    } else {
      toast.error("Unable to open print window. Please check popup blocker settings.");
    }
  };

  const windowPrintKOTByGroup = (orderItems, options = {}) => {
    const parseDateLike = (value) => {
      if (!value) return null;
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    const getShishaStartDate = (items) => {
      const candidates = (items || []).flatMap((item) => [
        item?.kot_print_time,
        item?.print_time,
        item?.created_at,
        item?.updated_at,
        item?.timestamp,
        item?.time,
      ]);

      const validDates = candidates
        .map((candidate) => parseDateLike(candidate))
        .filter((candidate) => candidate instanceof Date);

      if (validDates.length === 0) return new Date();
      return new Date(Math.min(...validDates.map((value) => value.getTime())));
    };

    const formatTimeOnly = (dateObj) => {
      if (!(dateObj instanceof Date) || Number.isNaN(dateObj.getTime())) return '-';
      return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const normalizeGroup = (value) => {
      const text = String(value || '').trim().toLowerCase();
      if (text.includes('bar')) return 'BAR';
      if (text.includes('shisha')) return 'SHISHA';
      if (text.includes('food')) return 'FOOD';
      return 'FOOD';
    };

    const buckets = {
      FOOD: [],
      BAR: [],
      SHISHA: []
    };

    (orderItems || []).forEach((item) => {
      const group = normalizeGroup(item?.item_group || item?.itemGroup || item?.itemgroup || item?.group_name || item?.item_type);
      buckets[group].push(item);
    });

    const shishaTimingJobs = buckets.SHISHA.flatMap((item) => {
      const qty = Number(item?.quantity || 1);
      const slipCount = Number.isFinite(qty) && qty > 1 ? Math.floor(qty) : 1;

      return Array.from({ length: slipCount }, (_, copyIndex) => ({
        group: 'SHISHA',
        header: 'Shisha Timing',
        isTimingSlip: true,
        timingItem: item,
        copyIndex,
        copyTotal: slipCount,
      }));
    });

    const jobs = [
      { group: 'FOOD', header: 'KOT Food', isTimingSlip: false },
      { group: 'BAR', header: 'KOT Bar', isTimingSlip: false },
      { group: 'SHISHA', header: 'KOT Shisha', isTimingSlip: false },
      ...shishaTimingJobs,
    ].filter((job) => buckets[job.group].length > 0);

    if (jobs.length === 0) {
      windowPrintKOT(orderItems, 'KOT', options);
      return;
    }

    jobs.forEach((job, index) => {
      setTimeout(() => {
        const bucketItems = job.isTimingSlip ? [job.timingItem] : buckets[job.group];
        const bucketTotal = bucketItems.reduce((sum, item) => {
          const itemTotal = parseFloat(item.total_amount || item.total_price || 0);
          const fallback = parseFloat(item.price || 0) * parseFloat(item.quantity || 0);
          return sum + (Number.isFinite(itemTotal) && itemTotal > 0 ? itemTotal : fallback);
        }, 0);

        let timingInfo = null;
        if (job.group === 'SHISHA' && job.isTimingSlip) {
          const shishaStartDate = parseDateLike(job?.timingItem?.kot_print_time)
            || parseDateLike(job?.timingItem?.print_time)
            || parseDateLike(job?.timingItem?.created_at)
            || parseDateLike(job?.timingItem?.updated_at)
            || parseDateLike(job?.timingItem?.timestamp)
            || parseDateLike(job?.timingItem?.time)
            || parseDateLike(options?.shishaStartTime)
            || getShishaStartDate(bucketItems);
          const shishaEndDate = new Date(shishaStartDate.getTime() + (60 * 60 * 1000));
          timingInfo = {
            itemName: job?.timingItem?.item_name || '-',
            startTime: formatTimeOnly(shishaStartDate),
            endTime: formatTimeOnly(shishaEndDate),
            slipLabel: job?.copyTotal > 1 ? `Slip ${Number(job.copyIndex) + 1}/${job.copyTotal}` : '',
          };
        }

        windowPrintKOT(bucketItems, job.header, {
          ...options,
          totalAmount: bucketTotal,
          timingInfo,
        });
      }, index * 350);
    });
  };

  const windowPrintKOTReprint = (orderItems, tableNumber, orderNumber) => {
    const totalAmount = (orderItems || []).reduce((sum, item) => {
      const itemTotal = parseFloat(item.total_amount || item.total_price || 0);
      const fallback = parseFloat(item.price || 0) * parseFloat(item.quantity || 0);
      return sum + (Number.isFinite(itemTotal) && itemTotal > 0 ? itemTotal : fallback);
    }, 0);

    let kotContent = `
      <div style="font-family: 'Courier New', monospace; max-width: 220px; margin: 0 auto; padding: 12px; font-size: 12px;">
        <div style="text-align: center; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 8px;">
          <h2 style="margin: 0; font-size: 14px;">KITCHEN ORDER TICKET</h2>
          <h3 style="margin: 2px 0; font-size: 12px;">(KOT)</h3>
          <div style="margin-top: 4px; font-size: 18px; font-weight: bold;">COPY</div>
        </div>
        <div style="margin-bottom: 10px; font-size: 12px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span><strong>Table:</strong> ${tableNumber}</span>
            <span><strong>Order #:</strong> ${orderNumber}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span><strong>Date:</strong> ${new Date().toLocaleDateString()}</span>
            <span><strong>Time:</strong> ${new Date().toLocaleTimeString()}</span>
          </div>
        </div>
        <div style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 5px 0;">
          <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 3px; font-size: 13px;">
            <span>Item</span>
            <span>Qty</span>
          </div>
    `;

    orderItems.forEach((item) => {
      const isWeightBased = item.weight_based === 1 || item.weight_based === "1";
      const qtyDisplay = isWeightBased ? `${(parseFloat(item.quantity || 0) * 1000).toFixed(0)}g` : (item.quantity || 0).toString();

      kotContent += `
        <div style="display: flex; justify-content: space-between; margin-bottom: 2px; padding: 1px 0; font-size: 13px;">
          <span style="flex: 1; padding-right: 5px;">${item.item_name}</span>
          <span style="min-width: 30px; text-align: right;">${qtyDisplay}</span>
        </div>
      `;
    });

    kotContent += `
        </div>
        <div style="margin-top: 8px; text-align: center; border-top: 1px dashed #000; padding-top: 5px;">
          <div style="margin-bottom: 5px; font-size: 12px;">
            <strong>Total: ฿ ${totalAmount.toFixed(2)}</strong>
          </div>
          <div style="font-size: 10px; color: #666;">
            ${new Date().toLocaleString()}
          </div>
        </div>
        <div style="text-align: center; margin-top: 8px; font-size: 10px; color: #666;">
          <p style="margin: 0;">Thank you!</p>
        </div>
      </div>
    `;

    const printWindow = window.open("", "_blank", "width=280,height=400");
    if (!printWindow) {
      toast.error("Unable to open print window. Please check popup blocker settings.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>KOT COPY - Table ${tableNumber}</title>
        <style>
          @media print {
            body { margin: 0; }
            @page { margin: 0.3in; size: 3in 4in; }
            .watermark { display: block !important; }
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.3;
            color: #000;
            background: #fff;
            position: relative;
          }
          .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-40deg);
            font-size: 52px;
            font-weight: 900;
            color: rgba(0, 0, 0, 0.10);
            white-space: nowrap;
            pointer-events: none;
            z-index: 9999;
            letter-spacing: 4px;
            font-family: 'Courier New', monospace;
            user-select: none;
          }
        </style>
      </head>
      <body>
        <div class="watermark">KOT COPY</div>
        ${kotContent}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    setTimeout(() => {
      if (printWindow && !printWindow.closed) {
        printWindow.close();
      }
    }, 2000);
  };

  const handleSelectReprintTable = async (tableName) => {
    setReprintTable(tableName);
    setReprintOrderNumbers([]);
    setReprintOrderNumber(null);
    setReprintOrderField("order_number");
    setReprintItems([]);

    if (!tableName) return;

    setReprintLoadingOrders(true);
    try {
      let tableOrders = await fetchData("order_items", null, "id", {
        table_number: tableName,
        status: "1"
      });

      if (!tableOrders || tableOrders.length === 0) {
        tableOrders = await fetchData("order_items", null, "id", {
          table_number: tableName
        });
      }

      const orderList = [];
      (tableOrders || []).forEach((item) => {
        if (item.order_number !== undefined && item.order_number !== null && item.order_number !== "") {
          orderList.push({ value: item.order_number, field: "order_number" });
        } else if (item.order_id !== undefined && item.order_id !== null && item.order_id !== "") {
          orderList.push({ value: item.order_id, field: "order_id" });
        } else if (item.invoice_number !== undefined && item.invoice_number !== null && item.invoice_number !== "") {
          orderList.push({ value: item.invoice_number, field: "invoice_number" });
        }
      });

      const seen = new Set();
      const uniqueOrderList = orderList.filter((order) => {
        const key = `${order.field}:${order.value}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const sorted = uniqueOrderList.sort((a, b) => Number(a.value) - Number(b.value));

      setReprintOrderNumbers(sorted);
      if (sorted.length === 0) {
        toast.info("No running orders for this table.");
      }
    } catch (error) {
      console.error("Error fetching running orders:", error);
      toast.error("Failed to fetch running orders.");
    } finally {
      setReprintLoadingOrders(false);
    }
  };

  const handleSelectReprintOrder = async (orderSelection) => {
    if (!reprintTable) {
      toast.error("Please select a table first.");
      return;
    }

    const orderValue = orderSelection?.value ?? orderSelection;
    const orderField = orderSelection?.field || "order_number";

    setReprintOrderNumber(orderValue);
    setReprintOrderField(orderField);
    setReprintOrderModalOpen(true);
    setReprintLoadingItems(true);

    try {
      let orderItems = await fetchData("order_items", null, "id", {
        table_number: reprintTable,
        [orderField]: orderValue,
        status: "1"
      });

      if (!orderItems || orderItems.length === 0) {
        orderItems = await fetchData("order_items", null, "id", {
          table_number: reprintTable,
          [orderField]: orderValue
        });
      }

      setReprintItems(orderItems || []);
      if (!orderItems || orderItems.length === 0) {
        toast.info("No items found for this order.");
      }
    } catch (error) {
      console.error("Error fetching order items:", error);
      toast.error("Failed to fetch order items.");
    } finally {
      setReprintLoadingItems(false);
    }
  };

  const handleReprintKOTEscPos = async () => {
    if (!reprintTable || !reprintOrderNumber) {
      toast.error("Please select an order first.");
      return;
    }

    if (!reprintItems || reprintItems.length === 0) {
      toast.error("No items to print.");
      return;
    }

    const totalAmount = reprintItems.reduce((sum, item) => {
      const itemTotal = parseFloat(item.total_amount || item.total_price || 0);
      const fallback = parseFloat(item.price || 0) * parseFloat(item.quantity || 0);
      return sum + (Number.isFinite(itemTotal) && itemTotal > 0 ? itemTotal : fallback);
    }, 0);

    const kotData = {
      table: reprintTable,
      orderNumber: reprintOrderNumber,
      timestamp: new Date().toISOString(),
      watermark: "COPY",
      items: reprintItems.map((item) => ({
        item_name: item.item_name,
        quantity: parseFloat(item.quantity || 0),
        item_group: resolveItemGroup(item)
      })),
      total: totalAmount.toFixed(2)
    };

    try {
      const printResult = await sendEscPosKotCommand(kotData);

      if (printResult) {
        toast.success("KOT sent via ESC/POS command.");
      } else {
        toast.error("KOT command failed.");
      }
    } catch (error) {
      console.error("Error reprinting KOT ESC/POS:", error);
      toast.error(error?.response?.data?.message || "Failed to send ESC/POS command.");
    }
  };

  const handleReprintKOTHtml = () => {
    if (!reprintTable || !reprintOrderNumber) {
      toast.error("Please select an order first.");
      return;
    }

    if (!reprintItems || reprintItems.length === 0) {
      toast.error("No items to print.");
      return;
    }

    windowPrintKOTReprint(reprintItems, reprintTable, reprintOrderNumber);
  };

  // Send KOT via ESC/POS thermal printer
  const handleSendKOTESCPOS = async () => {
    if (!selectedTable) {
      toast.error('Please select a table!');
      return;
    }

    if (cart.length === 0) {
      toast.error('Cart is empty!');
      return;
    }

    try {
      toast.info('Processing order...');

      // Get the next setup date
      const setupDate = await getNextSetupDate();

      // Prepare order items early for faster processing
      const orderItems = cart.map(item => ({
        order_number: maxNumber,
        table_number: selectedTable,
        item_name: item.iname,
        item_group: resolveItemGroup(item),
        quantity: parseFloat(item.quantity.toFixed(2)),
        price: parseFloat(item.offerprice),
        total_amount: parseFloat((item.offerprice * item.quantity).toFixed(2)),
        status: "1",
        uom: item.uom || "",
        weight_based: item.weight === "weight" ? 1 : 0,
        setup_date: setupDate,
        // Add category information for reporting
        category_id: resolveCategoryId(item),
        category_name: resolveCategoryName(item),
        subcategory_id: resolveSubcategoryId(item),
        // Add table category for filtering
        table_cat_id: selectedTableCategory || null,
      }));

      // Save order data in parallel
      const [response, response1] = await Promise.all([
        axios.post(`/insertdata/orders`, {
          userid: getUserName(),
          order_number: maxNumber,
          table_number: selectedTable,
          total_amount: total,
          status: "1",
        }, getHeaders()),
        
        axios.post(`/insertdatabulk/order_items`, {
          items: orderItems
        }, getHeaders())
      ]);

      if (response1.data.success) {
        console.log("✅ ORDER SAVED SUCCESSFULLY");
        toast.success(response.data.message);
        setOrderNumber((prevOrder) => prevOrder + 1);

        // Prepare KOT data with same format as existing KOT
        const kotData = {
          table: selectedTable,
          orderNumber: maxNumber,
          timestamp: new Date().toISOString(),
          items: cart.map(item => ({
            item_name: item.iname,
            quantity: parseFloat(item.quantity.toFixed(2)),
            item_group: resolveItemGroup(item)
          })),
          total: total.toFixed(2)
        };

        const printResult = await sendEscPosKotCommand(kotData);

        if (printResult) {
          console.log('✅ KOT ESC/POS command sent successfully');
          toast.success('Order saved and KOT ESC/POS command sent!');
        } else {
          toast.warning('Order saved but ESC/POS command failed.');
        }
        
        // Clear cart after successful operations
        setCart([]);
        setTotal(0);
        
        // Update table status and refresh data in background
        Promise.all([
          updateData("tablelist", { status: '1' }, { name: selectedTable }),
          loadTablesForSelection(),
          getRunningTable("orders", settableList),
          getMax("orders", setmaxNumber, "userid", getUserName(), "order_number")
        ]).then(() => {
          setRefreshTrigger(prev => prev + 1);
          console.log("KOT ESC/POS sent successfully, data refreshed...");
        });
        
      } else {
        toast.error("Failed to save the order!");
      }
    } catch (error) {
      console.error('❌ Error in handleSendKOTESCPOS:', error);
      if (handleAuthError(error)) return;
      
      // Check if it's a network/connection error
      if (error.message === 'Failed to fetch' || error.message.includes('Network') || error.code === 'ERR_NETWORK') {
        toast.error('⚠️ Connection error! Check your network and printer server.', {
          autoClose: 5000
        });
      } else {
        toast.error('Error: ' + (error.response?.data?.message || error.message || 'Unknown error'));
      }
    }
  };

  // Function to handle printing the order with window print - Optimized
  const handlePrintOrder = async () => {
    // console.log("=== SEND KOT CLICKED ===");
    // console.log("Selected Table:", selectedTable);
    // console.log("Selected Table Category:", selectedTableCategory);
    // console.log("Cart contents:", cart);
    
    if (!selectedTable) {
      toast.error('Please select a table!');
      return;
    }

    // Show immediate feedback
    toast.info('Processing order...');

    try {
      // Get the next setup date
      const setupDate = await getNextSetupDate();
      //console.log("Setup date:", setupDate);

      // Prepare order items early for faster processing
      const orderItems = cart.map(item => ({
        order_number: maxNumber,
        table_number: selectedTable,
        item_name: item.iname,
        item_group: resolveItemGroup(item),
        quantity: parseFloat(item.quantity.toFixed(2)),
        price: parseFloat(item.offerprice),
        total_amount: parseFloat((item.offerprice * item.quantity).toFixed(2)),
        status: "1",
        uom: item.uom || "",
        weight_based: item.weight === "weight" ? 1 : 0,
        setup_date: setupDate,
        // Add category information for reporting
        category_id: resolveCategoryId(item),
        category_name: resolveCategoryName(item),
        subcategory_id: resolveSubcategoryId(item),
        // Add table category for filtering
        table_cat_id: selectedTableCategory || null,
      }));

      // Debug logging for table category
      // console.log("=== ORDER ITEMS BEING PREPARED ===");
      // console.log("Order being saved with table_cat_id:", selectedTableCategory);
      // console.log("Selected table category state:", selectedTableCategory);
      // console.log("Complete order items:", orderItems);
      // console.log("Order items with table_cat_id:", orderItems.map(item => ({ 
      //   item_name: item.item_name, 
      //   table_cat_id: item.table_cat_id 
      // })));

      // console.log("=== SAVING TO DATABASE ===");
      // console.log("Orders API call data:", {
      //   userid: getUserName(),
      //   order_number: maxNumber,
      //   table_number: selectedTable,
      //   total_amount: total,
      //   status: "1",
      // });
      
      // console.log("Order Items API call data:", { items: orderItems });
      // console.log("=== DETAILED ORDER ITEMS ===");
      orderItems.forEach((item, index) => {
        console.log(`Item ${index + 1}:`, {
          item_name: item.item_name,
          table_cat_id: item.table_cat_id,
          table_number: item.table_number,
          quantity: item.quantity,
          total_amount: item.total_amount
        });
      });
      //console.log("selectedTableCategory state:", selectedTableCategory);
      
      // Save order data in parallel
      const [response, response1] = await Promise.all([
        axios.post(`/insertdata/orders`, {
          userid: getUserName(),
          order_number: maxNumber,
          table_number: selectedTable,
          total_amount: total,
          status: "1",
        }, getHeaders()),
        
        axios.post(`/insertdatabulk/order_items`, {
          items: orderItems
        }, getHeaders())
      ]);

      // console.log("=== API RESPONSES ===");
      // console.log("Orders response:", response.data);
      // console.log("Order items response:", response1.data);

      if (response1.data.success) {
        console.log("✅ ORDER SAVED SUCCESSFULLY");

        let savedOrderItems = [];
        try {
          savedOrderItems = await fetchData("order_items", null, "id", {
            table_number: selectedTable,
            order_number: maxNumber,
            setup_date: setupDate,
          }) || [];
        } catch (fetchError) {
          console.warn("Unable to fetch saved order items for timing KOT:", fetchError);
        }

        const effectiveOrderItems = Array.isArray(savedOrderItems) && savedOrderItems.length > 0
          ? savedOrderItems
          : orderItems;

        const shishaRows = effectiveOrderItems.filter((item) =>
          String(item?.item_group || item?.itemGroup || item?.itemgroup || item?.group_name || item?.item_type || '')
            .toLowerCase()
            .includes('shisha')
        );

        const shishaStartSource = shishaRows.find((row) =>
          row?.kot_print_time || row?.print_time || row?.created_at || row?.updated_at || row?.timestamp || row?.time
        );

        const shishaStartTime = shishaStartSource?.kot_print_time
          || shishaStartSource?.print_time
          || shishaStartSource?.created_at
          || shishaStartSource?.updated_at
          || shishaStartSource?.timestamp
          || shishaStartSource?.time
          || null;

        windowPrintKOTByGroup(effectiveOrderItems, {
          tableNumber: selectedTable,
          orderNumber: maxNumber,
          shishaStartTime,
        });

        toast.success(response.data.message);
        setOrderNumber((prevOrder) => prevOrder + 1);
        
        // Clear cart immediately after successful save
        setCart([]);
        setTotal(0);
        
        // Update table status and refresh data in background
        Promise.all([
          updateData("tablelist", { status: '1' }, { name: selectedTable }),
          loadTablesForSelection(),
          getRunningTable("orders", settableList),
          getMax("orders", setmaxNumber, "userid", getUserName(), "order_number")
        ]).then(() => {
          setRefreshTrigger(prev => prev + 1);
          console.log("KOT sent successfully, data refreshed...");
        });
        
      } else {
        // console.log("❌ ORDER SAVE FAILED");
        // console.log("Error details:", response1.data);
        toast.error("Failed to save the order!");
      }
    } catch (error) {
      // console.log("❌ EXCEPTION DURING ORDER SAVE");
      // console.error('Error saving order:', error);
      // console.error('Error response:', error.response?.data);
      // console.error('Error status:', error.response?.status);
      if (handleAuthError(error)) return;
      toast.error('Error saving order!');
    }
  };
   const handlePrintOrderESC = async () => {
    if (!selectedTable) {
      toast.error('Please select a table!');
      return;
    }

    // Existing code for handling order saving...
    try {
      // Get the next setup date
      const setupDate = await getNextSetupDate();
      
      const response = await axios.post(`/insertdata/orders`, {
        userid: getUserName(),
        order_number: maxNumber,
        table_number: selectedTable,
        total_amount: total,
        status: "1",
        // setup_date: setupDate // ✅ Add setup_date column
      },
        getHeaders()
      );

      // Prepare an array of order items to insert
      const orderItems = cart.map(item => ({
        
        order_number: maxNumber,
        table_number: selectedTable,
        item_name: item.iname,     // Assuming each item has a name property
        item_group: resolveItemGroup(item),
        quantity: parseFloat(item.quantity.toFixed(2)),    // Ensure quantity is properly formatted as decimal
        price: parseFloat(item.offerprice),      // Price per unit  
        total_amount: parseFloat((item.offerprice * item.quantity).toFixed(2)), // Total for this item
        status: "1", //running table status
        uom: item.uom || "", // Unit of measure
        weight_based: item.weight === "weight" ? 1 : 0, // Flag for weight-based items
        setup_date: setupDate, // ✅ Add setup_date column
        // Add category information for reporting
        category_id: resolveCategoryId(item),
        category_name: resolveCategoryName(item),
        subcategory_id: resolveSubcategoryId(item),
        // Add table category for filtering
        table_cat_id: selectedTableCategory || null,
      }));
      
      // Debug logging
      //console.log("Order items being sent to database:", orderItems);
      orderItems.forEach((item, index) => {
        // console.log(`Item ${index + 1}:`, {
        //   name: item.item_name,
        //   originalQuantity: cart[index].quantity,
        //   formattedQuantity: item.quantity,
        //   isWeightBased: item.weight_based,
        //   price: item.price,
        //   total: item.total_amount
        // });
      });
      const response1 = await axios.post(`/insertdatabulk/order_items`, {
        items: orderItems // Wrap in an object if your API expects this
      },
        getHeaders()
      );

      await updateData(
        "tablelist",
        { status: '1' },
        { name: selectedTable } // Additional WHERE conditions
      );
      await loadTablesForSelection();
      await getRunningTable("orders", settableList);
      await getMax("orders", setmaxNumber, "userid", getUserName(), "order_number");

        // Step 3: Print KOT after successful save
    if (response1.data.success) {
      toast.success(response.data.message);
      setOrderNumber((prevOrder) => prevOrder + 1);
        // Send request to backend for printing
      //   await axios.post("/printkot", {
      //     table: selectedTable,
      //     items: orderItems,
      //     total: total
      // });
      printKOT(orderItems); // Call function to print the KOT
      setCart([]);
      setTotal(0);
      
      // Trigger refresh for CheckBillModal
      setRefreshTrigger(prev => prev + 1);
      console.log("KOT sent successfully, triggering refresh...");
      
    } else {
      toast.error("Failed to save the order!");
    }
    } catch (error) {
      console.error('Error saving order:', error);
      if (handleAuthError(error)) return;
      toast.error('Error saving order!');
    }
  };
  const normalizeTableRows = (rows = []) => {
    if (!Array.isArray(rows)) return [];

    const isOccupied = (value) => {
      const normalized = String(value ?? "").trim().toLowerCase();
      return value === 1 || value === "1" || value === true || normalized === "true" || normalized === "occupied" || normalized === "running" || normalized === "busy";
    };

    return rows.map((row) => ({
      ...row,
      status: isOccupied(row?.status) ? 1 : 0,
    }));
  };

  const loadTablesForSelection = async () => {
    const basicTables = await fetchData("tablelist", null, "id", {}) || [];
    let finalTables = Array.isArray(basicTables) ? [...basicTables] : [];

    try {
      const joinedTables = await fetchDataFromTwoTables(
        "tablelist",
        "table_category",
        "table_cat_id",
        "id",
        null,
        "t1.id",
        {}
      );

      if (Array.isArray(joinedTables) && joinedTables.length > 0 && finalTables.length > 0) {
        const joinedByKey = new Map(
          joinedTables.map((table) => [String(table?.id ?? table?.name ?? ""), table])
        );

        finalTables = finalTables.map((table) => {
          const byId = joinedByKey.get(String(table?.id ?? ""));
          const byName = joinedByKey.get(String(table?.name ?? ""));
          const joined = byId || byName;

          if (!joined) return table;

          return {
            ...table,
            table_cat_id: joined.table_cat_id ?? table.table_cat_id ?? null,
            category: joined.category ?? joined.category_name ?? table.category ?? null,
            category_name: joined.category_name ?? joined.category ?? table.category_name ?? null,
          };
        });
      }
    } catch (error) {
      // Fallback to basic table list when join fetch fails
    }

    setTotaltablelist(normalizeTableRows(finalTables));
  };

  const refreshTables = async (event) => {
    if (event?.preventDefault) event.preventDefault();
    await Promise.all([
      loadTablesForSelection(),
      getRunningTable("orders", settableList),
    ]);
    setRefreshTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    const fetchAndSetData = async () => {
      try {
        // console.log("NewPOS Component: Starting data fetch...");
        // console.log("UserName:", getUserName());
        // console.log("UserType:", localStorage.getItem('usertype') || sessionStorage.getItem('usertype'));
        
        await fetchData("categories", setCategories, "id", {});
        // console.log("Categories fetched successfully");
        
        await getMax("orders", setmaxNumber, "userid", getUserName(), "order_number");
        // console.log("Max order number fetched successfully");
        
        await getRunningTable("orders", settableList);
       // console.log("Running tables fetched successfully");
        
        await loadTablesForSelection();
        //console.log("Table list fetched successfully");
        
        // ✅ Fetch company info for customer display and KOT header (prefer company_profile)
        const companyProfileData = await fetchData("company_profile", null, "id", {});
        const fallbackCompanyInfoData =
          Array.isArray(companyProfileData) && companyProfileData.length > 0
            ? companyProfileData
            : await fetchData("companyinfo", null, "id", {});

        if (fallbackCompanyInfoData && fallbackCompanyInfoData.length > 0) {
          const company = fallbackCompanyInfoData[0];
          setCompanyInfo({
            name: company.name || company.company_name || company.companyName || company.shop_name || 'ChefMate POS',
            company_name: company.company_name || company.name || company.companyName || company.shop_name || 'ChefMate POS',
            shop_name: company.shop_name || company.name || company.company_name || company.companyName || 'ChefMate POS',
            address: company.address || 'Restaurant Address',
            phone: company.phone_number || 'Phone Number'
          });
          // console.log("Company info fetched successfully");
        }

        // console.log("NewPOS Component: All data fetched successfully");
      } catch (error) {
        console.error("Error in NewPOS useEffect:", error);
        if (handleAuthError(error)) return;
        toast.error("Error loading POS data: " + error.message);
      }
    };

    fetchAndSetData();
  }, []);

  return (
    <>
      {/* ✅ Full Screen POS Container */}
      <div style={{ 
        width: '100vw', 
        height: '100vh', 
        overflow: 'hidden',
        backgroundColor: '#f8f9fa',
        position: 'relative'
      }}>
        
        {/* ✅ Dashboard Navigation Button */}
        <button 
          className="btn dashboard-btn"
          onClick={navigateToDashboard}
          style={{ 
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 1000,
            borderRadius: '50%',
            width: '48px',
            height: '48px',
            padding: '0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '600',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            fontSize: '14px',
            border: 'none',
            backgroundColor: '#dc3545',
            color: 'white',
            transition: 'all 0.3s ease'
          }}
          title="Dashboard"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.05)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.25)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
          }}
        >
          <FaHome size={18} />
        </button>

        {/* ✅ POS System Title */}
        <div className="pos-title" style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          backgroundColor: 'white',
          padding: '10px 20px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          fontWeight: 'bold',
          fontSize: '18px',
          color: '#333'
        }}>
          ChefmatePro 2.0 POS System
        </div>

        {/* Floating Table Selection Button */}
        <button 
          className="btn btn-primary floating-table-btn"
          onClick={showTableSelection}
          style={{ 
            position: 'fixed',
            top: '100px',
            right: '20px',
            zIndex: 1000,
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0, 123, 255, 0.3)',
            border: 'none',
            fontSize: '20px',
            transition: 'all 0.3s ease'
          }}
          title={selectedTable ? `Current Table: ${selectedTable}` : 'Select Table'}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.1)";
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(0, 123, 255, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 123, 255, 0.3)";
          }}
        >
          <FaTable />
          {selectedTable && (
            <span 
              style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                backgroundColor: '#28a745',
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                fontSize: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}
            >
              ✓
            </span>
          )}
        </button>

        {/* ✅ Customer Display Control Button */}
        <button 
          className={`btn ${isCustomerDisplayOpen ? 'btn-success' : 'btn-warning'} floating-display-btn`}
          onClick={toggleCustomerDisplay}
          style={{ 
            position: 'fixed',
            top: '170px',
            right: '20px',
            zIndex: 1000,
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isCustomerDisplayOpen 
              ? '0 4px 12px rgba(40, 167, 69, 0.3)' 
              : '0 4px 12px rgba(255, 193, 7, 0.3)',
            border: 'none',
            fontSize: '18px',
            transition: 'all 0.3s ease'
          }}
          title={isCustomerDisplayOpen ? 'Close Customer Display' : 'Open Customer Display'}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.1)";
            e.currentTarget.style.boxShadow = isCustomerDisplayOpen 
              ? "0 6px 16px rgba(40, 167, 69, 0.4)" 
              : "0 6px 16px rgba(255, 193, 7, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = isCustomerDisplayOpen 
              ? "0 4px 12px rgba(40, 167, 69, 0.3)" 
              : "0 4px 12px rgba(255, 193, 7, 0.3)";
          }}
        >
          {isCustomerDisplayOpen ? <FaEye /> : <FaDesktop />}
        </button>

        {/* ✅ Main Content Area with proper spacing */}
        <div style={{ 
          height: '100vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingTop: '80px',
          paddingLeft: '12px',
          paddingRight: '12px',
          paddingBottom: '200px'
        }}>

        {/* Main Category List */}
        <div className="row mt-2">
          <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
            <CardComponent
              title="Choose Category"
              headerColor=""
              pull="left"
              bodyClass="panel-body"
              titleStyle={{ color: 'white' }}
            >
              <div className="panel panel-default card-view" style={{ padding: '5px' }}>
                <div className="row" style={{ margin: '0' }}>
                  {categories.length > 0 ? (
                    categories.map((category, index) => (
                      <div className="col-1 col-md-1 col-sm-3 col-xs-6" key={index} style={{ padding: '2px' }}>
                        <button
                          className="btn btn-primary category-btn"
                          onClick={() => handleCategoryClick(category.id)}
                          style={{ 
                            width: '100%', 
                            padding: '8px 4px', 
                            fontSize: '12px', 
                            margin: '2px 0',
                            minHeight: '35px',
                            color: '#fff'
                          }}
                        >
                          {category.name}
                        </button>
                      </div>
                    ))
                  ) : (
                    <p>Loading categories...</p>
                  )}
                </div>
              </div>
            </CardComponent>
          </div>
        </div>

        {/* Subcategory List */}
        <div className="row mt-2">
          <div className="col-lg-2 col-md-2 col-sm-4 col-xs-12">
            <CardComponent
              title="Subcategories"
              headerColor="info"
              pull="left"
              bodyClass="panel-body"
              titleStyle={{ color: 'white' }}
            >
              <div className="panel panel-default card-view" style={{ padding: '5px' }}>
                  <div
                    className="item-list-container"
                    style={{
                      maxHeight: 'calc(100vh - 260px)',
                      overflowY: 'auto',
                      paddingBottom: '120px',
                    }}
                  >
                  <div className="row" style={{ margin: '0' }}>
                    {subcategories.length > 0 ? (
                      subcategories.map((subcategory, index) => (
                        <div className="col-12" key={index} style={{ padding: '2px' }}>
                          <button
                            onClick={() => handleSubcategoryClick(subcategory.id)}
                            className="btn btn-danger btn-anim fixed-width-btn"
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              fontSize: '11px',
                              margin: '1px 0',
                              minHeight: '50px'
                            }}
                          >
                            {subcategory.subcat}
                          </button>
                        </div>
                      ))
                    ) : (
                      <p style={{ fontSize: '12px', padding: '10px' }}>No subcategories available for this category.</p>
                    )}
                  </div>
                </div>
              </div>
            </CardComponent>
          </div>

          {/* Item List */}
          <div className="col-lg-7 col-md-7 col-sm-8 col-xs-12">
            <CardComponent
              title="Items"
              headerColor="info"
              pull="left"
              bodyClass="panel-body"
              titleStyle={{ color: 'white' }}
            >
              <div className="panel panel-default card-view" style={{ padding: '5px' }}>
                <div
                  className="item-list-container"
                  style={{
                    maxHeight: 'calc(100vh - 260px)',
                    overflowY: 'auto',
                    paddingBottom: '120px',
                  }}
                >
                  <div className="row mt-2" style={{ margin: '0' }}>
                    {data.length > 0 ? (
                      data.map((item, index) => (
                        <div key={item.id} className="col-lg-2 col-md-3 col-sm-6 col-xs-12 mb-2" style={{ padding: '5px' }}>
                          <div className="item-card text-center" style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '8px' }}>
                            <img
                              src={`${baseURL}/uploads/${item.filename}`}
                              alt={item.iname}
                              onClick={() => addItemToOrder(index, item)}
                              className="item-image"
                              style={{ 
                                marginBottom: '5px',
                                width: '100%',
                                height: '120px',
                                objectFit: 'cover',
                                borderRadius: '6px',
                                cursor: 'pointer'
                              }}
                            />
                            <h5 className="item-name" style={{ fontSize: '13px', margin: '3px 0' }}>{item.iname}</h5>
                            <p className="item-price" style={{ fontSize: '12px', margin: '2px 0' }}>฿ {item.offerprice}.00</p>
                           
                          </div>
                        </div>
                      ))
                    ) : (
                      <p style={{ padding: '20px', fontSize: '14px' }}>No items available for this subcategory.</p>
                    )}
                  </div>
                </div>
              </div>
            </CardComponent>
          </div>

          {/* Order Summary */}

          {/* Order Summary with quantity adjustment buttons and item total amount display */}
          <div className="col-lg-3 col-md-3 col-sm-4 col-xs-12">
            <CardComponent
              title={selectedTable}
              headerColor="info"
              pull="left"
              bodyClass="panel-body"
              titleStyle={{ color: 'white' }}
            >
              <div className="panel panel-default card-view" style={{ padding: '5px' }}>
                <div className="row" style={{ margin: '0' }}>
                  <div className="col-12" style={{ paddingBottom: '8px' }}>
                    {/* Quick Add Item Card - Always Visible */}
                    <div className="card" style={{ padding: '12px', background: '#f8f9fa', borderRadius: '0', border: '1px solid #e9ecef', marginBottom: '12px' }}>
                      <h6 style={{ fontWeight: '700', marginBottom: '10px', fontSize: '13px', color: '#495057' }}>⚡ Quick Add Item</h6>
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          await addItemByCode(quickItemCode, quickQty);
                          focusItemCodeInput();
                        }}
                      >
                        <input
                          type="text"
                          className="form-control mb-2"
                          placeholder="Item Code / Barcode"
                          value={quickItemCode}
                          onChange={(e) => setQuickItemCode(e.target.value)}
                          ref={itemCodeInputRef}
                          style={{ fontSize: '12px', height: '36px' }}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const qtyInput = document.getElementById('quick-qty-input');
                              if (qtyInput && e.target.id !== 'quick-qty-input') {
                                e.preventDefault();
                                qtyInput.focus();
                              }
                            }
                          }}
                        />
                        <input
                          id="quick-qty-input"  
                          type="number"
                          min="1"
                          className="form-control mb-2"
                          placeholder="Quantity"
                          value={quickQty}
                          onChange={(e) => setQuickQty(e.target.value)}
                          style={{ fontSize: '12px', height: '36px' }}
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              await addItemByCode(quickItemCode, quickQty);
                              setQuickQty("1");
                              focusItemCodeInput();
                            }
                          }}
                        />
                        <small style={{ fontSize: '11px', color: '#6c757d' }}>Press Enter to move to quantity, Enter again to add</small>
                      </form>
                    </div>

                    <div
                      style={{
                        maxHeight: 'calc(100vh - 420px)',
                        overflowY: 'auto',
                        paddingRight: '4px',
                        paddingBottom: '16px',
                      }}
                    >
                      {cart.length > 0 ? (
                        cart.map((item, index) => (
                          <>
                            <div
                              className="order-item d-flex align-items-center justify-content-between mb-1"
                              key={index}
                              style={{ padding: '3px 0' }}
                            >
                              <h5 className=" mb-0 pos-cart-item-name">
                                {item.iname} x {formatQuantityForDisplay(item)} = ฿ {(item.quantity * item.offerprice).toFixed(2)}
                              </h5>
                              <div className="quantity-controls d-flex align-items-center">
                                <button
                                  className="btn btn-dark-custom btn-sm me-1"
                                  onClick={() => decreaseItemQuantity(index)}
                                  style={{ padding: '1px 4px', fontSize: '18px' }}
                                >
                                  -
                                </button>
                                <span className="quantity me-1" style={{ fontSize: '8px' }}>{item.quantity}</span>
                                <button
                                  className="btn btn-dark-custom btn-sm"
                                  onClick={() => increaseItemQuantity(index)}
                                  style={{ padding: '1px 4px', fontSize: '18px' }}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </>
                        ))
                      ) : (
                        <div style={{ padding: '10px' }}>
                          <p style={{ fontSize: '12px', marginBottom: '8px' }}>Your cart is empty.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardComponent>
          </div>


        </div>

        {/* Bottom Actions Container */}
        <div style={{
          position: 'fixed',
          left: '0',
          right: '0',
          bottom: '0',
          zIndex: 1000,
          backgroundColor: 'white',
          borderRadius: '0',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.08)',
          padding: '12px clamp(12px, 2vw, 20px)',
          width: '100vw'
        }}>
          <div
            className="total-container d-flex justify-content-between align-items-center gap-2"
            style={{
              marginBottom: '8px',
              paddingBottom: '8px',
              borderBottom: '1px solid #e9ecef',
              flexWrap: 'nowrap',
              overflow: 'hidden',
            }}
          >
            <span style={{ fontSize: '22px', fontWeight: '600', color: '#000', margin: 0, lineHeight: '1' }}>
              Total:{" "}
              <span style={{ color: '#000' }}>฿ {total.toFixed(2)}</span>
            </span>
            <div className="d-flex align-items-center gap-2">
              <ESCPosAutoDetectButton
                orderData={{
                  id: maxNumber,
                  order_number: maxNumber,
                  queue_number: maxNumber,
                  table: selectedTable,
                  table_number: selectedTable,
                  timestamp: new Date().toISOString(),
                  items: cart.map(item => ({
                    item_name: item.iname,
                    quantity: item.quantity,
                    price: item.offerprice,
                    special_instructions: item.notes || '',
                    category: resolveItemGroup(item),
                    item_group: resolveItemGroup(item)
                  })),
                  customer_name: 'Order',
                  total: total
                }}
                sendPrintCommand={handleESCPosOrderFlow}
                onPrintSuccess={() => {
                  console.log('✅ ESC/POS order completed successfully');
                  toast.success('KOT sent to printer and cart cleared!');
                }}
                size="middle"
                buttonType="default"
                buttonText="KOT"
                buttonTextStyle={{ height: '36px', padding: '0 14px', fontSize: '12px', fontWeight: '600', lineHeight: '36px', display: 'inline-flex', alignItems: 'center' }}
              />
              <button
                className="btn btn-danger"
                onClick={handleDeleteOrder}
                style={{ height: '36px', padding: '0 14px', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', lineHeight: '1' }}
                title="Clear Cart"
              >
                <FaTrash className="me-1" /> Clear Cart
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', overflowY: 'hidden', flexWrap: 'nowrap', paddingBottom: '4px', WebkitOverflowScrolling: 'touch' }}>
            <button 
              className="btn btn-success"
              onClick={handleBillHistory}
              style={{ padding: '8px 14px', fontSize: '12px', fontWeight: '600', borderRadius: '8px', border: 'none', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}
            >
              📋 Bill History
            </button>
            <button 
              className="btn btn-primary"
              onClick={refreshTables}
              style={{ padding: '8px 14px', fontSize: '12px', fontWeight: '600', borderRadius: '8px', border: 'none', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}
            >
              🔄 Refresh
            </button>
            <button 
              className="btn btn-warning"
              onClick={showtableBillDetails}
              style={{ padding: '8px 14px', fontSize: '12px', fontWeight: '600', borderRadius: '8px', border: 'none', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}
            >
              💰 Check Bill
            </button>
            <button 
              className="btn btn-info"
              onClick={showReprintKOT}
              style={{ padding: '8px 14px', fontSize: '12px', fontWeight: '600', borderRadius: '8px', border: 'none', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}
            >
              🖨️ Reprint KOT
            </button>
            <button 
              className="btn btn-danger"
              onClick={() => navigate('/logout')}
              style={{ padding: '8px 14px', fontSize: '12px', fontWeight: '600', borderRadius: '8px', border: 'none', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}
            >
              🚪 Logout
            </button>
          </div>
        </div>
        
        </div> {/* ✅ Close main content area */}
        
      </div> {/* ✅ Close full screen POS container */}
      <TableSelectionModal
        isOpen={tableSelectionModal}
        onClose={() => setTableSelectionModal(false)}
        tables={TotalTablelist}
        onTableSelect={handleTableClick}
        selectedTable={selectedTable}
      />
      <CheckBillModal
          isOpen={tableshowModal}
          customer={selectedContract}
          uptableList={Tablelist}
          refreshTrigger={refreshTrigger}
          // onItemAdded={triggerReload} // Pass the reload function
          onClose={() => settableShowModal(false)} // Close the modal
        />
      <ReprintKOTModal
        isOpen={reprintModalOpen}
        onClose={closeReprintKOT}
        tables={(TotalTablelist || []).filter((table) => table.status === 1 || table.status === "1")}
        selectedTable={reprintTable}
        onSelectTable={handleSelectReprintTable}
        orderNumbers={reprintOrderNumbers}
        onSelectOrder={handleSelectReprintOrder}
        loadingOrders={reprintLoadingOrders}
      />
      <ReprintKOTOrderModal
        isOpen={reprintOrderModalOpen}
        onClose={() => setReprintOrderModalOpen(false)}
        tableNumber={reprintTable}
        orderNumber={reprintOrderNumber}
        items={reprintItems}
        loadingItems={reprintLoadingItems}
        onPrintEscPos={handleReprintKOTEscPos}
        onPrintHtml={handleReprintKOTHtml}
      />
    </>
  );
}

