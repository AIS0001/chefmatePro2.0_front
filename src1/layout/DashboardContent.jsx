import React from 'react'

export default function DashboardContent() {
  return (
    <>
      
		<div className="page-wrapper">
            <div className="container-fluid pt-25">
				{/* <!-- Row --> */}
				<div className="row">
					<div className="col-lg-3 col-md-6 col-sm-6 col-xs-12">
						<div className="panel panel-default card-view pa-0">
							<div className="panel-wrapper collapse in">
								<div className="panel-body pa-0">
									<div className="sm-data-box bg-red">
										<div className="container-fluid">
											<div className="row">
												<div className="col-xs-6 text-center pl-0 pr-0 data-wrap-left">
													<span className="txt-light block counter"><span class="counter-anim">914,001</span></span>
													<span className="weight-500 uppercase-font txt-light block font-13">visits</span>
												</div>
												<div className="col-xs-6 text-center  pl-0 pr-0 data-wrap-right">
													<i className="zmdi zmdi-male-female txt-light data-right-rep-icon"></i>
												</div>
											</div>	
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div className="col-lg-3 col-md-6 col-sm-6 col-xs-12">
						<div className="panel panel-default card-view pa-0">
							<div className="panel-wrapper collapse in">
								<div className="panel-body pa-0">
									<div className="sm-data-box bg-yellow">
										<div className="container-fluid">
											<div className="row">
												<div className="col-xs-6 text-center pl-0 pr-0 data-wrap-left">
													<span className="txt-light block counter"><span class="counter-anim">46.41</span>%</span>
													<span className="weight-500 uppercase-font txt-light block">bounce rate</span>
												</div>
												<div className="col-xs-6 text-center  pl-0 pr-0 data-wrap-right">
													<i className="zmdi zmdi-redo txt-light data-right-rep-icon"></i>
												</div>
											</div>	
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div className="col-lg-3 col-md-6 col-sm-6 col-xs-12">
						<div className="panel panel-default card-view pa-0">
							<div className="panel-wrapper collapse in">
								<div className="panel-body pa-0">
									<div className="sm-data-box bg-green">
										<div className="container-fluid">
											<div className="row">
												<div className="col-xs-6 text-center pl-0 pr-0 data-wrap-left">
													<span className="txt-light block counter"><span class="counter-anim">4,054,876</span></span>
													<span className="weight-500 uppercase-font txt-light block">pageviews</span>
												</div>
												<div className="col-xs-6 text-center  pl-0 pr-0 data-wrap-right">
													<i className="zmdi zmdi-file txt-light data-right-rep-icon"></i>
												</div>
											</div>	
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div className="col-lg-3 col-md-6 col-sm-6 col-xs-12">
						<div className="panel panel-default card-view pa-0">
							<div className="panel-wrapper collapse in">
								<div className="panel-body pa-0">
									<div className="sm-data-box bg-blue">
										<div className="container-fluid">
											<div className="row">
												<div className="col-xs-6 text-center pl-0 pr-0 data-wrap-left">
													<span className="txt-light block counter"><span class="counter-anim">46.43</span>%</span>
													<span className="weight-500 uppercase-font txt-light block">growth rate</span>
												</div>
												<div className="col-xs-6 text-center  pl-0 pr-0 pt-25  data-wrap-right">
													<div id="sparkline_4" ></div>
												</div>
											</div>	
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
				{/* <!-- /Row -->
				
				<!-- Row --> */}
				<div className="row">
						<div className="col-lg-6 col-md-12 col-sm-12 col-xs-12">
                        <div className="panel panel-default card-view">
							<div className="panel-heading">
								<div className="pull-left">
									<h6 className="panel-title txt-dark">user statistics</h6>
								</div>
								<div className="pull-right">
									<span className="no-margin-switcher">
										<input type="checkbox" id="morris_switch"  className="js-switch" data-color="#ff2a00" data-secondary-color="#2879ff" data-size="small"/>	
									</span>	
								</div>
								<div className="clearfix"></div>
							</div>
							<div className="panel-wrapper collapse in">
                                <div className="panel-body">
									<div id="morris_extra_line_chart" class="morris-chart" ></div>
									<ul className="flex-stat mt-40">
										<li>
											<span className="block">Weekly Users</span>
											<span className="block txt-dark weight-500 font-18"><span class="counter-anim">3,24,222</span></span>
										</li>
										<li>
											<span className="block">Monthly Users</span>
											<span className="block txt-dark weight-500 font-18"><span class="counter-anim">1,23,432</span></span>
										</li>
										<li>
											<span className="block">Trend</span>
											<span className="block">
												<i className="zmdi zmdi-trending-up txt-success font-24"></i>
											</span>
										</li>
									</ul>
								</div>
							</div>
                        </div>
                    </div>
						<div className="col-lg-3 col-md-6 col-sm-6 col-xs-12">
						<div className="panel panel-default card-view">
							<div className="panel-wrapper collapse in">
                                <div className="panel-body sm-data-box-1">
									<span className="uppercase-font weight-500 font-14 block text-center txt-dark">customer satisfaction</span>	
									<div className="cus-sat-stat weight-500 txt-success text-center mt-5">
										<span className="counter-anim">93.13</span><span>%</span>
									</div>
									<div className="progress-anim mt-20">
										<div className="progress">
											<div className="progress-bar progress-bar-success wow animated progress-animated" role="progressbar" aria-valuenow="93.12" aria-valuemin="0" aria-valuemax="100"></div>
										</div>
									</div>
									<ul className="flex-stat mt-5">
										<li>
											<span className="block">Previous</span>
											<span className="block txt-dark weight-500 font-15">79.82</span>
										</li>
										<li>
											<span className="block">% Change</span>
											<span className="block txt-dark weight-500 font-15">+14.29</span>
										</li>
										<li>
											<span className="block">Trend</span>
											<span className="block">
												<i className="zmdi zmdi-trending-up txt-success font-20"></i>
											</span>
										</li>
									</ul>
								</div>
                            </div>
                        </div>
						<div className="panel panel-default card-view">
							<div className="panel-heading">
								<div className="pull-left">
									<h6 className="panel-title txt-dark">browser stats</h6>
								</div>
								<div className="pull-right">
									<a href="#" className="pull-left inline-block mr-15">
										<i className="zmdi zmdi-download"></i>
									</a>
									<a href="#" className="pull-left inline-block close-panel" data-effect="fadeOut">
										<i className="zmdi zmdi-close"></i>
									</a>
								</div>
								<div className="clearfix"></div>
							</div>
							<div className="panel-wrapper collapse in">
								<div className="panel-body">
									<div>
										<span className="pull-left inline-block capitalize-font txt-dark">
											google chrome
										</span>
										<span className="label label-warning pull-right">50%</span>
										<div className="clearfix"></div>
										<hr className="light-grey-hr row mt-10 mb-10"/>
										<span className="pull-left inline-block capitalize-font txt-dark">
											mozila firefox
										</span>
										<span className="label label-danger pull-right">10%</span>
										<div className="clearfix"></div>
										<hr className="light-grey-hr row mt-10 mb-10"/>
										<span className="pull-left inline-block capitalize-font txt-dark">
											Internet explorer
										</span>
										<span className="label label-success pull-right">30%</span>
										<div className="clearfix"></div>
										<hr className="light-grey-hr row mt-10 mb-10"/>
										<span className="pull-left inline-block capitalize-font txt-dark">
											safari
										</span>
										<span className="label label-primary pull-right">10%</span>
										<div className="clearfix"></div>
									</div>
								</div>	
							</div>
						</div>
					</div>
					<div className="col-lg-3 col-md-6 col-sm-6 col-xs-12">
                       <div className="panel panel-default card-view panel-refresh">
							<div className="refresh-container">
								<div className="la-anim-1"></div>
							</div>
							<div className="panel-heading">
								<div className="pull-left">
									<h6 className="panel-title txt-dark">Visit by Traffic Types</h6>
								</div>
								<div className="pull-right">
									<a href="#" className="pull-left inline-block refresh mr-15">
										<i className="zmdi zmdi-replay"></i>
									</a>
									<div className="pull-left inline-block dropdown">
										<a className="dropdown-toggle" data-toggle="dropdown" href="#" aria-expanded="false" role="button"><i class="zmdi zmdi-more-vert"></i></a>
										<ul className="dropdown-menu bullet dropdown-menu-right"  role="menu">
											<li role="presentation"><a href="javascript:void(0)" role="menuitem"><i className="icon wb-reply" aria-hidden="true"></i>Devices</a></li>
											<li role="presentation"><a href="javascript:void(0)" role="menuitem"><i className="icon wb-share" aria-hidden="true"></i>General</a></li>
											<li role="presentation"><a href="javascript:void(0)" role="menuitem"><i className="icon wb-trash" aria-hidden="true"></i>Referral</a></li>
										</ul>
									</div>
								</div>
								<div className="clearfix"></div>
							</div>
							<div className="panel-wrapper collapse in">
								<div className="panel-body">
									<div>
										<canvas id="chart_6" height="191"></canvas>
									</div>	
									<hr className="light-grey-hr row mt-10 mb-15"/>
									<div className="label-chatrs">
										<div className="">
											<span className="clabels clabels-lg inline-block bg-blue mr-10 pull-left"></span>
											<span className="clabels-text font-12 inline-block txt-dark capitalize-font pull-left"><span class="block font-15 weight-500 mb-5">44.46% organic</span><span class="block txt-grey">356 visits</span></span>
											<div id="sparkline_1" class="pull-right" ></div>
											<div className="clearfix"></div>
										</div>
									</div>
									<hr className="light-grey-hr row mt-10 mb-15"/>
									<div className="label-chatrs">
										<div className="">
											<span className="clabels clabels-lg inline-block bg-green mr-10 pull-left"></span>
											<span className="clabels-text font-12 inline-block txt-dark capitalize-font pull-left"><span class="block font-15 weight-500 mb-5">5.54% Refrral</span><span class="block txt-grey">36 visits</span></span>
											<div id="sparkline_2" class="pull-right" ></div>
											<div className="clearfix"></div>
										</div>
									</div>
									<hr className="light-grey-hr row mt-10 mb-15"/>
									<div className="label-chatrs">
										<div className="">
											<span className="clabels clabels-lg inline-block bg-yellow mr-10 pull-left"></span>
											<span className="clabels-text font-12 inline-block txt-dark capitalize-font pull-left"><span class="block font-15 weight-500 mb-5">50% Other</span><span class="block txt-grey">245 visits</span></span>
											<div id="sparkline_3" class="pull-right" ></div>
											<div className="clearfix"></div>
										</div>
									</div>
								</div>	
							</div>
						</div>
					</div>
				</div>
				{/* <!-- /Row -->
				
				<!-- Row --> */}
				<div className="row">
					<div className="col-lg-8 col-md-7 col-sm-12 col-xs-12">
						<div className="panel panel-default card-view panel-refresh">
							<div className="refresh-container">
								<div className="la-anim-1"></div>
							</div>
							<div className="panel-heading">
								<div className="pull-left">
									<h6 className="panel-title txt-dark">social campaigns</h6>
								</div>
								<div className="pull-right">
									<a href="#" className="pull-left inline-block refresh mr-15">
										<i className="zmdi zmdi-replay"></i>
									</a>
									<a href="#" className="pull-left inline-block full-screen mr-15">
										<i className="zmdi zmdi-fullscreen"></i>
									</a>
									<div className="pull-left inline-block dropdown">
										<a className="dropdown-toggle" data-toggle="dropdown" href="#" aria-expanded="false" role="button"><i class="zmdi zmdi-more-vert"></i></a>
										<ul className="dropdown-menu bullet dropdown-menu-right"  role="menu">
											<li role="presentation"><a href="javascript:void(0)" role="menuitem"><i className="icon wb-reply" aria-hidden="true"></i>Edit</a></li>
											<li role="presentation"><a href="javascript:void(0)" role="menuitem"><i className="icon wb-share" aria-hidden="true"></i>Delete</a></li>
											<li role="presentation"><a href="javascript:void(0)" role="menuitem"><i className="icon wb-trash" aria-hidden="true"></i>New</a></li>
										</ul>
									</div>
								</div>
								<div className="clearfix"></div>
							</div>
							<div className="panel-wrapper collapse in">
								<div className="panel-body row pa-0">
									<div className="table-wrap">
										<div className="table-responsive">
											<table className="table table-hover mb-0">
												<thead>
													<tr>
														<th>Campaign</th>
														<th>Client</th>
														<th>Changes</th>
														<th>Budget</th>
														<th>Status</th>
													</tr>
												</thead>
												<tbody>
													<tr>
														<td><span className="txt-dark weight-500">Facebook</span></td>
														<td>Beavis</td>
														<td><span className="txt-success"><i class="zmdi zmdi-caret-up mr-10 font-20"></i><span>2.43%</span></span></td>
														<td>
															<span className="txt-dark weight-500">$1478</span>
														</td>
														<td>
															<span className="label label-primary">Active</span>
														</td>
													</tr>
													<tr>
														<td><span className="txt-dark weight-500">Youtube</span></td>
														<td>Felix</td>
														<td><span className="txt-success"><i class="zmdi zmdi-caret-up mr-10 font-20"></i><span>1.43%</span></span></td>
														<td>
															<span className="txt-dark weight-500">$951</span>
														</td>
														<td>
															<span className="label label-danger">Closed</span>
														</td>
													</tr>
													<tr>
														<td><span className="txt-dark weight-500">Twitter</span></td>
														<td>Cannibus</td>
														<td><span className="txt-danger"><i class="zmdi zmdi-caret-down mr-10 font-20"></i><span>-8.43%</span></span></td>
														<td>
															<span className="txt-dark weight-500">$632</span>
														</td>
														<td>
															<span className="label label-default">Hold</span>
														</td>
													</tr>
													<tr>
														<td><span className="txt-dark weight-500">Spotify</span></td>
														<td>Neosoft</td>
														<td><span className="txt-success"><i class="zmdi zmdi-caret-up mr-10 font-20"></i><span>7.43%</span></span></td>
														<td>
															<span className="txt-dark weight-500">$325</span>
														</td>
														<td>
															<span className="label label-default">Hold</span>
														</td>
													</tr>
													<tr>
														<td><span className="txt-dark weight-500">Instagram</span></td>
														<td>Hencework</td>
														<td><span className="txt-success"><i class="zmdi zmdi-caret-up mr-10 font-20"></i><span>9.43%</span></span></td>
														<td>
															<span className="txt-dark weight-500">$258</span>
														</td>
														<td>
															<span className="label label-primary">Active</span>
														</td>
													</tr>
												</tbody>
											</table>
										</div>
									</div>	
								</div>	
							</div>
						</div>
					</div>
					<div className="col-lg-4 col-md-5 col-sm-12 col-xs-12">
						<div className="panel panel-default card-view panel-refresh">
							<div className="refresh-container">
								<div className="la-anim-1"></div>
							</div>
							<div className="panel-heading">
								<div className="pull-left">
									<h6 className="panel-title txt-dark">Advertising & Promotions</h6>
								</div>
								<div className="pull-right">
									<a href="#" className="pull-left inline-block refresh mr-15">
										<i className="zmdi zmdi-replay"></i>
									</a>
									<div className="pull-left inline-block dropdown">
										<a className="dropdown-toggle" data-toggle="dropdown" href="#" aria-expanded="false" role="button"><i class="zmdi zmdi-more-vert"></i></a>
										<ul className="dropdown-menu bullet dropdown-menu-right"  role="menu">
											<li role="presentation"><a href="javascript:void(0)" role="menuitem"><i className="icon wb-reply" aria-hidden="true"></i>option 1</a></li>
											<li role="presentation"><a href="javascript:void(0)" role="menuitem"><i className="icon wb-share" aria-hidden="true"></i>option 2</a></li>
											<li role="presentation"><a href="javascript:void(0)" role="menuitem"><i className="icon wb-trash" aria-hidden="true"></i>option 3</a></li>
										</ul>
									</div>
								</div>
								<div className="clearfix"></div>
							</div>
							<div className="panel-wrapper collapse in">
								<div className="panel-body">
									<div>
										<canvas id="chart_2" height="253"></canvas>
									</div>	
									<div className="label-chatrs mt-30">
										<div className="inline-block mr-15">
											<span className="clabels inline-block bg-yellow mr-5"></span>
											<span className="clabels-text font-12 inline-block txt-dark capitalize-font">Active</span>
										</div>
										<div className="inline-block mr-15">
											<span className="clabels inline-block bg-red mr-5"></span>
											<span className="clabels-text font-12 inline-block txt-dark capitalize-font">Closed</span>
										</div>	
										<div className="inline-block">
											<span className="clabels inline-block bg-green mr-5"></span>
											<span className="clabels-text font-12 inline-block txt-dark capitalize-font">Hold</span>
										</div>											
									</div>
								</div>
							</div>	
						</div>	
					</div>	
				</div>	
				{/* <!-- Row --> */}
			</div>
			
			{/* <!-- Footer --> */}
			<footer className="footer container-fluid pl-30 pr-30">
				<div className="row">
					<div className="col-sm-12">
						<p>2017 &copy; Hound. Pampered by Hencework</p>
					</div>
				</div>
			</footer>
			{/* <!-- /Footer --> */}
			
		</div>
        {/* <!-- /Main Content --> */}

    </>
  )
}
