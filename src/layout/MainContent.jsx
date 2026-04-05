import React, { useEffect, useState } from "react";
import Footer from "./Footer";

export default function MainContent({ children, isSidebarOpen }) {
  const [isMobile, setIsMobile] = useState(false);
  const desktopSidebarWidth = isSidebarOpen ? 240 : 80;
  const contentPadding = isMobile ? "0 12px 0 12px" : "0 20px 0 24px";

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div
      className="page-wrapper"
      style={{
        marginLeft: isMobile ? "0" : `${desktopSidebarWidth}px`,
        transition: "margin-left 0.3s ease",
        paddingTop: "64px",
        background: 'transparent',
      }}
    >
      <div className="container-fluid" style={{ padding: contentPadding }}>
        {children}
      </div>

      {/* <WhatsAppButton phoneNumber="66986643299" />
      <PhoneButton phoneNumber="66986643299" /> */}
      <Footer />
    </div>
  );
}
