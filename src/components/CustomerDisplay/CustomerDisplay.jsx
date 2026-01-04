import React, { useEffect, useState, useRef } from 'react';
import './CustomerDisplay.css';

const CustomerDisplay = () => {
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [displayMode, setDisplayMode] = useState('normal'); // 'normal' or 'billConfirmation'
  const [billSummary, setBillSummary] = useState(null);
  const [companyInfo, setCompanyInfo] = useState({
    name: 'ChefMate POS',
    address: 'Restaurant Address',
    phone: 'Phone Number',
    logo: ''
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const tableContainerRef = useRef(null);

  // Auto-scroll to bottom when new items are added
  useEffect(() => {
    if (tableContainerRef.current && cartItems && Array.isArray(cartItems) && cartItems.length > 0) {
      const container = tableContainerRef.current;
      const scrollToBottom = () => {
        // Check if content overflows the container
        const isOverflowing = container.scrollHeight > container.clientHeight;
        
        if (isOverflowing) {
          // Smooth scroll to bottom
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
          });
        }
      };
      
      // Delay scroll to allow DOM to update and animations to start
      const timeoutId = setTimeout(scrollToBottom, 200);
      
      return () => clearTimeout(timeoutId);
    }
  }, [cartItems]);

  // Also auto-scroll when cart items change (quantity updates, etc.)
  useEffect(() => {
    if (tableContainerRef.current && cartItems && Array.isArray(cartItems) && cartItems.length > 0) {
      const container = tableContainerRef.current;
      
      // Check if we should auto-scroll (only if already near bottom or overflowing)
      const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 50;
      const isOverflowing = container.scrollHeight > container.clientHeight;
      
      if (isOverflowing && isNearBottom) {
        setTimeout(() => {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
          });
        }, 100);
      }
    }
  }, [cartItems, total]);

  // Listen for cart updates from the main POS system
  useEffect(() => {
    const handleCartUpdate = (event) => {
      const { cart, total: cartTotal } = event.detail;
      setCartItems(Array.isArray(cart) ? cart : []);
      setTotal(cartTotal || 0);
    };

    // Listen for custom events from the main POS
    window.addEventListener('cartUpdated', handleCartUpdate);

    // Listen for company info updates
    const handleCompanyUpdate = (event) => {
      setCompanyInfo(event.detail);
    };
    window.addEventListener('companyInfoUpdated', handleCompanyUpdate);

    // ✅ Listen for bill confirmation
    const handleBillConfirmation = (event) => {
      const { cart, total: cartTotal } = event.detail;
      setDisplayMode('billConfirmation');
      setBillSummary(event.detail);
      setCartItems(Array.isArray(cart) ? cart : []);
      setTotal(cartTotal || 0);
    };
    window.addEventListener('billConfirmationUpdated', handleBillConfirmation);

    // ✅ Listen for custom messages
    const handleCustomMessage = (event) => {
      const { message, type } = event.detail;
      if (type === 'billSummary') {
        setDisplayMode('billConfirmation');
      } else if (type === 'normal') {
        setDisplayMode('normal');
        setBillSummary(null);
      }
    };
    window.addEventListener('customMessage', handleCustomMessage);

    // ✅ Listen for clear display command
    const handleClearDisplay = () => {
      setDisplayMode('normal');
      setBillSummary(null);
      setCartItems([]);
      setTotal(0);
    };
    window.addEventListener('clearDisplay', handleClearDisplay);

    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('companyInfoUpdated', handleCompanyUpdate);
      window.removeEventListener('billConfirmationUpdated', handleBillConfirmation);
      window.removeEventListener('customMessage', handleCustomMessage);
      window.removeEventListener('clearDisplay', handleClearDisplay);
      clearInterval(timeInterval);
    };
  }, []);

  const formatCurrency = (amount) => {
    return `฿ ${Number(amount).toFixed(2)}`;
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatQuantity = (item) => {
    return item.quantity_type === "weight"
      ? `${(item.quantity * 1000).toFixed(0)}g`
      : `${item.quantity}`;
  };

  if (displayMode === 'billConfirmation' && billSummary) {
    return (
      <div className="customer-display confirmation-mode">
        <div className="display-header confirmation-header">
          <h1>📋 Order Confirmation</h1>
          <div className="time-display">{formatTime(currentTime)}</div>
        </div>

        <div className="confirmation-content">
          <div className="confirmation-summary">
            <h2>Order Summary</h2>
            <div className="confirmation-items">
              {cartItems && Array.isArray(cartItems) && cartItems.map((item, index) => (
                <div key={index} className="confirmation-item">
                  <div className="item-details">
                    <span className="item-name">{item.iname || item.item_name}</span>
                    <span className="item-qty">Qty: {formatQuantity(item)}</span>
                  </div>
                  <div className="item-amount">{formatCurrency((item.offerprice || item.price) * item.quantity)}</div>
                </div>
              ))}
            </div>
            
            <div className="confirmation-totals">
              {billSummary.subtotal && (
                <div className="total-line">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(billSummary.subtotal)}</span>
                </div>
              )}
              {billSummary.discount > 0 && (
                <div className="total-line">
                  <span>Discount:</span>
                  <span>-{formatCurrency(billSummary.discount)}</span>
                </div>
              )}
              {billSummary.tax > 0 && (
                <div className="total-line">
                  <span>Tax:</span>
                  <span>{formatCurrency(billSummary.tax)}</span>
                </div>
              )}
              <div className="total-line grand-total">
                <span>Grand Total:</span>
                <span>{formatCurrency(billSummary.grandTotal || total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="confirmation-footer">
          <div className="confirmation-message">
            <h3>Please confirm your order</h3>
            <p>Thank you for your business!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-display main-display">
      {/* Header with company info and time */}
      <div className="display-header">
        <div className="company-info">
          {companyInfo.logo && (
            <img src={companyInfo.logo} alt="Company Logo" className="company-logo" />
          )}
          <h1>{companyInfo.name || 'ChefMate POS'}</h1>
        </div>
        <div className="datetime-display">
          <div className="time-display">{formatTime(currentTime)}</div>
          <div className="date-display">{formatDate(currentTime)}</div>
        </div>
      </div>

      {/* Main Content - 2 Column Layout */}
      <div className="two-column-layout">
        {/* Left Column - Offers/Advertisements - Vertical layout */}
        <div className="offers-column">
          {/* Top Offer */}
          <div className="offer-section offer-section-1">
            <div className="offer-image-container">
              <img 
                src="https://d1csarkz8obe9u.cloudfront.net/posterpreviews/pizza-ad-design-template-bd60b7be7a50acc56f6773b8aaceb38c_screen.jpg?ts=1656058786"
                alt="Pizza Special Offer"
                className="offer-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div className="offer-fallback" style={{ display: 'none' }}>
                <div className="offer-content">
                  <div className="offer-header">
                    <h3>🍕 Today's Special</h3>
                  </div>
                  <div className="offer-details">
                    <div className="offer-badge">50% OFF</div>
                    <div className="offer-title">Delicious Pizza Combo</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="offer-text-details">
              <h4>🍕 Pizza Special</h4>
              <p>Get any large pizza + 2 drinks + dessert for just ฿449. Limited time offer!</p>
              <div className="offer-price-tag">
                <span className="price-original">฿899</span>
                <span className="price-sale">฿449</span>
              </div>
            </div>
          </div>

          {/* Bottom Offer */}
          <div className="offer-section offer-section-2">
            <div className="offer-image-container">
              <img 
                src="https://cdn.prod.website-files.com/62285ec29d1c4d1e8ff2df0b/677fb36b8191fbfcd640c5a3_AD_4nXdICER6yHBJTYPMy2YKEWYd0ZGEmLED91bIPXYRbeiDSBf3oEDjBxnqVDzsK_jp8LqmKfbXqn_aSj-dRKx2W32W0SWmo8xszD5wAqWhOT7OikZctN9-vQGnNAV-8L7YMnqacgxzVw.webp"
                alt="Food Advertisement"
                className="offer-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div className="offer-fallback" style={{ display: 'none' }}>
                <div className="offer-content">
                  <div className="offer-header">
                    <h3>🍽️ Delicious Meals</h3>
                  </div>
                  <div className="offer-details">
                    <div className="offer-badge">Fresh</div>
                    <div className="offer-title">Premium Quality</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="offer-text-details">
              <h4>🍽️ Fresh & Delicious</h4>
              <p>Premium quality ingredients, expertly prepared. Try our chef's special menu today!</p>
              <div className="offer-features">
                <span className="feature">✓ Fresh Ingredients</span>
                <span className="feature">✓ Chef Special</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Cart Items */}
        <div className="cart-column">
          <div className="cart-section-full">
            {!cartItems || !Array.isArray(cartItems) || cartItems.length === 0 ? (
              <div className="welcome-screen">
                <div className="welcome-animation">
                  <div className="welcome-icon">🛒</div>
                  <h2>Welcome to Our Restaurant!</h2>
                  <p>Your order will appear here</p>
                  <div className="animated-dots">
                    <span>.</span>
                    <span>.</span>
                    <span>.</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="cart-display-full">
                <div className="cart-header-section">
                  <h2 className="cart-title">🍽️ Your Order</h2>
                  <div className="cart-summary">
                    <span className="item-count">{cartItems && Array.isArray(cartItems) ? cartItems.length : 0} items</span>
                    <div className="total-preview">
                      <span className="total-label">Total:</span>
                      <span className="total-amount">{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="cart-items-table-container" ref={tableContainerRef}>
                  <table className="cart-items-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Item Name</th>
                        <th>Rate</th>
                        <th>Qty</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems && Array.isArray(cartItems) && cartItems.map((item, index) => (
                        <tr key={index} className="cart-item-row">
                          <td className="item-serial">{index + 1}</td>
                          <td className="item-name">{item.iname || item.item_name}</td>
                          <td className="item-rate">{formatCurrency(item.offerprice || item.price)}</td>
                          <td className="item-quantity">{formatQuantity(item)}</td>
                          <td className="item-amount">{formatCurrency((item.offerprice || item.price) * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="display-footer">
        <div className="footer-message">
          <div className="scrolling-text">
            <span>🙏 Thank you for choosing us! • 📞 Call us: +66-123-456-789 • 🌐 Visit: www.chefmate.com • 💌 Follow us on social media for more offers!</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDisplay;
