import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, User, LogOut, ChevronDown } from "lucide-react";
import UserAvatar from "./UserAvatar";
import DeleteAccountModal from "./DeleteAccountModal";

interface UserProfileMenuProps {
  displayName: string;
  isStaff: boolean;
  onLogout: () => void;
  canAccessSettings: boolean;
}

const UserProfileMenu: React.FC<UserProfileMenuProps> = ({
  displayName,
  isStaff,
  onLogout,
  canAccessSettings,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center space-x-3 focus:outline-none"
      >
        <UserAvatar name={displayName} />
        <span className="text-sm font-medium text-gray-700 hidden sm:block">
          {displayName}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div className="py-1">
            <button
              onClick={() => {
                setShowMenu(false);
                navigate("/profile");
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <User className="h-4 w-4 mr-3" />
              Profile
            </button>

            {canAccessSettings && (
              <button
                onClick={() => {
                  setShowMenu(false);
                  navigate("/settings");
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Settings className="h-4 w-4 mr-3" />
                Settings
              </button>
            )}

            {!isStaff && (
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowDeleteModal(true);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                <User className="h-4 w-4 mr-3" />
                Delete Account
              </button>
            )}

            <button
              onClick={onLogout}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Logout
            </button>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <DeleteAccountModal
          onClose={() => setShowDeleteModal(false)}
          onConfirm={() => {
            // Handle account deletion
            setShowDeleteModal(false);
            onLogout();
          }}
        />
      )}
    </div>
  );
};

export default UserProfileMenu;
