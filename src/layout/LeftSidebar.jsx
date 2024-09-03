import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import menuItems from "../components/MenuItems";

export default function LeftSidebar() {

  const [activeMenu, setActiveMenu] = useState(null);

  const handleMenuClick = (index) => {
    setActiveMenu(activeMenu === index ? null : index);

  };


  return (
    <>

      <div className="fixed-sidebar-left">
        <ul className="nav navbar-nav side-nav nicescroll-bar">
          <li className="navigation-header">
            <span>Main</span>
            <i className="zmdi zmdi-more"></i>
          </li>

          {/* Menu Json Array values started */}
          {menuItems.map((item, index) => (
            <li
              key={index}

            >
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
                    <i className={`zmdi zmdi-caret-${activeMenu === index ? 'up' : 'down'}`}></i>
                  </div>
                )}
                <div class="clearfix"></div>
              </Link>
              {item.submenu && (
                <ul className={`submenu ${activeMenu === index ? 'show' : ''}`}>
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
    </>
  );
}
