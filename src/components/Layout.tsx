import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import SubscriptionAlert from "./SubscriptionAlert";
import { useSidebarStore } from "../store/ui/sidebarStore";

const Layout = () => {
  const { isOpen } = useSidebarStore();

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isOpen ? "md:ml-64" : "ml-0"
        }`}
      >
        <Header />
        <SubscriptionAlert />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-primary-background p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
