import React, { useEffect, useState, useRef, useMemo } from "react";
import Modal from "react-modal";
import { useNavigate, Link } from "react-router-dom";
import { FaTimes } from "react-icons/fa"; // Importing the close icon from react-icons
import { TextfieldwithLabel } from "../Buttons/Textfield";
import axios from "axios";
import { fetchComboData, fetchComboDataWithWhere } from "../../services/api";
import { getHeaders } from "../../utility/getHeader";
import fetchData from "../../functions/fetchData";
import { SubmitButton } from "../Buttons/Textfield";
import { Modal as AntModal, Table, Row, Col, Card, Button, Input, Select, Space, Statistic, Badge, Spin, Divider, Tag } from "antd";
import { ReloadOutlined, CloseOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CardComponent from "../../components/cards/CardComponent";
import FinalBillModal from "./FinalBillModal";
import fetchOrderDetails from "../../functions/fetchOrderDetails";
import updateData from "../../functions/updateData";
import { FaRedo } from "react-icons/fa"; // Import refresh icon
import CustomerDetailsModal from "./customerDetailsModal";
import LineQRDiscountModal from "./LineQRDiscountModal";
import QRPaymentModal from "../QRPaymentModal";
import { getUserName } from "../../functions/storageUtils"; // Import getUserName for cashier name
import customerDisplayManager from "../../services/CustomerDisplayManager"; // Import customer display manager
import { getNextSetupDate } from "../../utils/setupDateUtils"; // ✅ Import setup date utility
import { printInvoice, printInvoiceToCashier, printKioskInvoice } from "../../services/thermalPrinter";
import { generateQRForCheckBill } from "../../services/qrPaymentService";
import "./CheckBillModal.css";


const customStyles = {
  content: {
    position: "relative",
    top: "auto",
    left: "auto",
    right: "auto",
    bottom: "auto",
    margin: "0",
    transform: "none",
    width: "100%",
    height: "auto",
    maxWidth: "none",
    maxHeight: "none",
    padding: "0",
    border: "none",
    borderRadius: "12px",
    overflow: "visible",
    background: "transparent",
    inset: "auto"
  },
  overlay: {
    zIndex: 1050,
    background: "linear-gradient(135deg, rgba(0, 0, 0, 0.5) 0%, rgba(255, 255, 255, 0.1) 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backdropFilter: "blur(2px)"
  },
};

const getCurrentDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const getCurrentTime = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};

//console.log(getCurrentTime()); // Output: HH:MM:SS

//console.log(getCurrentDate()); // Output: YYYY-MM-DD

const CheckBillModal = ({ isOpen, customer, uptableList, onClose, refreshTrigger }) => {
  const [formdata, setFormData] = useState({
    pmode: "Cash", // Default to "Cash"
    discAmount: 0,
    discountType: "percentage", // Default to "percentage"
    phones: "",
    remark: ""
    // other fields
  });
  const [companyInfo, setcompanyInfo] = useState([]);
  const [TotalTablelist, setTotaltablelist] = useState([]); // Initialize as empty array instead of 0
  const [TaxesData, setTaxesData] = useState(0);
  const [selectedTable, setSelectedTable] = useState(null); // Table selection
  const [selectedTables, setSelectedTables] = useState([]); // Multiple table selection for merging
  const [isMergeMode, setIsMergeMode] = useState(false); // Toggle merge mode
  const [isSplitMode, setIsSplitMode] = useState(false); // Toggle split mode
  const [selectedSplitItemKeys, setSelectedSplitItemKeys] = useState([]); // Selected items for split group creation
  const [splitGroups, setSplitGroups] = useState([]); // [{ id, name, itemKeys }]
  const [FinalBillData, setFinalBillData] = useState([]); // Manage the table data state
  const [OrderItemsData, setOrderItemsData] = useState([]); // Manage the table data state
  const [isLineQRModalOpen, setLineQRModalOpen] = useState(false);
  const [isQRPaymentModalOpen, setQRPaymentModalOpen] = useState(false);


  // Handle table selection
  const handleTableClick = (tableNumber) => {
    setSelectedTable(tableNumber);

    toast.success(`Selected Table: ${tableNumber}`);
  };
  const [getTax, setTax] = useState([]);
  const [getUnit, setUnits] = useState([]);
  const [paymentOptions, setpaymentOptions] = useState([]);
  const [finalData, setFinalData] = useState([]);
  const [changeMoney, setChangeMoney] = useState("");
  const [phones, setphones] = useState("");
  const printRef = useRef();
  const [latestBillId, setLatestBillId] = useState(null);
  const [savedSplitInvoices, setSavedSplitInvoices] = useState([]);


  const [reload, setReload] = useState(false);
  const [data, setData] = useState([]);
  const [errors, setErrors] = useState({});
  const [images, setImages] = useState([]);
  const [isCustomerModalOpen, setCustomerModalOpen] = useState(false);
  const [customerDetails, setCustomerDetails] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [isBillSaved, setIsBillSaved] = useState(false);

  //   if (!customer) return null;

  const refreshTables = (event) => {
    try {
      fetchData("tablelist", setTotaltablelist, "id", { status: "1" });
      setIsBillSaved(false);
    } catch (error) {
      console.error('Error refreshing tables:', error);
    }
  };

  // Function to refresh tables and clear bill summary
  const refreshTablesAndClearBill = async () => {
    try {
      // Refresh table list
      await fetchData("tablelist", setTotaltablelist, "id", { status: "1" });
      
      // Clear bill summary data
      setFinalData([]);
      setSelectedTable(null);
      setSubtotal(0);
      setDiscAmount(0);
      settaxAmount(0);
      setroundoffAmount(0);
      setgrandAmount(0);
      settotalAmount(0);
      setsubtotalAfterDiscount(0);
      setIsBillSaved(false);
      setLatestBillId(null);
      setSavedSplitInvoices([]);
      
      // Clear merge states
      setSelectedTables([]);
      setIsMergeMode(false);
      setIsSplitMode(false);
      setSelectedSplitItemKeys([]);
      setSplitGroups([]);
      
      // Clear form data
      setFormData({
        pmode: "Cash",
        discAmount: 0,
        discountType: "percentage",
        phones: "",
        paidAmount: "",
        remark: ""
      });
      setChangeMoney("");
      setphones("");
      
      // console.log("Tables refreshed and bill summary cleared");
    } catch (error) {
      console.error("Error refreshing tables:", error);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    //console.log(formdata);
    try {
      const post1 = await axios.post(
        "/insertdata/items",
        {
          iname: formdata.iname,
          unit: formdata.unit,
          tax: formdata.tax,
          mrp: formdata.mrp,
          offerprice: formdata.offerprice,
          catid: formdata.category,
          subcatid: formdata.subcat,
          description: formdata.desc,
        },
        getHeaders()
      );
      const formdata1 = e.target;
      const formData = new FormData();
      Array.from(formdata1.images.files).forEach((file) => {
        formData.append("images", file);
      });
      // console.log(post1.data.id);
      formData.append("product_id", post1.data.id); // Assuming post1 returns item ID

      const post2 = await axios.post("/addnewproduct/item_images", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`, // Again, make sure the token is correct
        },
      });
      // Immediately fetch updated data after adding an item
      // await fetchData("items", setData, "id", {});
      //  onItemAdded(); // Call this to trigger the reload function in NewItem
      toast.success("Item added successfully!");
      setImages([]);
      // Optionally add a delay before closing the modal to ensure the toast is visible
      setTimeout(() => {
        onClose(); // Close modal
      }, 1000); // Adjust the delay as needed
      //console.log("Fetched data after add:", data);
    } catch (err) {
      toast.error("Error in adding Item");
      console.error(err.message);
    }

    // Clear form data and errors
    // setFormData({});
    setErrors({});
  };
  const navigate = useNavigate();
  //handle change money
  const handleChangeMoney = (e) => {
    const paidAmount = parseFloat(e.target.value) || 0; // Convert to a number or set to 0 if empty
    const grandTotal = Math.round(
      finalData.reduce((acc, item) => acc + item.total_price, 0) * 1.07
    ); // Calculate the grand total
    const change = paidAmount - grandAmount; // Calculate the change
    setChangeMoney(change.toFixed(2)); // Update the state with the calculated change
    setFormData((prevData) => ({
      ...prevData,
      paidAmount: e.target.value, // Update the paid amount in formdata
    }));
  };
  const [subtotal, setSubtotal] = useState(0);
  const [discAmount, setDiscAmount] = useState(0);
  const [calculatedDiscountAmount, setCalculatedDiscountAmount] = useState(0); // Track actual discount amount
  const [taxAmount, settaxAmount] = useState(0);
  const [roundoffAmount, setroundoffAmount] = useState(0);
  const [grandAmount, setgrandAmount] = useState(0);
  const [totalAmount, settotalAmount] = useState(0);
  const [subtotalAfterDiscount, setsubtotalAfterDiscount] = useState(0);
  const [isCustomerPhoneModalOpen, setIsCustomerPhoneModalOpen] = useState(false);
  const [currencySign, setCurrencySign] = useState("฿"); // Default to Thai Baht







  const handleComboChange = (e) => {
    const { value } = e.target;
    setFormData((prevData) => ({ ...prevData, pmode: value }));

    // console.log("Payment Mode Selected:", value); // ✅ Debugging
    if (value === "Credit") {
      // console.log("Opening Customer Details Modal"); // ✅ Debugging
      setCustomerModalOpen(true);
    }
  };


  // Handle changes to the discount type (percentage or amount)
  const handleDiscountTypeChange = (e) => {
    setFormData({
      ...formdata,
      discountType: e.target.value, // Update the discountType value based on selection
    });

    // Recalculate discount immediately after changing type
    //handlediscount({ target: { value: discAmount.toString() } });
  };


  // Fetch subcategories based on selected category
  const handleTableHistory = async (tableName) => {
    setSelectedTable(tableName);
    setFormData((prevData) => ({ ...prevData, paidAmount: "", pmode: "Cash", remark: "" }));
    setChangeMoney("");
    setDiscAmount("0");
    setIsBillSaved(false); // Reset bill saved status when selecting a new table
    setSelectedSplitItemKeys([]);
    setSplitGroups([]);
    setSavedSplitInvoices([]);

    fetchData("order_items", setFinalData, "id", { table_number: tableName, status: "1" });

    //  handlediscount({ target: { value: "0" } });
  };

  // Toggle merge mode
  const toggleMergeMode = () => {
    const nextMode = !isMergeMode;
    setIsMergeMode(nextMode);
    if (nextMode) {
      setIsSplitMode(false);
      setSelectedSplitItemKeys([]);
      setSplitGroups([]);
    }
    setSelectedTables([]);
    setSelectedTable(null);
    setFinalData([]);
    setIsBillSaved(false);
    setSavedSplitInvoices([]);
    toast.info(isMergeMode ? "Merge mode disabled" : "Merge mode enabled - Select multiple tables");
  };

  const getItemRowKey = (item, index) => {
    if (item?.id !== undefined && item?.id !== null) return `id-${item.id}`;
    return `idx-${index}-${item?.item_name || 'item'}`;
  };

  const billTableData = useMemo(() => {
    return (finalData || []).map((item, index) => ({
      ...item,
      _rowKey: getItemRowKey(item, index),
      unit_price: (item.total_price / item.quantity).toFixed(2)
    }));
  }, [finalData]);

  const assignedSplitKeySet = useMemo(() => {
    const assigned = new Set();
    splitGroups.forEach((group) => {
      (group.itemKeys || []).forEach((key) => assigned.add(key));
    });
    return assigned;
  }, [splitGroups]);

  const splitItemToGroupName = useMemo(() => {
    const map = new Map();
    splitGroups.forEach((group) => {
      (group.itemKeys || []).forEach((key) => {
        map.set(key, group.name);
      });
    });
    return map;
  }, [splitGroups]);

  const splitSummaries = useMemo(() => {
    return splitGroups.map((group) => {
      const items = billTableData.filter((item) => (group.itemKeys || []).includes(item._rowKey));
      const subtotalValue = items.reduce((acc, item) => acc + (Number(item.total_price) || 0), 0);
      return {
        ...group,
        items,
        subtotal: subtotalValue
      };
    });
  }, [splitGroups, billTableData]);

  const toggleSplitMode = () => {
    const nextMode = !isSplitMode;
    setIsSplitMode(nextMode);
    setSelectedSplitItemKeys([]);
    setSplitGroups([]);
    setSavedSplitInvoices([]);
    if (nextMode) {
      setIsMergeMode(false);
      setSelectedTables([]);
      toast.info("Split mode enabled - Select items and create multiple splits");
    } else {
      toast.info("Split mode disabled");
    }
  };

  const createSplitFromSelection = () => {
    if (!isSplitMode) return;

    const availableSelection = selectedSplitItemKeys.filter((key) => !assignedSplitKeySet.has(key));
    if (availableSelection.length === 0) {
      toast.error("Please select unassigned items to create a split");
      return;
    }

    const splitNumber = splitGroups.length + 1;
    const newGroup = {
      id: `split-${Date.now()}-${splitNumber}`,
      name: `Split ${splitNumber}`,
      itemKeys: availableSelection
    };

    setSplitGroups((prev) => [...prev, newGroup]);
    setSelectedSplitItemKeys([]);
    toast.success(`${newGroup.name} created`);
  };

  const removeSplitGroup = (groupId) => {
    setSplitGroups((prev) => prev.filter((group) => group.id !== groupId));
  };

  // Handle table selection in merge mode
  const handleTableSelection = async (tableName) => {
    if (isMergeMode) {
      let newSelectedTables;
      // In merge mode, allow multiple table selection
      if (selectedTables.includes(tableName)) {
        // Remove table if already selected
        newSelectedTables = selectedTables.filter(table => table !== tableName);
        setSelectedTables(newSelectedTables);
        toast.info(`Table ${tableName} removed from selection`);
      } else {
        // Add table to selection
        newSelectedTables = [...selectedTables, tableName];
        setSelectedTables(newSelectedTables);
        toast.success(`Table ${tableName} added to selection`);
      }
      
      // Automatically merge and show bill summary when tables are selected
      if (newSelectedTables.length > 0) {
        await autoMergeTables(newSelectedTables);
      } else {
        // Clear bill data if no tables selected
        setFinalData([]);
        setSelectedTable(null);
      }
    } else {
      // Normal single table selection
      handleTableHistory(tableName);
    }
  };

  // Auto-merge function to show bill summary immediately
  const autoMergeTables = async (tablesToMerge) => {
    try {
      // Fetch order items from all selected tables
      const allOrderItems = [];
      for (const tableName of tablesToMerge) {
        const tableOrders = await fetchData("order_items", null, "id", { 
          table_number: tableName, 
          status: "1" 
        });
        if (tableOrders && tableOrders.length > 0) {
          allOrderItems.push(...tableOrders);
        }
      }

      if (allOrderItems.length === 0) {
        setFinalData([]);
        setSelectedTable(null);
        return;
      }

      // Combine items with same name by adding quantities and totals
      const mergedItems = {};
      allOrderItems.forEach(item => {
        if (mergedItems[item.item_name]) {
          // Item already exists, combine quantities and totals
          mergedItems[item.item_name].quantity += item.quantity;
          mergedItems[item.item_name].total_price += parseFloat(item.total_price);
        } else {
          // New item, add to merged items
          mergedItems[item.item_name] = {
            ...item,
            total_price: parseFloat(item.total_price)
          };
        }
      });

      // Convert back to array
      const finalMergedData = Object.values(mergedItems);
      
      setFinalData(finalMergedData);
      setSelectedTable(`Merged: ${tablesToMerge.join(', ')}`);
      setIsBillSaved(false);
      
    } catch (error) {
      console.error("Error auto-merging tables:", error);
      toast.error("Error occurred while merging tables");
    }
  };

  // Merge selected tables and show combined bill
  const handleMergeTables = async () => {
    if (selectedTables.length < 2) {
      toast.error("Please select at least 2 tables to merge");
      return;
    }

    // Use the auto-merge function
    await autoMergeTables(selectedTables);
    toast.success(`Successfully merged ${selectedTables.length} tables`);
  };


  // Runs when discAmount or discountType changes
  useEffect(() => {
    if (finalData.length === 0 || !TaxesData || TaxesData.length === 0) return; // Prevent running when there's no data

    let discountAmount = parseFloat(discAmount) || 0;

    // Calculate subtotal safely
    const subtotalValue = finalData.reduce((acc, item) => acc + (Number(item.total_price) || 0), 0);
    setSubtotal(subtotalValue.toFixed(2));

    // Adjust discount calculation based on type
    if (formdata.discountType === "percentage") {
      discountAmount = Math.min((subtotalValue * discountAmount) / 100, subtotalValue); // Prevent over-discount
    } else {
      discountAmount = Math.min(discountAmount, subtotalValue); // Prevent over-discount for amount
    }

    // Store the calculated discount amount
    setCalculatedDiscountAmount(discountAmount);

    // Calculate subtotal after discount
    const subtotalAfterDiscount = subtotalValue - discountAmount;
    setsubtotalAfterDiscount(subtotalAfterDiscount.toFixed(2));

    // Calculate tax based on settings
    let taxValue = 0;
    let totalAmountValue = 0;
    
    const taxRate = parseFloat(TaxesData[0].taxvalue) || 0;
    
    if (TaxesData[0].included === "true") {
      // Tax included in price
      taxValue = (subtotalAfterDiscount * taxRate) / (100 + taxRate);
      totalAmountValue = subtotalAfterDiscount;
    } else {
      // Tax excluded from price
      taxValue = subtotalAfterDiscount * (taxRate / 100);
      totalAmountValue = subtotalAfterDiscount + taxValue;
    }
    
    settaxAmount(taxValue.toFixed(2));
    settotalAmount(totalAmountValue.toFixed(2));

    // Round-off amount
    const roundedTotal = Math.round(totalAmountValue);
    const roundoffValue = roundedTotal - totalAmountValue;
    setroundoffAmount(roundoffValue.toFixed(2));

    // Set final grand total
    setgrandAmount(roundedTotal.toFixed(2));

  }, [discAmount, formdata.discountType, finalData, TaxesData]); // Added TaxesData to dependencies


  const handleBillHistory = async () => {
    navigate(`/reports/billhistory`);
  };

  // ✅ Handle ESC/POS Thermal Printer Invoice Printing
  const handlePrintBillESCPOS = async () => {
    try {
      if (!finalData || finalData.length === 0) {
        toast.error("No items to preview. Please add items first.");
        return;
      }

      // Detect mode: KIOSK if table is "Walk-in" or contains "kiosk", otherwise CheckBill
      const isKioskMode = selectedTable && (selectedTable.toLowerCase() === "walk-in" || selectedTable.toLowerCase().includes("kiosk"));

      const companyName = companyInfo && companyInfo[0] ? companyInfo[0].name : "CHEFMATE";
      const companyAddress = companyInfo && companyInfo[0] ? companyInfo[0].address : "Sol 13, Pattaya-20150";
      const companyPhone = companyInfo && companyInfo[0] ? companyInfo[0].phone_number : "";
      const companyTaxId = companyInfo && companyInfo[0] ? companyInfo[0].tax_id : "";

      const defaultInvoiceData = {
        billId: latestBillId || "0",
        queueNumber: selectedTable || "Walk-in",
        companyName,
        companyAddress,
        companyPhone,
        companyTaxId,
        timestamp: new Date().toLocaleString(),
        items: finalData.map(item => ({
          item_name: item.item_name,
          quantity: item.quantity,
          price: (item.total_price / item.quantity).toFixed(2),
          total: Number(item.total_price).toFixed(2)
        })),
        subtotal: Number(subtotal).toFixed(2),
        discountPercent: formdata.discountType === "percentage" ? discAmount : 0,
        discountAmount: Number(calculatedDiscountAmount).toFixed(2),
        subtotalAfterDiscount: Number(subtotalAfterDiscount).toFixed(2),
        taxPercent: 7,
        taxAmount: Number(taxAmount).toFixed(2),
        roundOff: Number(roundoffAmount).toFixed(2),
        total: Number(grandAmount).toFixed(2),
        paymentMethod: formdata.pmode || "CASH",
        operatedBy: "3130"
      };

      const invoicesToPrint = (savedSplitInvoices && savedSplitInvoices.length > 0)
        ? savedSplitInvoices
        : [defaultInvoiceData];

      let toastId;
      try {
        toastId = toast.loading("Printing invoice...");
        
        let allSuccess = true;
        for (let index = 0; index < invoicesToPrint.length; index++) {
          const invoiceData = {
            ...invoicesToPrint[index],
            companyName,
            companyAddress,
            companyPhone,
            companyTaxId,
            timestamp: invoicesToPrint[index]?.timestamp || new Date().toLocaleString(),
            paymentMethod: invoicesToPrint[index]?.paymentMethod || formdata.pmode || "CASH"
          };

          const success = isKioskMode
            ? await printKioskInvoice(invoiceData)
            : await printInvoiceToCashier(invoiceData);

          if (!success) {
            allSuccess = false;
            break;
          }
        }

        if (allSuccess) {
          if (toastId) {
            toast.dismiss(toastId);
          }
          toast.success(invoicesToPrint.length > 1 ? "Split invoices printed successfully!" : "Invoice printed to Cashier printer successfully!");
        } else {
          if (toastId) {
            toast.dismiss(toastId);
          }
          toast.error("Failed to print invoice. Make sure printer server is running on port 7001.");
        }
      } catch (error) {
        if (toastId) {
          toast.dismiss(toastId);
        }
        console.error("❌ Error printing invoice:", error);
        toast.error("Error printing invoice: " + error.message);
      }
    } catch (error) {
      console.error("❌ Error in handlePrintBillESCPOS:", error);
      toast.error("Error preparing invoice: " + error.message);
    }
  };

  // ✅ Generate QR code for CheckBill payment
  const handleGenerateQRCode = async () => {
    let toastId;
    try {
      if (!isBillSaved) {
        toast.error("Please save the bill first before generating QR code.");
        return;
      }

      toastId = toast.loading("Generating QR code...");
      const qrData = await generateQRForCheckBill(grandAmount);
      
      if (qrData) {
        if (toastId) {
          toast.dismiss(toastId);
        }
        toast.success("QR code generated successfully!");
        console.log("QR Data:", qrData);
        // You can use qrData here if needed for additional processing
      }
    } catch (error) {
      if (toastId) {
        toast.dismiss(toastId);
      }
      console.error("❌ Error generating QR code:", error);
      toast.error("Error generating QR code: " + error.message);
    }
  };

  // ✅ Send bill summary to customer display
  const sendBillSummaryToCustomerDisplay = () => {
    if (customerDisplayManager.isDisplayConnected() && finalData.length > 0) {
      try {
        // Prepare bill summary data
        const billSummary = {
          tableNumber: selectedTable,
          items: finalData.map(item => ({
            iname: item.item_name,
            item_name: item.item_name,
            quantity: item.quantity,
            offerprice: item.total_price / item.quantity,
            price: item.total_price / item.quantity,
            total_price: item.total_price
          })),
          subtotal: subtotal,
          discount: discAmount,
          discountType: formdata.discountType,
          subtotalAfterDiscount: subtotalAfterDiscount,
          tax: taxAmount,
          grandTotal: grandAmount,
          paymentMode: formdata.pmode,
          status: 'BILL_CONFIRMATION',
          message: 'Please confirm your order'
        };

        // Send bill confirmation to customer display
        customerDisplayManager.sendBillConfirmation(billSummary);
        
        // console.log("Bill summary sent to customer display");
      } catch (error) {
        console.error("Error sending bill summary to customer display:", error);
      }
    }
  };

  // ✅ Handle modal close and clear customer display
  const handleModalClose = () => {
    try {
      // Dismiss all active toasts to prevent errors
      try {
        if (toast && typeof toast.dismiss === 'function') {
          toast.dismiss();
        }
      } catch (toastError) {
        console.warn('Error dismissing toasts:', toastError);
      }
      
      // Clear bill confirmation from customer display
      if (customerDisplayManager.isDisplayConnected()) {
        customerDisplayManager.sendCustomMessage('NORMAL_MODE', 'normal');
      }
      
      // Call the original onClose function
      if (typeof onClose === 'function') {
        onClose();
      }
    } catch (error) {
      console.error('Error closing modal:', error);
      // Still try to close the modal even if there's an error
      if (typeof onClose === 'function') {
        onClose();
      }
    }
  };

  const handlePrintClick = async (itemId) => {
    try {

      const invId = itemId;
      //alert(invId);
      // Fetch the final_bill and order_items details for the given itemId
      const myfinalbilldata = await fetchData("final_bill", setFinalBillData, "id", { id: invId });
      const myOrderItemsData = await fetchData("order_items", setOrderItemsData, "id", { invoice_number: invId });
      // Check if inv_time exists in finalBillData
      const invTime = myfinalbilldata[0].inv_time;
      const formattedTime = invTime ? invTime.split(':').slice(0, 2).join(':') : 'N/A'; // Use 'N/A' if inv_time is undefined

      // Format the data for printing using a similar structure
      const printContent = `
        <html>
          <head>
            <style>
              html, body {
                margin: 0;
                padding: 0;
                font-family: 'Cambria', monospace;
              }
              body {
                font-size: 18px;
                width: 80mm;
              }
              .bill-header {
                text-align: center;
                margin-bottom: 2px;
              }
              .bill-header h2 {
                margin: 0;
                font-size: 24px;
                font-weight: bold;
              }
              .bill-header p {
                margin: 4px 0;
                font-size: 18px;
              }
              .table {
                width: 100%;
                margin-top: 1px;
                border-collapse: collapse;
              }
              .table th, .table td {
                text-align: left;
                padding: 5px 0;
                font-size: 18px;
                line-height: 1.6;
              }
              .table th {
                font-weight: bold;
                border-bottom: 1px solid #000;
              }
              .table th.header {
                font-weight: bold;
                
              }
              .table td {
                border-bottom: 1px solid #ddd;
              }
              .table td.total {
                font-weight: bold;
                font-size: 18px;
                margin-right: 2px;
                border-bottom: 1px solid #000;
              }
              .total-row {
                margin-top: 5px;
                margin-right: 10px;
                font-weight: bold;
                text-align: right;
                font-size: 18px;
              }
              .footer {
                margin-top: 15px;
                text-align: center;
                font-size: 18px;
              }
            </style>
          </head>
          <body>
            <div class="bill-header">
               <h2>${companyInfo[0].name}</h2>
            <div class="company-info">
              <p>${companyInfo[0].address}</p>
              <p>${companyInfo[0].phone_number}</p>
              <p>Tax:${companyInfo[0].tax_id}</p>
            
           
            </div>
             
           
          
          </div>
            <div class="bill-bill-body">
             
              <table class="table">
                
                  <tr >
                    <td class="header" >Bill ID: ${myfinalbilldata[0].id}</td>
                   
                    <td class="header" >${myfinalbilldata[0].table_number}</td>
                    
                  </tr>
                   <tr >
                    <td>Date: ${myfinalbilldata[0].inv_date}</td>
                   
                    <td>Time:${formattedTime}</td>
                    
                  </tr>
                
                <tbody> 
                <tr>  </tr>
                <tr>  </tr>
                </tbody>
                </table>
             
            </div>
            <div class="bill-body">
              <table class="table">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Qty</th>
                    <th>Rate</th>
                    <th>Total </th>
                  </tr>
                </thead>
                <tbody>
                  ${myOrderItemsData
          .map(
            (item) => `
                        <tr>
                          <td>${item.item_name}</td>
                          <td>${item.quantity}</td>
                          <td>${currencySign} ${item.total_price / item.quantity}</td>
                          <td>${currencySign} ${item.total_price}</td>
                        </tr>
                      `
          )
          .join('')}
                </tbody>
              </table>
               <div class="total-row">
              <span>Subtotal: ${currencySign} ${myfinalbilldata[0].subtotal}</span><br>
              <span>Discount: ${currencySign} ${myfinalbilldata[0].discount_amount}</span><br>
              <span>Subtotal After Discount: ${currencySign} ${myfinalbilldata[0].subtotal_afterdiscount}</span><br>

              <span>Tax (7%): ${currencySign} ${myfinalbilldata[0].tax}</span><br>
              <span>Round Off: ${currencySign} ${myfinalbilldata[0].roundoff}</span><br>
              <span>Total Amount: ${currencySign} ${myfinalbilldata[0].grand_total}</span>
            </div>
              
            </div>
            <div class="footer">
              <p>Printed on ${new Date().toLocaleString()}</p>
              <p>Cashier: ${getUserName() || 'N/A'}</p>
              <p>Powered by ${companyInfo[0].developer}</p>
            </div>
          </body>
        </html>
      `;

      // Open the print dialog with the formatted content
      const newWindow = window.open("", "_blank");
      newWindow.document.write(printContent);
      newWindow.document.close();

      newWindow.onload = () => {
        newWindow.print(); // Print the document
        newWindow.close(); // Close the window after printing
      };
    } catch (error) {
      console.error("Error fetching data for printing:", error);
    }
  };

  const calculateTaxedTotal = async (subtotal) => {
    try {
      // const response = await axios.get("/api/taxes/active", getHeaders());
      const response = await fetchData("taxes", setTotaltablelist, "id", { status: "active" });
      const taxes = response.data;

      let finalSubtotal = subtotal;
      let total = subtotal;
      const taxDetails = [];

      taxes.forEach((tax) => {
        const rate = parseFloat(tax.taxvalue);

        if (tax.included) {
          const taxAmount = (subtotal * rate) / (100 + rate);
          finalSubtotal -= taxAmount;
          taxDetails.push({
            name: tax.taxname,
            amount: taxAmount.toFixed(2),
            included: true,
          });
        } else {
          const taxAmount = (finalSubtotal * rate) / 100;
          total += taxAmount;
          taxDetails.push({
            name: tax.taxname,
            amount: taxAmount.toFixed(2),
            included: false,
          });
        }
      });

      return {
        subtotal: finalSubtotal.toFixed(2),
        total: total.toFixed(2),
        taxes: taxDetails,
      };
    } catch (err) {
      console.error("Failed to fetch or calculate taxes", err);
      return {
        subtotal: subtotal.toFixed(2),
        total: subtotal.toFixed(2),
        taxes: [],
      };
    }
  };


  const handleSaveBill = async (overrideMode) => {
    try {
      const selectedPaymentMode = (overrideMode || formdata.pmode || "").trim();
      const normalizedRemark = (formdata.remark || "").trim();

      // Validate payment mode is selected
      if (!selectedPaymentMode) {
        toast.error("Please select a payment mode before saving the bill.");
        return;
      }

      if (selectedPaymentMode === "Entertainment" && !normalizedRemark) {
        toast.error("Please enter a remark before saving an Entertainment bill.");
        return;
      }

      // console.log("Current formdata.pmode:", selectedPaymentMode); // ✅ Debug payment mode
      // console.log("Full formdata:", formdata); // ✅ Debug full form data

      // Validate customer details if payment mode is Credit
      if (selectedPaymentMode === "Credit" && (!customerDetails.name || !customerDetails.phone || !customerDetails.email)) {
        toast.error("Please enter customer details before saving the bill for Credit payment.");
        setCustomerModalOpen(true);
        return;
      }

      // Validate that we have tax data
      if (!TaxesData || TaxesData.length === 0) {
        toast.error("Tax information not loaded. Please try again.");
        return;
      }

      // Validate that we have items to bill
      if (!finalData || finalData.length === 0) {
        toast.error("No items to bill. Please add items first.");
        return;
      }

      // Validate that a table is selected
      if (!selectedTable) {
        toast.error("Please select a table before saving the bill.");
        return;
      }

      // console.log("Starting bill save process for payment mode:", selectedPaymentMode);

      // Calculate subtotal safely (same as useEffect calculation)
      const calculatedSubtotal = finalData.reduce((acc, item) => acc + (Number(item.total_price) || 0), 0);
      
      // Calculate discount amount based on the type (same as useEffect)
      let finaldiscount_amount = parseFloat(discAmount) || 0;
      if (formdata.discountType === "percentage") {
        finaldiscount_amount = Math.min((calculatedSubtotal * finaldiscount_amount) / 100, calculatedSubtotal);
      } else {
        finaldiscount_amount = Math.min(finaldiscount_amount, calculatedSubtotal);
      }
      
      // Calculate subtotal after discount
      const calculatedSubtotalAfterDiscount = calculatedSubtotal - finaldiscount_amount;
      
      // Calculate tax based on settings (same as useEffect)
      let calculatedTaxAmount = 0;
      let calculatedTotalAmount = 0;
      
      if (TaxesData[0].included === "true") {
        // Tax included calculation
        calculatedTaxAmount = (calculatedSubtotalAfterDiscount * TaxesData[0].taxvalue) / (100 + TaxesData[0].taxvalue);
        calculatedTotalAmount = calculatedSubtotalAfterDiscount;
      } else {
        // Tax excluded calculation
        calculatedTaxAmount = calculatedSubtotalAfterDiscount * (TaxesData[0].taxvalue / 100);
        calculatedTotalAmount = calculatedSubtotalAfterDiscount + calculatedTaxAmount;
      }
      
      // Calculate round off
      const roundedTotal = Math.round(calculatedTotalAmount);
      const calculatedRoundoffAmount = roundedTotal - calculatedTotalAmount;
      
      // Final grand total
      const calculatedGrandTotal = roundedTotal;
      
      // Determine bill status - 0 for paid, 1 for unpaid/credit
      let billstatus = 0; // Default to paid
      if (selectedPaymentMode === "Credit") {
        billstatus = 1; // Unpaid for credit
      }

      //prepare the request body
      const setupDate = await getNextSetupDate(); // ✅ Get next setup date
      
      const billData = {
        customer_id: selectedPaymentMode === "Credit" ? customerDetails.custid || null : null,
        tablenumber: selectedTables.length > 0 ? selectedTables.join(', ') : (selectedTable || ""),
        subtotal: calculatedSubtotal.toFixed(2),
        discount_type: formdata.discountType || "amount",
        discount_value: parseFloat(discAmount) || 0,
        discount_amount: finaldiscount_amount.toFixed(2),
        subtotal_afterdiscount: calculatedSubtotalAfterDiscount.toFixed(2),
        tax: calculatedTaxAmount.toFixed(2),
        total_amount: calculatedTotalAmount.toFixed(2),
        round_off: calculatedRoundoffAmount.toFixed(2),
        grand_total: calculatedGrandTotal.toFixed(2),
        payment_mode: selectedPaymentMode || "Cash", // ✅ Ensure payment mode is not empty
        status: billstatus,
        setup_date: setupDate, // ✅ Add setup_date column
        remark: (formdata.remark || "").trim()
      };

      // console.log('Payment mode being sent to API:', billData.payment_mode); // ✅ Debug API data
      // console.log('Full billData object:', billData); // ✅ Debug full object

      // ✅ Additional validation to ensure payment_mode is valid
      if (!billData.payment_mode || billData.payment_mode.trim() === "") {
        billData.payment_mode = "Cash"; // Force default to Cash
        console.warn("Payment mode was empty, defaulting to Cash");
      }

      // Add detailed logging for payment mode
      // console.log('Payment mode details:');
      // console.log('- formdata.pmode:', formdata.pmode);
      // console.log('- typeof formdata.pmode:', typeof formdata.pmode);
      // console.log('- billData.payment_mode:', billData.payment_mode);
      // console.log('- typeof billData.payment_mode:', typeof billData.payment_mode);

      // Validate calculated values match display values
      const displaySubtotal = parseFloat(subtotal);
      const displayGrandTotal = parseFloat(grandAmount);
      
      if (Math.abs(calculatedSubtotal - displaySubtotal) > 0.01) {
        console.warn("Subtotal mismatch:", { calculated: calculatedSubtotal, display: displaySubtotal });
      }
      
      if (Math.abs(calculatedGrandTotal - displayGrandTotal) > 0.01) {
        console.warn("Grand total mismatch:", { calculated: calculatedGrandTotal, display: displayGrandTotal });
      }

      // console.log('Sending bill data to API:', billData);
      
      // Add detailed logging for payment mode
      // console.log('Payment mode details:');
      // console.log('- formdata.pmode:', formdata.pmode);
      // console.log('- typeof formdata.pmode:', typeof formdata.pmode);
      // console.log('- billData.payment_mode:', billData.payment_mode);
      // console.log('- typeof billData.payment_mode:', typeof billData.payment_mode);

      // Save the final bill and ledger entries simultaneously in one request
      const response = await axios.post(
        "/savebill",  // API route that saves both bill & ledger
        billData,
        getHeaders()
      );

      // console.log('API Response:', response.data);

      if (!response.data || !response.data.bill_id) {
        throw new Error("Invalid response from server - no bill ID returned");
      }

      const { bill_id } = response.data; // Get the inserted bill ID
      setLatestBillId(bill_id);
      setSavedSplitInvoices([]);

      // console.log('Bill saved successfully with ID:', bill_id);

      // Update table status - handle both single table and merged tables
      if (selectedTables.length > 0) {
        // Merged tables scenario
        for (const tableName of selectedTables) {
          await updateData(
            "tablelist",
            { status: "0" }, // Mark table as "closed"
            { name: tableName }
          );
          
          // Update order items for each table
          await updateData("order_items", {
            status: "0", // Mark orders as completed
            invoice_number: bill_id, // Attach the invoice number
            setup_date: setupDate // ✅ Add setup_date when updating order_items
          },
            {
              table_number: tableName, // Match the table number
              status: "1", // Only update active orders
            }
          );
        }
      } else {
        // Single table scenario
        await updateData(
          "tablelist",
          { status: "0" }, // Mark table as "closed"
          { name: selectedTable }
        );

        // Update order items status and attach invoice number
        await updateData("order_items", {
          status: "0", // Mark orders as completed
          invoice_number: bill_id, // Attach the invoice number
          setup_date: setupDate // ✅ Add setup_date when updating order_items
        },
          {
            table_number: selectedTable, // Match the table number
            status: "1", // Only update active orders
          }
        );
      }

      // Refresh the table list and UI
      await fetchData("tablelist", setTotaltablelist, "id", { status: "1" });
      refreshTables(); // Auto-refresh tables modal with updated records

      // Show success toast message
      toast.success(`Bill saved successfully! Bill ID: ${bill_id}`);
      setIsBillSaved(true);
      setFormData((prev) => ({ ...prev, remark: "" }));
      
    } catch (err) {
      console.error("Error occurred during bill save:", err);
      toast.error(`Error saving bill: ${err.message || 'Unknown error'}`);
    }
  };

  const handleSaveSplitBills = async (overrideMode) => {
    try {
      const selectedPaymentMode = (overrideMode || formdata.pmode || "").trim();
      const normalizedRemark = (formdata.remark || "").trim();

      if (!selectedPaymentMode) {
        toast.error("Please select a payment mode before saving split bills.");
        return;
      }

      if (selectedPaymentMode === "Entertainment" && !normalizedRemark) {
        toast.error("Please enter a remark before saving split bills with Entertainment payment mode.");
        return;
      }

      if (!selectedTable || selectedTables.length > 0 || isMergeMode) {
        toast.error("Split bill is available for a single selected table only.");
        return;
      }

      if (!finalData || finalData.length === 0) {
        toast.error("No items to split.");
        return;
      }

      if (!splitGroups || splitGroups.length < 2) {
        toast.error("Please create at least 2 splits.");
        return;
      }

      if (selectedPaymentMode === "Credit" && (!customerDetails.name || !customerDetails.phone || !customerDetails.email)) {
        toast.error("Please enter customer details before saving split bills for Credit payment.");
        setCustomerModalOpen(true);
        return;
      }

      const allItemKeys = new Set(billTableData.map((item) => item._rowKey));
      const assignedKeys = new Set(splitGroups.flatMap((group) => group.itemKeys || []));
      if (allItemKeys.size !== assignedKeys.size) {
        toast.error("Please assign all items into split groups before saving.");
        return;
      }

      if (!TaxesData || TaxesData.length === 0) {
        toast.error("Tax information not loaded. Please try again.");
        return;
      }

      const setupDate = await getNextSetupDate();

      const totalSubtotal = billTableData.reduce((acc, item) => acc + (Number(item.total_price) || 0), 0);
      let totalDiscountAmount = parseFloat(discAmount) || 0;
      if (formdata.discountType === "percentage") {
        totalDiscountAmount = Math.min((totalSubtotal * totalDiscountAmount) / 100, totalSubtotal);
      } else {
        totalDiscountAmount = Math.min(totalDiscountAmount, totalSubtotal);
      }

      const createdBillIds = [];
      const splitInvoicesForPrint = [];

      for (let index = 0; index < splitSummaries.length; index++) {
        const split = splitSummaries[index];
        const splitSubtotal = split.subtotal;

        const proportionalDiscount = totalSubtotal > 0
          ? (totalDiscountAmount * splitSubtotal) / totalSubtotal
          : 0;

        const splitSubtotalAfterDiscount = splitSubtotal - proportionalDiscount;

        let splitTaxAmount = 0;
        let splitTotalAmount = 0;
        if (TaxesData[0].included === "true") {
          splitTaxAmount = (splitSubtotalAfterDiscount * TaxesData[0].taxvalue) / (100 + TaxesData[0].taxvalue);
          splitTotalAmount = splitSubtotalAfterDiscount;
        } else {
          splitTaxAmount = splitSubtotalAfterDiscount * (TaxesData[0].taxvalue / 100);
          splitTotalAmount = splitSubtotalAfterDiscount + splitTaxAmount;
        }

        const splitRoundedTotal = Math.round(splitTotalAmount);
        const splitRoundOff = splitRoundedTotal - splitTotalAmount;
        const splitGrandTotal = splitRoundedTotal;

        const billData = {
          customer_id: selectedPaymentMode === "Credit" ? customerDetails.custid || null : null,
          tablenumber: `${selectedTable} - ${split.name}`,
          subtotal: splitSubtotal.toFixed(2),
          discount_type: formdata.discountType || "amount",
          discount_value: parseFloat(discAmount) || 0,
          discount_amount: proportionalDiscount.toFixed(2),
          subtotal_afterdiscount: splitSubtotalAfterDiscount.toFixed(2),
          tax: splitTaxAmount.toFixed(2),
          total_amount: splitTotalAmount.toFixed(2),
          round_off: splitRoundOff.toFixed(2),
          grand_total: splitGrandTotal.toFixed(2),
          payment_mode: selectedPaymentMode,
          status: selectedPaymentMode === "Credit" ? 1 : 0,
          setup_date: setupDate,
          remark: `${(formdata.remark || "").trim()} [${split.name}]`.trim()
        };

        const response = await axios.post("/savebill", billData, getHeaders());
        const { bill_id } = response.data || {};
        if (!bill_id) {
          throw new Error(`Failed to create ${split.name}`);
        }

        createdBillIds.push(bill_id);

        splitInvoicesForPrint.push({
          billId: bill_id,
          queueNumber: `${selectedTable} - ${split.name}`,
          items: split.items.map((item) => ({
            item_name: item.item_name,
            quantity: item.quantity,
            price: Number(item.total_price / item.quantity).toFixed(2),
            total: Number(item.total_price).toFixed(2)
          })),
          subtotal: Number(splitSubtotal).toFixed(2),
          discountPercent: formdata.discountType === "percentage" ? discAmount : 0,
          discountAmount: Number(proportionalDiscount).toFixed(2),
          subtotalAfterDiscount: Number(splitSubtotalAfterDiscount).toFixed(2),
          taxPercent: parseFloat(TaxesData[0].taxvalue) || 0,
          taxAmount: Number(splitTaxAmount).toFixed(2),
          roundOff: Number(splitRoundOff).toFixed(2),
          total: Number(splitGrandTotal).toFixed(2),
          paymentMethod: selectedPaymentMode || "CASH",
          operatedBy: "3130",
          timestamp: new Date().toLocaleString()
        });

        for (const item of split.items) {
          if (!item?.id) continue;
          await updateData(
            "order_items",
            {
              status: "0",
              invoice_number: bill_id,
              setup_date: setupDate
            },
            {
              id: item.id,
              status: "1"
            }
          );
        }
      }

      await updateData("tablelist", { status: "0" }, { name: selectedTable });

      await fetchData("tablelist", setTotaltablelist, "id", { status: "1" });
      refreshTables();

      setLatestBillId(createdBillIds[createdBillIds.length - 1] || null);
      setSavedSplitInvoices(splitInvoicesForPrint);
      setIsBillSaved(true);
      setFormData((prev) => ({ ...prev, remark: "" }));
      toast.success(`Split bills saved successfully! Bill IDs: ${createdBillIds.join(', ')}`);
    } catch (err) {
      console.error("Error occurred during split bill save:", err);
      toast.error(`Error saving split bills: ${err.message || 'Unknown error'}`);
    }
  };

  // Quick-pay helper to set payment mode and save in one click
  const handleQuickPayment = async (mode) => {
    setFormData((prev) => ({ ...prev, pmode: mode }));
    if (isSplitMode && splitGroups.length > 0) {
      await handleSaveSplitBills(mode);
      return;
    }
    await handleSaveBill(mode);
  };
  // useEffect(() => {
  //   if (latestBillId) {
  //     handlePrintClick(latestBillId);
  //   }
  // }, [latestBillId]);



  const handlePrintBill = async () => {
    try {
      // Check if bill is already saved
      if (!isBillSaved) {
        toast.error("Please save the bill first before printing.");
        return;
      }

      const newWindow = window.open("", "_blank");

      const companyName = companyInfo[0]?.name || "";
      const companyAddress = companyInfo[0]?.address || "";
      const companyTaxId = companyInfo[0]?.tax_id || "";

      const invoicesForPrint = (savedSplitInvoices && savedSplitInvoices.length > 0)
        ? savedSplitInvoices
        : [{
            billId: latestBillId,
            queueNumber: selectedTable,
            items: finalData.map((item) => ({
              item_name: item.item_name,
              quantity: item.quantity,
              price: Number(item.total_price / item.quantity).toFixed(2),
              total: Number(item.total_price).toFixed(2)
            })),
            subtotal: subtotal,
            discountAmount: formdata.discountType === "percentage" ? calculatedDiscountAmount : discAmount,
            subtotalAfterDiscount: subtotalAfterDiscount,
            taxPercent: 7,
            taxAmount: taxAmount,
            roundOff: roundoffAmount,
            total: grandAmount,
            paymentMethod: formdata.pmode || 'Cash'
          }];

      const billBlocks = invoicesForPrint.map((invoice, idx) => `
        <div class="bill-page ${idx < invoicesForPrint.length - 1 ? 'page-break' : ''}">
          <div class="bill-header">
            <h2>${companyName}</h2>
            <div class="company-info">
              <p>${companyAddress}</p>
              <p>Tax:${companyTaxId}</p>
            </div>
          </div>
          <div class="bill-bill-body">
            <table class="table">
              <tr>
                <th class="header">Bill ID: ${invoice.billId || '-'}</th>
                <th class="header">${invoice.queueNumber || '-'}</th>
              </tr>
              <tr>
                <th>Date: ${getCurrentDate()}</th>
                <th>Time: ${getCurrentTime()}</th>
              </tr>
              <tr>
                <th colspan="2">Payment Mode: ${invoice.paymentMethod || formdata.pmode || 'Cash'}</th>
              </tr>
              <tbody>
                <tr></tr>
                <tr></tr>
              </tbody>
            </table>
          </div>
          <div class="bill-body">
            <table class="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${(invoice.items || [])
                  .map(
                    (item) => `
                      <tr>
                        <td>${item.item_name}</td>
                        <td>${item.quantity}</td>
                        <td>${currencySign} ${Number(item.price).toFixed(2)}</td>
                        <td>${currencySign} ${Number(item.total).toFixed(2)}</td>
                      </tr>
                    `
                  )
                  .join("")}
              </tbody>
            </table>
            <div class="total-row">
              <span>Subtotal: ${currencySign} ${Number(invoice.subtotal || 0).toFixed(2)}</span><br>
              <span>Discount: ${formdata.discountType === "percentage" ? `${discAmount}%` : `${currencySign} ${Number(invoice.discountAmount || 0).toFixed(2)}`}</span><br>
              <span>Subtotal after Discount: ${currencySign} ${Number(invoice.subtotalAfterDiscount || 0).toFixed(2)}</span><br>
              <span>Tax (${Number(invoice.taxPercent || 0)}%): ${currencySign} ${Number(invoice.taxAmount || 0).toFixed(2)}</span><br>
              <span>Round Off: ${currencySign} ${Number(invoice.roundOff || 0).toFixed(2)}</span><br>
              <span>Total Amount: ${currencySign} ${Number(invoice.total || 0).toFixed(2)}</span>
            </div>
          </div>
          <div class="footer">
            <p>Operated By: ${getUserName() || 'N/A'}</p>
            <p>Powered by chefmate POS !! </p>
          </div>
        </div>
      `);

      newWindow.document.write(`
        <html>
          <head>
            <style>
              html, body {
                margin: 0;
                padding: 0;
                font-family: 'Cambria', monospace; /* Common font for receipts */
              }
              body {
                font-size: 18px; /* Increased font size for better readability */
                width: 80mm; /* Common thermal printer size */
              }
              .bill-header {
                display: grid;
                grid-template-columns: 1fr 1fr;
                grid-gap: 5px;
                text-align: center;
                margin-bottom: 10px;
              }
            .bill-header h2 {
              grid-column: span 2;
              margin: 0;
              font-size: 24px; /* Larger header */
              font-weight: bold;
            }
            .bill-header .company-info {
              grid-column: span 3;
              text-align: center;
            }
            .bill-header .company-info p {
              margin: 4px 0;
              font-size: 18px; /* Larger text for better readability */
            }
            .bill-header .contact-info {
              display: flex;
              justify-content: center;
              grid-column: span 2;
            }
            .bill-header .left-col {
              text-align: left;
            }
            .bill-header .right-col {
              text-align: right;
              margin-right:20px;
              
            }
            .bill-header .tax-id {
              text-align: left;
              grid-column: span 2;
              font-size: 16px;
              margin:0;
            }
            .table {
              width: 100%;
              margin-top: 1px;
              border-collapse: collapse;
            }
            .table th, .table td {
              text-align: left;
              padding: 5px 0; /* Adjust padding to make text fit better */
              font-size: 18px; /* Larger font size for readability */
              line-height: 1.6; /* Increase line height for better readability */
            }
            .table th {
              font-weight: bold;
              border-bottom:1px solid #000;
            }
            .table td {
              border-bottom: 1px solid #ddd;
            }
            .table td.total {
              font-weight: bold;
              font-size: 18px; /* Larger font for totals */
              margin-right:2px;
              border-bottom:1px solid #000;
            }
            .total-row {
              margin-top: 5px;
              margin-right: 10px;
              font-weight: bold;
              text-align: right;
              font-size: 18px;
              line-height: 1.6; /* Larger font size for totals */
            }
            .total-row span {
              margin-left: 0px;
            }
            .footer {
              margin-top: 15px;
              text-align: center;
              font-size: 18px; /* Larger footer font */
            }
            .bill-page {
              width: 100%;
            }
            .page-break {
              page-break-after: always;
            }
          </style>
        </head>
        <body>${billBlocks.join('')}</body>
      </html>
    `);



    newWindow.document.close();

    newWindow.onload = () => {
      newWindow.print(); // Print the document
      newWindow.close(); // Close the window after printing
      
      // Notify customer display that bill is completed
      customerDisplayManager.sendCustomMessage("Bill printed successfully. Thank you for your visit!");
      
      // Clear bill confirmation after a short delay
      setTimeout(() => {
        customerDisplayManager.clearCustomerDisplay();
      }, 3000);
    };
    
    } catch (error) {
      console.error("Error in print and save:", error);
      toast.error("Error occurred while saving and printing bill.");
    }
  };
  const handlePrintBillSummary = async () => {
    try {
      if (!finalData || finalData.length === 0) {
        toast.error("No items to preview. Please add items first.");
        return;
      }

      const newWindow = window.open("", "_blank");

      const companyName = companyInfo[0]?.name || "";
      const companyAddress = companyInfo[0]?.address || "";
      const companyTaxId = companyInfo[0]?.tax_id || "";

      const splitPreviewInvoices = (isSplitMode && splitSummaries && splitSummaries.length > 0)
        ? (() => {
            const totalSubtotal = splitSummaries.reduce((acc, split) => acc + Number(split.subtotal || 0), 0);
            let totalDiscountAmount = parseFloat(discAmount) || 0;
            if (formdata.discountType === "percentage") {
              totalDiscountAmount = Math.min((totalSubtotal * totalDiscountAmount) / 100, totalSubtotal);
            } else {
              totalDiscountAmount = Math.min(totalDiscountAmount, totalSubtotal);
            }

            const taxRate = parseFloat(TaxesData?.[0]?.taxvalue || 0);
            const taxIncluded = TaxesData?.[0]?.included === "true";

            return splitSummaries.map((split, idx) => {
              const splitSubtotal = Number(split.subtotal || 0);
              const splitDiscountAmount = totalSubtotal > 0
                ? (totalDiscountAmount * splitSubtotal) / totalSubtotal
                : 0;
              const splitSubtotalAfterDiscount = splitSubtotal - splitDiscountAmount;

              let splitTaxAmount = 0;
              let splitTotalAmount = 0;
              if (taxIncluded) {
                splitTaxAmount = (splitSubtotalAfterDiscount * taxRate) / (100 + taxRate);
                splitTotalAmount = splitSubtotalAfterDiscount;
              } else {
                splitTaxAmount = splitSubtotalAfterDiscount * (taxRate / 100);
                splitTotalAmount = splitSubtotalAfterDiscount + splitTaxAmount;
              }

              const splitRoundedTotal = Math.round(splitTotalAmount);
              const splitRoundOff = splitRoundedTotal - splitTotalAmount;

              return {
                billId: "-",
                queueNumber: `${selectedTable || '-'} - ${split.name || `Split ${idx + 1}`}`,
                items: (split.items || []).map((item) => ({
                  item_name: item.item_name,
                  quantity: item.quantity,
                  price: Number(item.total_price / item.quantity).toFixed(2),
                  total: Number(item.total_price).toFixed(2)
                })),
                subtotal: splitSubtotal.toFixed(2),
                discountAmount: splitDiscountAmount.toFixed(2),
                subtotalAfterDiscount: splitSubtotalAfterDiscount.toFixed(2),
                taxPercent: taxRate,
                taxAmount: splitTaxAmount.toFixed(2),
                roundOff: splitRoundOff.toFixed(2),
                total: splitRoundedTotal.toFixed(2),
                paymentMethod: formdata.pmode || 'Cash'
              };
            });
          })()
        : [];

      const invoicesForSummary = (savedSplitInvoices && savedSplitInvoices.length > 0)
        ? savedSplitInvoices
        : splitPreviewInvoices;

      const summaryBlocks = (invoicesForSummary && invoicesForSummary.length > 0)
        ? invoicesForSummary.map((invoice, idx) => `
          <div class="summary-page ${idx < invoicesForSummary.length - 1 ? 'page-break' : ''}">
              <div class="bill-header">
                <h2>${companyName}</h2>
                <p>${companyAddress}</p>
                <p>Tax:${companyTaxId}</p>
                <p><strong>Bill Summary (${invoice.queueNumber || `Split ${idx + 1}`})</strong></p>
              </div>
              <div class="bill-bill-body">
                <table class="table">
                  <tr>
                    <th class="header">Bill ID: ${invoice.billId || '-'}</th>
                    <th class="header">${invoice.queueNumber || '-'}</th>
                  </tr>
                  <tr>
                    <th>Date: ${getCurrentDate()}</th>
                    <th>Time: ${getCurrentTime()}</th>
                  </tr>
                  <tr>
                    <th colspan="2">Payment Mode: ${invoice.paymentMethod || formdata.pmode || 'Cash'}</th>
                  </tr>
                </table>
              </div>
              <div class="bill-body">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Rate</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${(invoice.items || [])
                      .map(
                        (item) => `
                          <tr>
                            <td>${item.item_name}</td>
                            <td>${item.quantity}</td>
                            <td>${currencySign} ${Number(item.price).toFixed(2)}</td>
                            <td>${currencySign} ${Number(item.total).toFixed(2)}</td>
                          </tr>
                        `
                      )
                      .join("")}
                  </tbody>
                </table>
                <div class="total-row">
                  <span>Subtotal: ${currencySign} ${Number(invoice.subtotal || 0).toFixed(2)}</span><br>
                  <span>Discount: ${formdata.discountType === "percentage" ? `${discAmount}%` : `${currencySign} ${Number(invoice.discountAmount || 0).toFixed(2)}`}</span><br>
                  <span>Subtotal after Discount: ${currencySign} ${Number(invoice.subtotalAfterDiscount || 0).toFixed(2)}</span><br>
                  <span>Tax (${Number(invoice.taxPercent || 0)}%): ${currencySign} ${Number(invoice.taxAmount || 0).toFixed(2)}</span><br>
                  <span>Round Off: ${currencySign} ${Number(invoice.roundOff || 0).toFixed(2)}</span><br>
                  <span>Total Amount: ${currencySign} ${Number(invoice.total || 0).toFixed(2)}</span>
                </div>
              </div>
              <div class="footer">
                <p>Operated By: ${getUserName() || 'N/A'}</p>
                <p>Powered by chefmate POS !!</p>
              </div>
            </div>
          `)
        : [
            `
            <div class="summary-page">
              <div class="bill-header">
                <h2>${companyName}</h2>
                <p>${companyAddress}</p>
                <p>Tax:${companyTaxId}</p>
                <p><strong>Bill Summary</strong></p>
              </div>
              <div class="bill-bill-body">
                <table class="table">
                  <tr>
                    <th class="header">Bill ID: ${latestBillId || "-"}</th>
                    <th class="header">${selectedTable || "-"}</th>
                  </tr>
                  <tr>
                    <th>Date: ${getCurrentDate()}</th>
                    <th>Time: ${getCurrentTime()}</th>
                  </tr>
                  <tr>
                    <th colspan="2">Payment Mode: ${formdata.pmode || 'Cash'}</th>
                  </tr>
                </table>
              </div>
              <div class="bill-body">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Rate</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${finalData
                      .map(
                        (item) => `
                          <tr>
                            <td>${item.item_name}</td>
                            <td>${item.quantity}</td>
                            <td>${currencySign} ${Number(item.total_price / item.quantity).toFixed(2)}</td>
                            <td>${currencySign} ${Number(item.total_price).toFixed(2)}</td>
                          </tr>
                        `
                      )
                      .join("")}
                  </tbody>
                </table>
                <div class="total-row">
                  <span>Subtotal: ${currencySign} ${subtotal}</span><br>
                  <span>Discount: ${formdata.discountType === "percentage" ? `${discAmount}%` : `${currencySign} ${discAmount}`}</span><br>
                  <span>Subtotal after Discount: ${currencySign} ${subtotalAfterDiscount}</span><br>
                  <span>Tax (7%): ${currencySign} ${taxAmount}</span><br>
                  <span>Round Off: ${currencySign} ${roundoffAmount}</span><br>
                  <span>Total Amount: ${currencySign} ${grandAmount}</span>
                </div>
              </div>
              <div class="footer">
                <p>Operated By: ${getUserName() || 'N/A'}</p>
                <p>Powered by chefmate POS !!</p>
              </div>
            </div>
            `
          ];

      newWindow.document.write(`
        <html>
          <head>
            <style>
              html, body {
                margin: 0;
                padding: 0;
                font-family: 'Cambria', monospace;
              }
              body {
                font-size: 18px;
                width: 80mm;
              }
              .bill-header {
                text-align: center;
                margin-bottom: 10px;
              }
              .bill-header h2 {
                margin: 0;
                font-size: 24px;
                font-weight: bold;
              }
              .bill-header p {
                margin: 4px 0;
                font-size: 18px;
              }
              .table {
                width: 100%;
                margin-top: 1px;
                border-collapse: collapse;
              }
              .table th, .table td {
                text-align: left;
                padding: 5px 0;
                font-size: 18px;
                line-height: 1.6;
              }
              .table th {
                font-weight: bold;
                border-bottom:1px solid #000;
              }
              .table td {
                border-bottom: 1px solid #ddd;
              }
              .total-row {
                margin-top: 5px;
                margin-right: 10px;
                font-weight: bold;
                text-align: right;
                font-size: 18px;
                line-height: 1.6;
              }
              .footer {
                margin-top: 15px;
                text-align: center;
                font-size: 18px;
              }
              .summary-page {
                width: 100%;
              }
              .page-break {
                page-break-after: always;
              }
            </style>
          </head>
          <body>${summaryBlocks.join("")}</body>
        </html>
      `);

      newWindow.document.close();

      newWindow.onload = () => {
        newWindow.print();
        newWindow.close();
      };
    } catch (error) {
      console.error("Error in bill summary print:", error);
      toast.error("Error occurred while printing bill summary.");
    }
  };
  useEffect(() => {
    if (finalData.length > 0) {
      setIsBillSaved(false);
    }
  }, [finalData]);

  useEffect(() => {
    const fetchAndSetData = async () => {
      try {
        await fetchData("taxes", setTaxesData, "id", { status: "Active" });
        await fetchData("tablelist", setTotaltablelist, "id", { status: "1" });
        await fetchData("companyinfo", setcompanyInfo, "id", {});
        await setpaymentOptions(await fetchComboData("paymentoptions", "name"));
        
        // Fetch currency sign from coresetting table
        const coreSettings = await fetchData("coresetting", null, "id", {});
        if (coreSettings && coreSettings.length > 0) {
          const currencyFromSettings = coreSettings.find(setting => setting.setting_name === "currency_sign");
          if (currencyFromSettings) {
            setCurrencySign(currencyFromSettings.setting_value);
          }
        }
      } catch (error) {
        console.error("Error in useEffect:", error);
      }
    };

    fetchAndSetData();
  }, []);  // ✅ This ensures it runs only once when the component mounts

  // useEffect to handle refresh trigger from parent component (when KOT is sent)
  useEffect(() => {
    if (refreshTrigger && isOpen) {
      // console.log("Refresh trigger received, updating table list...");
      fetchData("tablelist", setTotaltablelist, "id", { status: "1" });
    }
  }, [refreshTrigger, isOpen]);

  // useEffect to auto-refresh table list when modal opens
  useEffect(() => {
    if (isOpen) {
      // console.log("Modal opened, refreshing table list...");
      fetchData("tablelist", setTotaltablelist, "id", { status: "1" });
      
      // ✅ Send bill summary to customer display when modal opens
      setTimeout(() => {
        sendBillSummaryToCustomerDisplay();
      }, 500); // Small delay to ensure data is loaded
    }
  }, [isOpen, finalData, selectedTable, subtotal, grandAmount]); // Added dependencies


  // Dependency array ensures it runs only when finalData updates
  // Runs only when `latestBillId` updates
  const [showLineQR, setShowLineQR] = useState(false);
  const [lineDiscountEligible, setLineDiscountEligible] = useState(false);

  const handleLineDiscount = async () => {
    if (!customerDetails.phone) {
      toast.warning("Please enter customer phone number first.");
      setLineQRModalOpen(true);
      return;
    }

    try {
      const res = await axios.post('/checkline', {
        phone: customerDetails.phone
      });

      if (res.data.eligible) {
        setShowLineQR(true);
      } else {
        toast.error("You have already claimed the LINE discount.");
      }
    } catch (err) {
      toast.error("Error checking LINE discount eligibility.");
      console.error(err);
    }
  };

  return (
    <>

      <Modal
        isOpen={isOpen}
        onRequestClose={onClose}
        contentLabel="New Item Entry"
        style={customStyles}
        ariaHideApp={false}
      >
        <div style={{ padding: '16px', maxHeight: '90vh', overflowY: 'auto', backgroundColor: 'white', borderRadius: '12px' }}>
          
          {/* Header with Ant Design */}
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Bill Summary - {selectedTable}</h2>
            <Space>
              <Button type="primary" icon={<ReloadOutlined />} size="small" onClick={refreshTables} />
              <Button danger icon={<CloseOutlined />} size="small" onClick={handleModalClose} />
            </Space>
          </div>

          <Divider style={{ margin: '12px 0' }} />

          {/* Tables Section - Touchscreen Friendly */}
          <Card size="small" style={{ marginBottom: '20px', padding: '16px' }}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1890ff' }}>🏪 Tables</h4>
                <Space>
                  <Button 
                    type={isMergeMode ? 'primary' : 'default'} 
                    size="large"
                    onClick={toggleMergeMode}
                    style={{ fontSize: '13px', fontWeight: '600', minWidth: '100px', height: '40px' }}
                  >
                    {isMergeMode ? '✕ Exit' : '➕ Merge'}
                  </Button>
                  <Button 
                    type={isSplitMode ? 'primary' : 'default'} 
                    size="large"
                    onClick={toggleSplitMode}
                    style={{ fontSize: '13px', fontWeight: '600', minWidth: '100px', height: '40px' }}
                  >
                    {isSplitMode ? '✕ Exit' : '🔀 Split'}
                  </Button>
                </Space>
              </div>
              
              {isMergeMode && selectedTables.length > 0 && (
                <Tag color="success" style={{ fontSize: '13px', padding: '6px 12px' }}>✓ Selected: {selectedTables.join(', ')}</Tag>
              )}

              {isSplitMode && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Tag color="blue" style={{ fontSize: '13px', padding: '6px 12px' }}>
                    Split Groups: {splitGroups.length}
                  </Tag>
                  <Button
                    type="primary"
                    size="middle"
                    onClick={createSplitFromSelection}
                    disabled={selectedSplitItemKeys.length === 0 || !selectedTable || !finalData || finalData.length === 0}
                  >
                    Create Split From Selected Items
                  </Button>
                </div>
              )}
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
                {TotalTablelist && Array.isArray(TotalTablelist) && TotalTablelist.length > 0 ? (
                  TotalTablelist.map((tables, index) => (
                    <div
                      key={index}
                      onClick={() => handleTableSelection(tables.name)}
                      style={{
                        padding: '12px 8px',
                        border: `3px solid ${isMergeMode && selectedTables.includes(tables.name) ? '#1890ff' : tables.status === 0 ? '#d9d9d9' : '#ff4d4f'}`,
                        borderRadius: '8px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        backgroundColor: !isMergeMode && selectedTable === tables.name ? '#e6f7ff' : 'transparent',
                        transition: 'all 0.2s',
                        minHeight: '80px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        boxShadow: isMergeMode && selectedTables.includes(tables.name) ? '0 4px 12px rgba(24,144,255,0.3)' : 'none'
                      }}
                    >
                      <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '6px' }}>{tables.name}</div>
                      <Badge 
                        status={tables.status === 0 ? 'success' : 'error'} 
                        text={tables.status === 0 ? 'Free' : 'Busy'}
                        style={{ fontSize: '12px', fontWeight: '600' }}
                      />
                    </div>
                  ))
                ) : (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#999', padding: '20px', fontSize: '14px' }}>Loading...</div>
                )}
              </div>
            </Space>
          </Card>

        
        {/* Main Content - Two Column Layout - Touchscreen Friendly */}
          <Row gutter={[16, 20]}>
            {/* Left Side - Bill Summary */}
            <Col xs={24} md={14}>
              <Card size="small" ref={printRef} style={{ padding: '16px' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: '#1890ff' }}>📋 Bill Items</h4>
                <Table
                  columns={[
                    {
                      title: 'Item',
                      dataIndex: 'item_name',
                      key: 'item_name',
                      width: '50%',
                      render: (text, record) => (
                        <Space direction="vertical" size={0}>
                          <span style={{ fontSize: '13px', fontWeight: '500' }}>{text}</span>
                          {isSplitMode && splitItemToGroupName.get(record._rowKey) && (
                            <Tag color="purple" style={{ margin: 0, width: 'fit-content' }}>
                              {splitItemToGroupName.get(record._rowKey)}
                            </Tag>
                          )}
                        </Space>
                      )
                    },
                    { title: 'Qty', dataIndex: 'quantity', key: 'quantity', width: '15%', align: 'center', render: (text) => <span style={{ fontSize: '14px', fontWeight: '700' }}>{text}</span> },
                    { title: 'Unit Price', dataIndex: 'unit_price', key: 'unit_price', width: '17%', align: 'right', render: (text) => <span style={{ fontSize: '13px' }}>{currencySign} {text}</span> },
                    { title: 'Total', dataIndex: 'total_price', key: 'total_price', width: '18%', align: 'right', render: (text) => <strong style={{ fontSize: '14px', color: '#1890ff' }}>{currencySign} {Number(text).toFixed(2)}</strong> },
                  ]}
                  dataSource={billTableData || []}
                  rowKey="_rowKey"
                  rowSelection={
                    isSplitMode
                      ? {
                          selectedRowKeys: selectedSplitItemKeys,
                          onChange: (keys) => setSelectedSplitItemKeys(keys),
                          getCheckboxProps: (record) => ({
                            disabled: assignedSplitKeySet.has(record._rowKey)
                          })
                        }
                      : undefined
                  }
                  pagination={false}
                  size="small"
                  locale={{ emptyText: 'No items' }}
                  style={{ marginBottom: '16px' }}
                />

                {isSplitMode && splitSummaries.length > 0 && (
                  <Card size="small" style={{ marginBottom: '16px', borderColor: '#b37feb', backgroundColor: '#faf5ff' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '700', color: '#722ed1' }}>🔀 Split Groups</h4>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {splitSummaries.map((split) => (
                        <div key={split.id} style={{ border: '1px solid #e8d5ff', borderRadius: 8, padding: '10px 12px', backgroundColor: '#fff' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ color: '#531dab' }}>{split.name}</strong>
                            <Space>
                              <Tag color="blue">Items: {split.items.length}</Tag>
                              <Tag color="green">{currencySign} {split.subtotal.toFixed(2)}</Tag>
                              <Button size="small" danger onClick={() => removeSplitGroup(split.id)}>Remove</Button>
                            </Space>
                          </div>
                        </div>
                      ))}
                    </Space>
                  </Card>
                )}
                
                {/* Bill Totals - Touchscreen Friendly */}
                {finalData.length > 0 && (
                  <Card size="small" style={{ backgroundColor: '#fafafa', marginTop: '16px', padding: '16px' }}>
                    <Row gutter={[12, 12]}>
                      <Col span={12}><span style={{ fontSize: '13px', color: '#666' }}>Subtotal</span></Col>
                      <Col span={12} style={{ textAlign: 'right' }}><span style={{ fontSize: '14px', fontWeight: '600' }}>{currencySign} {subtotal}</span></Col>
                      
                      <Col span={12}><span style={{ fontSize: '13px', color: '#666' }}>Discount</span></Col>
                      <Col span={12} style={{ textAlign: 'right' }}><span style={{ fontSize: '14px', fontWeight: '600', color: '#ff7a45' }}>{formdata.discountType === "percentage" ? `${discAmount}%` : `${currencySign} ${discAmount}`}</span></Col>
                      
                      <Col span={12}><span style={{ fontSize: '13px', color: '#666' }}>After Discount</span></Col>
                      <Col span={12} style={{ textAlign: 'right' }}><span style={{ fontSize: '14px', fontWeight: '600' }}>{currencySign} {subtotalAfterDiscount}</span></Col>
                      
                      <Col span={12}><span style={{ fontSize: '13px', color: '#666' }}>Tax ({TaxesData[0]?.taxvalue || 0}%)</span></Col>
                      <Col span={12} style={{ textAlign: 'right' }}><span style={{ fontSize: '14px', fontWeight: '600' }}>{currencySign} {taxAmount}</span></Col>

                      <Col span={12}><span style={{ fontSize: '13px', color: '#666' }}>Round Off</span></Col>
                      <Col span={12} style={{ textAlign: 'right' }}><span style={{ fontSize: '14px', fontWeight: '600' }}>{currencySign} {roundoffAmount}</span></Col>
                      
                      <Divider style={{ margin: '10px 0' }} />
                      
                      <Col span={12}><strong style={{ fontSize: '16px', color: '#1890ff' }}>Grand Total</strong></Col>
                      <Col span={12} style={{ textAlign: 'right' }}><strong style={{ fontSize: '18px', color: '#1890ff' }}>{currencySign} {grandAmount}</strong></Col>
                    </Row>
                  </Card>
                )}
              </Card>
            </Col>

            {/* Right Side - Payment & Customer Info - Two Vertical Sections - Touchscreen Friendly */}
            <Col xs={24} md={5}>
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                {/* Customer Info Card */}
                <Card size="small" className="customer-card" style={{ padding: '16px' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '700', color: '#1890ff' }}>👤 Customer</h4>
                  <Input 
                    type="tel"
                    size="large"
                    placeholder="Mobile number"
                    value={phones}
                    onChange={(e) => setphones(e.target.value)}
                    style={{ marginBottom: '12px', fontSize: '14px', height: '44px' }}
                  />
                  <Button type="dashed" size="large" block onClick={() => setCustomerModalOpen(true)} style={{ height: '44px', fontSize: '13px', fontWeight: '600' }}>
                    📝 Add Details
                  </Button>
                </Card>

                {/* Payment Info Card */}
                <Card size="small" className="payment-info-card" style={{ padding: '16px' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '700', color: '#fa8c16' }}>💵 Change Money</h4>
                  <Input 
                    type="number"
                    size="large"
                    placeholder="Amount received"
                    value={formdata.paidAmount}
                    onChange={handleChangeMoney}
                    style={{ marginBottom: '12px', fontSize: '14px', height: '44px' }}
                  />
                  <div className="change-display" style={{ padding: '14px', backgroundColor: changeMoney >= 0 ? '#f6ffed' : '#fff1f0', borderRadius: '6px', marginBottom: '8px', border: changeMoney >= 0 ? '2px solid #52c41a' : '2px solid #ff4d4f' }}>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Change</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: changeMoney >= 0 ? '#52c41a' : '#ff4d4f' }}>
                      {currencySign} {changeMoney}
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '6px', fontWeight: 600 }}>Remark</div>
                  <Input.TextArea
                    rows={2}
                    placeholder="Add remark"
                    value={formdata.remark}
                    onChange={(e) => setFormData((prev) => ({ ...prev, remark: e.target.value }))}
                    style={{ fontSize: '13px' }}
                  />
                </Card>
              </Space>
            </Col>

            {/* Right-Right Side - Discount & Payment Methods */}
            <Col xs={24} md={5}>
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <Card
                  size="small"
                  className="discount-options-card"
                  style={{
                    backgroundColor: '#f0f5ff',
                    borderColor: '#b6e1ff',
                    borderRadius: 8,
                    padding: '16px'
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 15, color: '#1890ff' }}>
                    💰 Discount Options
                  </div>
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <Row gutter={[12, 12]}>
                      <Col span={12}>
                        <div style={{ fontSize: 13, marginBottom: 6, color: '#595959', fontWeight: 600 }}>Amount</div>
                        <Input
                          type="number"
                          size="large"
                          value={discAmount}
                          onChange={(e) => setDiscAmount(e.target.value)}
                          placeholder="0"
                          style={{ backgroundColor: '#fff7f1', fontSize: '14px', height: '40px' }}
                        />
                      </Col>
                      <Col span={12}>
                        <div style={{ fontSize: 13, marginBottom: 6, color: '#595959', fontWeight: 600 }}>Type</div>
                        <Select
                          size="large"
                          style={{ width: '100%' }}
                          value={formdata.discountType}
                          onChange={(value) => setFormData(prev => ({ ...prev, discountType: value }))}
                          options={[
                            { label: '%', value: 'percentage' },
                            { label: currencySign, value: 'fixed' }
                          ]}
                        />
                      </Col>
                    </Row>

                    <Divider style={{ margin: '10px 0' }} />

                    <Row gutter={[10, 10]} style={{ display: 'none' }}>
                      <Col span={12}>
                        <Button
                          type="default"
                          size="large"
                          block
                          onClick={() => {
                            if (!phones) {
                              toast.error("Please enter customer phone first.");
                              return;
                            }
                            setLineQRModalOpen(true);
                          }}
                          style={{
                            backgroundColor: '#e6f7ff',
                            color: '#1890ff',
                            borderColor: '#91d5ff',
                            fontWeight: '600',
                            fontSize: '13px',
                            height: '40px'
                          }}
                        >
                          LINE
                        </Button>
                      </Col>
                      <Col span={12}>
                        <Button
                          type="default"
                          size="large"
                          block
                          onClick={() => {
                            if (!customerDetails.phone) {
                              toast.error("Please enter customer phone first.");
                              return;
                            }
                            setLineQRModalOpen(true);
                          }}
                          style={{
                            backgroundColor: '#e6f4ea',
                            color: '#25a745',
                            borderColor: '#95e1b3',
                            fontWeight: '600',
                            fontSize: '13px',
                            height: '40px'
                          }}
                        >
                          WhatsApp
                        </Button>
                      </Col>
                    </Row>
                  </Space>
                </Card>

                {/* Payment Method Card - Touchscreen Friendly */}
                <Card
                  size="small"
                  className="payment-method-card"
                  style={{
                    backgroundColor: '#fff7e6',
                    borderColor: '#ffd591',
                    borderRadius: 8,
                    padding: '16px'
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 15, color: '#fa8c16' }}>
                    💳 Payment Method
                  </div>
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    {!isBillSaved && (
                      <>
                        <Row gutter={[10, 10]}>
                        <Col xs={12}>
                          <Button
                            type={formdata.pmode === 'Cash' ? 'primary' : 'default'}
                            size="large"
                            block
                            onClick={() => handleQuickPayment('Cash')}
                            disabled={!finalData || finalData.length === 0}
                            style={
                              formdata.pmode === 'Cash'
                                ? { backgroundColor: '#52c41a', borderColor: '#52c41a', color: '#fff', fontSize: '13px', fontWeight: '600', height: '48px' }
                                : { backgroundColor: '#f6ffed', color: '#52c41a', borderColor: '#b7eb8f', fontSize: '13px', fontWeight: '600', height: '48px' }
                            }
                          >
                            💵 Cash
                          </Button>
                        </Col>
                        <Col xs={12}>
                          <Button
                            type={formdata.pmode === 'Card' ? 'primary' : 'default'}
                            size="large"
                            block
                            onClick={() => handleQuickPayment('Card')}
                            disabled={!finalData || finalData.length === 0}
                            style={
                              formdata.pmode === 'Card'
                                ? { backgroundColor: '#1890ff', borderColor: '#1890ff', color: '#fff', fontSize: '13px', fontWeight: '600', height: '48px' }
                                : { backgroundColor: '#e6f7ff', color: '#1890ff', borderColor: '#91d5ff', fontSize: '13px', fontWeight: '600', height: '48px' }
                            }
                          >
                            💳 Card
                          </Button>
                        </Col>
                        <Col xs={12}>
                          <Button
                            type="default"
                            size="large"
                            block
                            onClick={() => {
                              handleGenerateQRCode();
                              setQRPaymentModalOpen(true);
                            }}
                            disabled={!finalData || finalData.length === 0}
                            style={
                              formdata.pmode === 'QR Scan'
                                ? { backgroundColor: '#13c2c2', borderColor: '#13c2c2', color: '#fff', fontSize: '13px', fontWeight: '600', height: '48px' }
                                : { backgroundColor: '#e6fffb', color: '#13c2c2', borderColor: '#87e8de', fontSize: '13px', fontWeight: '600', height: '48px' }
                            }
                          >
                            📱 QR Scan
                          </Button>
                        </Col>
                        <Col xs={12}>
                          <Button
                            type="default"
                            size="large"
                            block
                            onClick={() => handleQuickPayment('Entertainment')}
                            disabled={!finalData || finalData.length === 0}
                            style={
                              formdata.pmode === 'Entertainment'
                                ? { backgroundColor: '#ff7a45', borderColor: '#ff7a45', color: '#fff', fontSize: '13px', fontWeight: '600', height: '48px' }
                                : { backgroundColor: '#fff7e6', color: '#ff7a45', borderColor: '#ffbb96', fontSize: '13px', fontWeight: '600', height: '48px' }
                            }
                          >
                            🎉 Entertainment
                          </Button>
                        </Col>
                        <Col xs={12}>
                          <Button
                            type={formdata.pmode === 'Credit' ? 'primary' : 'default'}
                            size="large"
                            block
                            onClick={() => handleQuickPayment('Credit')}
                            disabled={!finalData || finalData.length === 0}
                            style={
                              formdata.pmode === 'Credit'
                                ? { backgroundColor: '#722ed1', borderColor: '#722ed1', color: '#fff', fontSize: '13px', fontWeight: '600', height: '48px' }
                                : { backgroundColor: '#f9f0ff', color: '#722ed1', borderColor: '#d3adf7', fontSize: '13px', fontWeight: '600', height: '48px' }
                            }
                          >
                            🧾 Credit
                          </Button>
                        </Col>
                        </Row>
                        <Button
                          type="primary"
                          size="large"
                          block
                          onClick={handlePrintBillSummary}
                          disabled={!finalData || finalData.length === 0}
                          style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', fontSize: '14px', fontWeight: '700', height: '50px' }}
                        >
                          🧾 Bill Summary
                        </Button>
                      </>
                    )}
                    {isBillSaved && (
                      <Row gutter={[8, 8]} style={{ width: '100%' }}>
                        <Col xs={24} md={8}>
                          <Button
                            type="primary"
                            size="large"
                            block
                            onClick={handlePrintBill}
                            style={{ backgroundColor: '#1890ff', borderColor: '#1890ff', fontSize: '14px', fontWeight: '700', height: '50px' }}
                          >
                            🖨️ Print Bill
                          </Button>
                        </Col>
                        <Col xs={24} md={8}>
                          <Button
                            type="primary"
                            size="large"
                            block
                            onClick={handlePrintBillSummary}
                            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', fontSize: '14px', fontWeight: '700', height: '50px' }}
                          >
                            🧾 Bill Summary
                          </Button>
                        </Col>
                        <Col xs={24} md={8}>
                          <Button
                            type="primary"
                            size="large"
                            block
                            onClick={handlePrintBillESCPOS}
                            style={{ backgroundColor: '#faad14', borderColor: '#faad14', color: '#fff', fontSize: '14px', fontWeight: '700', height: '50px' }}
                          >
                            🖨️ ESC/POS
                          </Button>
                        </Col>
                      </Row>
                    )}
                  </Space>
                </Card>

                {/* Bill History Card - Touchscreen Friendly */}
                <Card
                  size="small"
                  style={{
                    backgroundColor: '#fafafa',
                    borderColor: '#f0f0f0',
                    borderRadius: 8,
                    padding: '16px'
                  }}
                >
                  <Button
                    onClick={handleBillHistory}
                    size="large"
                    block
                    style={{
                      backgroundColor: '#e6f4ea',
                      color: '#25a745',
                      borderColor: '#95e1b3',
                      fontWeight: '700',
                      fontSize: '14px',
                      height: '48px'
                    }}
                  >
                    📋 Bill History
                  </Button>
                </Card>
              </Space>
            </Col>
          </Row>
        </div>
      </Modal>
      <LineQRDiscountModal
        isOpen={isLineQRModalOpen}
        onClose={() => setLineQRModalOpen(false)}
        onConfirm={() => {
          setDiscAmount(10);
          setFormData(prev => ({ ...prev, discountType: "percentage" })); // ✅ SAFE UPDATE
        }}
      />


      <CustomerDetailsModal
        isOpen={isCustomerModalOpen}
        customer={customerDetails}
        onClose={() => setCustomerModalOpen(false)}
        onSaveCustomerDetails={(details) => {
          setCustomerDetails(details);
          setCustomerModalOpen(false);
        }}
      />

      <QRPaymentModal
        visible={isQRPaymentModalOpen}
        onClose={() => setQRPaymentModalOpen(false)}
        billAmount={grandAmount}
        onPaymentSuccess={() => {
          setQRPaymentModalOpen(false);
          setFormData(prev => ({ ...prev, pmode: 'QR Scan' }));
          handleQuickPayment('QR Scan');
        }}
      />
    </>
  );
};

export default CheckBillModal;
