import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Layout, Button, Dropdown, Avatar, Badge, Menu, Space, Tooltip } from 'antd'
import { MenuFoldOutlined, MenuUnfoldOutlined, BellOutlined, SettingOutlined, UserOutlined, LogoutOutlined, ProfileOutlined, MailOutlined, PoweroffOutlined } from '@ant-design/icons'

export default function Topbar({ onToggleSidebar, isSidebarOpen }) {
	const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
	const { Header } = Layout;
	
	const toggleMobileNav = () => {
		setIsMobileNavOpen(!isMobileNavOpen);
	};

	useEffect(() => {
		// Add CSS animation for scrolling text and mobile responsive styles
		const style = document.createElement('style');
		style.textContent = `
			@keyframes scroll-back-forth {
				0% {
					transform: translateX(-100%);
				}
				50% {
					transform: translateX(100%);
				}
				100% {
					transform: translateX(-100%);
				}
			}
			
			.center-scrolling-text {
				position: absolute;
				left: 50%;
				top: 50%;
				transform: translate(-50%, -50%);
				z-index: 1;
				overflow: hidden;
				width: 60%;
				white-space: nowrap;
				pointer-events: none;
			}
			
			.scrolling-content {
				display: inline-block;
				animation: scroll-back-forth 45s ease-in-out infinite;
				color: #fff;
				font-weight: bold;
				font-size: 16px;
				text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
				width: 100%;
				text-align: center;
			}
			
			/* Mobile responsive styles */
			@media (max-width: 768px) {
				.center-scrolling-text {
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
				{/* <div className="center-scrolling-text">
					<div className="scrolling-content">ChefMate POS</div>
				</div> */}
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
