import React from 'react'

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
					<a className='active' href="widgets.html"><div className="pull-left"><i class="zmdi zmdi-landscape mr-20"></i><span class="right-nav-text">Dashboard</span></div><div class="pull-right"><span class="label label-warning">8</span></div><div class="clearfix"></div></a>
				</li>
				
           
				<li>
					<a href="javascript:void(0);" data-toggle="collapse" data-target="#ecom_dr"><div className="pull-left"><i class="zmdi zmdi-shopping-basket mr-20"></i><span class="right-nav-text">Blogs</span></div><div class="pull-right"><span class="label label-success">hot</span></div><div class="clearfix"></div></a>
					<ul id="ecom_dr" className="collapse collapse-level-1">
						<li>
							<a href="e-commerce.html">New Blog</a>
						</li>
						<li>
							<a href="product.html">View Blogs</a>
						</li>
						<li>
							<a href="product-detail.html">Blog Category</a>
						</li>
						
					</ul>
				</li>
				<li>
					<a href="javascript:void(0);" data-toggle="collapse" data-target="#app_dr"><div className="pull-left"><i class="zmdi zmdi-apps mr-20"></i><span class="right-nav-text">Pages </span></div><div class="pull-right"><i class="zmdi zmdi-caret-down"></i></div><div class="clearfix"></div></a>
					<ul id="app_dr" className="collapse collapse-level-1">
						<li>
							<a href="chats.html">New Page</a>
						</li>
						<li>
							<a href="calendar.html">View Pages</a>
						</li>
						<li>
							<a href="weather.html">Categories</a>
						</li>
					
					</ul>
				</li>
				<li>
					<a href="widgets.html"><div className="pull-left"><i class="zmdi zmdi-flag mr-20"></i><span class="right-nav-text">widgets</span></div><div class="pull-right"><span class="label label-warning">8</span></div><div class="clearfix"></div></a>
				</li>
				<li><hr className="light-grey-hr mb-10"/></li>
				<li className="navigation-header">
					<span>Media</span> 
					<i className="zmdi zmdi-more"></i>
				</li>
                <li>
					<a href="javascript:void(0);" data-toggle="collapse" data-target="#media"><div className="pull-left"><i class="zmdi zmdi-apps mr-20"></i><span class="right-nav-text">Media </span></div><div class="pull-right"><i class="zmdi zmdi-caret-down"></i></div><div class="clearfix"></div></a>
					<ul id="media" className="collapse collapse-level-1">
						<li>
							<a href="chats.html">New Media</a>
						</li>
						<li>
							<a href="calendar.html">View Gallery</a>
						</li>
						
					
					</ul>
				</li>
				
				
			</ul>
		</div>
    </>
  )
}
