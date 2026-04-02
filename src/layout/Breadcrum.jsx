import React from 'react'
import { useLocation } from 'react-router-dom';
import { Breadcrumb } from 'react-bootstrap';
export default function Breadcrum() {
	const location = useLocation();
	const pathnames = location.pathname.split('/').filter(x => x);
  return (
    <>
    <div className="col-lg-9 col-sm-8 col-md-8 col-xs-12">
						<ol className="breadcrumb">
						<Breadcrumb.Item href="/">Dashboard</Breadcrumb.Item>
      {pathnames.length > 0 ? (
        pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;

          return isLast ? (
            <Breadcrumb.Item active key={to}>
              {value}
            </Breadcrumb.Item>
          ) : (
            <Breadcrumb.Item href={to} key={to}>
              {value}
            </Breadcrumb.Item>
          );
        })
      ) : (
        <Breadcrumb.Item active>Dashboard</Breadcrumb.Item>
      )}
						</ol>
					</div>
    </>
  )
}
