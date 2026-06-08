import { useState } from "react";
import { Outlet} from "react-router-dom";
import { sidebarItems } from "../data/employeeSidebarData.js";
import { Sidebar } from "../components/common/EmployeeSideBar.jsx";
import { Header } from "../components/common/EmployeeHeader.jsx";

// Main layout
export default function EmployeesLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="h-screen w-full flex flex-col">
      <Header
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
      />

      <div className="flex-1 flex pt-16 overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} items={sidebarItems} toggleSidebar={toggleSidebar} />

        <div className="flex-1 overflow-auto p-6">
          <div className="h-full">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
