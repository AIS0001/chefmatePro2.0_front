import React from 'react'
import Header from '../../components/Header'
import DashboardContent from '../../layout/DashboardContent'
import Layout from '../../layout/Layout'

export default function Dashboard() {
  return (
   <>
     	<div className="preloader-it">
		<div className="la-anim-1"></div>
	</div>
   <Layout>
   <Header title="Tile Page" />
   <DashboardContent />
   </Layout>
 

    {/* <!-- /#wrapper --> */}
	
   </>
  )
}
