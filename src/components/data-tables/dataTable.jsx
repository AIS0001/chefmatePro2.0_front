import React, { useState, useEffect } from "react";
import {
  FaSort,
  FaSortUp,
  FaSortDown,
  FaAirbnb,
  FaAddressBook,
  FaBandcamp,
} from "react-icons/fa";
import { useNavigate, Link } from "react-router-dom";
import { Modal, Button, Table } from "react-bootstrap";
import ExportDataTable from "../Buttons/ExportdataTable";
import Pagination from "../Pagination/Pagination";
import Lightbox from "react-image-lightbox";
import "react-image-lightbox/style.css"; // Import lightbox styles
import { ToastContainer, toast } from "react-toastify";
import { baseURL } from "../..";
import { FaEdit, FaTrash, FaPrint } from "react-icons/fa";
import EditModal from "../Modals/EditModals";
import deleteRecord from "../../functions/delateData";
import cancelRecord from "../../functions/cancelBill";
import fetchData from "../../functions/fetchData";

const DataTable = ({ columns, data, tablename, onEditClick, onDeleteSuccess }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [companyInfo, setcompanyInfo] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "" });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [loading, setLoading] = useState(false); // Add loading state
  const [editingRecord, setEditingRecord] = useState(null); // State for editing record
  const [tableData, setTableData] = useState(data); // Manage the table data state
  const [FinalBillData, setFinalBillData] = useState([]); // Manage the table data state
  const [OrderItemsData, setOrderItemsData] = useState([]); // Manage the table data state
  const rowsPerPage = 50;
  const agent_id =localStorage.getItem("uname") || sessionStorage.getItem("uname");

  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);


  const editableTables = [ "customers", "taxes","items","suppliers"]; // Tables where edit is allowed
  const printableTables = ["order_items", "final_bill", "customers"]; // Tables where print is allowed
  const CancelBillTables = ["order_items", "order_items_gst", "final_bill", "advance_final_bill", "customers"]; // Tables where print is allowed
  const DeleteBillTables = ["order_items", "order_items_gst", "final_bill", "advance_final_bill"]; // Tables where print is allowed

  // Function to handle modal open and store selected customer data
  const handleCustomerClick = (customer) => {
    setSelectedCustomer(customer);
    setShowModal(true);
  };

  // Debug logging
  useEffect(() => {
    console.log("🔍 DataTable Debug Info:");
    console.log("📋 Table name:", tablename);
    console.log("🗑️ DeleteBillTables:", DeleteBillTables);
    console.log("❌ Should show delete button:", !DeleteBillTables.includes(tablename));
    console.log("✏️ EditableTables:", editableTables);
    console.log("🖨️ PrintableTables:", printableTables);
  }, [tablename]);

  // Sort data based on sortConfig
  const sortedData = React.useMemo(() => {
    let sortableItems = [...tableData];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [tableData, sortConfig]);

  // Pagination logic
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = sortedData.slice(startIndex, endIndex);
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  const [editId, setEditId] = useState(null);
  const [formdata, setFormData] = useState({
    taxname: "",
    taxvalue: "",
    included: false,
  });

  const navigate = useNavigate();

  const handleEditClick = (item) => {
    if (tablename === "items") {
      navigate(`/inventory/edititem/${item.id}`);
    } else if (tablename === "contract") {
      navigate(`/contracts/editcontract/${item.id}/${agent_id}`);
    } else if (tablename === "taxes") {
      // Use the onEditClick prop if provided, otherwise use default behavior
      if (onEditClick) {
        onEditClick(item);
      } else {
        console.log("Editing item:", item);
        setFormData({
          taxname: item.taxname,
          taxvalue: item.taxvalue,
          included: item.included,
        });
        setEditId(item.id); // switch to edit mode
      }
    } else if (onEditClick) {
      // For other tables, use the provided onEditClick handler
      onEditClick(item);
    }
  };

  const handlePrintClick = async (itemId) => {
    try {
      // Fetch the final_bill and order_items details for the given itemId
      const finalBillData = await fetchData("final_bill", setFinalBillData, "id", { id: itemId });
      await fetchData("companyinfo", setcompanyInfo, "id", {});
      const myorderItemsData = await fetchData("order_items", setOrderItemsData, "id", { invoice_number: itemId });
      // Check if inv_time exists in finalBillData
      const invTime = finalBillData[0].inv_time;
      const formattedTime = invTime ? invTime.split(':').slice(0, 2).join(':') : 'N/A'; // Use 'N/A' if inv_time is undefined

      // Format the data for printing using a similar structure
      const printContent1 = `
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
                  ${myorderItemsData
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
              <span>Subtotal: ฿ ${FinalBillData[0].subtotal}</span><br>
              <span>Tax (7%): ฿ ${FinalBillData[0].tax}</span><br>
              <span>Round Off: ฿ ${FinalBillData[0].tax}</span><br>
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
                  <td class="header" >Bill ID: ${FinalBillData[0].id}</td>
                 
                  <td class="header" >${FinalBillData[0].table_number}</td>
                  
                </tr>
                 <tr >
                  <td>Date: ${FinalBillData[0].inv_date}</td>
                 
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
                ${myorderItemsData
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
            <span>Subtotal: ฿ ${FinalBillData[0].subtotal}</span><br>
            <span>Discount: ฿ ${FinalBillData[0].discount_amount}</span><br>
            <span>Subtotal After Discount: ฿ ${FinalBillData[0].subtotal_afterdiscount}</span><br>

            <span>Tax (7%): ฿ ${FinalBillData[0].tax}</span><br>
            <span>Round Off: ฿ ${FinalBillData[0].roundoff}</span><br>
            <span>Total Amount: ฿ ${FinalBillData[0].grand_total}</span>
          </div>
            
          </div>
          <div class="footer">
            <p>Printed on ${new Date().toLocaleString()}</p>
            <p>Powered by ${companyInfo[0].name}</p>
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



  const handleDeleteClick = async (itemId) => {
    // Show confirmation dialog
    const confirmDelete = window.confirm("Are you sure you want to delete this record?");
    if (!confirmDelete) {
      return; // Exit if user cancels
    }

    try {
      // Implement delete logic here
      await deleteRecord(tablename, "id", itemId);
      if (tablename === "listing") {
        await deleteRecord("images", "id", itemId);
      } else if (tablename === "contract") {
        await deleteRecord("customer_images", "id", itemId);
      }

      // Update the table data state after deletion
      setTableData((prevData) => {
        const updatedData = prevData.filter((item) => item.id !== itemId);
        console.log("Updated Data:", updatedData); // Log updated data for debugging
        return updatedData; // Ensure new reference is returned
      });

      // Call the callback if provided (for refreshing parent component data)
      if (onDeleteSuccess) {
        onDeleteSuccess();
      } else {
        // Show generic success message if no callback provided
        toast.success("Record deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting record:", error);
      toast.error("Error deleting record");
    }
  };
  const handlecancelClick = async (itemId) => {
    try {
      // Implement delete logic here
      await cancelRecord(tablename, "id", itemId);

      // Update the table data state after deletion
      setTableData((prevData) => {
        const updatedData = prevData.filter((item) => item.id !== itemId);
        //console.log("Updated Data:", updatedData); // Log updated data for debugging
        toast.success("Invoice No."+itemId+" cancelled successfully");
        return updatedData; // Ensure new reference is returned
      });
    } catch (error) {
      console.error("Error deleting record:", error);
    }
  };
  const onSort = (columnKey) => {
    let direction = "asc";
    if (sortConfig.key === columnKey && sortConfig.direction === "asc") {
      direction = "desc";
    }

    setSortConfig({ key: columnKey, direction });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key === columnKey) {
      if (sortConfig.direction === "asc") {
        return <FaSortUp />;
      } else if (sortConfig.direction === "desc") {
        return <FaSortDown />;
      }
    }
    return <FaSort />;
  };

  const handleImageClick = (imageSrc) => {
    setLoading(true); // Start loading
    const imageUrl = `${baseURL}/${imageSrc}?t=${new Date().getTime()}`;
    setLightboxImage(imageUrl);
    setLightboxOpen(true);
  };
  // Sync tableData with data prop
  useEffect(() => {
    setTableData(data);
  }, [data]);
  return (
    <>
      <ToastContainer />
      {lightboxOpen && lightboxImage && (
        <Lightbox
          mainSrc={lightboxImage}
          onCloseRequest={() => setLightboxOpen(false)}
          onImageLoad={() => setLoading(false)} // Stop loading when image is loaded
        />
      )}
      {loading && <div className="loading-icon">Loading...</div>}
      <div className="table-wrap">
        <div className="table-responsive">
          <table
            className="table table-hover table-bordered display pb-30"
            id="datatable1"
          >
            <thead>
              <tr>
                {columns.map((col, index) => (
                  <th
                    key={index}
                    onClick={() => onSort(col.field)}
                    style={{
                      cursor: "pointer",
                      textAlign: "center",
                      color: "white",
                      backgroundColor: "#050505",
                    }} // Center text and add a background color
                  >
                    {col.label} {getSortIcon(col.field)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item, rowIndex) => (
                <tr key={rowIndex}>
                  {" "}
                  {/* Adjust row height */}
                  {columns.map((col, colIndex) => (
                    <td key={colIndex}>
                      {" "}
                      {/* Center cell content */}
                      {col.field === "path" && item[col.field] ? (
                        <img
                          src={`${baseURL}/${item[col.field]
                            }?t=${new Date().getTime()}`} // Cache-busting
                          alt="Thumbnail"
                          style={{
                            width: "50px",
                            height: "50px",
                            cursor: "pointer",
                            borderRadius: "4px", // Add rounded corners to image
                            border: "1px solid #ddd", // Border for the image
                          }}
                          onClick={() => handleImageClick(item[col.field])}
                        />
                      ) : col.field === "actions" ? (
                        <>
                          {/* Edit Icon (Allowed only for specific tables) */}
                          {editableTables.includes(tablename) && onEditClick && (
                            <FaEdit
                              style={{
                                cursor: "pointer",
                                marginRight: "10px",
                                color: "green",
                              }}
                              onClick={() => handleEditClick(item)}
                            />
                          )}

                          {/* Print Icon (Allowed only for specific tables) */}
                          {printableTables.includes(tablename) && (
                            <FaPrint
                              style={{
                                cursor: "pointer",
                                marginRight: "10px",
                                color: "blue",
                              }}
                              onClick={() => handlePrintClick(item.id)}
                            />
                          )}
                          {CancelBillTables.includes(tablename) && (
                            <FaTrash
                              style={{
                                cursor: "pointer",
                                marginRight: "10px",
                                color: "green",
                              }}
                              onClick={() => handlecancelClick(item.id)}
                            />
                          )}
                          {!DeleteBillTables.includes(tablename) && (
                            <>
                              {console.log("🗑️ Rendering delete button for table:", tablename, "Item ID:", item.id)}
                              <FaTrash
                                style={{
                                  cursor: "pointer",
                                  color: "red",
                                }}
                                onClick={() => handleDeleteClick(item.id)}
                              />
                            </>
                          )}
                          {/* Delete Icon (Allowed for ALL tables) */}
                         
                        </>
                      ) : col.field === "customer_name" ? (
                        <span
                          style={{
                            cursor: "pointer",
                            color: "blue",
                            fontWeight: "bold",
                          }}
                          onClick={() => handleCustomerClick(item)}
                        >
                          {item[col.field]}
                        </span>
                      ) : col.field === "status" &&
                        item[col.field] === "vaccant" ? (
                        <Link
                          className="btn btn-primary btn-sm"
                          to={`/lentproperty/newlent/${item.id}`}
                        >
                          Book Now
                        </Link>
                      ) : (
                        item[col.field]
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </>
  );
};

export default DataTable;
