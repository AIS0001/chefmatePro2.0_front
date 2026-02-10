
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout, Menu, Button, Tooltip, Divider } from 'antd';
import { LogoutOutlined, MenuFoldOutlined } from '@ant-design/icons';
import getMenuItems from "../components/MenuItems";
import getMenuItems_vat from "../components/Menu_item_vat";
import fetchData from "../functions/fetchData";

export default function LeftSidebar({ usertype, isOpen, isMobile, onClose }) {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const sidebarRef = useRef(null);
  const { Sider } = Layout;

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
      onClose();
    }
  };

  // Convert menu items to Ant Design Menu format
  const convertMenuItems = (items) => {
    return items.map((item, index) => {
      if (item.submenu) {
        return {
          key: index.toString(),
          label: item.name,
          icon: <i className={`zmdi zmdi-${item.icon}`} style={{ fontSize: '16px' }} />,
          children: item.submenu.map((subItem, subIndex) => ({
            key: `${index}-${subIndex}`,
            label: <Link to={subItem.path}>{subItem.name}</Link>,
          })),
        };
      } else {
        return {
          key: index.toString(),
          label: <Link to={item.path || "#!"}>{item.name}</Link>,
          icon: <i className={`zmdi zmdi-${item.icon}`} style={{ fontSize: '16px' }} />,
        };
      }
    });
  };

  const handleLogout = () => {
    navigate('/logout');
  };

  const effectiveOpen = isMobile ? isOpen : (isOpen || (!isMobile && !isOpen && sidebarHovered));
  const sidebarWidth = isMobile ? 240 : (effectiveOpen ? 240 : 80);

  return (
    <div
      ref={sidebarRef}
      style={{
        position: 'fixed',
        left: isMobile ? (isOpen ? 0 : -240) : 0,
        top: 64, // Below the header
        height: 'calc(100vh - 64px)',
        width: sidebarWidth,
        background: '#001529',
        transition: isMobile ? 'left 0.3s ease' : 'width 0.2s',
        zIndex: 2001,
        overflowY: 'auto',
        overflowX: 'hidden',
        boxShadow: isMobile && isOpen ? '2px 0 8px rgba(0,0,0,0.15)' : 'none',
      }}
      onMouseEnter={() => { if (!isMobile && !isOpen) setSidebarHovered(true); }}
      onMouseLeave={() => { if (!isMobile && !isOpen) { setSidebarHovered(false); setHoveredMenu(null); } }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Main Menu */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Menu
            mode="inline"
            theme="dark"
            items={convertMenuItems(menuItems)}
            style={{
              background: 'transparent',
              border: 'none',
            }}
            itemLabelStyle={{ color: '#ffffff', fontWeight: 500 }}
            inlineIndent={effectiveOpen ? 16 : 0}
          />
        </div>

        {/* Divider */}
        <Divider style={{ margin: '8px 0', borderColor: 'rgba(255, 255, 255, 0.15)' }} />

        {/* Logout Button */}
        <div style={{ padding: effectiveOpen ? '8px 16px' : '8px 8px', borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}>
          {effectiveOpen ? (
            <Button
              type="primary"
              danger
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              block
              style={{ background: '#ff4d4f', borderColor: '#ff4d4f' }}
            >
              Logout
            </Button>
          ) : (
            <Tooltip title="Logout" placement="right">
              <Button
                type="text"
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                block
                style={{ color: '#f5222d' }}
              />
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}
