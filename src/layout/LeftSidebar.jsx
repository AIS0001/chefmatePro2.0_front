
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import getMenuItems from "../components/MenuItems";
import getMenuItems_vat from "../components/Menu_item_vat";
import fetchData from "../functions/fetchData";


export default function LeftSidebar({ usertype, isOpen }) {
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


  // No submenu open/close on hover
  const handleMouseEnter = () => {};
  const handleMouseLeave = () => {};

  // Sidebar is considered open if isOpen or hovered while collapsed
  const effectiveOpen = isOpen || (!isOpen && sidebarHovered);

  return (
    <div
      ref={sidebarRef}
      className={`fixed-sidebar-left ${effectiveOpen ? "open" : "collapsed"}`}
      style={{
        overflowX: "hidden",
        minHeight: "100vh",
        width: effectiveOpen ? 240 : 60,
        transition: 'width 0.2s',
        zIndex: 2000,
      }}
      onMouseEnter={() => { if (!isOpen) setSidebarHovered(true); }}
      onMouseLeave={() => { if (!isOpen) { setSidebarHovered(false); setHoveredMenu(null); } }}
    >
      <ul className="nav navbar-nav side-nav nicescroll-bar" style={{ overflowX: "hidden" }}>
        <li className="navigation-header">
          <span>Main</span>
          <i className="zmdi zmdi-more"></i>
        </li>

        {menuItems.map((item, index) => {
          // Submenu only opens on click
          const showSubmenu = effectiveOpen && activeMenu === index;
          return (
            <li
              key={index}
              style={{ position: 'relative' }}
            >
              <Link
                to="#!"
                onClick={() => item.submenu && handleMenuClick(index)}
                data-toggle="collapse"
                data-target={item.dataTargetId}
              >
                <div className="pull-left" style={{ width: effectiveOpen ? 32 : 48, display: 'flex', alignItems: 'center', justifyContent: effectiveOpen ? 'flex-start' : 'center', transition: 'all 0.2s' }}>
                  <i className={`zmdi zmdi-${item.icon} mr-20`} style={{ fontSize: 22, marginRight: effectiveOpen ? 20 : 0, transition: 'all 0.2s' }}></i>
                </div>
                {effectiveOpen && (
                  <span className="right-nav-text" style={{ transition: 'opacity 0.2s', opacity: effectiveOpen ? 1 : 0 }}>{item.name}</span>
                )}
                {item.submenu && (
                  <div className="pull-right">
                    <i
                      className={`zmdi zmdi-caret-${showSubmenu ? "up" : "down"}`}
                    ></i>
                  </div>
                )}
                <div className="clearfix"></div>
              </Link>
              {item.submenu && (
                <ul
                  className={`submenu ${showSubmenu ? "show" : ""}`}
                  style={{}}
                >
                  {item.submenu.map((subItem, subIndex) => (
                    <li key={subIndex}>
                      <Link to={subItem.path}>{subItem.name}</Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}

        <li className="navigation-header">
          <span>Settings</span>
          <i className="zmdi zmdi-more"></i>
        </li>
      </ul>
    </div>
  );
}
