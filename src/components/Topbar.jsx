import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
export default function Topbar({ onToggleSidebar, isSidebarOpen }) {
	const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
	
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
		`;
		document.head.appendChild(style);
		
		return () => {
			document.head.removeChild(style);
		};
	}, []);

	return (
		<>
			<nav className="navbar navbar-inverse navbar-fixed-top">
				<div className="mobile-only-brand pull-left">
					<div className="nav-header pull-left">
						<div className="logo-wrap">
							<Link to="/dashboard">
								{isSidebarOpen ? (
									<img className="brand-img" src="../../dist/img/logo.png" alt="brand" />
								) : (
									<img className="brand-img" style={{ width: "40px" }} src="../../dist/img/cloudico.png" alt="brand-icon" />
								)}
							</Link>
						</div>
					</div>
					<Link 
						id="toggle_nav_btn" 
						onClick={(e) => {
							e.preventDefault();
							onToggleSidebar();
						}} 
						className="toggle-left-nav-btn inline-block ml-20 pull-left" 
						to="#"
					>
						<i className="zmdi zmdi-menu"></i>
					</Link>
					<Link id="toggle_mobile_search" data-toggle="collapse" data-target="#search_form" className="mobile-only-view" to="#"><i className="zmdi zmdi-search"></i></Link>
					<Link 
						id="toggle_mobile_nav" 
						className="mobile-only-view" 
						to="#"
						onClick={(e) => {
							e.preventDefault();
							toggleMobileNav();
						}}
					>
						<i className="zmdi zmdi-more"></i>
					</Link>
				</div>
				
				{/* Center scrolling text */}
				<div className="center-scrolling-text">
					<div className="scrolling-content">
						ChefMate POS
					</div>
				</div>

				<div id="mobile_only_nav" className={`mobile-only-nav pull-right ${isMobileNavOpen ? 'show' : ''}`}>
					<ul className="nav navbar-right top-nav pull-right">
						<li>
							<Link id="open_right_sidebar" to="#"><i className="zmdi zmdi-settings top-nav-icon"></i></Link>
						</li>
						<li className="dropdown app-drp">
							<Link to="#" className="dropdown-toggle" data-toggle="dropdown"><i class="zmdi zmdi-apps top-nav-icon"></i></Link>
							<ul className="dropdown-menu app-dropdown" data-dropdown-in="slideInRight" data-dropdown-out="flipOutX">
								<li>
									<div className="app-nicescroll-bar">
										<ul className="app-icon-wrap pa-10">
											<li>
												<Link to="#" className="connection-item">
													<i className="zmdi zmdi-cloud-outline txt-info"></i>
													<span className="block">weather</span>
												</Link>
											</li>
											<li>
												<Link to="#" className="connection-item">
													<i className="zmdi zmdi-email-open txt-success"></i>
													<span className="block">e-mail</span>
												</Link>
											</li>
											<li>
												<Link to="#" className="connection-item">
													<i className="zmdi zmdi-calendar-check txt-primary"></i>
													<span className="block">calendar</span>
												</Link>
											</li>
											<li>
												<Link to="#" className="connection-item">
													<i className="zmdi zmdi-map txt-danger"></i>
													<span className="block">map</span>
												</Link>
											</li>
											<li>
												<Link to="#" className="connection-item">
													<i className="zmdi zmdi-comment-outline txt-warning"></i>
													<span className="block">chat</span>
												</Link>
											</li>
											<li>
												<Link to="/users/editprofile" className="connection-item">
													<i className="zmdi zmdi-assignment-account"></i>
													<span className="block">Profile</span>
												</Link>
											</li>
										</ul>
									</div>
								</li>
								<li>
									<div className="app-box-bottom-wrap">
										<hr className="light-grey-hr ma-0" />
										<Link class="block text-center read-all" to="#"> more </Link>
									</div>
								</li>
							</ul>
						</li>
						{/* <li className="dropdown full-width-drp">
							<Link to="#" className="dropdown-toggle" data-toggle="dropdown"><i class="zmdi zmdi-more-vert top-nav-icon"></i></Link>
							<ul className="dropdown-menu mega-menu pa-0" data-dropdown-in="fadeIn" data-dropdown-out="fadeOut">
								<li className="product-nicescroll-bar row">
									<ul className="pa-20">
										<li className="col-md-3 col-xs-6 col-menu-list">
											<Link to="javascript:void(0);"><div className="pull-left"><i class="zmdi zmdi-landscape mr-20"></i><span class="right-nav-text">Dashboard</span></div><div class="pull-right"><i class="zmdi zmdi-caret-down"></i></div><div class="clearfix"></div></Link>
											<hr className="light-grey-hr ma-0" />
											<ul>
												<li>
													<Link to="index.html">Analytical</Link>
												</li>
												<li>
													<Link to="index2.html">Demographic</Link>
												</li>
												<li>
													<Link to="index3.html">Project</Link>
												</li>
												<li>
													<Link to="/users/editprofile">profile</Link>
												</li>
											</ul>
											<Link to="widgets.html"><div className="pull-left"><i class="zmdi zmdi-flag mr-20"></i><span class="right-nav-text">widgets</span></div><div class="pull-right"><span class="label label-warning">8</span></div><div class="clearfix"></div></Link>
											<hr className="light-grey-hr ma-0" />
											<Link to="documentation.html"><div className="pull-left"><i class="zmdi zmdi-book mr-20"></i><span class="right-nav-text">documentation</span></div><div class="clearfix"></div></Link>
											<hr className="light-grey-hr ma-0" />
										</li>
										<li className="col-md-3 col-xs-6 col-menu-list">
											<Link to="javascript:void(0);">
												<div className="pull-left">
													<i className="zmdi zmdi-shopping-basket mr-20"></i><span class="right-nav-text">E-Commerce</span>
												</div>
												<div className="pull-right"><span class="label label-success">hot</span>
												</div>
												<div className="clearfix"></div>
											</Link>
											<hr className="light-grey-hr ma-0" />
											<ul>
												<li>
													<Link to="e-commerce.html">Dashboard</Link>
												</li>
												<li>
													<Link to="product.html">Products</Link>
												</li>
												<li>
													<Link to="product-detail.html">Product Detail</Link>
												</li>
												<li>
													<Link to="add-products.html">Add Product</Link>
												</li>
												<li>
													<Link to="product-orders.html">Orders</Link>
												</li>
												<li>
													<Link to="product-cart.html">Cart</Link>
												</li>
												<li>
													<Link to="product-checkout.html">Checkout</Link>
												</li>
											</ul>
										</li>
										<li className="col-md-6 col-xs-12 preview-carousel">
											<Link to="javascript:void(0);"><div className="pull-left"><span class="right-nav-text">latest products</span></div><div class="clearfix"></div></Link>
											<hr className="light-grey-hr ma-0" />
											<div className="product-carousel owl-carousel owl-theme text-center">
												<Link to="#">
													<img src="../../dist/img/chair.jpg" alt="chair" />
													<span>Circle chair</span>
												</Link>
												<Link to="#">
													<img src="../../../../dist/img/chair2.jpg" alt="chair" />
													<span>square chair</span>
												</Link>
												<Link to="#">
													<img src="dist/img/chair3.jpg" alt="chair" />
													<span>semi circle chair</span>
												</Link>
												<Link to="#">
													<img src="../../dist/img/chair4.jpg" alt="chair" />
													<span>wooden chair</span>
												</Link>
												<Link to="#">
													<img src="../../dist/img/chair2.jpg" alt="chair" />
													<span>square chair</span>
												</Link>
											</div>
										</li>
									</ul>
								</li>
							</ul>
						</li> */}
						<li className="dropdown alert-drp">
							<Link to="#" className="dropdown-toggle" data-toggle="dropdown"><i class="zmdi zmdi-notifications top-nav-icon"></i><span class="top-nav-icon-badge">5</span></Link>
							<ul className="dropdown-menu alert-dropdown" data-dropdown-in="bounceIn" data-dropdown-out="bounceOut">
								<li>
									<div className="notification-box-head-wrap">
										<span className="notification-box-head pull-left inline-block">notifications</span>
										<Link class="txt-danger pull-right clear-notifications inline-block" to="#"> clear all </Link>
										<div className="clearfix"></div>
										<hr className="light-grey-hr ma-0" />
									</div>
								</li>
								<li>
									<div className="streamline message-nicescroll-bar">
										<div className="sl-item">
											<Link to="#">
												<div className="icon bg-green">
													<i className="zmdi zmdi-flag"></i>
												</div>
												<div className="sl-content">
													<span className="inline-block capitalize-font  pull-left truncate head-notifications">
														New subscription created</span>
													<span className="inline-block font-11  pull-right notifications-time">2pm</span>
													<div className="clearfix"></div>
													<p class="truncate">Your customer subscribed htmlFor the basic plan. The customer will pay $25 per month.</p>
												</div>
											</Link>
										</div>
										<hr className="light-grey-hr ma-0" />
										<div className="sl-item">
											<Link to="#">
												<div className="icon bg-yellow">
													<i className="zmdi zmdi-trending-down"></i>
												</div>
												<div className="sl-content">
													<span className="inline-block capitalize-font  pull-left truncate head-notifications txt-warning">Server #2 not responding</span>
													<span className="inline-block font-11 pull-right notifications-time">1pm</span>
													<div className="clearfix"></div>
													<p className="truncate">Some technical error occurred needs to be resolved.</p>
												</div>
											</Link>
										</div>
										<hr className="light-grey-hr ma-0" />
										<div className="sl-item">
											<Link to="#">
												<div className="icon bg-blue">
													<i className="zmdi zmdi-email"></i>
												</div>
												<div className="sl-content">
													<span className="inline-block capitalize-font  pull-left truncate head-notifications">2 new messages</span>
													<span className="inline-block font-11  pull-right notifications-time">4pm</span>
													<div className="clearfix"></div>
													<p class="truncate"> The last payment htmlFor your G Suite Basic subscription failed.</p>
												</div>
											</Link>
										</div>
										<hr className="light-grey-hr ma-0" />
										<div className="sl-item">
											<Link to="#">
												<div className="sl-avatar">
													<img class="img-responsive" src="../../dist/img/avatar.jpg" alt="avatar" />
												</div>
												<div className="sl-content">
													<span className="inline-block capitalize-font  pull-left truncate head-notifications">Sandy Doe</span>
													<span className="inline-block font-11  pull-right notifications-time">1pm</span>
													<div className="clearfix"></div>
													<p className="truncate">Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit</p>
												</div>
											</Link>
										</div>
										<hr className="light-grey-hr ma-0" />
										<div className="sl-item">
											<Link to="#">
												<div className="icon bg-red">
													<i className="zmdi zmdi-storage"></i>
												</div>
												<div className="sl-content">
													<span className="inline-block capitalize-font  pull-left truncate head-notifications txt-danger">99% server space occupied.</span>
													<span className="inline-block font-11  pull-right notifications-time">1pm</span>
													<div className="clearfix"></div>
													<p className="truncate">consectetur, adipisci velit.</p>
												</div>
											</Link>
										</div>
									</div>
								</li>
								<li>
									<div className="notification-box-bottom-wrap">
										<hr className="light-grey-hr ma-0" />
										<Link class="block text-center read-all" to="#"> read all </Link>
										<div className="clearfix"></div>
									</div>
								</li>
							</ul>
						</li>
						<li className="dropdown auth-drp">
							<Link to="#" className="dropdown-toggle pr-0" data-toggle="dropdown"><img src="../../dist/img/user1.png" alt="user_auth" class="user-auth-img img-circle" /><span class="user-online-status"></span></Link>
							<ul className="dropdown-menu user-auth-dropdown" data-dropdown-in="flipInX" data-dropdown-out="flipOutX">
								<li>
									<Link to="/users/editprofile"><i className="zmdi zmdi-account"></i><span>Profile</span></Link>
								</li>
								<li>
									<Link to="#"><i className="zmdi zmdi-card"></i><span>my balance</span></Link>
								</li>
								<li>
									<Link to="#"><i className="zmdi zmdi-email"></i><span>Inbox</span></Link>
								</li>
								<li>
									<Link to="/setting/companyinfo"><i className="zmdi zmdi-settings"></i><span>Settings</span></Link>
								</li>
								<li className="divider"></li>
								<li className="sub-menu show-on-hover">
									<Link to="#" className="dropdown-toggle pr-0 level-2-drp"><i class="zmdi zmdi-check text-success"></i> available</Link>
									<ul className="dropdown-menu open-left-side">
										<li>
											<Link to="#"><i className="zmdi zmdi-check text-success"></i><span>available</span></Link>
										</li>
										<li>
											<Link to="#"><i className="zmdi zmdi-circle-o text-warning"></i><span>busy</span></Link>
										</li>
										<li>
											<Link to="#"><i className="zmdi zmdi-minus-circle-outline text-danger"></i><span>offline</span></Link>
										</li>
									</ul>
								</li>
								<li className="divider"></li>
								<li>
									<Link to="/logout"><i className="zmdi zmdi-power"></i><span>Log Out</span></Link>
								</li>
							</ul>
						</li>
					</ul>
				</div>
			</nav>
		</>
	)
}
