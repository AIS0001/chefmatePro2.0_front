import React from 'react'
import appPackage from '../../package.json'

export default function Footer() {
	const appVersion = appPackage?.version || '';
	return (
		<>
			<footer className="footer container-fluid pl-30 pr-30">
				<div className="row">
					<div className="col-sm-12">
						<p>2024 &copy; Powered by Cloudnet Pvt. Ltd. | v{appVersion}</p>
					</div>
				</div>
			</footer>
		</>
	)
}
