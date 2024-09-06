import React from 'react'
import { Link } from 'react-router-dom'
export default function Topbar() {
	return (
		<>

			<nav className="navbar navbar-inverse navbar-fixed-top">
				<div className="mobile-only-brand pull-left">
					<div className="nav-header pull-left">
						<div className="logo-wrap">
							<Link to="/dashboard">
								<img class="brand-img" src="../../dist/img/logo.png" alt="brand" />
								<span className="brand-text">CloudNet</span>
							</Link>
						</div>
					</div>
					<Link id="toggle_nav_btn" className="toggle-left-nav-btn inline-block ml-20 pull-left" to="javascript:void(0);"><i class="zmdi zmdi-menu"></i></Link>
					<Link id="toggle_mobile_search" data-toggle="collapse" data-target="#search_form" className="mobile-only-view" to="javascript:void(0);"><i class="zmdi zmdi-search"></i></Link>
					<Link id="toggle_mobile_nav" className="mobile-only-view" to="javascript:void(0);"><i class="zmdi zmdi-more"></i></Link>

				</div>
				<div id="mobile_only_nav" className="mobile-only-nav pull-right">
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
												<Link to="weather.html" className="connection-item">
													<i className="zmdi zmdi-cloud-outline txt-info"></i>
													<span className="block">weather</span>
												</Link>
											</li>
											<li>
												<Link to="inbox.html" className="connection-item">
													<i className="zmdi zmdi-email-open txt-success"></i>
													<span className="block">e-mail</span>
												</Link>
											</li>
											<li>
												<Link to="calendar.html" className="connection-item">
													<i className="zmdi zmdi-calendar-check txt-primary"></i>
													<span className="block">calendar</span>
												</Link>
											</li>
											<li>
												<Link to="vector-map.html" className="connection-item">
													<i className="zmdi zmdi-map txt-danger"></i>
													<span className="block">map</span>
												</Link>
											</li>
											<li>
												<Link to="chats.html" className="connection-item">
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
										<Link class="block text-center read-all" to="javascript:void(0)"> more </Link>
									</div>
								</li>
							</ul>
						</li>
						<li className="dropdown full-width-drp">
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
													<Link to="profile.html">profile</Link>
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
						</li>
						<li className="dropdown alert-drp">
							<Link to="#" className="dropdown-toggle" data-toggle="dropdown"><i class="zmdi zmdi-notifications top-nav-icon"></i><span class="top-nav-icon-badge">5</span></Link>
							<ul className="dropdown-menu alert-dropdown" data-dropdown-in="bounceIn" data-dropdown-out="bounceOut">
								<li>
									<div className="notification-box-head-wrap">
										<span className="notification-box-head pull-left inline-block">notifications</span>
										<Link class="txt-danger pull-right clear-notifications inline-block" to="javascript:void(0)"> clear all </Link>
										<div className="clearfix"></div>
										<hr className="light-grey-hr ma-0" />
									</div>
								</li>
								<li>
									<div className="streamline message-nicescroll-bar">
										<div className="sl-item">
											<Link to="javascript:void(0)">
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
											<Link to="javascript:void(0)">
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
											<Link to="javascript:void(0)">
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
											<Link to="javascript:void(0)">
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
											<Link to="javascript:void(0)">
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
										<Link class="block text-center read-all" to="javascript:void(0)"> read all </Link>
										<div className="clearfix"></div>
									</div>
								</li>
							</ul>
						</li>
						<li className="dropdown auth-drp">
							<Link to="#" className="dropdown-toggle pr-0" data-toggle="dropdown"><img src="../../dist/img/user1.png" alt="user_auth" class="user-auth-img img-circle" /><span class="user-online-status"></span></Link>
							<ul className="dropdown-menu user-auth-dropdown" data-dropdown-in="flipInX" data-dropdown-out="flipOutX">
								<li>
									<Link to="profile.html"><i className="zmdi zmdi-account"></i><span>Profile</span></Link>
								</li>
								<li>
									<Link to="#"><i className="zmdi zmdi-card"></i><span>my balance</span></Link>
								</li>
								<li>
									<Link to="inbox.html"><i className="zmdi zmdi-email"></i><span>Inbox</span></Link>
								</li>
								<li>
									<Link to="#"><i className="zmdi zmdi-settings"></i><span>Settings</span></Link>
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
									<Link to="#"><i className="zmdi zmdi-power"></i><span>Log Out</span></Link>
								</li>
							</ul>
						</li>
					</ul>
				</div>
			</nav>



		</>
	)
}
