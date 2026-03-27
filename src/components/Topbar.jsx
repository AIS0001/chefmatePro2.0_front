import React, { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Layout, Button, Dropdown, Avatar, Badge, Space } from 'antd'
import { MenuFoldOutlined, MenuUnfoldOutlined, BellOutlined, SettingOutlined, UserOutlined, LogoutOutlined, ProfileOutlined, ClockCircleOutlined, ShopOutlined, CalendarOutlined, CloseOutlined } from '@ant-design/icons'
import axios from 'axios'
import { getAuthToken } from '../utility/auth'

export default function Topbar({ onToggleSidebar, isSidebarOpen }) {
	const navigate = useNavigate();
	const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
	const [currentTime, setCurrentTime] = useState(new Date());
	const [businessDate, setBusinessDate] = useState('');
	const [shopName, setShopName] = useState(localStorage.getItem('shop_name') || sessionStorage.getItem('shop_name') || '');
	const [paymentData, setPaymentData] = useState(null);
	const [bannerVisible, setBannerVisible] = useState(true);
	const [realtimeNotifications, setRealtimeNotifications] = useState([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const wsRef = useRef(null);
	const { Header } = Layout;

	const userType = (localStorage.getItem('usertype') || sessionStorage.getItem('usertype') || '').toLowerCase();
	const isSuperAdmin = userType === 'super_admin' || window.location.pathname.startsWith('/super-admin');
	const shopId = localStorage.getItem('shop_id') || sessionStorage.getItem('shop_id');

	// Fetch initial notifications from database
	const fetchInitialNotifications = async () => {
		try {
			const token = getAuthToken();
			if (!token) return;
			
			const res = await axios.get('/notifications', {
				headers: { Authorization: `Bearer ${token}` },
				params: {
					page: 1,
					limit: 10,
					unreadOnly: false
				}
			});
			
			console.log('📬 Fetched initial notifications:', res.data);
			if (res.data?.success) {
				const notificationsData = res.data.data?.notifications || [];
				console.log('✅ Initial notifications loaded:', notificationsData.length);
				
				// Transform and add to state
				const transformed = notificationsData.map(notif => ({
					id: notif.id,
					title: notif.title,
					message: notif.message,
					type: notif.notificationType || 'general',
					priority: notif.priority || 'normal',
					imageUrl: notif.image_url,
					timestamp: notif.created_at,
					isRead: notif.isRead || false,
					createdAt: notif.created_at
				}));
				
				setRealtimeNotifications(transformed);
				
				// Count unread
				const unread = transformed.filter(n => !n.isRead).length;
				setUnreadCount(unread);
			}
		} catch (error) {
			console.warn('⚠️ Could not fetch initial notifications:', error.message);
		}
	};

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

	// Fetch next payment due date
	useEffect(() => {
		const fetchPaymentDueDate = async () => {
			try {
				const token = getAuthToken();
				if (!token || isSuperAdmin) return;
				const res = await axios.get('/report/next-payment-due', {
					headers: { Authorization: `Bearer ${token}` }
				});
				if (res.data?.success) {
					setPaymentData(res.data);
				}
			} catch (err) {
				console.warn('Could not fetch payment due date:', err.message);
			}
		};
		fetchPaymentDueDate();
		
		// Refresh payment data every 5 minutes
		const interval = setInterval(fetchPaymentDueDate, 5 * 60 * 1000);
		return () => clearInterval(interval);
	}, [isSuperAdmin]);

	// Fetch initial notifications when component mounts
	useEffect(() => {
		fetchInitialNotifications();
		
		// Refresh notifications every 30 seconds
		const interval = setInterval(fetchInitialNotifications, 30 * 1000);
		return () => clearInterval(interval);
	}, []);

	// WebSocket connection for real-time notifications
	useEffect(() => {
		const token = getAuthToken();
		if (!token) return;

		// Connect to WebSocket - use /ws path (no token in URL to avoid 431 errors)
		const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
		const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
		
		console.log(`[Topbar WebSocket] Connecting to ${wsUrl}`);
		
		try {
			wsRef.current = new WebSocket(wsUrl);

			wsRef.current.onopen = () => {
				console.log('✅ WebSocket connected, sending auth token...');
				// Send auth token as first message (avoids 431 header size errors)
				wsRef.current.send(JSON.stringify({
					type: 'auth',
					token: token
				}));
			};

			wsRef.current.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data);
					
					// Handle connection response
					if (data.type === 'connection' && data.status === 'connected') {
						console.log('✅ WebSocket authenticated for real-time notifications');
						return;
					}

					// Handle different message types
					if (data.type === 'notification' && data.notification) {
						const notif = data.notification;
						// Add notification to list
						const newNotification = {
							id: notif.id || Date.now(),
							title: notif.title,
							message: notif.message,
							type: notif.notificationType || 'general',
							priority: notif.priority || 'normal',
							imageUrl: notif.imageUrl,
							timestamp: new Date().toISOString(),
							isRead: false,
							createdAt: new Date().toISOString()
						};
						
						setRealtimeNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
						setUnreadCount(prev => prev + 1);
						
						// Play notification sound
						playNotificationSound();
						
						// Browser notification
						if (Notification.permission === 'granted') {
							new Notification(notif.title, {
								body: notif.message,
								icon: '🔔',
								tag: `notification-${notif.id}`,
							});
						}
					}
				} catch (error) {
					console.error('Error parsing WebSocket message:', error);
				}
			};

			wsRef.current.onerror = (error) => {
				console.error('WebSocket error:', error);
			};

			wsRef.current.onclose = () => {
				console.warn('⚠️ WebSocket disconnected - notifications will still work on page refresh');
				// Don't reload the page - user can continue working
				// Notifications will be fetched on next page load
			};

		} catch (error) {
			console.error('WebSocket connection error:', error);
		}

		// Request notification permission
		if (Notification.permission === 'default') {
			Notification.requestPermission();
		}

		return () => {
			if (wsRef.current) {
				wsRef.current.close();
			}
		};
	}, []);

	// Play notification sound
	const playNotificationSound = () => {
		try {
			// Use Web Audio API to create a simple notification sound
			const audioContext = new (window.AudioContext || window.webkitAudioContext)();
			const oscillator = audioContext.createOscillator();
			const gainNode = audioContext.createGain();

			oscillator.connect(gainNode);
			gainNode.connect(audioContext.destination);

			// Create a pleasant notification sound (two tones)
			oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
			oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
			
			gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
			gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

			oscillator.start(audioContext.currentTime);
			oscillator.stop(audioContext.currentTime + 0.5);
		} catch (error) {
			console.warn('Notification sound error:', error);
		}
	};

	// Fetch and sync unread count from server
	const syncUnreadCount = async () => {
		try {
			const token = getAuthToken();
			if (!token) return;
			
			const res = await axios.get('/notifications/unread/count', {
				headers: { Authorization: `Bearer ${token}` }
			});
			
			if (res.data?.success && res.data?.data?.unreadCount !== undefined) {
				setUnreadCount(res.data.data.unreadCount);
				console.log('✅ Unread count synced:', res.data.data.unreadCount);
			}
		} catch (error) {
			console.warn('Could not sync unread count:', error.message);
		}
	};

	// Mark notification as read
	const markNotificationAsRead = async (notificationId) => {
		try {
			const token = getAuthToken();
			if (!token) return;
			
			// Get shop_id from storage to pass to backend
			const currentShopId = localStorage.getItem('shop_id') || sessionStorage.getItem('shop_id') || 0;
			
			const res = await axios.put(`/notifications/${notificationId}/read`, 
				{ shop_id: currentShopId },
				{
					headers: { Authorization: `Bearer ${token}` }
				}
			);
			
			if (res.data?.success) {
				// Update notification in state to mark as read
				setRealtimeNotifications(prev => 
					prev.map(notif => 
						notif.id === notificationId ? { ...notif, isRead: true } : notif
					)
				);
				// Decrement unread count
				setUnreadCount(prev => Math.max(0, prev - 1));
				console.log('✅ Notification marked as read:', notificationId);
				
				// Sync unread count from server to ensure accuracy
				setTimeout(() => syncUnreadCount(), 500);
			}
		} catch (error) {
			console.warn('Could not mark notification as read:', error.message);
		}
	};

	useEffect(() => {
		// Add CSS for mobile responsive styles
		const style = document.createElement('style');
		style.textContent = `
			/* Payment Due Banner Styles */
			.payment-due-banner {
				display: flex;
				align-items: center;
				justify-content: center;
				padding: 10px 16px;
				font-weight: 600;
				font-size: 14px;
				gap: 8px;
				animation: slideDown 0.3s ease-out;
			}

			@keyframes slideDown {
				from {
					opacity: 0;
					transform: translateY(-10px);
				}
				to {
					opacity: 1;
					transform: translateY(0);
				}
			}

			.payment-due-banner.overdue {
				background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%);
				border-bottom: 3px solid #dc2626;
				color: #7f1d1d;
			}

			.payment-due-banner.urgent {
				background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%);
				border-bottom: 3px solid #d97706;
				color: #78350f;
			}

			.payment-due-banner.warning {
				background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
				border-bottom: 3px solid #eab308;
				color: #713f12;
			}

			.payment-due-banner.normal {
				background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
				border-bottom: 3px solid #3b82f6;
				color: #1e40af;
			}

			.payment-due-banner.good {
				background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
				border-bottom: 3px solid #22c55e;
				color: #166534;
			}

			.payment-banner-icon {
				font-size: 16px;
			}

			.payment-banner-text {
				flex: 1;
			}

			.payment-banner-action {
				margin-left: 16px;
			}

			.payment-banner-action a {
				color: inherit;
				text-decoration: underline;
				font-weight: 700;
				cursor: pointer;
			}

			.payment-banner-action a:hover {
				opacity: 0.8;
			}

			.payment-banner-close {
				margin-left: auto;
				cursor: pointer;
				font-size: 18px;
			}

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
	const notificationMenuItems = realtimeNotifications.length > 0
		? [
			...realtimeNotifications.map((notif, index) => {
				// Format timestamp - show relative time (1 min ago, 15 mins ago, etc)
				const formatDate = (dateString) => {
					try {
						if (!dateString) return 'Just now';
						
						let date;
						
						// Handle different date formats
						if (typeof dateString === 'string') {
							// MySQL datetime format (YYYY-MM-DD HH:MM:SS)
							if (dateString.includes(' ') && !dateString.includes('T')) {
								const isoString = dateString.replace(' ', 'T');
								date = new Date(isoString);
							} 
							// ISO format with Z
							else if (dateString.includes('T') && dateString.includes('Z')) {
								date = new Date(dateString);
							}
							// ISO format without Z
							else if (dateString.includes('T')) {
								date = new Date(dateString + 'Z');
							}
							// Regular date string
							else {
								date = new Date(dateString);
							}
						} else {
							date = new Date(dateString);
						}
						
						// Check if date is valid
						if (isNaN(date.getTime())) {
							console.warn('Invalid date:', dateString);
							return 'Just now';
						}
						
						// Calculate time difference in seconds
						const now = new Date();
						const diffSeconds = Math.floor((now - date) / 1000);
						
						// Just now (less than 1 minute)
						if (diffSeconds < 60) {
							return 'Just now';
						}
						
						// Minutes
						const diffMinutes = Math.floor(diffSeconds / 60);
						if (diffMinutes < 60) {
							return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
						}
						
						// Hours
						const diffHours = Math.floor(diffSeconds / 3600);
						if (diffHours < 24) {
							return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
						}
						
						// Days
						const diffDays = Math.floor(diffSeconds / 86400);
						if (diffDays < 7) {
							return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
						}
						
						// Weeks
						const diffWeeks = Math.floor(diffSeconds / 604800);
						if (diffWeeks < 4) {
							return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
						}
						
						// Fallback: show full date
						return date.toLocaleString('en-US', { 
							month: 'short', 
							day: 'numeric', 
							hour: '2-digit', 
							minute: '2-digit',
							hour12: true
						});
					} catch (e) {
						console.warn('Date format error:', e, 'for:', dateString);
						return 'Just now';
					}
				};
				
				// Truncate message for brief description
				const briefDesc = notif.message?.substring(0, 60) + (notif.message?.length > 60 ? '...' : '') || '';
				
				return {
					key: `realtime-notif-${index}`,
					label: (
						<div 
							style={{
								padding: '8px 12px',
								background: !notif.isRead ? '#f0f5ff' : 'white',
								border: !notif.isRead ? '1px solid #91d5ff' : '1px solid #f0f0f0',
								borderRadius: '4px',
								marginBottom: '4px',
								cursor: 'pointer',
								transition: 'all 0.3s ease',
								maxWidth: '350px',
								minWidth: '280px'
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.background = '#e6f7ff';
								e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.08)';
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.background = !notif.isRead ? '#f0f5ff' : 'white';
								e.currentTarget.style.boxShadow = 'none';
							}}
							onClick={() => {
								// Mark as read
								markNotificationAsRead(notif.id);
								// Navigate to notifications page
								navigate('/notifications', { state: { notificationId: notif.id, title: notif.title } });
							}}
							title={notif.title}
						>
							<div style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'flex-start',
								gap: '8px'
							}}>
								<div style={{
									flex: 1,
									fontWeight: !notif.isRead ? 'bold' : 500,
									color: notif.priority === 'urgent' ? '#ff4d4f' : notif.priority === 'high' ? '#ff7a45' : '#262626',
									fontSize: '12px',
									lineHeight: '1.4',
									wordBreak: 'break-word'
								}}>
									{notif.priority === 'urgent' && '🔴 '}
									{notif.priority === 'high' && '🟠 '}
									{notif.title}
									{!notif.isRead && <span style={{marginLeft: '4px', color: '#1890ff'}}>●</span>}
								</div>
							</div>
							{briefDesc && (
								<div style={{
									fontSize: '11px',
									color: '#999',
									marginTop: '3px',
									lineHeight: '1.3',
									overflow: 'hidden',
									textOverflow: 'ellipsis',
									whiteSpace: 'nowrap',
									fontWeight: !notif.isRead ? '600' : 'normal'
								}}>
									{briefDesc}
								</div>
							)}
							<div style={{
								fontSize: '10px',
								color: '#bfbfbf',
								marginTop: '4px',
								textAlign: 'right'
							}}>
								{formatDate(notif.timestamp)}
							</div>
						</div>
					)
				};
			}),
			{
				key: 'view-all',
				label: (
					<div style={{
						padding: '6px 12px',
						borderTop: '1px solid #e8e8e8',
						marginTop: '4px',
						color: '#1890ff',
						fontWeight: 'bold',
						cursor: 'pointer',
						textAlign: 'center',
						fontSize: '12px'
					}}>
						<Link to="/notifications" style={{color: '#1890ff', textDecoration: 'none'}}>View All →</Link>
					</div>
				)
			}
		]
		: [
			{
				key: 'no-notif',
				label: (
					<div style={{padding: '12px', color: '#999', textAlign: 'center', fontSize: '12px'}}>
						No new notifications
					</div>
				)
			}
		];

	return (
		<>
		{/* Payment Due Date Banner - Only show when 3 or fewer days left or overdue */}
		{paymentData?.due_date && bannerVisible && (paymentData.is_overdue || paymentData.days_remaining <= 3) && (
				<div className={`payment-due-banner ${paymentData.is_overdue ? paymentData.urgency : 'good'}`}>
					<span className="payment-banner-icon">
						{paymentData.is_overdue ? '⚠️' : '✅'}
					</span>
					<span className="payment-banner-text">
						{paymentData.is_overdue ? (
							<>
								<strong>Payment Overdue!</strong> Your subscription payment was due.
							</>
						) : (
							<>
								<strong>Payment Due in {paymentData.days_remaining} day{paymentData.days_remaining !== 1 ? 's' : ''}</strong>
							</>
						)}
					</span>
					{paymentData.is_overdue && (
						<span className="payment-banner-action">
							<Link to="/subscription">Renew Now</Link>
						</span>
					)}
					<span className="payment-banner-close" onClick={() => setBannerVisible(false)}>
						<CloseOutlined />
					</span>
				</div>
			)}
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
					<Badge count={unreadCount} showZero style={{backgroundColor: unreadCount > 0 ? '#ff4d4f' : '#d9d9d9'}}>
						<Button
							type="text"
							icon={<BellOutlined style={{fontSize: '18px'}}/>}
							style={{color: '#fff'}}
							title="Real-time Notifications"
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
		</>
	)
}
