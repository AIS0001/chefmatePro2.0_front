import React, { useEffect, useState } from "react";
import Footer from "./Footer";
import WhatsAppButton from "../components/floatingbuttons/Whatsappbutton";
import PhoneButton from "../components/floatingbuttons/PhoneButton";

export default function MainContent({ children, isSidebarOpen }) {
  const [isMobile, setIsMobile] = useState(false);

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
        marginLeft: isMobile ? "0" : (isSidebarOpen ? "240px" : "60px"),
        transition: "margin-left 0.3s ease",
        paddingTop: "2px",
      }}
    >
      <div className="container-fluid">
        {children}
      </div>

      {/* <WhatsAppButton phoneNumber="66986643299" />
      <PhoneButton phoneNumber="66986643299" /> */}
      <Footer />
    </div>
  );
}
