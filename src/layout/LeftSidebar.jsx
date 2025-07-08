import React, { useState } from "react";
import { Link } from "react-router-dom";
import getMenuItems from "../components/MenuItems";  // Import the function
import getMenuItems_vat from "../components/Menu_item_vat";  // Import the function

export default function LeftSidebar({ usertype, isOpen }) {   // Receive userType as a prop

  const [activeMenu, setActiveMenu] = useState(null);

  const menuItems = getMenuItems(usertype);  // Get filtered menu based on userType

  const handleMenuClick = (index) => {
    setActiveMenu(activeMenu === index ? null : index);
  };

  return (
    //  <div className="fixed-sidebar-left" >
         <div className={`fixed-sidebar-left ${isOpen ? "open" : "collapsed"}`}>
      <ul className="nav navbar-nav side-nav nicescroll-bar">
       {/* <ul className="side-nav"> */}
        <li className="navigation-header">
          <span>Main</span>
          <i className="zmdi zmdi-more"></i>
        </li>

        {menuItems.map((item, index) => (
          <li key={index}>
            <Link
              to="#!"
              onClick={() => item.submenu && handleMenuClick(index)}
              data-toggle="collapse"
              data-target={item.dataTargetId}
            >
              <div className="pull-left">
                
                <i className={`zmdi zmdi-${item.icon} mr-20`}></i>
                <span className="right-nav-text">{item.name}</span>
              </div>
              {item.submenu && (
                <div className="pull-right">
                  <i
                    className={`zmdi zmdi-caret-${activeMenu === index ? "up" : "down"}`}
                  ></i>
                </div>
              )}
              <div className="clearfix"></div>
            </Link>
            {item.submenu && (
              <ul className={`submenu ${activeMenu === index ? "show" : ""}`}>
                {item.submenu.map((subItem, subIndex) => (
                  <li key={subIndex}>
                    <Link to={subItem.path}>{subItem.name}</Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}

        <li className="navigation-header">
          <span>Settings</span>
          <i className="zmdi zmdi-more"></i>
        </li>
      </ul>
    </div>
  );
}
