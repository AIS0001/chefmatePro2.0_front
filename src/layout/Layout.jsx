import React from "react";
import Topbar from "../components/Topbar";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import MainContent from "./MainContent";


export default function Layout({ children }) {
  return (
    <>
      <div
        className="wrapper theme-4-active pimary-color-red"
      >
        <Topbar />
        <LeftSidebar />
        <RightSidebar />
        {/* Your main content goes here */}
        <MainContent>{children}</MainContent>
      
      </div>
    </>
  );
}
