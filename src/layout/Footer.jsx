import React from 'react'
import { Link } from 'react-router-dom'
import appPackage from '../../package.json'

export default function Footer() {
	const appVersion = appPackage?.version || '';
	return (
		<>
			<footer className="footer container-fluid pl-30 pr-30">
				<div className="row">
					<div className="col-sm-12">
						<p>
							2026 &copy; Powered by Cloudnet Softwares Co. Ltd. |{' '}
							<Link to="/changelog" title="Open changelog">v{appVersion}</Link>
						</p>
					</div>
				</div>
			</footer>
		</>
	)
}
