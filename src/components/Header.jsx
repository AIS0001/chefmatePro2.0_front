import React from 'react'

import Breadcrum from '../layout/Breadcrum'
export default function Header({ title }) {
  return (
   <>
   	<div className="row heading-bg">
					<div className="col-lg-3 col-md-4 col-sm-4 col-xs-12">
						<h5 className="txt-dark">{title}</h5>
					</div>
					<Breadcrum title="Add New Page" />


				</div>
  
   </>
  )
}
