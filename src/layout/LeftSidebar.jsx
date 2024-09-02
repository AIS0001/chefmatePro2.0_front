import React from 'react'
import { Link } from "react-router-dom"

export default function LeftSidebar() {
	return (
		<>
			<div className="fixed-sidebar-left">
				<ul className="nav navbar-nav side-nav nicescroll-bar">
					<li className="navigation-header">
						<span>Main</span>
						<i className="zmdi zmdi-more"></i>
					</li>
					<li>
						<Link className='active' to="/dashboard"><div className="pull-left"><i class="zmdi zmdi-landscape mr-20"></i><span class="right-nav-text">Dashboard</span></div><div class="pull-right"><span class="label label-warning">8</span></div><div class="clearfix"></div></Link>
					</li>


					<li>
						<Link to="javascript:void(0);" data-toggle="collapse" data-target="#ecom_dr"><div className="pull-left"><i class="zmdi zmdi-shopping-basket mr-20"></i><span class="right-nav-text">Blogs</span></div><div class="pull-right"><span class="label label-success">hot</span></div><div class="clearfix"></div></Link>
						<ul id="ecom_dr" className="collapse collapse-level-1">
							<li>
								<Link to="e-commerce.html">New Blog</Link>
							</li>
							<li>
								<Link to="product.html">View Blogs</Link>
							</li>
							<li>
								<Link to="product-detail.html">Blog Category</Link>
							</li>

						</ul>
					</li>
					<li>
						<Link to="javascript:void(0);" data-toggle="collapse" data-target="#app_dr"><div className="pull-left"><i class="zmdi zmdi-apps mr-20"></i><span class="right-nav-text">Pages </span></div><div class="pull-right"><i class="zmdi zmdi-caret-down"></i></div><div class="clearfix"></div></Link>
						<ul id="app_dr" className="collapse collapse-level-1">
							<li>
								<Link to="pages/newpage">New Page</Link>
							</li>
							<li>
								<Link to="pages/viewpage">View Pages</Link>
							</li>
							<li>
								<Link to="categories">Categories</Link>
							</li>

						</ul>
					</li>
					<li>
						<Link to="widgets.html"><div className="pull-left"><i class="zmdi zmdi-flag mr-20"></i><span class="right-nav-text">widgets</span></div><div class="pull-right"><span class="label label-warning">8</span></div><div class="clearfix"></div></Link>
					</li>
					<li><hr className="light-grey-hr mb-10" /></li>
					<li className="navigation-header">
						<span>Media</span>
						<i className="zmdi zmdi-more"></i>
					</li>
					<li>
						<Link to="javascript:void(0);" data-toggle="collapse" data-target="#media"><div className="pull-left"><i class="zmdi zmdi-apps mr-20"></i><span class="right-nav-text">Media </span></div><div class="pull-right"><i class="zmdi zmdi-caret-down"></i></div><div class="clearfix"></div></Link>
						<ul id="media" className="collapse collapse-level-1">
							<li>
								<Link to="chats.html">New Media</Link>
							</li>
							<li>
								<Link to="calendar.html">View Gallery</Link>
							</li>


						</ul>
					</li>


				</ul>
			</div>
		</>
	)
}
