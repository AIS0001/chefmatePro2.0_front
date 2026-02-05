import React, { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Badge,
  Image,
  Typography,
  InputNumber,
  Modal,
  Divider,
  Space,
  message,
  Affix,
  Empty,
  Tag,
  Spin,
  Avatar,
  Statistic,
  Tooltip,
  Result
} from "antd";
import {
  ShoppingCartOutlined,
  PlusOutlined,
  MinusOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ShoppingOutlined,
  AppstoreOutlined,
  FireOutlined,
  StarFilled,
  HeartOutlined,
  CloseCircleOutlined
} from "@ant-design/icons";
import axios from "axios";
import { format } from "date-fns";
import { getNextSetupDate } from "../../utils/setupDateUtils";
import { baseURL } from "../../index";
import QRCode from "qrcode";
import QRPaymentModal from "../../components/QRPaymentModal";
import { generateKioskInvoiceCanvas, canvasToESCPOS, sendToThermalPrinter, printKioskInvoice, printMultipleTickets } from "../../services/thermalPrinter";
import "./Kiosk.css";

const { Title, Text } = Typography;

export default function Kiosk() {
  const currentDate = format(new Date(), "yyyy-MM-dd");

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [cartVisible, setCartVisible] = useState(false);
  const [confirmOrderModal, setConfirmOrderModal] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [orderNumber, setOrderNumber] = useState(null);
  const [companyInfo, setCompanyInfo] = useState({});
  const [paymentMethodModal, setPaymentMethodModal] = useState(false);
  const [qrCodeModal, setQrCodeModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('QR Code');



  const generateESCPOSBill = async (billId, cartItems, totalAmount, queueNumber, paymentMethod) => {
    try {
      const ESC = '\x1B';
      const GS = '\x1D';
      const INIT = ESC + '@';
      const CENTER = ESC + 'a' + '\x01';
      const LEFT = ESC + 'a' + '\x00';
      const BOLD_ON = ESC + 'E' + '\x01';
      const BOLD_OFF = ESC + 'E' + '\x00';
      const DOUBLE_ON = GS + '!' + '\x11';
      const DOUBLE_OFF = GS + '!' + '\x00';
      const CUT = GS + 'V' + '\x41' + '\x03';
      const NEWLINE = '\n';

      let escposCommand = INIT;

      // Header
      escposCommand += CENTER + BOLD_ON + DOUBLE_ON;
      escposCommand += (companyInfo.name || 'CHEFMATE KIOSK') + NEWLINE;
      escposCommand += DOUBLE_OFF + BOLD_OFF;
      escposCommand += '================================' + NEWLINE;
      escposCommand += BOLD_ON + `INVOICE #${billId}` + BOLD_OFF + '               ' + BOLD_ON + `QUEUE #${queueNumber}` + BOLD_OFF + NEWLINE;
      escposCommand += `Payment: ${paymentMethod}` + NEWLINE;
      escposCommand += `Mode: KIOSK Self-Service` + NEWLINE;
      escposCommand += `Date: ${format(new Date(), 'dd/MM/yyyy HH:mm')}` + NEWLINE;
      escposCommand += '================================' + NEWLINE;

      // Items header
      escposCommand += LEFT;
      escposCommand += BOLD_ON;
      escposCommand += 'Item                    Qty          Amount' + NEWLINE;
      escposCommand += BOLD_OFF;
      escposCommand += '-----------------------------------------------' + NEWLINE;

      // Items
      cartItems.forEach(item => {
        const itemName = item.iname.substring(0, 20).padEnd(20);
        const qty = formatQuantityForDisplay(item).toString().padStart(3);
        const amount = `${(item.quantity * item.offerprice).toFixed(2)}`.padStart(8);
        escposCommand += `${itemName}    ${qty}         ${amount}` + NEWLINE;
      });

      // Total section
      escposCommand += '===============================================' + NEWLINE;
      escposCommand += BOLD_ON + DOUBLE_ON;
      escposCommand += CENTER;
      escposCommand += `TOTAL: THB ${totalAmount.toFixed(2)}` + NEWLINE;
      escposCommand += DOUBLE_OFF + BOLD_OFF;
      escposCommand += '===============================================' + NEWLINE;
      escposCommand += NEWLINE;
      escposCommand += CENTER;
      escposCommand += 'Thank You!' + NEWLINE;
      escposCommand += 'Please Come Again' + NEWLINE;
      escposCommand += NEWLINE + NEWLINE + NEWLINE;

      // Cut paper
      escposCommand += CUT;

      // Convert ESC/POS command to base64 (handle Unicode/UTF-8 characters)
      const utf8String = unescape(encodeURIComponent(escposCommand));
      const base64Data = btoa(utf8String);

      console.log('📄 Sending ESC/POS bill to ThermalAgent printer...');
      console.log('Bill ID:', billId);
      console.log('Total Amount:', totalAmount);
      
      // Send to ThermalAgent print server
      try {
        const response = await axios.post('http://localhost:6001/print', {
          data: base64Data
        });
        
        if (response.data.success) {
          console.log('✅ Print successful:', response.data.message);
          message.success('Bill printed successfully!');
        } else {
          throw new Error(response.data.error || 'Print failed');
        }
      } catch (printError) {
        console.error('❌ Print server error:', printError.message);
        
        // Fallback: Download as text file
        const blob = new Blob([escposCommand], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bill_${billId}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        
        message.warning('Printer not available. Bill downloaded as file.');
      }

      return escposCommand;
    } catch (error) {
      console.error('Error generating ESC/POS bill:', error);
      message.error('Error generating bill');
      return null;
    }
  };

  useEffect(() => {
    const enableContextMenu = (event) => {
      event.stopPropagation();
    };

    document.addEventListener("contextmenu", enableContextMenu);
    fetchCompanyInfo();
    fetchCategories();

    return () => {
      document.removeEventListener("contextmenu", enableContextMenu);
    };
  }, []);

  useEffect(() => {
    const newTotal = cart.reduce((sum, item) => sum + item.quantity * item.offerprice, 0);
    setTotal(newTotal);
  }, [cart]);

  const fetchCompanyInfo = async () => {
    try {
      const url = `/kiosk/companyinfo`;
      console.log('[API CALL] Company Info - Full URL:', axios.defaults.baseURL + url);
      const response = await axios.get(url);
      console.log('[API RESPONSE] Company Info:', response.data);
      const responseData = response.data.data || response.data;
      const info = Array.isArray(responseData) ? responseData[0] : responseData;
      setCompanyInfo(info || {});
    } catch (error) {
      console.error('[API ERROR] Company Info:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const url = `/kiosk/categories`;
      console.log('[API CALL] Categories - Full URL:', axios.defaults.baseURL + url);
      const response = await axios.get(url);
      console.log('[API RESPONSE] Categories:', response.data);
      const categoriesData = response.data.data || response.data;
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error('[API ERROR] Categories:', error);
      console.error('[API ERROR] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = async (categoryId, categoryName) => {
    setSelectedCategory({ id: categoryId, name: categoryName });
    setSelectedSubcategory(null);
    setItems([]);
    try {
      setLoading(true);
      const url = `/kiosk/categories/${categoryId}/subcategories`;
      console.log('[API CALL] Subcategories:', url);
      const response = await axios.get(url);
      const subcategoriesData = response.data.data || response.data;
      setSubcategories(Array.isArray(subcategoriesData) ? subcategoriesData : []);
    } catch (error) {
      console.error('[API ERROR] Subcategories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubcategoryClick = async (subcategoryId, subcategoryName) => {
    if (!selectedCategory) return;
    setSelectedSubcategory({ id: subcategoryId, name: subcategoryName });
    try {
      setLoading(true);
      const params = {
        catid: selectedCategory.id,
        subcatid: subcategoryId,
        status: "active"
      };
      const url = `/kiosk/items?catid=${params.catid}&subcatid=${params.subcatid}&status=${params.status}`;
      console.log('[API CALL] Items:', axios.defaults.baseURL + url);
      const response = await axios.get(`/kiosk/items`, { params });
      const itemsData = response.data.data || response.data;
      setItems(Array.isArray(itemsData) ? itemsData : []);
    } catch (error) {
      console.error('[API ERROR] Items:', error);
    } finally {
      setLoading(false);
    }
  };

  const flyToCart = (event) => {
    // Get the clicked element's position
    const clickedElement = event.currentTarget;
    const imgElement = clickedElement.querySelector('img') || clickedElement;
    const rect = imgElement.getBoundingClientRect();
    
    // Target the "View Cart" button specifically
    const cartButton = 
      document.getElementById('view-cart-button') || 
      document.querySelector('.view-cart-button') ||
      document.querySelector('[class*="floating-cart"]');
    
    if (!cartButton) {
      console.warn('View Cart button not found for animation');
      return;
    }
    
    const cartRect = cartButton.getBoundingClientRect();
    
    // Create flying item clone with product image
    const flyingItem = document.createElement('div');
    flyingItem.className = 'flying-item';
    flyingItem.style.width = '100px';
    flyingItem.style.height = '100px';
    flyingItem.style.left = `${rect.left + rect.width / 2 - 50}px`;
    flyingItem.style.top = `${rect.top + rect.height / 2 - 50}px`;
    flyingItem.style.backgroundImage = `url(${imgElement.src})`;
    flyingItem.style.backgroundSize = 'cover';
    flyingItem.style.backgroundPosition = 'center';
    flyingItem.style.backgroundColor = '#fff';
    
    document.body.appendChild(flyingItem);
    
    // Calculate parabolic trajectory to "View Cart" button
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;
    const endX = cartRect.left + cartRect.width / 2;
    const endY = cartRect.top + cartRect.height / 2;
    
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    
    // Use CSS transition for smooth parabolic curve flying to View Cart button
    requestAnimationFrame(() => {
      flyingItem.style.transition = 'all 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      flyingItem.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.1) rotate(720deg)`;
    });
    
    // Add pulse effect to View Cart button
    cartButton.style.transition = 'transform 0.3s ease';
    cartButton.style.transform = 'scale(1.1)';
    setTimeout(() => {
      cartButton.style.transform = 'scale(1)';
    }, 300);
    
    // Remove element after animation completes
    setTimeout(() => {
      flyingItem.remove();
    }, 1000);
  };

  const addItemToCart = (item, event) => {
    // Trigger fly animation if event is provided
    if (event) {
      flyToCart(event);
    }
    
    const existingItemIndex = cart.findIndex(cartItem => cartItem.id === item.id);
    const updatedCart = [...cart];

    if (existingItemIndex !== -1) {
      updatedCart[existingItemIndex].quantity += 1;
    } else {
      updatedCart.push({
        ...item,
        quantity: 1,
        uom: item.uom || "",
        subtotal: item.offerprice,
        tax: item.tax || 0,
        tax_amount: (((item.tax || 0)) * item.offerprice / 100).toFixed(2),
        category_id: selectedCategory?.id,
        category_name: selectedCategory?.name,
        subcategory_id: selectedSubcategory?.id
      });
    }

    setCart(updatedCart);
    message.success(`${item.iname} added to cart!`);
  };

  const increaseQuantity = (index) => {
    const updatedCart = [...cart];
    updatedCart[index].quantity += 1;
    setCart(updatedCart);
  };

  const decreaseQuantity = (index) => {
    const updatedCart = [...cart];
    if (updatedCart[index].quantity > 1) {
      updatedCart[index].quantity -= 1;
    } else {
      updatedCart.splice(index, 1);
    }
    setCart(updatedCart);
  };

  const removeFromCart = (index) => {
    const updatedCart = [...cart];
    updatedCart.splice(index, 1);
    setCart(updatedCart);
  };

  const clearCart = () => {
    Modal.confirm({
      title: "Clear Cart",
      content: "Are you sure you want to clear all items from cart?",
      okText: "Yes",
      cancelText: "No",
      onOk: () => {
        setCart([]);
        message.success("Cart cleared");
      }
    });
  };

  const handlePlaceOrder = () => {
    if (cart.length === 0) {
      message.warning("Your cart is empty!");
      return;
    }
    setPaymentMethodModal(true);
  };

  const handlePaymentMethodSelect = async (method) => {
    setPaymentMethodModal(false);
    
    if (method === 'qr') {
      setSelectedPaymentMethod('QR Code');
      setQrCodeModal(true);
    } else if (method === 'card') {
      setSelectedPaymentMethod('Card');
      // Show card payment flow
      setConfirmOrderModal(true);
    }
  };

  const handleQRPaymentSuccess = async (continueAnyway = false) => {
    // This is called from QRPaymentModal when payment is successful or Continue Anyway is clicked
    if (continueAnyway) {
      // Handle Continue Anyway flow
      await handleContinueAnywaySaveBill();
    } else {
      // Handle successful payment verification
      await completeOrder();
    }
  };

  const handleContinueAnywaySaveBill = async () => {
    console.log('🚀 Continue anyway clicked - saving bill via API');
    
    try {
      setPaymentLoading(true);
      
      // Calculate totals for the bill
      const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.offerprice), 0);
      const taxAmount = cart.reduce((sum, item) => {
        const itemTotal = item.quantity * item.offerprice;
        const vat = parseFloat(item.vat) || 0;
        return sum + (itemTotal * vat) / 100;
      }, 0);
      const grandTotal = subtotal + taxAmount;
      
      // Prepare bill data
      const billData = {
        customer_id: 'KIOSK',
        tablenumber: 'KIOSK Self-Service',
        subtotal: subtotal,
        subtotal_afterdiscount: subtotal,
        tax: taxAmount,
        discount_type: 'fixed',
        discount_value: 0,
        round_off: 0,
        grand_total: grandTotal,
        payment_mode: selectedPaymentMethod,
        status: 1,
        setup_date: format(new Date(), 'yyyy-MM-dd')
      };
      
      console.log('Saving bill with data:', billData);
      
      // Call savebill API
      const response = await axios.post('/public/savebill', billData);
      
      if (response.data.success) {
        const billId = response.data.bill_id;
        const queueNumber = response.data.queue_number;
        console.log('✅ Bill saved successfully! Bill ID:', billId, 'Queue Number:', queueNumber);
        
        // Close modals immediately
        setQrCodeModal(false);
        setPaymentMethodModal(false);
        setCartVisible(false);
        setPaymentLoading(false);
        
        // Show success modal with queue number IMMEDIATELY
        setOrderNumber(queueNumber);
        setSuccessModal(true);
        
        // Auto-close success modal after 5 seconds
        setTimeout(() => {
          setSuccessModal(false);
        }, 5000);
        
        // Print operations in background (don't await)
        (async () => {
          try {
            // Generate single invoice with all items (BEFORE clearing cart)
            const invoiceData = {
              billId: billId,
              queueNumber: queueNumber,
              companyName: companyInfo && companyInfo.name ? companyInfo.name : 'CHEFMATE',
              companyAddress: companyInfo && companyInfo.address ? companyInfo.address : '',
              companyPhone: companyInfo && companyInfo.phone_number ? companyInfo.phone_number : '',
              companyTaxId: companyInfo && companyInfo.tax_id ? companyInfo.tax_id : '',
              timestamp: new Date().toISOString(),
              items: cart.map(item => ({
                item_name: item.iname,
                iname: item.iname,
                quantity: item.quantity,
                price: item.offerprice,
                offerprice: item.offerprice,
                total: item.quantity * item.offerprice
              })),
              total: grandTotal.toFixed(2),
              paymentMethod: 'QR Code'
            };
            
            // Generate and print ESC/POS bill
            await generateESCPOSBill(billId, cart, grandTotal, queueNumber, selectedPaymentMethod);
            
            // Print KIOSK invoice
            console.log('🧾 Printing KIOSK invoice for order...');
            await printKioskInvoice(invoiceData);
            
            console.log('✅ All printing operations completed');
          } catch (printError) {
            console.error('⚠️ Print error (non-blocking):', printError);
            message.warning('Bill saved but printing encountered an issue');
          }
        })();
        
        // Clear cart and reset UI after print operations are set up
        setCart([]);
        setSelectedCategory(null);
        setSelectedSubcategory(null);
        setItems([]);
        setTotal(0);
      } else {
        throw new Error(response.data.message || 'Failed to save bill');
      }
    } catch (error) {
      console.error('❌ Error saving bill:', error);
      message.error('Error saving bill: ' + (error.response?.data?.message || error.message));
      setPaymentLoading(false);
    }
  };

  const formatQuantityForDisplay = (item) => {
    if (item.weight === "weight") {
      const grams = item.quantity * 1000;
      return `${grams}g`;
    }
    return item.quantity;
  };

  const renderItemsSection = () => {
    if (!selectedSubcategory) {
      return (
        <Result
          icon={<AppstoreOutlined style={{ color: '#667eea' }} />}
          title="Select a Subcategory"
          subTitle="Choose a subcategory to see items"
        />
      );
    }
    if (items.length === 0) {
      return (
        <Empty 
          description="No items available" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ padding: '60px 0' }}
        />
      );
    }
    return (
      <Row gutter={[16, 16]}>
        {items.map((item) => (
          <Col xs={24} sm={12} md={12} lg={8} key={item.id}>
            <Card
              hoverable
              bordered={false}
              style={{
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                transition: 'all 0.3s ease',
                height: '100%'
              }}
              bodyStyle={{ padding: '16px' }}
              cover={
                <div 
                  onClick={(e) => addItemToCart(item, e)}
                  style={{ 
                    position: 'relative',
                    paddingTop: '75%',
                    overflow: 'hidden',
                    background: '#f0f0f0',
                    cursor: 'pointer'
                  }}>
                  <img
                    src={`${baseURL}/uploads/${item.filename || item.image_filename || "placeholder.png"}`}
                    alt={item.iname}
                    style={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover' 
                    }}
                    onError={(e) => {
                      console.error('Image failed to load:', `${baseURL}/uploads/${item.filename || item.image_filename}`);
                      console.log('Full URL:', e.target.src);
                      e.target.src = "data:image/png;base64,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";
                    }}
                    loading="lazy"
                  />
                  {item.weight === "weight" && (
                    <Tag 
                      color="orange" 
                      style={{ position: 'absolute', top: 8, right: 8, borderRadius: '12px', padding: '4px 12px', fontSize: '12px', fontWeight: 600 }}
                    >
                      By Weight
                    </Tag>
                  )}
                </div>
              }
            >
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Title level={5} style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                  {item.iname}
                </Title>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Statistic
                    value={item.offerprice}
                    prefix="THB"
                    valueStyle={{ color: '#52c41a', fontSize: '20px', fontWeight: 700 }}
                  />
                  <Tooltip title="Add to Cart">
                    <Button
                      type="primary"
                      shape="circle"
                      size="large"
                      icon={<PlusOutlined />}
                      onClick={(e) => addItemToCart(item, e)}
                      style={{
                        background: 'linear-gradient(135deg, #8ec5fc 0%, #e0c3fc 100%)',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(102,126,234,0.4)'
                      }}
                    />
                  </Tooltip>
                </Space>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  const completeOrder = async () => {
    try {
      setLoading(true);
      console.log('💾 Starting order completion and saving to database...');
      
      const currentTime = format(new Date(), 'HH:mm:ss');
      const setupDate = getNextSetupDate();
      
      // Calculate totals
      const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.offerprice), 0);
      const taxAmount = cart.reduce((sum, item) => {
        const itemTax = ((item.tax || 0) * item.offerprice / 100) * item.quantity;
        return sum + itemTax;
      }, 0);
      const grandTotal = subtotal + taxAmount;
      
      console.log('Order Summary:', {
        subtotal,
        taxAmount,
        grandTotal,
        itemCount: cart.length
      });
      
      // Step 1: Create order in orders table
      const orderResponse = await axios.post('/orders', {
        userid: 'KIOSK',
        order_number: Date.now(), // Will be overridden by backend if auto-increment
        table_number: 'KIOSK Self-Service',
        total_amount: grandTotal,
        invoice_number: null,
        status: 0 // 0 = new order
      });
      
      const orderId = orderResponse.data.data?.id || orderResponse.data.id;
      console.log('✅ Order created with ID:', orderId);
      
      // Step 2: Create order items in order_items table
      for (const item of cart) {
        const itemTotal = item.quantity * item.offerprice;
        await axios.post('/order_items', {
          order_id: orderId,
          table_number: 'KIOSK Self-Service',
          item_name: item.iname,
          quantity: item.quantity,
          total_price: itemTotal,
          invoice_number: null,
          status: 0,
          setup_date: setupDate,
          table_cat_id: null
        });
      }
      console.log(`✅ Created ${cart.length} order items`);
      
      // Step 3: Create final bill in final_bill table
      try {
        const billResponse = await axios.post('/final_bill', {
          customer_id: null,
          inv_date: currentDate,
          inv_time: currentTime,
          table_number: 'KIOSK Self-Service',
          subtotal: subtotal,
          discount_type: 'percentage',
          discount_value: 0,
          discount_amount: 0,
          subtotal_afterdiscount: subtotal,
          tax: taxAmount,
          roundoff: 0,
          grand_total: grandTotal,
          payment_mode: selectedPaymentMethod,
          status: 0, // 0 = pending/new
          paid_amount: grandTotal,
          setup_date: setupDate
        });
        
        const billId = billResponse.data.data?.id || billResponse.data.id;
        console.log('✅ Final bill created with ID:', billId);
        
        // Use bill ID as order number for display
        setOrderNumber(billId);
      } catch (billError) {
        console.error('⚠️ Failed to create final bill:', billError);
        // Use order ID if bill creation fails
        setOrderNumber(orderId);
      }
      
      console.log('🎉 Order completed successfully!');
      
      // Show success modal
      setSuccessModal(true);
      
      // Clear cart and reset UI
      setCart([]);
      setSelectedCategory(null);
      setSelectedSubcategory(null);
      setItems([]);
      setTotal(0);
      
      // Auto-close success modal after 5 seconds
      setTimeout(() => {
        setSuccessModal(false);
      }, 5000);
      
    } catch (error) {
      console.error('❌ Error completing order:', error);
      console.error('Error details:', error.response?.data);
      message.error('Error placing order: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const confirmOrder = async () => {
    await completeOrder();
  };

  return (
    <div className="kiosk-container">
      <Affix offsetTop={0}>
        <div className="kiosk-header" style={{
         
          padding: '24px 32px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          <div className="header-content" style={{ 
            maxWidth: '1400px', 
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Space align="center" size="large">
              <Avatar 
                size={64} 
                icon={<ShoppingOutlined />} 
                style={{ 
                  backgroundColor: '#fff',
                  color: '#EC4C23',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}
              />
              <div>
                <Title level={2} style={{ margin: 0, color: "#fff", fontWeight: 700 }}>
                  {companyInfo.name || "Welcome to ChefMate KIOSK"}
                </Title>
                <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: "16px" }}>
                  🍽️ Select items and place your order
                </Text>
              </div>
            </Space>

            <Badge count={cart.length} showZero offset={[-5, 5]} color="#ff4d4f">
              <Button
                type="primary"
                size="large"
                icon={<ShoppingCartOutlined />}
                onClick={() => setCartVisible(true)}
                className="view-cart-button"
                id="view-cart-button"
                style={{
                  height: '56px',
                  borderRadius: '28px',
                  fontSize: '16px',
                  fontWeight: 600,
                  backgroundColor: '#fff',
                  color: '#667eea',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  padding: '0 32px'
                }}
              >
                View Cart (THB {total.toFixed(2)})
              </Button>
            </Badge>
          </div>
        </div>
      </Affix>

      <div className="kiosk-content">
        <Spin spinning={loading} size="large">
          <div style={{ 
            background: '#f8f9fa',
            padding: '24px',
            borderRadius: '16px',
            marginBottom: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <Space align="center" style={{ marginBottom: '16px' }}>
              <AppstoreOutlined style={{ fontSize: '24px', color: '#667eea' }} />
              <Title level={3} style={{ margin: 0, color: '#1a1a1a' }}>Categories</Title>
            </Space>
            <div className="category-scroll" style={{ 
              display: 'flex', 
              gap: '12px', 
              overflowX: 'auto',
              paddingBottom: '8px'
            }}>
              {categories.length > 0 ? (
                categories.map((category) => (
                  <Button
                    key={category.id}
                    type={selectedCategory?.id === category.id ? "primary" : "default"}
                    size="large"
                    shape="round"
                    onClick={() => handleCategoryClick(category.id, category.name)}
                    style={{
                      minWidth: '140px',
                      height: '48px',
                      fontSize: '15px',
                      fontWeight: 600,
                      backgroundColor: selectedCategory?.id === category.id ? '#667eea' : '#fff',
                      borderColor: selectedCategory?.id === category.id ? '#667eea' : '#d9d9d9',
                      color: selectedCategory?.id === category.id ? '#fff' : '#1a1a1a',
                      boxShadow: selectedCategory?.id === category.id ? '0 4px 12px rgba(102,126,234,0.4)' : '0 2px 4px rgba(0,0,0,0.08)',
                      transition: 'all 0.3s ease'
                    }}
                    icon={<FireOutlined />}
                  >
                    {category.name}
                  </Button>
                ))
              ) : (
                <Empty 
                  description="No categories available" 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  style={{ width: '100%', padding: '40px 0' }}
                />
              )}
            </div>
          </div>

          <Row gutter={[24, 24]}>
            <Col xs={24} md={7}>
              <Card 
                bordered={false}
                style={{
                  borderRadius: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  height: '100%'
                }}
              >
                <Title level={4} style={{ marginBottom: 16, color: '#1a1a1a' }}>
                  📋 Subcategories
                </Title>
                {selectedCategory ? (
                  subcategories.length > 0 ? (
                    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                      {subcategories.map((subcategory) => (
                        <Button
                          key={subcategory.id}
                          block
                          size="large"
                          type={selectedSubcategory?.id === subcategory.id ? "primary" : "default"}
                          onClick={() => handleSubcategoryClick(subcategory.id, subcategory.subcat)}
                          style={{
                            height: '56px',
                            borderRadius: '12px',
                            fontSize: '15px',
                            fontWeight: 500,
                            textAlign: 'left',
                            backgroundColor: selectedSubcategory?.id === subcategory.id ? '#667eea' : '#f8f9fa',
                            borderColor: selectedSubcategory?.id === subcategory.id ? '#667eea' : 'transparent',
                            color: selectedSubcategory?.id === subcategory.id ? '#fff' : '#1a1a1a',
                            boxShadow: selectedSubcategory?.id === subcategory.id ? '0 4px 12px rgba(102,126,234,0.3)' : 'none',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          {subcategory.subcat}
                        </Button>
                      ))}
                    </Space>
                  ) : (
                    <Empty 
                      description="No subcategories" 
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      style={{ padding: '40px 0' }}
                    />
                  )
                ) : (
                  <Result
                    icon={<AppstoreOutlined style={{ color: '#667eea' }} />}
                    title="Select a Category"
                    subTitle="Choose a category to see subcategories"
                  />
                )}
              </Card>
            </Col>

            <Col xs={24} md={17}>
              <Card
                bordered={false}
                style={{
                  borderRadius: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  height: '100%'
                }}
              >
                <Title level={4} style={{ marginBottom: 16, color: '#1a1a1a' }}>
                  🍕 Menu Items
                </Title>
                {renderItemsSection()}
              </Card>
            </Col>
          </Row>
        </Spin>
      </div>

      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <ShoppingCartOutlined style={{ fontSize: "24px" }} />
            <span>Your Cart ({cart.length} items)</span>
          </div>
        }
        open={cartVisible}
        onCancel={() => setCartVisible(false)}
        width={700}
        footer={[
          <div key="footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0" }}>
            <div>
              <Title level={4} style={{ margin: 0 }}>
                Total: <Text type="success">THB {total.toFixed(2)}</Text>
              </Title>
            </div>
            <Space>
              <Button size="large" onClick={clearCart} danger icon={<DeleteOutlined />}>
                Clear Cart
              </Button>
              <Button
                type="primary"
                size="large"
                onClick={handlePlaceOrder}
                icon={<CheckCircleOutlined />}
                disabled={cart.length === 0}
              >
                Place Order
              </Button>
            </Space>
          </div>
        ]}
      >
        <div style={{ maxHeight: '500px', overflowY: 'auto', padding: '8px' }}>
          {cart.length === 0 ? (
            <Empty description="Your cart is empty" />
          ) : (
            cart.map((item, index) => (
              <div key={index} style={{ marginBottom: '16px' }}>
                <Row align="middle" gutter={[16, 16]}>
                  <Col span={4}>
                    <Image
                      src={`${baseURL}/uploads/${item.filename || item.image_filename || "placeholder.png"}`}
                      alt={item.iname}
                      width={70}
                      height={70}
                      style={{ objectFit: "cover", borderRadius: "8px" }}
                      preview={false}
                    />
                  </Col>
                  <Col span={9}>
                    <div>
                      <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 4 }}>
                        {item.iname}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 14 }}>
                        THB {item.offerprice} each
                      </Text>
                    </div>
                  </Col>
                  <Col span={7} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Space size="small">
                      <Button
                        icon={<MinusOutlined />}
                        onClick={() => decreaseQuantity(index)}
                        size="middle"
                        shape="circle"
                      />
                      <InputNumber
                        value={item.quantity}
                        readOnly
                        size="middle"
                        style={{ width: "50px", textAlign: "center" }}
                        controls={false}
                      />
                      <Button
                        icon={<PlusOutlined />}
                        onClick={() => increaseQuantity(index)}
                        size="middle"
                        shape="circle"
                      />
                    </Space>
                  </Col>
                  <Col span={4} style={{ textAlign: "right" }}>
                    <div>
                      <Title level={5} style={{ margin: 0, color: "#52c41a", marginBottom: 4 }}>
                        THB {(item.quantity * item.offerprice).toFixed(2)}
                      </Title>
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => removeFromCart(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  </Col>
                </Row>
                {index < cart.length - 1 && <Divider style={{ margin: "12px 0" }} />}
              </div>
            ))
          )}
        </div>
      </Modal>

      <Modal
        title="Confirm Your Order"
        open={confirmOrderModal}
        onOk={confirmOrder}
        onCancel={() => setConfirmOrderModal(false)}
        okText="Confirm Order"
        cancelText="Cancel"
        width={600}
        confirmLoading={loading}
      >
        <div style={{ padding: "20px 0" }}>
          <Title level={4}>Order Summary</Title>
          <Divider />
          {cart.map((item, index) => (
            <div key={index} style={{ marginBottom: "12px" }}>
              <Row justify="space-between">
                <Col>
                  <Text strong>{item.iname}</Text>
                  <Text type="secondary"> x {formatQuantityForDisplay(item)}</Text>
                </Col>
                <Col>
                  <Text>THB {(item.quantity * item.offerprice).toFixed(2)}</Text>
                </Col>
              </Row>
            </div>
          ))}
          <Divider />
          <Row justify="space-between">
            <Col>
              <Title level={3}>Total:</Title>
            </Col>
            <Col>
              <Title level={3} type="success">THB {total.toFixed(2)}</Title>
            </Col>
          </Row>
        </div>
      </Modal>

      <Modal
        open={successModal}
        footer={null}
        closable={false}
        centered
        width={500}
      >
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <CheckCircleOutlined style={{ fontSize: "80px", color: "#52c41a" }} />
          <Title level={2} style={{ marginTop: "20px" }}>Order Placed Successfully!</Title>
          <Text style={{ fontSize: "18px" }}>
            Your queue number is: <Text strong style={{ fontSize: "24px", color: "#1890ff" }}>#{orderNumber}</Text>
          </Text>
          <div style={{ marginTop: "30px" }}>
            <Text type="secondary">Please wait at your table. We'll bring your order soon!</Text>
          </div>
        </div>
      </Modal>

      {cart.length > 0 && (
        <Affix style={{ position: "fixed", bottom: 20, right: 20 }}>
          <Badge count={cart.length} offset={[-5, 5]}>
            <Button
              type="primary"
              size="large"
              shape="circle"
              icon={<ShoppingCartOutlined />}
              onClick={() => setCartVisible(true)}
              style={{
                width: "70px",
                height: "70px",
                fontSize: "28px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
              }}
              className="floating-cart-mobile"
            />
          </Badge>
        </Affix>
      )}

      {/* Payment Method Selection Modal */}
      <Modal
        title={
          <div style={{ textAlign: 'center' }}>
            <Title level={3} style={{ margin: 0 }}>Select Payment Method</Title>
          </div>
        }
        open={paymentMethodModal}
        onCancel={() => setPaymentMethodModal(false)}
        footer={null}
        width={500}
        centered
      >
        <Spin spinning={paymentLoading} tip="Generating QR Code...">
          <Space direction="vertical" size="large" style={{ width: '100%', padding: '24px 0' }}>
            <Card
              hoverable
              onClick={() => handlePaymentMethodSelect('qr')}
              style={{
                border: '2px solid #EECC33',
                borderRadius: '16px',
                textAlign: 'center',
                cursor: paymentLoading ? 'not-allowed' : 'pointer',
                opacity: paymentLoading ? 0.6 : 1
              }}
              bodyStyle={{ padding: '32px' }}
            >
              <Space direction="vertical" size="middle">
                <div style={{ fontSize: '48px' }}>📱</div>
                <Title level={4} style={{ margin: 0 }}>Thai QR Payment</Title>
                <Text type="secondary">Scan QR code with your banking app</Text>
              </Space>
            </Card>
            
            <Card
              hoverable
              onClick={() => handlePaymentMethodSelect('card')}
              style={{
                border: '2px solid #52c41a',
                borderRadius: '16px',
                textAlign: 'center',
                cursor: paymentLoading ? 'not-allowed' : 'pointer',
                opacity: paymentLoading ? 0.6 : 1
              }}
              bodyStyle={{ padding: '32px' }}
            >
              <Space direction="vertical" size="middle">
                <div style={{ fontSize: '48px' }}>💳</div>
                <Title level={4} style={{ margin: 0 }}>Card Payment</Title>
                <Text type="secondary">Pay with credit/debit card</Text>
              </Space>
            </Card>
          </Space>
        </Spin>
      </Modal>

      {/* QR Code Payment Modal - Separate Component */}
      <QRPaymentModal
        visible={qrCodeModal}
        onClose={() => setQrCodeModal(false)}
        cart={cart}
        total={total}
        companyInfo={companyInfo}
        onPaymentSuccess={handleQRPaymentSuccess}
      />

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <Affix style={{ position: "fixed", bottom: 20, right: 20 }}>
          <Badge count={cart.length} offset={[-5, 5]}>
            <Button
              type="primary"
              size="large"
              shape="circle"
              icon={<ShoppingCartOutlined />}
              onClick={() => setCartVisible(true)}
              style={{
                width: "70px",
                height: "70px",
                fontSize: "28px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
              }}
              className="floating-cart-mobile"
            />
          </Badge>
        </Affix>
      )}
    </div>
  );
}
