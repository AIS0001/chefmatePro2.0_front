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
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CardComponent from "../../components/cards/CardComponent";
import FinalBillModal from "./FinalBillModal";
import fetchOrderDetails from "../../functions/fetchOrderDetails";
import updateData from "../../functions/updateData";
import { FaRedo } from "react-icons/fa"; // Import refresh icon
import Layout from "../../layout/Layout";


const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    width: "100%",
    maxWidth: "90%", // Ensures it doesn't take up full width on small screens
    maxHeight: "90vh", // Makes sure modal content doesn't overflow vertically
    borderRadius: "10px",
    overflowY: "auto", // Enables scrolling if content overflows
  },
  overlay: {
    zIndex: 1050, // Ensure this is higher than your sidebar's z-index
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Optional: Overlay styling
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

console.log(getCurrentDate()); // Output: YYYY-MM-DD

const CheckBillModal = ({ isOpen, customer, uptableList, onClose }) => {
  const [formdata, setFormData] = useState({
    unit: "",
    tax: "",
    subcat: "",
  });
  const [companyInfo, setcompanyInfo] = useState([]);
  const [TotalTablelist, setTotaltablelist] = useState(0);
  const [selectedTable, setSelectedTable] = useState(null); // Table selection
  const [FinalBillData, setFinalBillData] = useState([]); // Manage the table data state
  const [OrderItemsData, setOrderItemsData] = useState([]); // Manage the table data state


  // Handle table selection
  const handleTableClick = (tableNumber) => {
    setSelectedTable(tableNumber);

    toast.success(`Selected Table: ${tableNumber}`);
  };
  const [getTax, setTax] = useState([]);
  const [getUnit, setUnits] = useState([]);
  const [getCategory, setCategory] = useState([]);
  const [finalData, setFinalData] = useState([]);
  const [changeMoney, setChangeMoney] = useState("");
  const printRef = useRef();

  const [reload, setReload] = useState(false);
  const [data, setData] = useState([]);
  const [errors, setErrors] = useState({});
  const [images, setImages] = useState([]);
  //   if (!customer) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };
  // Handle file changes and set preview
  const handleFileChange = (event) => {
    const selectedImages = Array.from(event.target.files).map((file) =>
      Object.assign(file, { preview: URL.createObjectURL(file) })
    );
    setImages((prevImages) => [...prevImages, ...selectedImages]);
  };
  const refreshTables = (event) => {
    fetchData("tablelist", setTotaltablelist, "id", { status: "1" });
  };

  const handleDeleteImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
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
      console.log(post1.data.id);
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
  const [taxAmount, settaxAmount] = useState(0);
  const [roundoffAmount, setroundoffAmount] = useState(0);
  const [grandAmount, setgrandAmount] = useState(0);
  const [totalAmount, settotalAmount] = useState(0);
  const [subtotalAfterDiscount, setsubtotalAfterDiscount] = useState(0);
  

  const handlediscount = (e) => {
    const discount = parseFloat(e.target.value) || 0;
    setDiscAmount(discount);
    
    // Calculate subtotal
    const subtotalValue = finalData.reduce((acc, item) => acc + item.total_price, 0);
    setSubtotal(subtotalValue.toFixed(2));
    
    // Apply discount and calculate new subtotal after discount
    const subtotalAfterDiscount = parseFloat(subtotalValue) - parseFloat(discount);
    setsubtotalAfterDiscount(subtotalAfterDiscount);
  
    // Calculate tax (7%) based on the updated subtotal after discount
    const taxValue = subtotalAfterDiscount * 0.07;
    settaxAmount(taxValue.toFixed(2));
    
    // Calculate total amount after tax
    const totalAmountValue = subtotalAfterDiscount + taxValue;
    settotalAmount(totalAmountValue.toFixed(2));
    
    // Calculate round-off amount
    const roundedTotal = Math.round(totalAmountValue);
    const roundoffValue = roundedTotal - totalAmountValue;
    setroundoffAmount(roundoffValue.toFixed(2));
    
    // Calculate grand total
    setgrandAmount(roundedTotal.toFixed(2));
  };
  
  
  // Fetch subcategories based on selected category
  const handleTableHistory = async (tableName) => {
    setSelectedTable(tableName); // Set the selected table
    setFormData((prevData) => ({
      ...prevData,
      paidAmount: "", // Reset the Paid Amount field
    }));
    setChangeMoney(""); // Reset the Change Money field
    setDiscAmount("0"); // Reset the Change Money field

    // Fetch order details for the selected table
    fetchData("order_items", setFinalData, "id", {
      table_number: tableName,
      status: "1",
    });
    
    // Call handlediscount manually with a default discount of 0
  handlediscount({ target: { value: "0" } });
  };


  const handleBillHistory = async () => {
    navigate(`/reports/billhistory`);
  };
  const handlePrintClick = async (itemId) => {
    try {
      //alert(itemId);
      const invId = itemId;
      // Fetch the final_bill and order_items details for the given itemId
      await fetchData("final_bill", setFinalBillData, "id", { id: invId });
      await fetchData("order_items", setOrderItemsData, "id", { invoice_number: invId });
      // Check if inv_time exists in finalBillData
      const invTime = FinalBillData[0].inv_time;
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
            <h2>Restaurant Name</h2>
           
          
          </div>
            <div class="bill-bill-body">
             
              <table class="table">
                
                  <tr >
                    <th class="header" >Bill ID: ${FinalBillData[0].id}</th>
                   
                    <th class="header" >${FinalBillData[0].table_number}</th>
                    
                  </tr>
                   <tr >
                    <th>Date: ${FinalBillData[0].inv_date}</th>
                   
                    <th>Time:${formattedTime}</th>
                    
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
                  ${OrderItemsData
          .map(
            (item) => `
                        <tr>
                          <td>${item.item_name}</td>
                          <td>${item.quantity}</td>
                          <td>฿ ${item.total_price / item.quantity}</td>
                          <td>฿ ${item.total_price}</td>
                        </tr>
                      `
          )
          .join('')}
                </tbody>
              </table>
               <div class="total-row">
              <span>ID: ฿ ${FinalBillData[0].id}</span><br>
              <span>Subtotal: ฿ ${FinalBillData[0].subtotal}</span><br>
              <span>Tax (7%): ฿ ${FinalBillData[0].tax}</span><br>
              <span>Round Off: ฿ ${FinalBillData[0].roundoff}</span><br>
              <span>Total Amount: ฿ ${FinalBillData[0].grand_total}</span>
            </div>
              
            </div>
            <div class="footer">
              <p>Printed on ${new Date().toLocaleString()}</p>
              <p>Powered by Your Company Name</p>
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


  const handleSaveBill = async () => {
    try {
    
      // Save the final bill and retrieve the last inserted ID
      const response = await axios.post(
        "/insertdata/final_bill",
        {
          inv_date: getCurrentDate(), // Current date in YMD format
          inv_time: getCurrentTime(), // Current time in HH:MM:SS format
          table_number: selectedTable, // Selected table number
          subtotal: subtotal, // Format to 2 decimal places
          discount: discAmount, // Format to 2 decimal places
          subtotal_afterdiscount: subtotalAfterDiscount, // Format to 2 decimal places
          tax: taxAmount,
          roundoff: roundoffAmount,
          grand_total: grandAmount,
        },
        getHeaders()
      );

      // Extract the last inserted ID
      const { id } = response.data; // Ensure `id` is accessed from `response.data`

      // Update table status and assign the invoice number to related records
      await updateData(
        "tablelist",
        { status: "0" }, // Mark table as "closed"
        { name: selectedTable } // Match the table by name
      );

      await updateData(
        "orders",
        {
          status: "0", // Mark orders as completed
          invoice_number: id, // Attach the invoice number
        },
        {
          table_number: selectedTable, // Match the table number
          status: "1", // Only update active orders
        }
      );
      await updateData(
        "order_items",
        {
          status: "0", // Mark orders as completed
          invoice_number: id, // Attach the invoice number
        },
        {
          table_number: selectedTable, // Match the table number
          status: "1", // Only update active orders
        }
      );


      await fetchData("tablelist", setTotaltablelist, "id", { status: "1" });
      handlePrintClick(id);

      toast.success("Bill saved successfully!");
      // onItemAdded(); // Trigger a refresh or reload if needed
    } catch (err) {
      console.error(err.message);
      toast.error("Error saving bill.");
    }
  };

  const handleGenetotal_priceBill = () => {
    const printContent = printRef.current.innerHTML;

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
               <div class="left-col">
             
              <p>${new Date().toLocaleString()}</p>
            </div>
            <div class="right-col">
              <p>${selectedTable}</p>
            
            </div>
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
                    <td>฿ ${item.total_price / item.quantity.toFixed(2)}</td>
                    <td>฿ ${item.total_price.toFixed(2)}</td>
                  </tr>
                `
        )
        .join("")}
              </tbody>
            </table>
            <div class="total-row">
              <span>Subtotal: ฿ ${finalData.subtotal}</span><br>
              <span>Subtotal: ฿ ${finalData.discount}</span><br>
              <span>Tax (7%): ฿ ${finalData.tax}</span><br>
              <span>Round Off: ฿ ${finalData.roundoff}</span>
              <span>Round Off: ฿ ${finalData.grand_total}</span>
            </div>
          </div>
          <div class="footer">
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
    const fetchAndSetData = async () => {
      try {
        await fetchData("tablelist", setTotaltablelist, "id", { status: "1" });
        await fetchData("companyinfo", setcompanyInfo, "id", {});
        
      } catch (error) {
        console.error("Error in useEffect:", error);
      }
    };

    fetchAndSetData();
  }, []);
  // Runs whenever finalData changes
useEffect(() => {
  if (finalData.length > 0) {
    handlediscount({ target: { value: discAmount.toString() } });
  }
}, [finalData]); // Dependency array ensures it runs only when finalData updates

  return (
    <>

      <Modal
        isOpen={isOpen}
        onRequestClose={onClose}
        contentLabel="New Item Entry"
        style={customStyles}
        ariaHideApp={false}
      >
        <ToastContainer />
        <div className="row mt-4">
          <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
            <CardComponent
              title="Running Tables List"
              headerColor="darkblue"
              pull="left"
              bodyClass="panel-body"
            >
              <div className="panel panel-default card-view">
                <div className="row justify-content-center">
                  {TotalTablelist.length > 0 ? (
                    TotalTablelist.map((tables, index) => (
                      <div
                        key={index}
                        onClick={() => handleTableHistory(tables.name,"0")}
                        className={`col-lg-2 col-md-3 col-sm-4 col-6 mb-4`}
                        style={{
                          cursor: "pointer",
                          transition: "transform 0.3s, box-shadow 0.3s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "scale(1.05)";
                          e.currentTarget.style.boxShadow =
                            "0px 4px 8px rgba(17, 218, 33, 0.2)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "scale(1)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <div
                          className={`table-card p-4 text-center border w-100 rounded`}
                          style={{
                            backgroundColor:
                              tables.status === 0 ? "#bf0202" : "#dc3545", // Green for available, red for occupied
                            color: "white",
                          }}
                        >
                          <img
                            src={`../../dist/img/tables/table.png`}
                            alt={`Table ${index + 1}`}
                            className="img-fluid mb-2"
                            style={{ width: "50px", height: "50px" }}
                          />
                          <h6 className="font-weight-bold">{tables.name}</h6>
                          <small
                            style={{
                              backgroundColor: "rgba(7, 194, 22, 0.3)",
                              padding: "3px 8px",
                              borderRadius: "5px",
                              fontSize: "12px",
                              color: "white",
                            }}
                          >
                            {tables.status === 0 ? "Available" : "Occupied"}
                          </small>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p>Loading tables...</p>
                  )}
                </div>
              </div>
            </CardComponent>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 0", // Optional: adds some padding around the section
          }}
        >
          <div className="row mt-4" style={{ flex: 1 }}>
            <div className="col-lg-6 col-md-6 col-sm-6 col-xs-12">
              <h4>Final Summary - {selectedTable}</h4> {/* Left-aligned text */}
            </div>
          </div>

          <div
            className="col-lg-4 col-md-4 col-sm-6 col-xs-12"
            style={{ textAlign: "right" }}
          >
            <button
              onClick={refreshTables}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                marginRight: "10px", // Optional: adds space between the buttons
              }}
            >
              <FaRedo size={20} color="green" /> {/* Refresh icon */}
            </button>

            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              <FaTimes size={20} color="red" /> {/* Close icon */}
            </button>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-8 col-md-8 col-sm-12 col-xs-12">
            <div ref={printRef}>
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <table className="table table-bordered table-hover text-end">
                    <thead className="table-dark">
                      <tr>
                        <th className="text-start">Item</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Total Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {finalData.length > 0 ? (
                        finalData.map((item, index) => (
                          <tr key={index}>
                            <td className="text-start">{item.item_name}</td>
                            <td>{item.quantity}</td>
                            <td>
                              ฿ {(item.total_price / item.quantity).toFixed(2)}
                            </td>{" "}
                            {/* Corrected unit price */}
                            <td>฿ {item.total_price.toFixed(2)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center">
                            Table is Empty
                          </td>
                        </tr>
                      )}
                    </tbody>

                    {finalData.length > 0 && (
                      <tfoot className="table-light">
                        <tr>
                          <td colSpan="3" className="text-end">
                            <strong>Subtotal</strong>
                          </td>
                          <td>
                            ฿{" "}
                            {subtotal}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan="3" className="text-end">
                            <strong>Discount</strong>
                          </td>
                          <td>
                            ฿{" "}
                            {discAmount}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan="3" className="text-end">
                            <strong>Subtotal After Discount</strong>
                          </td>
                          <td>
                            ฿{" "}
                            {subtotalAfterDiscount}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan="3" className="text-end">
                            <strong>Tax (7%)</strong>
                          </td>
                          <td>
                            ฿{" "}
                            {taxAmount}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan="3" className="text-end">
                            <strong>Total Amount</strong>
                          </td>
                          <td>
                            ฿{" "}
                            {totalAmount}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan="3" className="text-end">
                            <strong>Round Off Amount</strong>
                          </td>
                          <td>
                            ฿{" "}
                            {roundoffAmount}
                          </td>{" "}
                          {/* Corrected Round Off Amount */}
                        </tr>
                        <tr>
                          <td colSpan="3" className="text-end">
                            <strong>Grand Total</strong>
                          </td>
                          <td>
                            ฿{" "}
                            {grandAmount}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>

               
                </div>
              </form>
            </div>
          </div>
          <div className="col-lg-4 col-md-4 col-sm-12 col-xs-12">
          <div className="col-12">
                    <TextfieldwithLabel
                      id="paidAmount"
                      onChange={handleChangeMoney} // Call the function on input change
                      value={formdata.paidAmount}
                      type="text"
                      name="paidAmount"
                      lable="Recieved"
                    />
               </div>
               <div className="col-12">
                    <TextfieldwithLabel
                      id="changeMoney"
                      value={`฿ ${changeMoney}`} // Display the change amount with currency formatting
                      type="text"
                      name="changeMoney"
                      lable="Change Money"
                      style={{
                        color: changeMoney < 0 ? "red" : "green", // Red for insufficient payment, green for extra payment
                        fontWeight: "bold",
                      }}
                      readOnly // Make it read-only as it's calculated dynamically
                    />
                    </div>
                  <div className="col-12">
                    <TextfieldwithLabel
                      id="discAmount"
                      onChange={handlediscount} // Call the function on input change
                      value={discAmount}
                      type="text"
                      name="discAmount"
                      lable="Discount"
                    />
                  </div>
            <div className="d-flex justify-content-between mt-4">
              <button
                onClick={handleGenetotal_priceBill}
                className="btn btn-danger mb-2 custom-btn"
              >
                Print Bill
              </button>
              <button onClick={handleSaveBill}
                className="btn btn-primary mb-2 custom-btn">
                Save & Print Bill
              </button>
              <button
                onClick={handleSaveBill}
                className="btn btn-darkblue mb-2 custom-btn"
              >
                Save Bill
              </button>
              <button
                onClick={handleBillHistory}
                className="btn btn-success mt-2 custom-btn"
              >
                Bill History
              </button>
            </div>
          </div>
        </div>
        {/* Horizontal rule */}
      </Modal>

    </>
  );
};

export default CheckBillModal;
