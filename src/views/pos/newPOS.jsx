import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
import { getUserName } from "../../functions/storageUtils";

//const itemPrices = Array.from({ length: 9 }, (_, index) => 100 + index * 50);
export default function NewPOS() {
  const baseURL = 'http://localhost:4402';
  let currentDate = format(new Date(), "yyyy-MM-dd");

  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [maxNumber, setmaxNumber] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);

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
    setSelectedTable(tableNumber); // Update the selected table number
    toast.success(`Selected Table: ${tableNumber}`); // Optional: Notify the user
  };
  
  const updateInvoiceNumber = async (orderId, invoiceNumber) => {
    try {
      // Step 1: Update the orders table
      await axios.put(`http://localhost:4402/orders/${orderId}`, {
        invoice_number: invoiceNumber,
      });

      // Step 2: Update the order_items table associated with this order
      await axios.put(`http://localhost:4402/order_items`, {
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
// Function to handle printing the order
const handlePrintOrder = async () => {
  if (!selectedTable) {
    toast.error('Please select a table!');
    return;
  }
  
  // Existing code for handling order saving...
  try {
    const response = await axios.post(`/insertdata/orders`, {
      userid:getUserName(),
      order_number: maxNumber,
      table_number: selectedTable,
      total_amount: total
    },
    getHeaders()
  );
  await getMax("orders",setmaxNumber,"userid",getUserName(),"order_number");
     // Prepare an array of order items to insert
     const orderItems = cart.map(item => ({
      order_number: maxNumber,
      table_number: selectedTable,
      item_name: item.iname,     // Assuming each item has a name property
      quantity: item.quantity,    // Quantity of the item
      price: item.offerprice,      // Price per unit
      total_amount: item.offerprice * item.quantity // Total for this item
    }));
  const response1 = await axios.post(`/insertdatabulk/order_items`, {
    items: orderItems // Wrap in an object if your API expects this
  },
  getHeaders()
);


    if (response1.data.success) {
      toast.success(response.data.message);
      setOrderNumber(prevOrder => prevOrder + 1);
      setCart([]);
      setTotal(0);
    } else {
      toast.error('Failed to save the order!');
    }
  } catch (error) {
    console.error('Error saving order:', error);
    toast.error('Error saving order!');
  }
};


  useEffect(() => {
    const fetchAndSetData = async () => {
      try {
        await fetchData("categories", setCategories, "id", {});
        await getMax("orders",setmaxNumber,"userid",getUserName(),"order_number");
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

        <div className="row mt-4">
          <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
            <CardComponent
              title="View All Tables List"
              headerColor="darkblue"
              pull="left"
              bodyClass="panel-body"
            >
              <div className="panel panel-default card-view">
                <div className="row">
                  {Array.from({ length: 20 }).map((_, index) => (
                    <div
                      key={index}
                      onClick={() => handleTableClick(index + 1)} // Table click handler
                      className="col-lg-2 col-md-4 col-sm-6 col-12 mb-3"
                    >
                      <div className={`table-card p-3 text-center border w-100 table-color-${index % 4}`}>
                        <img
                          src={`../../dist/img/tables/table.png`}
                          alt={`Table ${index + 1}`}
                          className="img-fluid mb-2"
                          style={{ width: "50px", height: "50px" }}
                        />
                        <h6>Table {index + 1}</h6>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardComponent>
          </div>
        </div>

        {/* Main Category List */}
        <div className="row mt-4">
          <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
            <CardComponent
              title="View All Categories"
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
              title={maxNumber}
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
                        {item.iname} x {item.quantity } = ฿{" "}
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
                      <button className="btn btn-primary" onClick={handlePrintOrder}>Print order</button>
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
              <button className="btn btn-success mb-2" onClick={handlePrintOrder}>Print Order</button>
              <button className="btn btn-warning mb-2">Check Bill</button>
              <button className="btn btn-info mb-2">Last Order</button>
              <button className="btn btn-primary mb-2">Generate Bill</button>
              <button className="btn btn-darkblue mb-2">Save Bill</button>
              <button className="btn btn-danger mb-2">Next Order</button>
              <button className="btn btn-darkblue mb-2">Previous Order</button>
              <button className="btn btn-warning mb-2">Save Bill</button>
              <button className="btn btn-danger mb-2">Next Order</button>
              <button className="btn btn-primary mb-2">Previous Order</button>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
