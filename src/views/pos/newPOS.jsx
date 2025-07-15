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
import CheckBillModal from "../../components/Modals/CheckBillModal";
import { FaEdit, FaTrash, FaPrint } from "react-icons/fa";


//const itemPrices = Array.from({ length: 9 }, (_, index) => 100 + index * 50);
export default function NewPOS() {
  // const baseURL = 'http://localhost:4402';
  
 //  const baseURL = 'https://www.sharmachefapi.cloudnetsoftwares.com';
  const baseURL = 'https://www.chefmateapi.cloudnetsoftwares.com';
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
     // console.log(response1);
      setData(response1);
    } catch (error) {
      console.error("Error fetching items for subcategory:", error);
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
console.log("weight:"+item.weight);
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
    });
  }

  setCart(updatedCart);
  updateTotal(updatedCart);
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
  return item.quantity_type === "weight"
    ? `${(item.quantity * 1000).toFixed(0)}g`
    : `${item.quantity}`;
};
  // Update total price
  const updateTotal = (cart) => {
    const newTotal = cart.reduce(
      (acc, item) => acc + item.quantity * item.offerprice,
      0
    );
    setTotal(newTotal);
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
        order_number: maxNumber,
        table_number: selectedTable,
        item_name: item.iname,     // Assuming each item has a name property
        quantity: item.quantity,    // Quantity of the item
        price: item.offerprice,      // Price per unit
        total_amount: item.offerprice * item.quantity, // Total for this item
        status: "1" //running table status
      }));
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
        <Header title="POS System " />
        <ToastContainer />

        <div className="row mt-2">
          <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
            <CardComponent
              title="View All Tables List"
              headerColor="darkblue"
              pull="left"
              bodyClass="panel-body"
            >
              <div className="panel panel-default card-view" style={{ padding: '5px' }}>
                <div className="row justify-content-center" style={{ margin: '0' }}>
                  {TotalTablelist.length > 0 ? (
                    TotalTablelist.map((table, index) => (
                      <div
                        key={index}
                        onClick={() => handleTableClick(table.name)}
                        className="col-lg-1 col-md-2 col-sm-3 col-4 mb-2"
                        style={{
                          cursor: "pointer",
                          transition: "transform 0.2s, box-shadow 0.2s",
                          padding: '3px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "scale(1.05)";
                          e.currentTarget.style.boxShadow = "0px 4px 10px rgba(0, 0, 0, 0.15)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "scale(1)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <div
                          className="table-card p-2 text-center rounded"
                          style={{
                            backgroundColor: table.status === 0 ? "#28a745" : "#dc3545",
                            color: "white",
                            border: "1px solid white",
                            minHeight: '70px'
                          }}
                        >
                          <img
                            src={`../../dist/img/tables/table.png`}
                            alt={`Table ${index + 1}`}
                            className="img-fluid mb-1"
                            style={{ width: "30px", height: "30px" }}
                          />
                          <h6
                            style={{
                              fontWeight: "bold",
                              textTransform: "uppercase",
                              margin: "0",
                              fontSize: "0.7rem",
                            }}
                          >
                            {table.name}
                          </h6>
                          <span
                            style={{
                              fontSize: "0.6rem",
                              fontWeight: "400",
                              marginTop: "2px",
                              display: "block",
                            }}
                          >
                            {table.status === 0 ? "Available" : "Occupied"}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted" style={{ fontSize: "1rem", padding: '20px' }}>
                      Loading tables...
                    </p>
                  )}
                </div>

              </div>
            </CardComponent>
          </div>
        </div>

        {/* Main Category List */}
        <div className="row mt-2">
          <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
            <CardComponent
              title="Choose Category"
              headerColor="darkblue"
              pull="left"
              bodyClass="panel-body"
            >
              <div className="panel panel-default card-view" style={{ padding: '5px' }}>
                <div className="row" style={{ margin: '0' }}>
                  {categories.length > 0 ? (
                    categories.map((category, index) => (
                      <div className="col-2 col-md-2 col-sm-6 col-xs-12" key={index} style={{ padding: '2px' }}>
                        <button
                          className="btn btn-primary category-btn"
                          onClick={() => handleCategoryClick(category.id)}
                          style={{ 
                            width: '100%', 
                            padding: '8px 4px', 
                            fontSize: '12px', 
                            margin: '2px 0',
                            minHeight: '35px'
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
              headerColor="danger"
              pull="left"
              bodyClass="panel-body"
            >
              <div className="panel panel-default card-view" style={{ padding: '5px' }}>
                  <div className="item-list-container" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
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
                              minHeight: '30px'
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
              headerColor="darkblue"
              pull="left"
              bodyClass="panel-body"
            >
              <div className="panel panel-default card-view" style={{ padding: '5px' }}>
                <div className="item-list-container">
                  <div className="row mt-2" style={{ margin: '0' }}>
                    {data.length > 0 ? (
                      data.map((item, index) => (
                        <div key={item.id} className="col-lg-3 col-md-4 col-sm-6 col-xs-12 mb-2" style={{ padding: '5px' }}>
                          <div className="item-card text-center" style={{ padding: '8px' }}>
                            <img
                              src={`${baseURL}/uploads/${item.filename}`}
                              alt={item.iname}
                              onClick={() => addItemToOrder(index, item)}
                              className="item-image"
                              style={{ marginBottom: '5px' }}
                            />
                            <h5 className="item-name" style={{ fontSize: '13px', margin: '3px 0' }}>{item.iname}</h5>
                            <p className="item-price" style={{ fontSize: '12px', margin: '2px 0' }}>฿ {item.offerprice}.00</p>
                            <p className="item-gst" style={{ fontSize: '11px', margin: '2px 0' }}> {item.tax}%</p>
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
            >
              <div className="panel panel-default card-view" style={{ padding: '5px' }}>
                <div className="row" style={{ margin: '0' }}>
                  <div className="col-12">
                    {cart.length > 0 ? (
                      cart.map((item, index) => (
                        <>
                          <div
                            className="order-item d-flex align-items-center justify-content-between mb-1"
                            key={index}
                            style={{ padding: '3px 0' }}
                          >
                            <h5 className="item-name mb-0" style={{ fontSize: '12px' }}>
                              {item.iname} x {formatQuantity(item)} = ฿ {(item.quantity * item.offerprice).toFixed(2)}
                            </h5>
                            <div className="quantity-controls d-flex align-items-center">
                              <button
                                className="btn btn-dark-custom btn-sm me-1"
                                onClick={() => decreaseItemQuantity(index)}
                                style={{ padding: '2px 6px', fontSize: '10px' }}
                              >
                                -
                              </button>
                              <span className="quantity me-1" style={{ fontSize: '11px' }}>{item.quantity}</span>
                              <button
                                className="btn btn-dark-custom btn-sm"
                                onClick={() => increaseItemQuantity(index)}
                                style={{ padding: '2px 6px', fontSize: '10px' }}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </>
                      ))
                    ) : (
                      <p style={{ fontSize: '12px', padding: '10px' }}>Your cart is empty.</p>
                    )}
                    <div className="total-container mt-2 d-flex justify-content-between align-items-center">
                      <h5 style={{ fontSize: '14px' }}>
                        Total:{" "}
                        <span className="total-amount">
                          ฿ {total.toFixed(2)}
                        </span>
                      </h5>
                    </div>
                    <div className="total-container mt-2 d-flex justify-content-between align-items-center">
                      <button 
                        className="btn btn-primary" 
                        onClick={handlePrintOrder}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      > 
                        <FaPrint className="me-1" />Send Kot
                      </button>
                      <button 
                        className="btn btn-danger" 
                        onClick={handleDeleteOrder}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      > 
                        <FaTrash className="me-1" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </CardComponent>
          </div>


        </div>

        {/* New Row for Action Buttons */}
        <div className="row mt-2">
          <div className="col-12">
            <div className="d-flex justify-content-between flex-wrap" style={{ padding: '0 15px' }}>
              <button 
                className="btn btn-warning mb-1"
                onClick={showtableBillDetails}
                style={{ padding: '6px 12px', fontSize: '12px', margin: '2px' }}
              >
                Check Bill
              </button>
              <button 
                className="btn btn-info mb-1"
                style={{ padding: '6px 12px', fontSize: '12px', margin: '2px' }}
              >
                Last Order
              </button>
              <button 
                className="btn btn-darkblue mb-1"
                style={{ padding: '6px 12px', fontSize: '12px', margin: '2px' }}
              >
                Previous Order
              </button>
              <button  
                onClick={handleBillHistory}
                className="btn btn-success mb-1 custom-btn"
                style={{ padding: '6px 12px', fontSize: '12px', margin: '2px' }}
              >
                Bill History
              </button>
              <button 
                onClick={refreshTables} 
                className="btn btn-primary mb-1"
                style={{ padding: '6px 12px', fontSize: '12px', margin: '2px' }}
              >
                Refresh Tables
              </button>
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
