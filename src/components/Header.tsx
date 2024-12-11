import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { MenuIcon, Bell, LogOut, Settings, User, SubscriptIcon } from "lucide-react";
import { RootState } from "../store";
import { logout } from "../store/slices/authSlice";
import NotificationList from "./notifications/NotificationList";
import { useGetNotificationsQuery } from "../store/services/notificationService";
import { PERMISSIONS, hasPermission } from "../utils/permissions";
import UserProfileModal from "./header/UserProfileModal";

interface Staff {
  role?: {
    permissions?: any;
  };
  name: String;
}

const Header = () => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const user = useSelector((state: RootState) => state.auth.user);
  const { staff } = useSelector((state: RootState) => state.auth) as {
    staff: Staff;
  };
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { storeId } = useParams();

  const { data: notifications = [] } = useGetNotificationsQuery(undefined, {
    skip: !user && !staff,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;
  const displayName = user?.name || staff?.name || "";

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const canAccessSettings =
    !staff ||
    hasPermission(staff?.role?.permissions, PERMISSIONS.MANAGE_SETTINGS);

  return (
    <header className="bg-accent shadow">
      <div className="flex justify-between items-center px-4 py-4 sm:px-6 lg:px-8">
        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-foreground hover:text-gray-500 hover:bg-accent"
        >
          <MenuIcon className="h-6 w-6" />
        </button>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-1 rounded-full text-foreground hover:text-gray-500 focus:outline-none"
            >
              <Bell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 md:left-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                <NotificationList onClose={() => setShowNotifications(false)} />
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 focus:outline-none"
            >
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium text-foreground hidden sm:block">
                {displayName}
              </span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 md:left-0 mt-2 w-48 rounded-md shadow-lg bg-card ring-1 ring-black ring-opacity-5">
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowProfileModal(true);
                      setShowUserMenu(false);
                    }}
                    className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-accent w-full text-left"
                  >
                    <User className="h-4 w-4 mr-3" />
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      navigate("/subscription");
                      setShowUserMenu(false);
                    }}
                    className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-accent w-full text-left"
                  >
                    <SubscriptIcon className="h-4 w-4 mr-3" />
                    Subscription
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileModal(true);
                      setShowUserMenu(false);
                    }}
                    className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-accent w-full text-left"
                  >
                    <Settings className="h-4 w-4 mr-3" />
                    Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-accent w-full text-left"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </header>
  );
};

export default Header;
