
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, Button, Tooltip, Divider } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import axios from 'axios';
import getMenuItems from "../components/MenuItems";
import getMenuItems_vat from "../components/Menu_item_vat";
import fetchData from "../functions/fetchData";
import { getHeaders, getShopPlanName } from "../utility/auth";

const STARTER_REPORT_PATHS = new Set([
  '/reports/billhistory',
  '/reports/dayclose',
  '/reports/cashdrawer'
]);

const ENTERPRISE_ONLY_REPORT_PATHS = new Set([
  '/reports/saleledger',
  '/reports/supplierledger'
]);

const PROFESSIONAL_REPORT_PATHS = new Set([
  '/reports/billhistorygst',
  '/reports/advanceorderreportgst',
  '/reports/itemwisesalegst',
  '/reports/itemwisesummaryvat',
  '/reports/lowstockitems',
  '/reports/daywise',
  '/reports/advanceorderreport',
  '/reports/itemwisesale',
  '/reports/billeditlogs',
  '/reports/entertainment',
  '/reports/groupwise',
  '/reports/loginattempts',
  '/quotation-history',
  '/inventory/stockreports'
]);

const PROFESSIONAL_FEATURE_PATHS = new Set([
  '/expenses/suppliersexpenses'
]);

const PLAN_GATED_ROLES = new Set(['manager', 'account']);

const normalizeManagerPlanTier = (planName) => {
  const normalized = String(planName || '').trim().toLowerCase();
  if (!normalized) return 'starter';
  if (normalized.includes('enterprise')) return 'enterprise';
  if (normalized.includes('professional') || normalized.includes('business') || normalized.includes('pro')) return 'professional';
  if (normalized.includes('starter') || normalized.includes('basic')) return 'starter';
  return 'starter';
};

const getStoredPlanName = () => {
  return getShopPlanName();
};

const persistPlanName = (planName) => {
  if (!planName) return;
  if (localStorage.getItem('token')) {
    localStorage.setItem('shop_plan_name', planName);
  }
  if (sessionStorage.getItem('token')) {
    sessionStorage.setItem('shop_plan_name', planName);
  }
};

const applyManagerPlanToMenu = (items, planTier) => {
  if (planTier === 'enterprise') {
    return items;
  }

  return items.map((item) => {
    if (!item.submenu) {
      return item;
    }

    const submenu = item.submenu.map((subItem) => {
      const path = String(subItem.path || '').toLowerCase();
      if (planTier === 'starter') {
        if (STARTER_REPORT_PATHS.has(path)) {
          return { ...subItem, disabled: false };
        }

        if (PROFESSIONAL_FEATURE_PATHS.has(path)) {
          return {
            ...subItem,
            disabled: true,
            disabledReason: 'Upgrade to Professional plan'
          };
        }

        if (!String(item.name || '').toLowerCase().includes('report')) {
          return { ...subItem, disabled: false };
        }

        return {
          ...subItem,
          disabled: true,
          disabledReason: 'Upgrade to Professional plan'
        };
      }

      if (planTier === 'professional') {
        if (PROFESSIONAL_FEATURE_PATHS.has(path)) {
          return { ...subItem, disabled: false };
        }

        if (ENTERPRISE_ONLY_REPORT_PATHS.has(path)) {
          return {
            ...subItem,
            disabled: true,
            disabledReason: 'Upgrade to Enterprise plan'
          };
        }

        if (!String(item.name || '').toLowerCase().includes('report')) {
          return { ...subItem, disabled: false };
        }

        if (STARTER_REPORT_PATHS.has(path) || PROFESSIONAL_REPORT_PATHS.has(path)) {
          return { ...subItem, disabled: false };
        }

        return { ...subItem, disabled: false };
      }

      return { ...subItem, disabled: false };
    });

    return { ...item, submenu };
  });
};

export default function LeftSidebar({ usertype, isOpen, isMobile, onClose }) {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [, setManagerPlanTier] = useState('starter');
  const [, setHoveredMenu] = useState(null);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const sidebarRef = useRef(null);

  useEffect(() => {
    // Fetch tax_type and manager plan, then shape menu access.
    async function fetchTaxTypeAndMenu() {
      let resolvedPlanName = getStoredPlanName();
      try {
        try {
          const profileResponse = await axios.get('/shop/profile', getHeaders());
          const planFromApi = profileResponse?.data?.data?.plan_name || '';
          resolvedPlanName = planFromApi;
          persistPlanName(planFromApi);
        } catch (profileError) {
          // Fall back to cached value if API fails
          resolvedPlanName = resolvedPlanName || getStoredPlanName();
        }

        const tier = normalizeManagerPlanTier(resolvedPlanName);
        setManagerPlanTier(tier);

        let taxType = "GST";
        try {
          const res = await fetchData("coresetting", null, "id", {});
          if (res && res.data && res.data.length > 0) {
            taxType = (res.data[0].tax_type || "GST").toLowerCase();
          }
        } catch (settingError) {
          taxType = "gst";
        }

        const baseMenu = taxType === "gst" ? getMenuItems(usertype) : getMenuItems_vat(usertype);
        const normalizedUserType = String(usertype || '').toLowerCase();
        const finalMenu = PLAN_GATED_ROLES.has(normalizedUserType)
          ? applyManagerPlanToMenu(baseMenu, tier)
          : baseMenu;

        if (taxType === "gst") {
          setMenuItems(finalMenu);
        } else {
          setMenuItems(finalMenu);
        }
      } catch (e) {
        const fallbackTier = normalizeManagerPlanTier(getStoredPlanName() || resolvedPlanName);
        setManagerPlanTier(fallbackTier);
        const fallbackUserType = String(usertype || '').toLowerCase();
        const fallbackMenu = PLAN_GATED_ROLES.has(fallbackUserType)
          ? applyManagerPlanToMenu(getMenuItems(usertype), fallbackTier)
          : getMenuItems(usertype);
        setMenuItems(fallbackMenu);
      }
    }
    fetchTaxTypeAndMenu();

    // Re-fetch plan when tab becomes visible (e.g. after super admin upgrades plan)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchTaxTypeAndMenu();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [usertype]);

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
            disabled: Boolean(subItem.disabled),
            label: subItem.disabled
              ? (
                <span
                  title={subItem.disabledReason || 'Upgrade your plan'}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, opacity: 0.9 }}
                >
                  <span>{subItem.name}</span>
                  <span
                    style={{
                      fontSize: 10,
                      lineHeight: '14px',
                      padding: '0 6px',
                      borderRadius: 10,
                      background: 'rgba(250, 173, 20, 0.2)',
                      color: '#ffd666',
                      border: '1px solid rgba(250, 173, 20, 0.45)',
                      letterSpacing: 0.2
                    }}
                  >
                    Upgrade
                  </span>
                </span>
              )
              : <Link to={subItem.path}>{subItem.name}</Link>,
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
        top: '64px',
        height: 'calc(100vh - 64px)',
        width: sidebarWidth,
        background: '#001529',
        transition: isMobile ? 'left 0.3s ease' : 'width 0.2s',
        zIndex: 2001,
        overflowY: 'auto',
        overflowX: 'hidden',
        boxShadow: isMobile && isOpen ? '2px 0 8px rgba(0,0,0,0.15)' : 'none',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        marginTop: 0,
        paddingTop: 0,
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
