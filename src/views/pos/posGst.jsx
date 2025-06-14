import React, { useEffect, useState } from "react";
import { Link,useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { getHeaders } from "../../utility/getHeader";
import fetchDataFromTwoTables from "../../functions/fetchdatawithTwoTables";
import { format } from "date-fns";
import CardComponent from "../../components/cards/CardComponent";
import Header from "../../components/Header";
import Layout from "../../layout/Layout";
import fetchData from "../../functions/fetchData";
import { Textfield } from "../../components/Buttons/Textfield";
import getMax from "../../functions/getMax";
import getRunningTable from "../../functions/getRunningTable";
import { getUserName } from "../../functions/storageUtils";
import updateData from "../../functions/updateData";
import CheckBillModal from "../../components/Modals/CheckBillGstModal";
import { FaEdit, FaTrash, FaPrint } from "react-icons/fa";


//const itemPrices = Array.from({ length: 9 }, (_, index) => 100 + index * 50);
export default function NewPOSGST() {
  const baseURL = 'http://localhost:4402';
  let currentDate = format(new Date(), "yyyy-MM-dd");

  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [maxNumber, setmaxNumber] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [Tablelist, settableList] = useState(null);
  const [TotalTablelist, setTotaltablelist] = useState(0);

  const [selectedContract, setSelectedContract] = useState(null);
  const [tableshowModal, settableShowModal] = useState(false);


  const showtableBillDetails = (contract) => {
    // setSelectedContract(contract);
    // fetchData("tablelist", setTotaltablelist, "id", {  });
    settableShowModal(true);
  };

  const [tableStatus, setTableStatus] = useState(
    Array.from({ length: 20 }, () => "vacant") // Default all tables to "vacant"
  );
  const navigate = useNavigate();
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
  // Handle table selection
  const handleTableClick = (tableNumber) => {
    setSelectedTable(tableNumber);
    toast.success(`Selected Table: ${tableNumber}`);
  };

  const updateInvoiceNumber = async (orderId, invoiceNumber) => {
    try {
      // Step 1: Update the orders table
      await axios.put(`http://localhost:4402/orders/${orderId}`, {
        invoice_number: invoiceNumber,
      });

      // Step 2: Update the order_items table associated with this order
      await axios.put(`http://localhost:4402/order_items_gst`, {
        order_id: orderId,
        invoice_number: invoiceNumber,
      });

      toast.success("Invoice number updated successfully!");
    } catch (error) {
      console.error("Error updating invoice number:", error);
      toast.error("Failed to update invoice number.");
    }
  };

  // Print Order (Save to MySQL)
  const handleBillHistory = async () => {
    navigate(`/reports/billhistory`);
  };



  // Fetch items when a subcategory is clicked
  const handleSubcategoryClick = async (subcategoryId) => {
    try {
      const response = await fetchData("items", setData, "subcatid", { subcatid: subcategoryId });
      const response1 = await fetchDataFromTwoTables("items", "item_images", "id", "product_id", setData, "t1.id", { subcatid: subcategoryId })
      // Assuming the response returns a list of items with images
      console.log(response1);
      setData(response1);
    } catch (error) {
      console.error("Error fetching items for subcategory:", error);
    }
  };



  // Add item to the cart
  const addItemToOrder = (index, item) => {

    const existingItemIndex = cart.findIndex(cartItem => cartItem.id === item.id);
    const updatedCart = [...cart];

    if (existingItemIndex !== -1) {
      updatedCart[existingItemIndex].quantity += 1; // Increase quantity
    } else {
     updatedCart.push({
  ...item,
  quantity: 1,
  uom: item.uom || "",
  subtotal: item.offerprice,   // initial subtotal = 1 x price
  cgst: item.tax/2 || 0,
  sgst: item.tax/2 || 0,
  igst: item.igst || 0,  //right now no need for local shop
   tax_amount: ( ((item.tax || 0) + (item.igst || 0)) * item.offerprice / 100 ).toFixed(2),  //calculate tax value included
});

    }

    setCart(updatedCart);
    updateTotal(updatedCart);
  };

  // Decrease item quantity
  const decreaseItemQuantity = (index) => {
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
  const increaseItemQuantity = (index) => {
    const updatedCart = [...cart];
    updatedCart[index].quantity += 1;
    setCart(updatedCart);
    updateTotal(updatedCart);
  };

  // Update total price
  const updateTotal = (cart) => {
    const newTotal = cart.reduce(
      (acc, item) => acc + item.quantity * item.offerprice,
      0
    );
    setTotal(newTotal);
  };

  //delete order
  const handleDeleteOrder = async () => {
    setCart([]);
    setTotal(0);
  }

  //Print KOT

  const printKOT = (orderItems) => {
    let kotContent = `\nKITCHEN ORDER TICKET (KOT)\n`;
    kotContent += `Table: ${selectedTable}\n`;
    kotContent += `--------------------------------\n`;
  
    orderItems.forEach((item) => {
      kotContent += `${item.item_name} x ${item.quantity}  \n`;
    });
  
    kotContent += `--------------------------------\n`;
    kotContent += `Date: ${new Date().toLocaleString()}\n`;
  
    // Send KOT content to printer (Assuming you use `window.print()`)
    const newWindow = window.open("", "_blank");
    newWindow.document.write(`<pre>${kotContent}</pre>`);
    newWindow.document.close();
    newWindow.print();
     newWindow.close();
  };

  
  // Function to handle printing the order
  const handlePrintOrder = async () => {
    if (!selectedTable) {
      toast.error('Please select a table!');
      return;
    }

    // Existing code for handling order saving...
    try {
      const response = await axios.post(`/insertdata/orders`, {
        userid: getUserName(),
        order_number: maxNumber,
        table_number: selectedTable,
        total_amount: total,
        status: "1"
      },
        getHeaders()
      );

      // Prepare an array of order items to insert
    const orderItems = cart.map(item => ({
  order_id: maxNumber,                     // or `order_number` if that's what your DB expects
  table_number: selectedTable,
  item_name: item.iname,
  quantity: item.quantity,
  uom: item.uom || "",                     // fallback if uom not present
  rate: item.subtotal || (item.offerprice * item.quantity),
  cgst: item.cgst || 0,
  sgst: item.sgst || 0,
  igst: item.igst || 0,
  tax_amount: item.tax_amount || 0,
  total_price: item.offerprice * item.quantity,
  status: "1"
}));

      const response1 = await axios.post(`/insertdatabulkgst/order_items_gst`, {
        items: orderItems // Wrap in an object if your API expects this
      },
        getHeaders()
      );

      await updateData(
        "tablelist",
        { status: '1' },
        { name: selectedTable } // Additional WHERE conditions
      );
      await fetchData("tablelist", setTotaltablelist, "id", {});
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
      
    } else {
      toast.error("Failed to save the order!");
    }
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error('Error saving order!');
    }
  };
  const refreshTables = (event) => {
    fetchData("tablelist", setTotaltablelist, "id", {});
  };

  useEffect(() => {
    const fetchAndSetData = async () => {
      try {
        await fetchData("categories", setCategories, "id", {});
        await getMax("orders", setmaxNumber, "userid", getUserName(), "order_number");
        await getRunningTable("orders", settableList);
        await fetchData("tablelist", setTotaltablelist, "id", {})
      } catch (error) {
        console.error("Error in useEffect:", error);
      }
    };

    fetchAndSetData();
  }, []);

  return (
    <>
      <Layout>
        <Header title="GST Based POS System " />
        <ToastContainer />

        <div className="row mt-4">
          <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
            <CardComponent
              title="View All Tables List"
              headerColor="darkblue"
              pull="left"
              bodyClass="panel-body"
            >
              <div className="panel panel-default card-view">
                <div className="row justify-content-center">
                  {TotalTablelist.length > 0 ? (
                    TotalTablelist.map((table, index) => (
                      <div
                        key={index}
                        onClick={() => handleTableClick(table.name)}
                        className="col-lg-2 col-md-4 col-sm-6 col-12 mb-4"
                        style={{
                          cursor: "pointer",
                          transition: "transform 0.3s, box-shadow 0.3s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "scale(1.05)";
                          e.currentTarget.style.boxShadow = "0px 6px 15px rgba(0, 0, 0, 0.2)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "scale(1)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <div
                          className="table-card p-4 text-center rounded"
                          style={{
                            backgroundColor: table.status === 0 ? "#28a745" : "#dc3545",
                            color: "white",
                            border: "2px solid white",
                          }}
                        >
                          <img
                            src={`../../dist/img/tables/table.png`}
                            alt={`Table ${index + 1}`}
                            className="img-fluid mb-3"
                            style={{ width: "60px", height: "60px" }}
                          />
                          <h5
                            style={{
                              fontWeight: "bold",
                              textTransform: "uppercase",
                              margin: "0",
                              fontSize: "1rem",
                            }}
                          >
                            {table.name}
                          </h5>
                          <span
                            style={{
                              fontSize: "0.9rem",
                              fontWeight: "500",
                              marginTop: "5px",
                              display: "block",
                            }}
                          >
                            {table.status === 0 ? "Available" : "Occupied"}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted" style={{ fontSize: "1.2rem" }}>
                      Loading tables...
                    </p>
                  )}
                </div>

              </div>
            </CardComponent>
          </div>
        </div>

        {/* Main Category List */}
        <div className="row mt-4">
          <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
            <CardComponent
              title="Choose Category"
              headerColor="darkblue"
              pull="left"
              bodyClass="panel-body"
            >
              <div className="panel panel-default card-view">
                <div className="row">
                  {categories.length > 0 ? (
                    categories.map((category, index) => (
                      <div className="col-2 col-md-2 col-sm-6 col-xs-12" key={index}>
                        <button
                          className="btn btn-primary category-btn"
                          onClick={() => handleCategoryClick(category.id)}
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
        <div className="row mt-4">
          <div className="col-lg-2 col-md-2 col-sm-4 col-xs-12">
            <CardComponent
              title="Subcategories"
              headerColor="danger"
              pull="left"
              bodyClass="panel-body"
            >
              <div className="panel panel-default card-view">
                <div className="item-list-container">
                  <div className="row">
                    {subcategories.length > 0 ? (
                      subcategories.map((subcategory, index) => (
                        <div className="col-12" key={index}>
                          <button
                            onClick={() => handleSubcategoryClick(subcategory.id)}
                            className="btn btn-danger btn-anim fixed-width-btn"
                          >
                            {subcategory.subcat}
                          </button>
                        </div>
                      ))
                    ) : (
                      <p>No subcategories available for this category.</p>
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
              headerColor="darkblue"
              pull="left"
              bodyClass="panel-body"
            >
              <div className="panel panel-default card-view">
                <div className="item-list-container">
                  <div className="row mt-3">
                    {data.length > 0 ? (
                      data.map((item, index) => (
                        <div key={item.id} className="col-lg-3 col-md-4 col-sm-6 col-xs-12 mb-3">
                          <div className="item-card text-center">
                            <img
                              src={`${baseURL}/uploads/${item.filename}`}
                              alt={item.iname}
                              onClick={() => addItemToOrder(index, item)}
                              className="item-image"
                            />
                            <h5 className="item-name">{item.iname}</h5>
                            <p className="item-price">฿ {item.offerprice}.00</p>
                            <p className="item-gst"> {item.tax}%</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p>No items available for this subcategory.</p>
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
            >
              <div className="panel panel-default card-view">
                <div className="row">
                  <div className="col-12">
                    {cart.length > 0 ? (
                      cart.map((item, index) => (
                        <>
                          <div
                            className="order-item d-flex align-items-center justify-content-between mb-2"
                            key={index}
                          >
                            <h5 className="item-name mb-0">
                              {item.iname} x {item.quantity} = 
                              ฿{(item.quantity * item.offerprice).toFixed(2)}
                            </h5>
                            <div className="quantity-controls d-flex align-items-center">
                              <button
                                className="btn btn-dark-custom btn-sm me-2"
                                onClick={() => decreaseItemQuantity(index)}
                              >
                                -
                              </button>
                              <span className="quantity me-2">{item.quantity}</span>
                              <button
                                className="btn btn-dark-custom btn-sm"
                                onClick={() => increaseItemQuantity(index)}
                              >
                                +
                              </button>
                            </div>
                          </div>


                        </>

                      ))
                    ) : (
                      <p>Your cart is empty.</p>
                    )}
                    <div className="total-container mt-3 d-flex justify-content-between align-items-center">
                      <h5>
                        Total:{" "}
                        <span className="total-amount">
                          ฿ {total.toFixed(2)}
                        </span>
                      </h5>
                    </div>
                    <div className="total-container mt-3 d-flex justify-content-between align-items-center">

                      <button className="btn btn-primary" onClick={handlePrintOrder}> <FaPrint className="me-2" />   Send Kot</button>
                      <button className="btn btn-danger" onClick={handleDeleteOrder}> <FaTrash className="me-2" /></button>

                    </div>
                  </div>
                </div>
              </div>
            </CardComponent>
          </div>


        </div>

        {/* New Row for Action Buttons */}
        <div className="row mt-3">
          <div className="col-12">
            <div className="d-flex justify-content-between flex-wrap mx-3">
              {" "}
              {/* Added mx-3 for equal horizontal spacing */}


              <button className="btn btn-warning mb-2"
                onClick={showtableBillDetails}

              >
                Check Bill</button>
              <button className="btn btn-info mb-2">Last Order</button>


              <button className="btn btn-darkblue mb-2">Previous Order</button>
              <button  onClick={handleBillHistory}className="btn btn-success mt-2 custom-btn" >
                Bill History
              </button>
              {/* <button className="btn btn-warning mb-2">Save Bill</button> */}

              <button onClick={refreshTables} className="btn btn-primary mb-2">Refresh Tables</button>
            </div>
          </div>
        </div>
 


      </Layout>
      <CheckBillModal
          isOpen={tableshowModal}
          customer={selectedContract}
          uptableList={Tablelist}
          // onItemAdded={triggerReload} // Pass the reload function
          onClose={() => settableShowModal(false)} // Close the modal
        />
    </>
  );
}
