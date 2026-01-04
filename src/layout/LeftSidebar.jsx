
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import getMenuItems from "../components/MenuItems";
import getMenuItems_vat from "../components/Menu_item_vat";
import fetchData from "../functions/fetchData";


export default function LeftSidebar({ usertype, isOpen, isMobile, onClose }) {
  const [activeMenu, setActiveMenu] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const sidebarRef = useRef(null);

  useEffect(() => {
    // Fetch tax_type from coresetting and set menu accordingly
    async function fetchTaxTypeAndMenu() {
      try {
        const res = await fetchData("coresetting", null, "id", {});
        let taxType = "GST";
        if (res && res.data && res.data.length > 0) {
          taxType = (res.data[0].tax_type || "GST").toLowerCase();
        }
        if (taxType === "gst") {
          setMenuItems(getMenuItems(usertype));
        } else {
          setMenuItems(getMenuItems_vat(usertype));
        }
      } catch (e) {
        setMenuItems(getMenuItems(usertype)); // fallback
      }
    }
    fetchTaxTypeAndMenu();
  }, [usertype]);

  const handleMenuClick = (index) => {
    setActiveMenu(activeMenu === index ? null : index);
  };

  // Handle menu link clicks for mobile
  const handleMenuLinkClick = (item) => {
    if (isMobile && !item.submenu) {
      // Close mobile sidebar when clicking a direct link
      onClose();
    }
  };

  // No submenu open/close on hover
  const handleMouseEnter = () => {};
  const handleMouseLeave = () => {};

  // Sidebar is considered open if isOpen or hovered while collapsed (desktop only)
  // For mobile, always show content when sidebar is open
  const effectiveOpen = isMobile ? isOpen : (isOpen || (!isMobile && !isOpen && sidebarHovered));

  return (
   // ...existing code...
    <div
      ref={sidebarRef}
      className={`fixed-sidebar-left ${effectiveOpen ? "open" : "collapsed"} ${isMobile && isOpen ? "mobile-open" : ""}`}
      style={{
        overflowX: "hidden",
        minHeight: "100vh",
        width: isMobile ? 240 : (effectiveOpen ? 240 : 60), // Ensure enough width for text on mobile
        transition: isMobile ? 'left 0.3s ease' : 'width 0.2s',
        zIndex: 2000,
        position: 'fixed',
        left: isMobile ? (isOpen ? 0 : -240) : 0,
        background: '#212121',
        boxShadow: isMobile && isOpen ? '2px 0 8px rgba(0,0,0,0.08)' : 'none', // Optional: shadow for mobile
      }}
      onMouseEnter={() => { if (!isMobile && !isOpen) setSidebarHovered(true); }}
      onMouseLeave={() => { if (!isMobile && !isOpen) { setSidebarHovered(false); setHoveredMenu(null); } }}
    >
      <ul className="nav navbar-nav side-nav nicescroll-bar" style={{ overflowX: "hidden", paddingLeft: isMobile ? 0 : undefined }}>
        <li className="navigation-header" style={{ paddingLeft: isMobile ? 16 : undefined }}>
          <span>Main</span>
          <i className="zmdi zmdi-more"></i>
        </li>

        {menuItems.map((item, index) => {
          const showSubmenu = (isMobile || effectiveOpen) && activeMenu === index;
          return (
            <li
              key={index}
              style={{ position: 'relative', paddingLeft: isMobile ? 8 : undefined, paddingRight: isMobile ? 8 : undefined }}
            >
              <Link
                to={item.submenu ? "#!" : item.path || "#!"}
                onClick={(e) => {
                  if (item.submenu) {
                    e.preventDefault();
                    handleMenuClick(index);
                  } else {
                    handleMenuLinkClick(item);
                  }
                }}
                data-toggle="collapse"
                data-target={item.dataTargetId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: isMobile ? '10px 8px' : '10px 0',
                  fontSize: isMobile ? '15px' : '14px',
                  width: '100%',
                  minHeight: '40px',
                }}
              >
                <div style={{
                  width: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: isMobile ? 12 : 20,
                }}>
                  <i className={`zmdi zmdi-${item.icon}`} style={{
                    fontSize: 22,
                    color: '#f9f9f9',
                  }}></i>
                </div>
                {(isMobile || effectiveOpen) && (
                  <span className="right-nav-text" style={{
                    opacity: 1,
                    fontWeight: 500,
                    color: '#f9f9f9',
                    flex: 1,
                    textAlign: 'left',
                  }}>
                    {item.name}
                  </span>
                )}
                {item.submenu && (isMobile || effectiveOpen) && (
                  <div style={{ marginLeft: 'auto' }}>
                    <i className={`zmdi zmdi-caret-${showSubmenu ? "up" : "down"}`}></i>
                  </div>
                )}
              </Link>
              {item.submenu && (
                <ul
                  className={`submenu ${showSubmenu ? "show" : ""}`}
                  style={{
                    background: isMobile ? '#212121' : undefined,
                    paddingLeft: isMobile ? 24 : 0,
                  }}
                >
                  {item.submenu.map((subItem, subIndex) => (
                    <li key={subIndex}>
                      <Link
                        to={subItem.path}
                        onClick={() => handleMenuLinkClick(subItem)}
                        style={{
                          fontSize: isMobile ? '14px' : '13px',
                          padding: isMobile ? '8px 0' : '6px 0',
                          color: 'white',
                          display: 'block',
                        }}
                      >
                        {subItem.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}

        <li className="navigation-header" style={{ paddingLeft: isMobile ? 16 : undefined }}>
          <span>Settings</span>
          <i className="zmdi zmdi-more"></i>
        </li>
      </ul>
    </div>
// ...existing code...
  );
}
