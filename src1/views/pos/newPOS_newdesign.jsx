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
import { FaPrint, FaTrash } from 'react-icons/fa';
import './newPOS.css';
import { Textfield } from "../../components/Buttons/Textfield";
import getMax from "../../functions/getMax";
import getRunningTable from "../../functions/getRunningTable";
import { getUserName } from "../../functions/storageUtils";
import updateData from "../../functions/updateData";
import CheckBillModal from "../../components/Modals/CheckBillModal";

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
  // Enhanced toast notifications with better UX
  const showSuccessToast = (message) => {
    toast.success(message, {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
    });
  };

  const showErrorToast = (message) => {
    toast.error(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
    });
  };

  // Handle table selection with enhanced feedback
  const handleTableClick = (tableNumber) => {
    setSelectedTable(tableNumber);
    showSuccessToast(`Table ${tableNumber} selected! 🪑`);
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
// Enhanced add item to order function with better UX
const addItemToOrder = (index, item) => {
  if (!selectedTable) {
    showErrorToast('Please select a table first! 🪑');
    return;
  }

  const isWeightBased = item.weight === "weight";
  let qty = 1;

  if (isWeightBased) {
    const input = prompt("Enter weight in grams (e.g. 150, 250, 500, 1000):", "250");
    const grams = parseFloat(input);

    if (isNaN(grams) || grams <= 0) {
      showErrorToast("Invalid weight entered! Please try again.");
      return;
    }

    qty = grams / 1000; // Convert grams to kg
  }

  const existingItemIndex = cart.findIndex(cartItem => cartItem.id === item.id);
  const updatedCart = [...cart];

  if (existingItemIndex !== -1) {
    updatedCart[existingItemIndex].quantity += qty;
    showSuccessToast(`${item.iname} quantity updated! 📦`);
  } else {
    updatedCart.push({
      ...item,
      quantity: qty,
      uom: item.uom || "",
      subtotal: item.offerprice,
      tax: item.tax || 0,
      tax_amount: (((item.tax || 0)) * item.offerprice / 100).toFixed(2),
    });
    showSuccessToast(`${item.iname} added to cart! 🛒`);
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

  // Enhanced delete order function
  const handleDeleteOrder = async () => {
    if (cart.length === 0) {
      showErrorToast('Cart is already empty! 🛒');
      return;
    }

    // Show confirmation dialog
    const confirmDelete = window.confirm('Are you sure you want to clear all items from the cart?');
    if (!confirmDelete) {
      return;
    }

    setCart([]);
    setTotal(0);
    showSuccessToast('Cart cleared successfully! 🧹');
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

  
  // Function to handle printing the order with enhanced UX
  const handlePrintOrder = async () => {
    if (!selectedTable) {
      showErrorToast('Please select a table first! 🪑');
      return;
    }

    if (cart.length === 0) {
      showErrorToast('Your cart is empty! Add some items first. 🛒');
      return;
    }

    try {
      // Show loading toast
      toast.info('Processing your order... ⏳', {
        position: "top-right",
        autoClose: false,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: false,
        draggable: false,
        progress: undefined,
        theme: "colored",
        toastId: "processing-order"
      });

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
        item_name: item.iname,
        quantity: item.quantity,
        price: item.offerprice,
        total_amount: item.offerprice * item.quantity,
        status: "1"
      }));

      const response1 = await axios.post(`/insertdatabulk/order_items`, {
        items: orderItems
      },
        getHeaders()
      );

      await updateData(
        "tablelist",
        { status: '1' },
        { name: selectedTable }
      );
      await fetchData("tablelist", setTotaltablelist, "id", {});
      await getMax("orders", setmaxNumber, "userid", getUserName(), "order_number");

      // Dismiss loading toast
      toast.dismiss("processing-order");

      if (response1.data.success) {
        showSuccessToast(`Order sent to kitchen! 🍳 KOT for Table ${selectedTable}`);
        setOrderNumber((prevOrder) => prevOrder + 1);
        printKOT(orderItems);
        setCart([]);
        setTotal(0);
        
        // Add a celebration effect
        setTimeout(() => {
          showSuccessToast('Order successfully processed! 🎉');
        }, 1000);
      } else {
        showErrorToast("Failed to save the order! Please try again.");
      }
    } catch (error) {
      toast.dismiss("processing-order");
      console.error('Error saving order:', error);
      showErrorToast('Error processing order! Please check your connection.');
    }
  };
  const refreshTables = (event) => {
    fetchData("tablelist", setTotaltablelist, "id", {});
  };

  // Function to get table image based on table status or number
  const getTableImage = (table) => {
    // You can customize this logic based on your requirements
    if (table.status === 0) {
      return `${process.env.REACT_APP_IMAGE_BASE_URL}/dist/img/tables/table.png`; // Available table
    } else {
      return `${process.env.REACT_APP_IMAGE_BASE_URL}/dist/img/tables/table-occupied.png`; // Occupied table (if you have different images)
    }
    // Or use different images for different table numbers:
    // return `${process.env.REACT_APP_IMAGE_BASE_URL}/dist/img/tables/table-${table.name}.png`;
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
        <div className="pos-container pos-background">
          <Header title="🍽️ Restaurant POS System" />
          <ToastContainer 
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />

          {/* Enhanced Tables Section */}
          <div className="container-fluid">
            <div className="row mb-4">
              <div className="col-12">
                <div className="pos-card">
                  <div className="section-header">
                    <h3 className="section-title">
                      <i className="fas fa-chair me-2 icon-chair"></i>
                      Select Table
                    </h3>
                    <div className="d-flex align-items-center gap-3">
                      <div className="d-flex align-items-center">
                        <div className="status-indicator available"></div>
                        <span className="status-available">Available</span>
                      </div>
                      <div className="d-flex align-items-center">
                        <div className="status-indicator occupied"></div>
                        <span className="status-occupied">Occupied</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="row justify-content-center">
                    {TotalTablelist.length > 0 ? (
                      TotalTablelist.map((table, index) => (
                        <div
                          key={index}
                          onClick={() => handleTableClick(table.name)}
                          className="col-lg-2 col-md-3 col-sm-4 col-6 mb-3 table-card-container"
                        >
                          <div className={`table-card ${
                            selectedTable === table.name 
                              ? 'selected-table' 
                              : table.status === 0 
                                ? 'available' 
                                : 'occupied'
                          }`}>
                            <div className="table-image">
                              <img 
                                src={getTableImage(table)}
                                alt={`Table ${table.name}`}
                                onError={(e) => {
                                  // Fallback to default table image if specific image fails
                                  e.target.src = `${process.env.REACT_APP_IMAGE_BASE_URL}/dist/img/tables/table.png`;
                                  e.target.onerror = () => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'block';
                                  };
                                }}
                              />
                              <div className="table-icon-fallback" style={{ display: 'none' }}>
                                🪑
                              </div>
                            </div>
                            <h6 className="table-name">
                              {table.name}
                            </h6>
                            <span className="table-status">
                              {table.status === 0 ? "Available" : "Occupied"}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-12 text-center">
                        <div className="loading-container">
                          <i className="fas fa-spinner fa-spin fa-2x mb-3"></i>
                          <p className="loading-text">Loading tables...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Categories - More Prominent */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="pos-card-compact">
                  <div className="section-header">
                    <h4 className="section-title">
                      <i className="fas fa-layer-group me-2 icon-layer-group"></i>
                      Categories
                    </h4>
                    <div className="badge categories">
                      {categories.length} Categories
                    </div>
                  </div>
                  
                  <div className="categories-scroll-container">
                    {categories.length > 0 ? (
                      categories.map((category, index) => (
                        <button
                          key={index}
                          onClick={() => handleCategoryClick(category.id)}
                          className={`category-button ${selectedCategory === category.id ? 'selected' : 'default'}`}
                        >
                          {selectedCategory === category.id && (
                            <div className="category-check">
                              <i className="fas fa-check"></i>
                            </div>
                          )}
                          {category.name}
                        </button>
                      ))
                    ) : (
                      <div className="loading-spinner">
                        <i className="fas fa-spinner fa-spin"></i>
                        <span>Loading categories...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Subcategories - More Visible */}
            {subcategories.length > 0 && (
              <div className="row mb-4">
                <div className="col-12">
                  <div className="pos-card-compact">
                    <div className="section-header">
                      <h4 className="section-title medium">
                        <i className="fas fa-list me-2" style={{ color: '#e74c3c' }}></i>
                        Subcategories
                      </h4>
                      <div className="badge subcategories">
                        {subcategories.length} Items
                      </div>
                    </div>
                    
                    <div className="subcategories-scroll-container">
                      {subcategories.map((subcategory, index) => (
                        <button
                          key={index}
                          onClick={() => handleSubcategoryClick(subcategory.id)}
                          className="subcategory-button"
                        >
                          {subcategory.subcat}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Main Content Area - Maximized Space */}
            <div className="row">
              {/* Items Grid - Maximum Space Allocation */}
              <div className="col-lg-10 col-md-9 col-sm-12 mb-4">
                <div className="pos-card">
                  <div className="items-header">
                    <h4 className="section-title large">
                      <i className="fas fa-hamburger me-2" style={{ color: '#f39c12' }}></i>
                      Menu Items
                    </h4>
                    <div className="items-badges">
                      {selectedTable && (
                        <span className="badge table-selected">
                          Table: {selectedTable}
                        </span>
                      )}
                      <span className="badge items">
                        {data.length} Items
                      </span>
                    </div>
                  </div>
                  
                  <div className="menu-items-scroll-container">
                    <div className="row menu-items-grid">
                      {data.length > 0 ? (
                        data.map((item, index) => (
                          <div key={item.id} className="col-xxl-2 col-xl-3 col-lg-4 col-md-6 col-sm-6 col-12 mb-3">
                            <div
                              onClick={() => addItemToOrder(index, item)}
                              className="menu-item-card"
                            >
                              {/* Tax Badge */}
                              <div className="menu-item-tax-badge">
                                {item.tax}% Tax
                              </div>
                              
                              {/* Large Image Container */}
                              <div className="menu-item-image">
                                <img
                                  src={`${baseURL}/uploads/${item.filename}`}
                                  alt={item.iname}
                                />
                                
                                {/* Overlapping Text Container */}
                                <div className="menu-item-overlay">
                                  <h6 className="menu-item-name">
                                    {item.iname}
                                  </h6>
                                  
                                  <div className="menu-item-price">
                                    ฿{item.offerprice}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-12 text-center">
                          <div className="empty-state">
                            <i className="fas fa-utensils fa-5x mb-4 icon-utensils"></i>
                            <h4 className="empty-state-title">No Items Available</h4>
                            <p className="empty-state-description">
                              {!selectedCategory ? 'Select a category to view items' : 'Select a subcategory to view items'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Order Summary - More Compact */}
              <div className="col-lg-2 col-md-3 col-sm-12 mb-4">
                <div className="order-summary-container">
                  <div className="order-summary-header">
                    <h4 className="order-summary-title">
                      <i className="fas fa-shopping-cart me-2 icon-cart"></i>
                      Cart
                    </h4>
                    <div className={`table-badge ${selectedTable ? 'selected' : 'no-table'}`}>
                      {selectedTable || 'No Table'}
                    </div>
                  </div>
                  
                  <div className="cart-items-container">
                    {cart.length > 0 ? (
                      cart.map((item, index) => (
                        <div key={index} className="cart-item">
                          <div className="cart-item-header">
                            <h6 className="cart-item-name">
                              {item.iname}
                            </h6>
                            <span className="cart-item-total">
                              ฿{(item.quantity * item.offerprice).toFixed(2)}
                            </span>
                          </div>
                          
                          <div className="cart-item-controls">
                            <div className="quantity-controls">
                              <button
                                onClick={() => decreaseItemQuantity(index)}
                                className="quantity-button decrease"
                              >
                                -
                              </button>
                              <span className="quantity-display">
                                {formatQuantity(item)}
                              </span>
                              <button
                                onClick={() => increaseItemQuantity(index)}
                                className="quantity-button increase"
                              >
                                +
                              </button>
                            </div>
                            
                            <span className="cart-item-price">
                              ฿{item.offerprice} each
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="empty-cart">
                        <i className="fas fa-shopping-cart fa-2x mb-2 icon-cart-empty"></i>
                        <p className="empty-cart-text">Cart is empty</p>
                        <p className="empty-cart-subtext">Add items to order</p>
                      </div>
                    )}
                  </div>
                  
                  {cart.length > 0 && (
                    <>
                      <div style={{
                        background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
                        color: 'white',
                        padding: '12px',
                        borderRadius: '10px',
                        marginBottom: '15px',
                        textAlign: 'center'
                      }}>
                        <h4 style={{
                          margin: 0,
                          fontSize: '1.1rem',
                          fontWeight: '700'
                        }}>
                          Total: ฿{total.toFixed(2)}
                        </h4>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        gap: '8px'
                      }}>
                        <button
                          onClick={handlePrintOrder}
                          style={{
                            flex: 1,
                            padding: '10px',
                            background: 'linear-gradient(135deg, #27ae60 0%, #219a52 100%)',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 6px 20px rgba(39, 174, 96, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = 'none';
                          }}
                        >
                          <FaPrint />
                          Send KOT
                        </button>
                        
                        <button
                          onClick={handleDeleteOrder}
                          style={{
                            padding: '10px',
                            background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '40px'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 6px 20px rgba(231, 76, 60, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = 'none';
                          }}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Action Buttons */}
            <div className="row">
              <div className="col-12">
                <div style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  
                  padding: '25px',
                  boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  <div className="row g-3">
                    <div className="col-lg-2 col-md-4 col-sm-6">
                      <button
                        onClick={showtableBillDetails}
                        style={{
                          width: '100%',
                          padding: '15px',
                          background: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
                          border: 'none',
                          borderRadius: '12px',
                          color: 'white',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-3px)';
                          e.target.style.boxShadow = '0 8px 25px rgba(243, 156, 18, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        <i className="fas fa-receipt"></i>
                        Check Bill
                      </button>
                    </div>
                    
                    <div className="col-lg-2 col-md-4 col-sm-6">
                      <button
                        style={{
                          width: '100%',
                          padding: '15px',
                          background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                          border: 'none',
                          borderRadius: '12px',
                          color: 'white',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-3px)';
                          e.target.style.boxShadow = '0 8px 25px rgba(52, 152, 219, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        <i className="fas fa-history"></i>
                        Last Order
                      </button>
                    </div>
                    
                    <div className="col-lg-2 col-md-4 col-sm-6">
                      <button
                        style={{
                          width: '100%',
                          padding: '15px',
                          background: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)',
                          border: 'none',
                          borderRadius: '12px',
                          color: 'white',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-3px)';
                          e.target.style.boxShadow = '0 8px 25px rgba(155, 89, 182, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        <i className="fas fa-arrow-left"></i>
                        Previous Order
                      </button>
                    </div>
                    
                    <div className="col-lg-2 col-md-4 col-sm-6">
                      <button
                        onClick={handleBillHistory}
                        style={{
                          width: '100%',
                          padding: '15px',
                          background: 'linear-gradient(135deg, #27ae60 0%, #219a52 100%)',
                          border: 'none',
                          borderRadius: '12px',
                          color: 'white',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-3px)';
                          e.target.style.boxShadow = '0 8px 25px rgba(39, 174, 96, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        <i className="fas fa-file-invoice-dollar"></i>
                        Bill History
                      </button>
                    </div>
                    
                    <div className="col-lg-2 col-md-4 col-sm-6">
                      <button
                        onClick={refreshTables}
                        style={{
                          width: '100%',
                          padding: '15px',
                          background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                          border: 'none',
                          borderRadius: '12px',
                          color: 'white',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-3px)';
                          e.target.style.boxShadow = '0 8px 25px rgba(231, 76, 60, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        <i className="fas fa-sync-alt"></i>
                        Refresh Tables
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Floating Action Button */}
        {selectedTable && cart.length > 0 && (
          <div className="floating-action">
            <button
              onClick={handlePrintOrder}
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #27ae60 0%, #219a52 100%)',
                border: 'none',
                color: 'white',
                fontSize: '1.5rem',
                cursor: 'pointer',
                boxShadow: '0 8px 25px rgba(39, 174, 96, 0.4)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.1)';
                e.target.style.boxShadow = '0 12px 35px rgba(39, 174, 96, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = '0 8px 25px rgba(39, 174, 96, 0.4)';
              }}
            >
              <FaPrint />
            </button>
          </div>
        )}
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
