import React from 'react'

import Breadcrum from '../layout/Breadcrum'
export default function Header({ title }) {
  return (
   <>
	<div
		className="row heading-bg"
		style={{
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'space-between',
			gap: '8px',
			minHeight: '52px',
			padding: '8px 12px',
			margin: 0,
		}}
	>
		<div style={{ minWidth: 0 }}>
			<h5 className="txt-dark" style={{ margin: 0, lineHeight: 1.25 }}>{title}</h5>
		</div>
		<div style={{ marginLeft: 'auto' }}>
			<Breadcrum />
		</div>
	</div>
  
   </>
  )
}
