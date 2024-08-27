import React from 'react'
import Header from '../../components/Header'
import Layout from '../../layout/Layout'
const  Pages=()=> {
  return (
    <>
      <Layout>
        <Header title="Add New Page " />
        <div className='row'>
          <div class="col-lg-6 col-md-6 col-sm-6 col-xs-12">
            <div class="panel panel-danger card-view">
              <div class="panel-heading">
                <div class="pull-left">
                  <h6 class="panel-title txt-light">panel danger</h6>
                </div>
                <div class="clearfix"></div>
              </div>
              <div class="panel-wrapper collapse in">
                <div class="panel-body">
                  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum tincidunt est vitae ultrices accumsan. Aliquam ornare lacus adipiscing, posuere lectus et, fringilla augue.</p>
                </div>
              </div>
            </div>
          </div>

          <div class="col-lg-6 col-md-6 col-sm-6 col-xs-12">
            <div class="panel panel-danger card-view">
              <div class="panel-heading">
                <div class="pull-left">
                  <h6 class="panel-title txt-light">panel danger</h6>
                </div>
                <div class="clearfix"></div>
              </div>
              <div class="panel-wrapper collapse in">
                <div class="panel-body">
                  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum tincidunt est vitae ultrices accumsan. Aliquam ornare lacus adipiscing, posuere lectus et, fringilla augue.</p>
                </div>
              </div>
            </div>
          </div>


        </div>
      </Layout>
    </>
  )
}
export default Pages;