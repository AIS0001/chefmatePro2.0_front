/* eslint-disable no-undef */
import React, { useEffect } from 'react';
import Header from '../../../components/Header';
import Layout from '../../../layout/Layout'
import { Textfield,SubmitButton } from '../../../components/Buttons/Textfield';
import { ComboBox } from '../../../components/Buttons/ComboBox';
import { AdvanceInput } from '../../../components/Buttons/advanceinput';
import { AdvanceComboBox } from '../../../components/Buttons/advanceinput';
import DatePicker from '../../../components/Buttons/Date';


export default function NewUser() {

    useEffect(() => {
        
       // $('#action').select2(); 
   
    }, []);
    return (
        <>
            <Layout>
                <Header title="Add New User" />
               
                <div className='row'>
                    <div class="col-lg-4 col-md-4 col-sm-4 col-xs-4">
                        <div class="panel panel-danger card-view">
                            <div class="panel-heading">
                                <div class="pull-left">
                                    <h6 class="panel-title txt-light">panel danger</h6>
                                </div>
                                <div class="clearfix"></div>
                            </div>
                            <div class="panel-wrapper collapse in">
                                <div class="panel-body">

                                <div class="row">
						<div class="col-md-12">
							<div class="panel panel-default card-view">
                            <Textfield 
                                          id="title"
                                            type="text"
                                            name="title"                                            
                                            value=""
                                            placeholder="Enter Page Title"

                                            />
                                            <AdvanceInput 
                                             id="title"
                                             type="text"
                                             name="title"                                            
                                             value=""
                                            
                                            />

<AdvanceInput 
                                             id="title"
                                             type="date"
                                             name="title"                                            
                                             value=""
                                            
                                            />
                                           


								
							</div>
						</div>
					</div>
    </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-lg-8 col-md-8 col-sm-8 col-xs-8">
                        <div class="panel panel-danger card-view">
                            <div class="panel-heading">
                                <div class="pull-left">
                                    <h6 class="panel-title txt-light">Action</h6>
                                </div>
                                <div class="clearfix"></div>
                            </div>
                            <div class="panel-wrapper collapse in">
                                <div class="panel-body">
                                <div class="col-sm-12">
                                            <Textfield 
                                            id="Order"
                                            type="text"
                                            name="order"
                                            value=""
                                            placeholder="Order No."
                                            />
                                    </div>
                                    
                                    <div class="col-sm-12">
                                         <ComboBox 
                                         id="action"
                                         combodata="Action"
                                         />
                                    </div>
                                    
                                    <div class="col-sm-10"> 
                                         <ComboBox 
                                         id="category"
                                         combodata="Category"                                        
                                         />
                                    </div>
                                    <div class="col-sm-12"> 
                                         <ComboBox 
                                         id="subcategory"
                                         combodata="Sub Category"                                        
                                         />
                                    </div>
                                    <div class="col-sm-12">
                                        <DatePicker />
                                    </div>
           
                                    <div class="col-sm-12">
                                          <SubmitButton 
                                          type="submit"
                                          name="Publish"
                                          cls="btn btn-success btn-anim"
                                          />
                                    </div>
                                      </div>
                            </div>
                        </div>
                    </div>


                </div>
            </Layout>
        </>
    )
}
