import React from "react";
import Footer from "./Footer";
import WhatsAppButton from "../components/floatingbuttons/Whatsappbutton";
import PhoneButton from "../components/floatingbuttons/PhoneButton";

export default function MainContent({ children, isSidebarOpen }) {
  return (
    <div
      className="page-wrapper"
      style={{
        marginLeft: isSidebarOpen ? "225px" : "60px",
        transition: "margin-left 0.3s ease",
      }}
    >
      <div className="container-fluid">
        {children}
      </div>

      <WhatsAppButton phoneNumber="66986643299" />
      <PhoneButton phoneNumber="66986643299" />
      <Footer />
    </div>
  );
}
