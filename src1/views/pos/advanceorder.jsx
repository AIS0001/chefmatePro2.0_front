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
import CheckBillModal from "../../components/Modals/AdvanceOrdercheckBill";
import { FaEdit, FaTrash, FaPrint } from "react-icons/fa";
import "./advanceorder.css";


//const itemPrices = Array.from({ length: 9 }, (_, index) => 100 + index * 50);
export default function AdvanceOrders() {
    // const baseURL = 'http://localhost:4402';
   const baseURL = 'https://sharmachefapi.cloudnetsoftwares.com';
  // const baseURL = 'https://www.chefmateapi.cloudnetsoftwares.com';
  let currentDate = format(new Date(), "yyyy-MM-dd");

  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [maxNumber, setmaxNumber] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
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
    setSelectedSubcategory(null); // Reset selected subcategory
    setData([]); // Clear items when switching categories
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
      await axios.put(baseURL`/advance_orders/${orderId}`, {
        invoice_number: invoiceNumber,
      });

      // Step 2: Update the advance_order_items table associated with this order
      await axios.put(baseURL`/advance_order_items`, {
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
    navigate(`/reports/advancebillhistory`);
  };



  // Fetch items when a subcategory is clicked
  const handleSubcategoryClick = async (subcategoryId) => {
    try {
      setSelectedSubcategory(subcategoryId);
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
        quantity: 1, // Initial quantity set to 1
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
      const response = await axios.post(`/insertdata/advance_orders`, {
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
      const response1 = await axios.post(`/insertdatabulk/advance_order_items`, {
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
      await getMax("advance_orders", setmaxNumber, "userid", getUserName(), "order_number");

        // Step 3: Print KOT after successful save
    if (response1.data.success) {
      toast.success(response.data.message);
      setOrderNumber((prevOrder) => prevOrder + 1);
    
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
        await getMax("advance_orders", setmaxNumber, "userid", getUserName(), "order_number");
        await getRunningTable("advance_orders", settableList);
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
        <Header title="Advance Order System " />
        <ToastContainer />

        <div className="row mt-3">
          <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
            <CardComponent
              title="Tables"
              headerColor="darkblue1"
              pull="left"
              bodyClass="panel-body card-compact"
            >
              <div className="panel panel-default card-view">
                <div className="tables-container-compact">
                  <div className="row">
                    {TotalTablelist.length > 0 ? (
                      TotalTablelist.map((table, index) => (
                        <div
                          key={index}
                          className="col-lg-2 col-md-3 col-sm-4 col-6"
                        >
                          <div
                            onClick={() => handleTableClick(table.name)}
                            className={`table-card-compact ${table.status === 0 ? "available" : "occupied"}`}
                          >
                            <img
                              src={`../../dist/img/tables/table.png`}
                              alt={`Table ${table.name}`}
                              className="table-image"
                            />
                            <div className="table-name">{table.name}</div>
                            <div className="table-status">
                              {table.status === 0 ? "Available" : "Occupied"}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-12 text-center">
                        <p className="text-muted">Loading tables...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardComponent>
          </div>
        </div>

        {/* Categories */}
        <div className="row mt-3">
          <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
            <CardComponent
              title="Categories"
              headerColor="darkblue1"
              pull="left"
              bodyClass="panel-body card-compact"
            >
              <div className="panel panel-default card-view">
                <div className="category-container-compact">
                  <div className="row">
                    {categories.length > 0 ? (
                      categories.map((category, index) => (
                        <div className="col-2 col-md-2 col-sm-6 col-xs-12" key={index}>
                          <button
                            className={`category-btn-compact ${selectedCategory === category.id ? 'active' : ''}`}
                            onClick={() => handleCategoryClick(category.id)}
                          >
                            {category.name}
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="col-12 text-center">
                        <p className="text-muted">Loading categories...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardComponent>
          </div>
        </div>

        {/* Subcategories and Items */}
        <div className="row mt-3">
          <div className="col-lg-2 col-md-3 col-sm-4 col-xs-12">
            <CardComponent
              title="Subcategories"
              headerColor="danger"
              pull="left"
              bodyClass="panel-body card-compact"
            >
              <div className="panel panel-default card-view">
                <div className="subcategory-container-compact">
                  <div className="row">
                    {subcategories.length > 0 ? (
                      subcategories.map((subcategory, index) => (
                        <div className="col-12" key={index}>
                          <button
                            onClick={() => handleSubcategoryClick(subcategory.id)}
                            className={`subcategory-btn-compact ${selectedSubcategory === subcategory.id ? 'active' : ''}`}
                          >
                            {subcategory.subcat}
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="col-12 text-center">
                        <p className="text-muted small">Select a category first</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardComponent>
          </div>

          {/* Items */}
          <div className="col-lg-7 col-md-6 col-sm-8 col-xs-12">
            <CardComponent
              title="Items"
              headerColor="darkblue1"
              pull="left"
              bodyClass="panel-body card-compact"
            >
              <div className="panel panel-default card-view">
                <div className="items-container-compact">
                  <div className="row">
                    {data.length > 0 ? (
                      data.map((item, index) => (
                        <div key={item.id} className="col-lg-3 col-md-4 col-sm-6 col-xs-12">
                          <div
                            className="item-card-compact"
                            onClick={() => addItemToOrder(index, item)}
                          >
                            <img
                              src={`${baseURL}/uploads/${item.filename}`}
                              alt={item.iname}
                              className="item-image"
                            />
                            <div className="item-name">{item.iname}</div>
                            <div className="item-price">฿ {item.offerprice}.00</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-12 text-center">
                        <p className="text-muted">Select a subcategory to view items</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardComponent>
          </div>

          {/* Order Summary */}
          <div className="col-lg-3 col-md-3 col-sm-4 col-xs-12">
            <CardComponent
              title={selectedTable ? `Table: ${selectedTable}` : "Select Table"}
              headerColor="info"
              pull="left"
              bodyClass="panel-body card-compact"
            >
              <div className="panel panel-default card-view">
                <div className="order-summary-container">
                  {cart.length > 0 ? (
                    cart.map((item, index) => (
                      <div className="order-item-compact" key={index}>
                        <div className="item-name">
                          {item.iname} x {item.quantity} = ฿{(item.quantity * item.offerprice).toFixed(2)}
                        </div>
                        <div className="quantity-controls">
                          <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => decreaseItemQuantity(index)}
                          >
                            -
                          </button>
                          <span className="quantity">{item.quantity}</span>
                          <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => increaseItemQuantity(index)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted">
                      <p>Your cart is empty</p>
                    </div>
                  )}
                  
                  <div className="order-total mt-3 pt-3 border-top">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <strong>Total: ฿{total.toFixed(2)}</strong>
                    </div>
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-primary btn-sm flex-grow-1" 
                        onClick={handlePrintOrder}
                        disabled={!selectedTable || cart.length === 0}
                      >
                        <FaPrint className="me-1" />Send KOT
                      </button>
                      <button 
                        className="btn btn-outline-danger btn-sm" 
                        onClick={handleDeleteOrder}
                        disabled={cart.length === 0}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </CardComponent>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="row mt-3">
          <div className="col-12">
            <CardComponent
              title="Actions"
              headerColor="secondary"
              pull="left"
              bodyClass="panel-body card-compact"
            >
              <div className="panel panel-default card-view">
                <div className="action-buttons-compact">
                  <button 
                    className="btn btn-warning"
                    onClick={showtableBillDetails}
                  >
                    Check Bill
                  </button>
                  <button className="btn btn-info">
                    Last Order
                  </button>
                  <button className="btn btn-darkblue1">
                    Previous Order
                  </button>
                  <button 
                    onClick={handleBillHistory}
                    className="btn btn-success"
                  >
                    Bill History
                  </button>
                  <button 
                    onClick={refreshTables} 
                    className="btn btn-primary"
                  >
                    Refresh Tables
                  </button>
                </div>
              </div>
            </CardComponent>
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
