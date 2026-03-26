import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Layout, Button, Dropdown, Avatar, Badge, Space } from 'antd'
import { MenuFoldOutlined, MenuUnfoldOutlined, BellOutlined, SettingOutlined, UserOutlined, LogoutOutlined, ProfileOutlined, ClockCircleOutlined, ShopOutlined, CalendarOutlined } from '@ant-design/icons'
import axios from 'axios'
import { getAuthToken } from '../utility/auth'

export default function Topbar({ onToggleSidebar, isSidebarOpen }) {
	const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
	const [currentTime, setCurrentTime] = useState(new Date());
	const [businessDate, setBusinessDate] = useState('');
	const [shopName, setShopName] = useState(localStorage.getItem('shop_name') || sessionStorage.getItem('shop_name') || '');
	const { Header } = Layout;

	const userType = (localStorage.getItem('usertype') || sessionStorage.getItem('usertype') || '').toLowerCase();
	const isSuperAdmin = userType === 'super_admin' || window.location.pathname.startsWith('/super-admin');
	const shopId = localStorage.getItem('shop_id') || sessionStorage.getItem('shop_id');

	// Fetch shop name from backend if not in storage but shop_id exists
	useEffect(() => {
		if (shopName || !shopId || isSuperAdmin) return;
		const fetchShopName = async () => {
			try {
				const token = getAuthToken();
				if (!token) return;
				const res = await axios.get('/shop-name', {
					headers: { Authorization: `Bearer ${token}` },
					params: { shop_id: shopId }
				});
				if (res.data?.shop_name) {
					setShopName(res.data.shop_name);
					const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
					storage.setItem('shop_name', res.data.shop_name);
				}
			} catch (err) {
				console.warn('Could not fetch shop name:', err.message);
			}
		};
		fetchShopName();
	}, [shopId, shopName, isSuperAdmin]);
	
	const toggleMobileNav = () => {
		setIsMobileNavOpen(!isMobileNavOpen);
	};

	// Real-time clock - updates every second
	useEffect(() => {
		const timer = setInterval(() => {
			setCurrentTime(new Date());
		}, 1000);
		return () => clearInterval(timer);
	}, []);

	// Fetch business date from day_close_summary
	useEffect(() => {
		const fetchBusinessDate = async () => {
			try {
				const token = getAuthToken();
				if (!token) return;
				const res = await axios.get('/business-date', {
					headers: { Authorization: `Bearer ${token}` }
				});
				if (res.data?.business_date) {
					setBusinessDate(res.data.business_date);
				}
			} catch (err) {
				// fallback to today
				setBusinessDate(new Date().toISOString().split('T')[0]);
			}
		};
		fetchBusinessDate();
	}, []);

	useEffect(() => {
		// Add CSS for mobile responsive styles
		const style = document.createElement('style');
		style.textContent = `
			/* Mobile responsive styles */
			@media (max-width: 768px) {
				.topbar-center-info {
					display: none !important;
				}
				
				.mobile-only-nav {
					display: none;
					position: absolute;
					top: 60px;
					right: 0;
					background: #fff;
					width: 100%;
					box-shadow: 0 2px 10px rgba(0,0,0,0.1);
					z-index: 1000;
				}
				
				.mobile-only-nav.show {
					display: block !important;
				}
				
				.mobile-only-view {
					display: inline-block !important;
				}
				
				.toggle-left-nav-btn {
					display: inline-block !important;
				}
				
				.page-wrapper {
					margin-left: 0 !important;
				}
				
				.fixed-sidebar-left {
					position: fixed !important;
					left: -240px !important;
					transition: left 0.3s ease !important;
					z-index: 2000 !important;
				}
				
				.fixed-sidebar-left.mobile-open {
					left: 0 !important;
				}
				
				.sidebar-overlay {
					position: fixed;
					top: 0;
					left: 0;
					width: 100%;
					height: 100%;
					background: rgba(0,0,0,0.5);
					z-index: 1999;
					display: none;
				}
				
				.sidebar-overlay.show {
					display: block;
				}
			}
			
			@media (min-width: 769px) {
				.mobile-only-view {
					display: none !important;
				}
				
				.mobile-only-nav {
					display: block !important;
				}
			}
			
			.topbar-header {
				background-color: #001529 !important;
				box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
			}
			
			.topbar-logo-wrap {
				display: flex;
				align-items: center;
				gap: 16px;
				color: #fff;
			}
			
			.topbar-nav-right {
				display: flex;
				align-items: center;
				gap: 8px;
			}
			
			.topbar-nav-right .ant-btn {
				color: #fff;
				border: none;
				background: transparent;
			}
			
			.topbar-nav-right .ant-btn:hover {
				color: #fff;
				background: rgba(255, 255, 255, 0.1);
			}
			
			.ant-dropdown-menu {
				background-color: #f5f5f5;
			}
		`;
		document.head.appendChild(style);
		
		return () => {
			document.head.removeChild(style);
		};
	}, []);

	// User profile menu
	const userMenuItems = [
		{
			key: 'profile',
			icon: <ProfileOutlined />,
			label: <Link to="/users/editprofile">Profile</Link>,
		},
		{
			key: 'settings',
			icon: <SettingOutlined />,
			label: <Link to="/setting/companyinfo">Settings</Link>,
		},
		{
			key: 'divider1',
			type: 'divider',
		},
		{
			key: 'logout',
			icon: <LogoutOutlined />,
			label: <Link to="/logout">Log Out</Link>,
			danger: true,
		},
	];

	// Notification menu
	const notificationMenuItems = [
		{
			key: 'notif1',
			label: (
				<div style={{padding: '8px 0'}}>
					<div style={{fontWeight: 'bold', marginBottom: '4px'}}>New subscription created</div>
					<div style={{fontSize: '12px', color: '#666'}}>Your customer subscribed for the basic plan</div>
					<div style={{fontSize: '11px', color: '#999', marginTop: '4px'}}>2pm</div>
				</div>
			),
		},
		{
			key: 'notif2',
			label: (
				<div style={{padding: '8px 0'}}>
					<div style={{fontWeight: 'bold', marginBottom: '4px', color: '#faad14'}}>Server #2 not responding</div>
					<div style={{fontSize: '12px', color: '#666'}}>Some technical error occurred</div>
					<div style={{fontSize: '11px', color: '#999', marginTop: '4px'}}>1pm</div>
				</div>
			),
		},
		{
			key: 'notif3',
			label: (
				<div style={{padding: '8px 0'}}>
					<div style={{fontWeight: 'bold', marginBottom: '4px'}}>2 new messages</div>
					<div style={{fontSize: '12px', color: '#666'}}>Payment notification received</div>
					<div style={{fontSize: '11px', color: '#999', marginTop: '4px'}}>4pm</div>
				</div>
			),
		},
	];

	return (
		<Header className="topbar-header" style={{
			display: 'flex',
			justifyContent: 'space-between',
			alignItems: 'center',
			padding: '0 24px',
			height: '64px',
			backgroundColor: '#001529'
		}}>
			{/* Left side - Logo and Toggle */}
			<div className="topbar-logo-wrap">
				<Link to="/dashboard" style={{display: 'flex', alignItems: 'center'}}>
					{isSidebarOpen ? (
						<img src="../../dist/img/logo.png" alt="brand" style={{height: '40px'}} />
					) : (
						<img src="../../dist/img/cloudico.png" alt="brand-icon" style={{height: '40px'}} />
					)}
				</Link>
				<Button
					type="text"
					icon={isSidebarOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
					onClick={onToggleSidebar}
					style={{color: '#fff', fontSize: '18px'}}
				/>
			</div>

			{/* Center - Business Date, Clock & Shop Name */}
			<div style={{
				display: 'flex',
				alignItems: 'center',
				gap: '20px',
				color: '#fff',
				fontSize: '14px',
				fontWeight: 500,
			}}>
				{!isSuperAdmin && shopName && (
					<div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
						<ShopOutlined style={{ fontSize: '16px', color: '#1890ff' }} />
						<span style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '0.3px' }}>{shopName}</span>
					</div>
				)}
				{!isSuperAdmin && shopName && <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.25)' }} />}
				<div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
					<CalendarOutlined style={{ fontSize: '14px', color: '#52c41a' }} />
					<span>
						<span style={{ opacity: 0.7, fontSize: '12px', marginRight: 4 }}>Biz Date:</span>
						{businessDate
							? new Date(businessDate + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
							: '...'
						}
					</span>
				</div>
				<div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.25)' }} />
				<div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
					<ClockCircleOutlined style={{ fontSize: '14px', color: '#faad14' }} />
					<span style={{
						fontFamily: "'Courier New', monospace",
						fontSize: '16px',
						fontWeight: 700,
						letterSpacing: '1px',
						minWidth: '80px',
					}}>
						{currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
					</span>
				</div>
			</div>

			{/* Right side - Navigation */}
			<Space size="large" className="topbar-nav-right">
				{/* Notifications */}
				<Dropdown menu={{items: notificationMenuItems}} placement="bottomRight">
					<Badge count={5} showZero>
						<Button
							type="text"
							icon={<BellOutlined style={{fontSize: '18px'}}/>}
							style={{color: '#fff'}}
						/>
					</Badge>
				</Dropdown>

				{/* User Menu */}
				<Dropdown menu={{items: userMenuItems}} placement="bottomRight">
					<Avatar 
						icon={<UserOutlined />}
						src="../../dist/img/user1.png"
						style={{cursor: 'pointer', border: '2px solid #fff'}}
					/>
				</Dropdown>
			</Space>
		</Header>
	)
}
