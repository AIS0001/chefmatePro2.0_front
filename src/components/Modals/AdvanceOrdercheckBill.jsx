import React, { useEffect, useState, useRef, useMemo } from "react";
import Modal from "react-modal";
import { useNavigate, Link } from "react-router-dom";
import { FaTimes } from "react-icons/fa"; // Importing the close icon from react-icons
import { TextfieldwithLabel } from "../Buttons/Textfield";
import axios from "axios";
import { fetchComboData, fetchComboDataWithWhere } from "../../services/api";
import { getHeaders, getAuthToken, getResolvedShopId } from "../../utility/getHeader";
import fetchData from "../../functions/fetchData";
import { SubmitButton } from "../Buttons/Textfield";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CardComponent from "../../components/cards/CardComponent";
import FinalBillModal from "./FinalBillModal";
import fetchOrderDetails from "../../functions/fetchOrderDetails";
import updateData from "../../functions/updateData";
import { FaRedo } from "react-icons/fa"; // Import refresh icon
import CustomerDetailsModal from "./customerDetailsModal";
import LineQRDiscountModal from "./LineQRDiscountModal";
import { getUserName } from "../../functions/storageUtils"; // Import getUserName for cashier name
import "./AdvanceOrdercheckBill.css";


const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    width: "95%",
    maxWidth: "1200px",
    maxHeight: "90vh",
    padding: "0",
    border: "none",
    borderRadius: "12px",
    overflowY: "auto",
    background: "transparent",
  },
  overlay: {
    zIndex: 1050,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
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

const AdvanceOrderCheckBillModal = ({ isOpen, customer, uptableList, onClose }) => {
    const [formdata, setFormData] = useState({
        pmode: "",
        discAmount: 0,
        discountType: "percentage", // Default to "percentage"
        phones: ""
        // other fields
    });
    const [companyInfo, setcompanyInfo] = useState([]);
    const [TotalTablelist, setTotaltablelist] = useState(0);
    const [TaxesData, setTaxesData] = useState(0);
    const [selectedTable, setSelectedTable] = useState(null); // Table selection
    const [FinalBillData, setFinalBillData] = useState([]); // Manage the table data state
    const [OrderItemsData, setOrderItemsData] = useState([]); // Manage the table data state
    const [isLineQRModalOpen, setLineQRModalOpen] = useState(false);


    // Handle table selection
    const handleTableClick = (tableNumber) => {
        setSelectedTable(tableNumber);

        toast.success(`Selected Table: ${tableNumber}`);
    };
    const [customerId, setCustomerId] = useState('');
    const [invDate, setInvDate] = useState('');
    const [invTime, setInvTime] = useState('');
    const [tableNumber, setTableNumber] = useState('');
    const [discountAmount, setDiscountAmount] = useState(0);
    const [paidAmount, setPaidAmount] = useState(0);
    const [getTax, setTax] = useState([]);
    const [getUnit, setUnits] = useState([]);
    const [paymentOptions, setpaymentOptions] = useState([]);
    const [finalData, setFinalData] = useState([]);
    const [changeMoney, setChangeMoney] = useState("");
    const [phones, setphones] = useState("");
    const printRef = useRef();
    const [latestBillId, setLatestBillId] = useState(null);


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

    const [pickupDate, setPickupDate] = useState('');
    const [pickupTime, setPickupTime] = useState('');
    const [specialNote, setSpecialNote] = useState('');
    const [orderType, setOrderType] = useState('');
    const [billGeneratedBy, setBillGeneratedBy] = useState('');
    const [finalBilled, setFinalBilled] = useState(false);
    const [createdBy, setCreatedBy] = useState('');
    //   if (!customer) return null;

    const refreshTables = (event) => {
        fetchData("tablelist", setTotaltablelist, "id", { status: "1" });
        setIsBillSaved(false);
        
        // Clear current bill data when refreshing
        setFinalData([]);
        setSelectedTable(null);
        
        // Reset all calculation states
        setSubtotal(0);
        setDiscAmount(0);
        settaxAmount(0);
        setroundoffAmount(0);
        setgrandAmount(0);
        settotalAmount(0);
        setsubtotalAfterDiscount(0);
        
        // Reset form data
        setFormData({
            pmode: "",
            discAmount: 0,
            discountType: "percentage",
            phones: "",
            paidAmount: ""
        });
        setChangeMoney("");
        setphones("");
    };

    //   if (!customer) return null;
    useEffect(() => {
        const storedUsername = localStorage.getItem('uname') || sessionStorage.getItem('uname');
        if (storedUsername) {
            setBillGeneratedBy(storedUsername);
        }
    }, []);
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
            const formData = new FormData();
            if (images && images.length > 0) {
                images.forEach((file) => {
                    formData.append("images", file);
                });
            }
            console.log(post1.data.id);
            formData.append("product_id", post1.data.id); // Assuming post1 returns item ID

            // For FormData, only set Authorization header. Let axios handle Content-Type with multipart boundary
            const token = getAuthToken();
            const config = {
              headers: {
                Authorization: token && !token.startsWith('Bearer ') ? `Bearer ${token}` : token
              }
            };
            const post2 = await axios.post("/addnewproduct/item_images", formData, config);
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
        const change = paidAmount - grandTotal; // Calculate the change
        setChangeMoney(change.toFixed(2)); // Update the state with the calculated change
        setFormData((prevData) => ({
            ...prevData,
            paidAmount: e.target.value, // Update the paid amount in formdata
        }));
    };
    const [subtotal, setSubtotal] = useState(0);
    const [discAmount, setDiscAmount] = useState(0);
    const [taxAmount, settaxAmount] = useState(0);
    const [roundoffAmount, setroundoffAmount] = useState(0);
    const [grandAmount, setgrandAmount] = useState(0);
    const [totalAmount, settotalAmount] = useState(0);
  const [subtotalAfterDiscount, setsubtotalAfterDiscount] = useState(0);
  const [isBillSaved, setIsBillSaved] = useState(false);
  const [isCustomerPhoneModalOpen, setIsCustomerPhoneModalOpen] = useState(false);
  const [currencySign, setCurrencySign] = useState("฿"); // Default to Thai Baht







    const handleComboChange = (e) => {
        const { value } = e.target;
        setFormData((prevData) => ({ ...prevData, pmode: value }));

        console.log("Payment Mode Selected:", value); // ✅ Debugging
        if (value === "Credit") {
            console.log("Opening Customer Details Modal"); // ✅ Debugging
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
        setFormData((prevData) => ({ ...prevData, paidAmount: "" }));
        setChangeMoney("");
        setDiscAmount("0");
        setIsBillSaved(false); // Reset bill saved status when selecting a new table
        
        // Reset all calculation states when selecting a new table
        setSubtotal(0);
        settaxAmount(0);
        setroundoffAmount(0);
        setgrandAmount(0);
        settotalAmount(0);
        setsubtotalAfterDiscount(0);

        fetchData("advance_order_items", setFinalData, "id", { table_number: tableName, status: "1" });

        //  handlediscount({ target: { value: "0" } });
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
        navigate(`/reports/advancebillhistory`);
    };
    const handlePrintClick = async (itemId) => {
        try {

            const invId = itemId;
            //alert(invId);
            // Fetch the final_bill and advance_order_items details for the given itemId
            const myfinalbilldata = await fetchData("advance_final_bill", setFinalBillData, "id", { id: invId });
            const myOrderItemsData = await fetchData("advance_order_items", setOrderItemsData, "id", { invoice_number: invId });
            // Check if pickup_time exists in finalBillData
            const invTime = myfinalbilldata[0].pickup_time;
            const formattedTime = invTime ? invTime.split(':').slice(0, 2).join(':') : 'N/A'; // Use 'N/A' if pickup_time is undefined

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
              <p>Tax:${companyInfo[0].tax_id}</p>
            
           
            </div>
             
           
          
          </div>
            <div class="bill-bill-body">
             
              <table class="table">
                 <tr >
                    <td class="header" >Order No.  ${myfinalbilldata[0].id}</td>
                   
                    <td class="header" >${myfinalbilldata[0].table_number}</td>
                    
                  </tr>
                   <tr >
                    <td>Pickup Date: ${myfinalbilldata[0].pickup_date}</td>
                   
                  
                    
                  </tr>
                  <tr >
                   
                   
                    <td>Pickup Time:${formattedTime}</td>
                    
                  </tr>
                   <tr >
                    <td>Order Type: ${myfinalbilldata[0].order_type}</td>
                   
                    <td> </td>
                    
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
            <p>Note: ${myfinalbilldata[0].special_note}</p>
              <p>Printed on ${new Date().toLocaleString()}</p>
              <p>Cashier: ${getUserName() || 'N/A'}</p>
              <p>Powered by Cloudnet Softwares </p>
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


    const handleSaveBill = async () => {
        try {
            // Validate customer details if payment mode is Credit
            if (formdata.pmode === "Credit" && (!customerDetails.name || !customerDetails.phone || !customerDetails.email)) {
                alert("Please enter customer details before saving the bill.");
                setCustomerModalOpen(true);
                return;
            }

            // Calculate subtotal, tax, discount, round off, and grand total
            const subtotal = finalData.reduce((acc, item) => acc + item.total_price, 0);
            const tax = subtotal * 0.07; // Assuming 7% tax
            const grandTotal = subtotal + tax;

            // Calculate discount amount based on the type (percentage or amount)
            let finaldiscount_amount = discAmount;
            if (formdata.discountType === "percentage") {
                finaldiscount_amount = (subtotal * discAmount) / 100; // Calculate percentage discount
            }
            let billstatus = 0;
            if (formdata.pmode === "Credit") {
                billstatus = 1;
            }

            //prepare the request body
            const billData = {
                pickup_date: pickupDate,
                pickup_time: pickupTime,
                special_note: specialNote,
                order_type: orderType,
                bill_generated_by: billGeneratedBy,
                final_billed: finalBilled ? 1 : 0,
                // Add other required fields like:
                customer_id: customerId,
                inv_date: invDate,
                inv_time: invTime,
                table_number: tableNumber,
                subtotal: subtotal,
                discount_type: formdata.discountType || "amount", // ✅ Ensure default value
                discount_value: discAmount,
                discount_amount: discountAmount,
                subtotal_afterdiscount: subtotalAfterDiscount,
                tax: '0',

                roundoff: roundoffAmount,
                grand_total: grandAmount,
                payment_mode: formdata.pmode || "Credit", // ✅ Default to Cas
                paid_amount: paidAmount,
                status: 0 // or your current status
            };


            // Log the bill data being sent to the API
            console.log('Sending bill data:', billData);

            // Save the final bill and ledger entries simultaneously in one request
            const response = await axios.post(
                "/advancesavebill",  // Change to the API route that saves both bill & ledger
                billData,
                getHeaders() // Assuming you have a function for headers
            );

            console.log('API Response:', response.data);  // Log the response from the API


            const { bill_id } = response.data; // Get the inserted bill ID
            // alert(bill_id);
            setLatestBillId(bill_id);
            // ✅ Call print function directly
            //handlePrintClick(bill_id);

            // 🔥 **Update the state to hold the new bill_id**
            // ✅ Use functional update to ensure latest state

            // Update the table status
            await updateData(
                "tablelist",
                { status: "0" }, // Mark table as "closed"
                { name: selectedTable }
            );

            // Update order items status and attach invoice number
            await updateData("advance_order_items", {
                status: "0", // Mark orders as completed
                invoice_number: bill_id, // Attach the invoice number
            },
                {
                    table_number: selectedTable, // Match the table number
                    status: "1", // Only update active orders
                }
            );

            // Refresh the table list
            await fetchData("tablelist", setTotaltablelist, "id", { status: "1" });

            // ✅ Immediately pass the latest bill ID to the print function
            //alert(bill_id);
            //handlePrintClick(bill_id);


            // Clear the bill summary table after successful save
            setFinalData([]);
            setSelectedTable(null);
            
            // Reset all calculation states
            setSubtotal(0);
            setDiscAmount(0);
            settaxAmount(0);
            setroundoffAmount(0);
            setgrandAmount(0);
            settotalAmount(0);
            setsubtotalAfterDiscount(0);
            
            // Reset form data
            setFormData({
                pmode: "",
                discAmount: 0,
                discountType: "percentage",
                phones: "",
                paidAmount: ""
            });
            setChangeMoney("");
            setphones("");
            
            // Reset order details
            setPickupDate('');
            setPickupTime('');
            setSpecialNote('');
            setOrderType('');
            setFinalBilled(false);

            // Show success toast message
            toast.success("Bill saved successfully!");
            setIsBillSaved(true);
        } catch (err) {
            console.error("Error occurred during bill save:", err.message);  // Log the error
            toast.error("Error saving bill.");
        }
    };
    // useEffect(() => {
    //   if (latestBillId) {
    //     handlePrintClick(latestBillId);
    //   }
    // }, [latestBillId]);



    const handleGenetotal_priceBill = async () => {
        const printContent = printRef.current.innerHTML;
        // alert(billId);
        // await fetchData("final_bill", setFinalBillData, "id", { id: billId });
        // await fetchData("advance_order_items", setOrderItemsData, "id", { invoice_number: billId });
        // Check if pickup_time exists in finalBillData

        const newWindow = window.open("", "_blank");

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
          </style>
        </head>
        <body>
          <div class="bill-header">
            <h2>${companyInfo[0].name}</h2>
            <div class="company-info">
              <p>${companyInfo[0].address}</p>
              <p>Tax:${companyInfo[0].tax_id}</p>
            
           
            </div>
             
                
          
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
            <p>Cashier: ${getUserName() || 'N/A'}</p>
            <p>Powered by CloudPOS !! </p>
          </div>
        </body>
      </html>
    `);



        newWindow.document.close();

        newWindow.onload = () => {
            newWindow.print(); // Print the document
            newWindow.close(); // Close the window after printing
        };
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
                
                // Fetch core settings for currency sign
                try {
                    const coreSettings = await fetchData("coresetting", null, "id", {});
                    if (coreSettings && coreSettings.length > 0) {
                        setCurrencySign(coreSettings[0].currency_sign || "฿");
                    }
                } catch (error) {
                    console.error("Error fetching core settings:", error);
                }
            } catch (error) {
                console.error("Error in useEffect:", error);
            }
        };

        fetchAndSetData();
    }, []);  // ✅ This ensures it runs only once when the component mounts


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

    // Function to clear the bill summary table manually
    const clearBillSummary = () => {
        setFinalData([]);
        setSelectedTable(null);
        
        // Reset all calculation states
        setSubtotal(0);
        setDiscAmount(0);
        settaxAmount(0);
        setroundoffAmount(0);
        setgrandAmount(0);
        settotalAmount(0);
        setsubtotalAfterDiscount(0);
        
        // Reset form data
        setFormData({
            pmode: "",
            discAmount: 0,
            discountType: "percentage",
            phones: "",
            paidAmount: ""
        });
        setChangeMoney("");
        setphones("");
        
        // Reset order details
        setPickupDate('');
        setPickupTime('');
        setSpecialNote('');
        setOrderType('');
        setFinalBilled(false);
        setIsBillSaved(false);
        
        toast.success("Bill summary cleared successfully!");
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onRequestClose={onClose}
                contentLabel="Advance Order Check Bill"
                style={customStyles}
                ariaHideApp={false}
            >
                <div className="advance-bill-modal-container">
                    <ToastContainer />
                    
                    {/* Header */}
                    <div className="advance-bill-modal-header">
                        <h2 className="advance-bill-modal-title">Advance Order Summary - {selectedTable}</h2>
                        <div className="advance-bill-modal-actions">
                            <button onClick={refreshTables} className="advance-refresh-btn">
                                <FaRedo size={16} />
                            </button>
                            <button onClick={onClose} className="advance-close-btn">
                                <FaTimes size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Tables Section */}
                    <div className="advance-tables-section">
                        <h4 style={{ margin: "0 0 15px 0", color: "#495057" }}>Advance Order Tables</h4>
                        <div className="advance-tables-grid">
                            {TotalTablelist.length > 0 ? (
                                TotalTablelist.map((tables, index) => (
                                    <div
                                        key={index}
                                        onClick={() => handleTableHistory(tables.name, "0")}
                                        className={`advance-table-card ${tables.status === 0 ? "available" : "occupied"}`}
                                    >
                                        <img
                                            src={`../../dist/img/tables/table.png`}
                                            alt={`Table ${index + 1}`}
                                            onError={(e) => {
                                                e.target.src = "../../dist/img/tables/table.png";
                                            }}
                                        />
                                        <h6>{tables.name}</h6>
                                        <span className={`advance-table-status ${tables.status === 0 ? "available" : "occupied"}`}>
                                            {tables.status === 0 ? "Available" : "Occupied"}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="advance-loading-message">Loading tables...</div>
                            )}
                        </div>
                    </div>

                    {/* Advance Order Details Section */}
                    <div className="advance-order-details-section">
                        <h4 style={{ margin: "0 15px 15px 0", color: "#495057" }}>Order Details</h4>
                        <div className="advance-order-info-grid">
                            <div className="advance-order-info-item">
                                <label>Pickup Date</label>
                                <input
                                    type="date"
                                    value={pickupDate}
                                    onChange={(e) => setPickupDate(e.target.value)}
                                />
                            </div>
                            <div className="advance-order-info-item">
                                <label>Pickup Time</label>
                                <input
                                    type="time"
                                    value={pickupTime}
                                    onChange={(e) => setPickupTime(e.target.value)}
                                />
                            </div>
                            <div className="advance-order-info-item">
                                <label>Special Note</label>
                                <input
                                    type="text"
                                    value={specialNote}
                                    onChange={(e) => setSpecialNote(e.target.value)}
                                    placeholder="Enter special instructions"
                                />
                            </div>
                            <div className="advance-order-info-item">
                                <label>Order Type</label>
                                <input
                                    type="text"
                                    value={orderType}
                                    onChange={(e) => setOrderType(e.target.value)}
                                    placeholder="Enter order type"
                                />
                            </div>
                            <div className="advance-order-info-item">
                                <label>Bill Generated By</label>
                                <input
                                    type="text"
                                    value={billGeneratedBy}
                                    readOnly
                                />
                            </div>
                            <div className="advance-order-info-item">
                                <div className="advance-order-checkbox">
                                    <input
                                        type="checkbox"
                                        id="final_billed"
                                        checked={finalBilled}
                                        onChange={(e) => setFinalBilled(e.target.checked)}
                                    />
                                    <label htmlFor="final_billed">Final Billed</label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="advance-bill-content">
                        {/* Left Side - Bill Summary */}
                        <div className="advance-bill-summary-section" ref={printRef}>
                            <div className="advance-bill-summary-header">
                                Bill Summary
                            </div>
                            
                            <div className="advance-bill-table-container">
                                <table className="advance-bill-table">
                                    <thead>
                                        <tr>
                                            <th className="text-start">Item</th>
                                            <th>Qty</th>
                                            <th>Unit Price</th>
                                            <th className="text-end">Total Price</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {finalData.length > 0 ? (
                                            finalData.map((item, index) => (
                                                <tr key={index}>
                                                    <td className="text-start">{item.item_name}</td>
                                                    <td>{item.quantity}</td>
                                                    <td>{currencySign} {(item.total_price / item.quantity).toFixed(2)}</td>
                                                    <td className="text-end">{currencySign} {Number(item.total_price).toFixed(2)}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="advance-empty-table-message">
                                                    Table is Empty
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {finalData.length > 0 && (
                                <div className="advance-bill-totals">
                                    <div className="advance-total-row">
                                        <span className="label">Subtotal</span>
                                        <span className="value">{currencySign} {subtotal}</span>
                                    </div>
                                    <div className="advance-total-row">
                                        <span className="label">Discount</span>
                                        <span className="value">
                                            {formdata.discountType === "percentage" ? `${discAmount}%` : `${currencySign} ${discAmount}`}
                                        </span>
                                    </div>
                                    <div className="advance-total-row">
                                        <span className="label">Subtotal After Discount</span>
                                        <span className="value">{currencySign} {subtotalAfterDiscount}</span>
                                    </div>
                                    <div className="advance-total-row">
                                        <span className="label">Tax ({TaxesData[0]?.taxvalue || 0}%)</span>
                                        <span className="value">{currencySign} {taxAmount}</span>
                                    </div>
                                    <div className="advance-total-row">
                                        <span className="label">Total Amount</span>
                                        <span className="value">{currencySign} {totalAmount}</span>
                                    </div>
                                    <div className="advance-total-row">
                                        <span className="label">Round Off Amount</span>
                                        <span className="value">{currencySign} {roundoffAmount}</span>
                                    </div>
                                    <div className="advance-total-row">
                                        <span className="label">Grand Total</span>
                                        <span className="value">{currencySign} {grandAmount}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Side - Payment & Customer Info */}
                        <div className="advance-payment-section">
                            {/* Customer Information Card */}
                            <div className="advance-payment-card">
                                <div className="advance-payment-card-header">
                                    Customer Information
                                </div>
                                <div className="advance-payment-card-body">
                                    <div className="advance-form-group">
                                        <label>Customer Mobile Number</label>
                                        <input
                                            type="number"
                                            value={phones}
                                            onChange={(e) => setphones(e.target.value)}
                                            placeholder="Enter mobile number"
                                        />
                                    </div>
                                    <button
                                        onClick={() => setCustomerModalOpen(true)}
                                        className="advance-action-btn info"
                                    >
                                        Add Customer Details
                                    </button>
                                </div>
                            </div>

                            {/* Payment Details Card */}
                            <div className="advance-payment-card">
                                <div className="advance-payment-card-header">
                                    Payment Details
                                </div>
                                <div className="advance-payment-card-body">
                                    <div className="advance-form-group">
                                        <label>Payment Mode</label>
                                        <select
                                            value={formdata.pmode}
                                            onChange={handleComboChange}
                                        >
                                            {paymentOptions.map((pmt) => (
                                                <option key={pmt.name} value={pmt.name}>
                                                    {pmt.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="advance-form-group">
                                        <label>Amount Received</label>
                                        <input
                                            type="text"
                                            value={formdata.paidAmount}
                                            onChange={handleChangeMoney}
                                            placeholder="Enter received amount"
                                        />
                                    </div>

                                    <div className="advance-form-group">
                                        <label>Change Money</label>
                                        <input
                                            type="text"
                                            className={`change-money ${changeMoney >= 0 ? 'positive' : 'negative'}`}
                                            value={`${currencySign} ${changeMoney}`}
                                            readOnly
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Discount Card */}
                             <div className="payment-card">
                                           <div className="payment-card-header">
                                             Discount Options
                                           </div>
                                           <div className="payment-card-body">
                                             <div className="discount-controls">
                                               <div className="discount-input">
                                                 <label>Discount Amount</label>
                                                 <input
                                                   type="number"
                                                   className="form-control"
                                                   value={discAmount}
                                                   onChange={(e) => setDiscAmount(e.target.value)}
                                                   placeholder="Enter discount"
                                                 />
                                               </div>
                                               <div className="discount-type-select">
                                                 <label>Type</label>
                                                 <select
                                                   className="form-select"
                                                   value={formdata.discountType}
                                                   onChange={(e) => setFormData(prev => ({ ...prev, discountType: e.target.value }))}
                                                 >
                                                   <option value="percentage">%</option>
                                                   <option value="fixed">{currencySign}</option>
                                                 </select>
                                               </div>
                                             </div>
                           
                                             <div className="action-buttons">
                                               <button
                                                 onClick={() => {
                                                   if (!phones) {
                                                     toast.error("Please enter customer phone first.");
                                                     return;
                                                   }
                                                   setLineQRModalOpen(true);
                                                 }}
                                                 className="btn btn-warning"
                                               >
                                                 LINE Discount
                                               </button>
                                               <button
                                                 onClick={() => {
                                                   if (!customerDetails.phone) {
                                                     toast.error("Please enter customer phone first.");
                                                     return;
                                                   }
                                                   setLineQRModalOpen(true);
                                                 }}
                                                 className="btn btn-info"
                                               >
                                                 WhatsApp Discount
                                               </button>
                                             </div>
                                           </div>
                                         </div>

                            {/* Action Buttons */}
                            <div className="advance-payment-card">
                                <div className="advance-payment-card-body">
                                    <div className="advance-action-buttons">
                                        {!isBillSaved && (
                                            <button
                                                onClick={handleSaveBill}
                                                className="advance-action-btn success"
                                                disabled={!finalData || finalData.length === 0}
                                            >
                                                Save Bill
                                            </button>
                                        )}
                                        {isBillSaved && (
                                            <button
                                                onClick={handleGenetotal_priceBill}
                                                className="advance-action-btn primary"
                                            >
                                                Print Bill
                                            </button>
                                        )}
                                        <button
                                            onClick={clearBillSummary}
                                            className="advance-action-btn warning"
                                            disabled={!finalData || finalData.length === 0}
                                        >
                                            Clear Bill
                                        </button>
                                        <button
                                            onClick={handleBillHistory}
                                            className="advance-action-btn info"
                                        >
                                            Bill History
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
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
        </>
    );
};

export default AdvanceOrderCheckBillModal;
