import React from "react";
import Topbar from "../components/Topbar";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import MainContent from "./MainContent";
import Footer from "./Footer";
import WhatsAppButton from "../components/floatingbuttons/Whatsappbutton";
import PhoneButton from "../components/floatingbuttons/PhoneButton";

export default function Layout({ children }) {
  return (
    <>
      <div
        className="wrapper theme-1-active pimary-color-red"
        style={{ minHeight: "1183px" }}
      >
        <Topbar />
        <LeftSidebar />
        <RightSidebar />
        {/* Your main content goes here */}
        <MainContent>{children}</MainContent>
        {/* Use the Footer component */}
        <WhatsAppButton phoneNumber="66986643299" />
        <PhoneButton phoneNumber="66986643299" />
        <Footer />
      </div>
    </>
  );
}
