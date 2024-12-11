import React, { useEffect } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  LayoutDashboard,
  Store,
  Package,
  ShoppingCart,
  BarChart2,
  Tag,
  LogOut,
  Boxes,
  Users,
  ChevronRight,
  ChevronLeft,
  FolderTree,
  Settings,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/slices/authSlice";
import { RootState } from "../store";
import { PERMISSIONS, hasPermission } from "../utils/permissions";
import { useSidebarStore } from "../store/ui/sidebarStore";

interface NavItemProps {
  to: string;
  icon: any;
  children: React.ReactNode;
  permission?: string;
}

interface Staff {
  role?: {
    permissions?: any;
  };
}

const NavItem = ({ to, icon: Icon, children, permission }: NavItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  const { staff } = useSelector((state: RootState) => state.auth) as {
    staff: Staff;
  };

  if (permission && staff) {
    if (!hasPermission(staff?.role?.permissions, permission)) {
      return null;
    }
  }

  return (
    <Link
      to={to}
      className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
        isActive
          ? "bg-secondary text-white"
          : "text-indigo-100 hover:bg-primary-hover"
      }`}
    >
      <Icon className="mr-3 h-5 w-5" />
      {children}
    </Link>
  );
};

const Sidebar = () => {
  const dispatch = useDispatch();
  const { storeId } = useParams();
  const { staff, user } = useSelector((state: RootState) => state.auth);
  const { isOpen, setIsOpen, toggle } = useSidebarStore();
  const [isMobile, setIsMobile] = React.useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile && !isOpen) {
        setIsOpen(true);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Call once to set initial state

    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen, setIsOpen]);

  const handleLogout = () => {
    localStorage.removeItem("selectedStoreId");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("staff");
    dispatch(logout());
  };

  if (staff && storeId !== staff.store) {
    return null;
  }

  const sidebarContent = (
    <div className="flex flex-col flex-grow pt-5 bg-primary overflow-y-auto h-full">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center flex-shrink-0">
          <Store className="h-8 w-8 text-white" />
          <span className="ml-2 text-white text-lg font-semibold">
            Irego POS System
          </span>
        </div>
      </div>
      <div className="mt-5 flex-1 flex flex-col">
        <nav className="flex-1 px-2 pb-4 space-y-1">
          {!storeId ? (
            !staff && (
              <NavItem to="/stores" icon={Store}>
                Stores
              </NavItem>
            )
          ) : (
            <>
              <NavItem
                to={`/stores/${storeId}/dashboard`}
                icon={LayoutDashboard}
              >
                Dashboard
              </NavItem>
              <NavItem
                to={`/stores/${storeId}/categories`}
                icon={FolderTree}
                permission={PERMISSIONS.MANAGE_INVENTORY}
              >
                Categories
              </NavItem>
              <NavItem
                to={`/stores/${storeId}/products`}
                icon={Package}
                permission={PERMISSIONS.MANAGE_INVENTORY}
              >
                Products
              </NavItem>
              <NavItem
                to={`/stores/${storeId}/inventory`}
                icon={Boxes}
                permission={PERMISSIONS.MANAGE_INVENTORY}
              >
                Inventory
              </NavItem>
              <NavItem
                to={`/stores/${storeId}/sales`}
                icon={ShoppingCart}
                permission={PERMISSIONS.CREATE_SALE}
              >
                Sales
              </NavItem>
              <NavItem
                to={`/stores/${storeId}/discounts`}
                icon={Tag}
                permission={PERMISSIONS.MANAGE_INVENTORY}
              >
                Discounts
              </NavItem>
              <NavItem
                to={`/stores/${storeId}/reports`}
                icon={BarChart2}
                permission={PERMISSIONS.VIEW_REPORTS}
              >
                Reports
              </NavItem>
              <NavItem
                to={`/stores/${storeId}/users`}
                icon={Users}
                permission={PERMISSIONS.MANAGE_USERS}
              >
                Users
              </NavItem>
              <NavItem
                to={`/stores/${storeId}/settings`}
                icon={Settings}
                permission={PERMISSIONS.MANAGE_SETTINGS}
              >
                Settings
              </NavItem>
              {!staff && (
                <NavItem to="/stores" icon={Store}>
                  Switch Store
                </NavItem>
              )}
            </>
          )}
        </nav>
        <div className="px-2 pb-4">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-indigo-100 hover:bg-primary-hover rounded-md"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-20 w-64 bg-primary overflow-y-auto transition-all duration-300 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${isMobile ? "shadow-lg" : ""}`}
      >
        {sidebarContent}
      </div>

      {/* Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-10 bg-black bg-opacity-50"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Toggle button */}
      <button
        onClick={toggle}
        className={`fixed top-4 z-30 p-2 rounded-md bg-primary text-white transition-all duration-300 ${
          isOpen ? "left-64" : "left-4"
        } ${isMobile ? "" : "md:hidden"}`}
        aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
      >
        {isOpen ? (
          <ChevronLeft className="h-6 w-6" />
        ) : (
          <ChevronRight className="h-6 w-6" />
        )}
      </button>
    </>
  );
};

export default Sidebar;
