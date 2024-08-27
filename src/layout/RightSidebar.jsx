import React from 'react'

export default function RightSidebar() {
  return (
 <>
 		
		<div className="fixed-sidebar-right">
			<ul className="right-sidebar">
				<li>
					<div  className="tab-struct custom-tab-1">
						<ul role="tablist" class="nav nav-tabs" id="right_sidebar_tab">
							<li class="active" role="presentation"><a aria-expanded="true"  data-toggle="tab" role="tab" id="chat_tab_btn" href="#chat_tab">chat</a></li>
							<li role="presentation" class=""><a  data-toggle="tab" id="messages_tab_btn" role="tab" href="#messages_tab" aria-expanded="false">messages</a></li>
							<li role="presentation" class=""><a  data-toggle="tab" id="todo_tab_btn" role="tab" href="#todo_tab" aria-expanded="false">todo</a></li>
						</ul>
						<div class="tab-content" id="right_sidebar_content">
							<div  id="chat_tab" className="tab-pane fade active in" role="tabpanel">
								<div className="chat-cmplt-wrap">
									<div className="chat-box-wrap">
										<div className="add-friend">
											<a href="javascript:void(0)" className="inline-block txt-grey">
												<i className="zmdi zmdi-more"></i>
											</a>	
											<span className="inline-block txt-dark">users</span>
											<a href="javascript:void(0)" className="inline-block text-right txt-grey"><i class="zmdi zmdi-plus"></i></a>
											<div className="clearfix"></div>
										</div>
										<form role="search" className="chat-search pl-15 pr-15 pb-15">
											<div className="input-group">
												<input type="text" id="example-input1-group2" name="example-input1-group2" class="form-control" placeHolder="Search"/>
												<span className="input-group-btn">
												<button type="button" className="btn  btn-default"><i class="zmdi zmdi-search"></i></button>
												</span>
											</div>
										</form>
										<div id="chat_list_scroll">
											<div className="nicescroll-bar">
												<ul className="chat-list-wrap">
													<li className="chat-list">
														<div className="chat-body">
															<a  href="javascript:void(0)">
																<div className="chat-data">
																	<img class="user-img img-circle"  src="dist/img/user.png" alt="user"/>
																	<div className="user-data">
																		<span className="name block capitalize-font">Clay Masse</span>
																		<span className="time block truncate txt-grey">No one saves us but ourselves.</span>
																	</div>
																	<div className="status away"></div>
																	<div className="clearfix"></div>
																</div>
															</a>
															<a  href="javascript:void(0)">
																<div className="chat-data">
																	<img class="user-img img-circle"  src="dist/img/user1.png" alt="user"/>
																	<div className="user-data">
																		<span className="name block capitalize-font">Evie Ono</span>
																		<span className="time block truncate txt-grey">Unity is strength</span>
																	</div>
																	<div className="status offline"></div>
																	<div className="clearfix"></div>
																</div>
															</a>
															<a  href="javascript:void(0)">
																<div className="chat-data">
																	<img class="user-img img-circle"  src="dist/img/user2.png" alt="user"/>
																	<div className="user-data">
																		<span className="name block capitalize-font">Madalyn Rascon</span>
																		<span className="time block truncate txt-grey">Respect yourself if you would have others respect you.</span>
																	</div>
																	<div className="status online"></div>
																	<div className="clearfix"></div>
																</div>
															</a>
															<a  href="javascript:void(0)">
																<div className="chat-data">
																	<img class="user-img img-circle"  src="dist/img/user3.png" alt="user"/>
																	<div className="user-data">
																		<span className="name block capitalize-font">Mitsuko Heid</span>
																		<span className="time block truncate txt-grey">I’m thankful.</span>
																	</div>
																	<div className="status online"></div>
																	<div className="clearfix"></div>
																</div>
															</a>
															<a  href="javascript:void(0)">
																<div className="chat-data">
																	<img class="user-img img-circle"  src="dist/img/user.png" alt="user"/>
																	<div className="user-data">
																		<span className="name block capitalize-font">Ezequiel Merideth</span>
																		<span className="time block truncate txt-grey">Patience is bitter.</span>
																	</div>
																	<div className="status offline"></div>
																	<div className="clearfix"></div>
																</div>
															</a>
															<a  href="javascript:void(0)">
																<div className="chat-data">
																	<img class="user-img img-circle"  src="dist/img/user1.png" alt="user"/>
																	<div className="user-data">
																		<span className="name block capitalize-font">Jonnie Metoyer</span>
																		<span className="time block truncate txt-grey">Genius is eternal patience.</span>
																	</div>
																	<div className="status online"></div>
																	<div className="clearfix"></div>
																</div>
															</a>
															<a  href="javascript:void(0)">
																<div className="chat-data">
																	<img class="user-img img-circle"  src="dist/img/user2.png" alt="user"/>
																	<div className="user-data">
																		<span className="name block capitalize-font">Angelic Lauver</span>
																		<span className="time block truncate txt-grey">Every burden is a blessing.</span>
																	</div>
																	<div className="status away"></div>
																	<div className="clearfix"></div>
																</div>
															</a>
															<a  href="javascript:void(0)">
																<div className="chat-data">
																	<img class="user-img img-circle"  src="dist/img/user3.png" alt="user"/>
																	<div className="user-data">
																		<span className="name block capitalize-font">Priscila Shy</span>
																		<span className="time block truncate txt-grey">Wise to resolve, and patient to perform.</span>
																	</div>
																	<div className="status online"></div>
																	<div className="clearfix"></div>
																</div>
															</a>
															<a  href="javascript:void(0)">
																<div className="chat-data">
																	<img class="user-img img-circle"  src="dist/img/user4.png" alt="user"/>
																	<div className="user-data">
																		<span className="name block capitalize-font">Linda Stack</span>
																		<span className="time block truncate txt-grey">Our patience will achieve more than our force.</span>
																	</div>
																	<div className="status away"></div>
																	<div className="clearfix"></div>
																</div>
															</a>
														</div>
													</li>
												</ul>
											</div>
										</div>
									</div>
									<div className="recent-chat-box-wrap">
										<div className="recent-chat-wrap">
											<div className="panel-heading ma-0">
												<div className="goto-back">
													<a  id="goto_back" href="javascript:void(0)" className="inline-block txt-grey">
														<i className="zmdi zmdi-chevron-left"></i>
													</a>	
													<span className="inline-block txt-dark">ryan</span>
													<a href="javascript:void(0)" className="inline-block text-right txt-grey"><i class="zmdi zmdi-more"></i></a>
													<div className="clearfix"></div>
												</div>
											</div>
											<div className="panel-wrapper collapse in">
												<div className="panel-body pa-0">
													<div className="chat-content">
														<ul className="nicescroll-bar pt-20">
															<li className="friend">
																<div className="friend-msg-wrap">
																	<img class="user-img img-circle block pull-left"  src="dist/img/user.png" alt="user"/>
																	<div className="msg pull-left">
																		<p>Hello Jason, how are you, it's been a long time since we last met?</p>
																		<div className="msg-per-detail text-right">
																			<span className="msg-time txt-grey">2:30 PM</span>
																		</div>
																	</div>
																	<div className="clearfix"></div>
																</div>	
															</li>
															<li className="self mb-10">
																<div className="self-msg-wrap">
																	<div className="msg block pull-right"> Oh, hi Sarah I'm have got a new job now and is going great.
																		<div className="msg-per-detail text-right">
																			<span className="msg-time txt-grey">2:31 pm</span>
																		</div>
																	</div>
																	<div className="clearfix"></div>
																</div>	
															</li>
															<li className="self">
																<div className="self-msg-wrap">
																	<div className="msg block pull-right">  How about you?
																		<div className="msg-per-detail text-right">
																			<span className="msg-time txt-grey">2:31 pm</span>
																		</div>
																	</div>
																	<div className="clearfix"></div>
																</div>	
															</li>
															<li className="friend">
																<div className="friend-msg-wrap">
																	<img class="user-img img-circle block pull-left"  src="dist/img/user.png" alt="user"/>
																	<div className="msg pull-left"> 
																		<p>Not too bad.</p>
																		<div className="msg-per-detail  text-right">
																			<span className="msg-time txt-grey">2:35 pm</span>
																		</div>
																	</div>
																	<div className="clearfix"></div>
																</div>	
															</li>
														</ul>
													</div>
													<div className="input-group">
														<input type="text" id="input_msg_send" name="send-msg" class="input-msg-send form-control" placeHolder="Type something"/>
														<div className="input-group-btn emojis">
															<div className="dropup">
																<button type="button" className="btn  btn-default  dropdown-toggle" data-toggle="dropdown" ><i class="zmdi zmdi-mood"></i></button>
																<ul className="dropdown-menu dropdown-menu-right">
																	<li><a href="javascript:void(0)">Action</a></li>
																	<li><a href="javascript:void(0)">Another action</a></li>
																	<li className="divider"></li>
																	<li><a href="javascript:void(0)">Separated link</a></li>
																</ul>
															</div>
														</div>
														<div className="input-group-btn attachment">
															<div className="fileupload btn  btn-default"><i class="zmdi zmdi-attachment-alt"></i>
																<input type="file" className="upload"/>
															</div>
														</div>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
								
							<div id="messages_tab" className="tab-pane fade" role="tabpanel">
								<div className="message-box-wrap">
									<div className="msg-search">
										<a href="javascript:void(0)" className="inline-block txt-grey">
											<i className="zmdi zmdi-more"></i>
										</a>	
										<span className="inline-block txt-dark">messages</span>
										<a href="javascript:void(0)" className="inline-block text-right txt-grey"><i class="zmdi zmdi-search"></i></a>
										<div className="clearfix"></div>
									</div>
									<div className="set-height-wrap">
										<div className="streamline message-box nicescroll-bar">
											<a href="javascript:void(0)">
												<div className="sl-item unread-message">
													<div className="sl-avatar avatar avatar-sm avatar-circle">
														<img class="img-responsive img-circle" src="dist/img/user.png" alt="avatar"/>
													</div>
													<div className="sl-content">
														<span className="inline-block capitalize-font   pull-left message-per">Clay Masse</span>
														<span className="inline-block font-11  pull-right message-time">12:28 AM</span>
														<div className="clearfix"></div>
														<span className=" truncate message-subject">Themeforest message sent via your envato market profile</span>
														<p className="txt-grey truncate">Neque porro quisquam est qui dolorem ipsu messm quia dolor sit amet, consectetur, adipisci velit</p>
													</div>
												</div>
											</a>
											<a href="javascript:void(0)">
												<div className="sl-item">
													<div className="sl-avatar avatar avatar-sm avatar-circle">
														<img class="img-responsive img-circle" src="dist/img/user1.png" alt="avatar"/>
													</div>
													<div className="sl-content">
														<span className="inline-block capitalize-font   pull-left message-per">Evie Ono</span>
														<span className="inline-block font-11  pull-right message-time">1 Feb</span>
														<div className="clearfix"></div>
														<span className=" truncate message-subject">Pogody theme support</span>
														<p className="txt-grey truncate">Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit</p>
													</div>
												</div>
											</a>
											<a href="javascript:void(0)">
												<div className="sl-item">
													<div className="sl-avatar avatar avatar-sm avatar-circle">
														<img class="img-responsive img-circle" src="dist/img/user2.png" alt="avatar"/>
													</div>
													<div className="sl-content">
														<span className="inline-block capitalize-font   pull-left message-per">Madalyn Rascon</span>
														<span className="inline-block font-11  pull-right message-time">31 Jan</span>
														<div className="clearfix"></div>
														<span className=" truncate message-subject">Congratulations from design nominees</span>
														<p className="txt-grey truncate">Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit</p>
													</div>
												</div>
											</a>
											<a href="javascript:void(0)">
												<div className="sl-item unread-message">
													<div className="sl-avatar avatar avatar-sm avatar-circle">
														<img class="img-responsive img-circle" src="dist/img/user3.png" alt="avatar"/>
													</div>
													<div className="sl-content">
														<span className="inline-block capitalize-font   pull-left message-per">Ezequiel Merideth</span>
														<span className="inline-block font-11  pull-right message-time">29 Jan</span>
														<div className="clearfix"></div>
														<span className=" truncate message-subject">Themeforest item support message</span>
														<p className="txt-grey truncate">Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit</p>
													</div>
												</div>
											</a>
											<a href="javascript:void(0)">
												<div className="sl-item unread-message">
													<div className="sl-avatar avatar avatar-sm avatar-circle">
														<img class="img-responsive img-circle" src="dist/img/user4.png" alt="avatar"/>
													</div>
													<div className="sl-content">
														<span className="inline-block capitalize-font   pull-left message-per">Jonnie Metoyer</span>
														<span className="inline-block font-11  pull-right message-time">27 Jan</span>
														<div className="clearfix"></div>
														<span className=" truncate message-subject">Help with beavis contact form</span>
														<p className="txt-grey truncate">Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit</p>
													</div>
												</div>
											</a>
											<a href="javascript:void(0)">
												<div className="sl-item">
													<div className="sl-avatar avatar avatar-sm avatar-circle">
														<img class="img-responsive img-circle" src="dist/img/user.png" alt="avatar"/>
													</div>
													<div className="sl-content">
														<span className="inline-block capitalize-font   pull-left message-per">Priscila Shy</span>
														<span className="inline-block font-11  pull-right message-time">19 Jan</span>
														<div className="clearfix"></div>
														<span className=" truncate message-subject">Your uploaded theme is been selected</span>
														<p className="txt-grey truncate">Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit</p>
													</div>
												</div>
											</a>
											<a href="javascript:void(0)">
												<div className="sl-item">
													<div className="sl-avatar avatar avatar-sm avatar-circle">
														<img class="img-responsive img-circle" src="dist/img/user1.png" alt="avatar"/>
													</div>
													<div className="sl-content">
														<span className="inline-block capitalize-font   pull-left message-per">Linda Stack</span>
														<span className="inline-block font-11  pull-right message-time">13 Jan</span>
														<div className="clearfix"></div>
														<span className=" truncate message-subject"> A new rating has been received</span>
														<p className="txt-grey truncate">Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit</p>
													</div>
												</div>
											</a>
										</div>
									</div>
								</div>
							</div>
							<div  id="todo_tab" className="tab-pane fade" role="tabpanel">
								<div className="todo-box-wrap">
									<div className="add-todo">
										<a href="javascript:void(0)" className="inline-block txt-grey">
											<i className="zmdi zmdi-more"></i>
										</a>	
										<span className="inline-block txt-dark">todo list</span>
										<a href="javascript:void(0)" className="inline-block text-right txt-grey"><i class="zmdi zmdi-plus"></i></a>
										<div className="clearfix"></div>
									</div>
									<div className="set-height-wrap">
									
										<ul className="todo-list nicescroll-bar">
											<li className="todo-item">
												<div className="checkbox checkbox-default">
													<input type="checkbox" id="checkbox01"/>
													<label htmlFor="checkbox01">Record The First Episode</label>
												</div>
											</li>
											<li>
												<hr className="light-grey-hr"/>
											</li>
											<li className="todo-item">
												<div className="checkbox checkbox-pink">
													<input type="checkbox" id="checkbox02"/>
													<label htmlFor="checkbox02">Prepare The Conference Schedule</label>
												</div>
											</li>
											<li>
												<hr className="light-grey-hr"/>
											</li>
											<li className="todo-item">
												<div className="checkbox checkbox-warning">
													<input type="checkbox" id="checkbox03" checked/>
													<label htmlFor="checkbox03">Decide The Live Discussion Time</label>
												</div>
											</li>
											<li>
												<hr className="light-grey-hr"/>
											</li>
											<li className="todo-item">
												<div className="checkbox checkbox-success">
													<input type="checkbox" id="checkbox04" checked/>
													<label htmlFor="checkbox04">Prepare For The Next Project</label>
												</div>
											</li>
											<li>
												<hr className="light-grey-hr"/>
											</li>
											<li className="todo-item">
												<div className="checkbox checkbox-danger">
													<input type="checkbox" id="checkbox05" checked/>
													<label htmlFor="checkbox05">Finish Up AngularJs Tutorial</label>
												</div>
											</li>
											<li>
												<hr className="light-grey-hr"/>
											</li>
											<li className="todo-item">
												<div className="checkbox checkbox-purple">
													<input type="checkbox" id="checkbox06" checked/>
													<label htmlFor="checkbox06">Finish Infinity Project</label>
												</div>
											</li>
											<li>
												<hr className="light-grey-hr"/>
											</li>
										</ul>
										{/* <!-- /Todo-List --> */}
									</div>
								</div>
							</div>
						</div>
					</div>
				</li>
			</ul>
		</div>
		
 </>
  )
}
