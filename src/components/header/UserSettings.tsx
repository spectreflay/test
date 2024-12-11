import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { Settings, Moon, Sun, Lock, Trash2, Leaf, Sparkles } from 'lucide-react';
import {
  useUpdatePasswordMutation,
  useDeleteAccountMutation,
  useUpdateThemeMutation,
} from "../../store/services/userService";
import { useThemeStore } from "../../store/ui/themeStore";
import { useDispatch } from "react-redux";
import { logout } from "../../store/slices/authSlice";
import { useNavigate } from "react-router-dom";
import DeleteAccountModal from "./../profile/DeleteAccountModal";

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const UserSettings = () => {
  const { theme, setTheme } = useThemeStore();
  const [updatePassword] = useUpdatePasswordMutation();
  const [updateTheme, { isLoading: isThemeUpdating }] = useUpdateThemeMutation();
  const [deleteAccount] = useDeleteAccountMutation();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordForm>();

  const onPasswordSubmit = async (data: PasswordForm) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      await updatePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }).unwrap();
      toast.success("Password updated successfully");
      reset();
    } catch (error) {
      toast.error("Failed to update password");
    }
  };

  const handleThemeChange = async (newTheme: "light" | "dark" | "green" | "indigo") => {
    try {
      await updateTheme({ themePreference: newTheme }).unwrap();
      setTheme(newTheme);
      toast.success("Theme updated successfully");
    } catch (error) {
      toast.error("Failed to update theme");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount().unwrap();
      dispatch(logout());
      navigate("/login");
      toast.success("Account deleted successfully");
    } catch (error) {
      toast.error("Failed to delete account");
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Settings className="h-6 w-6" />
        User Settings
      </h1>

      {/* Theme Settings */}
      <div>
        <h2 className="text-lg font-medium mb-4">Theme</h2>
        <div className="flex flex-wrap items-center gap-4">
          {["light", "green", "indigo", "dark"].map((themeOption) => (
            <button
              key={themeOption}
              onClick={() =>
                handleThemeChange(
                  themeOption as "light" | "dark" | "green" | "indigo"
                )
              }
              disabled={isThemeUpdating}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
                isThemeUpdating ? 'opacity-50 cursor-not-allowed' : ''
              } ${
                themeOption === "dark"
                  ? theme === themeOption
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                  : theme === themeOption
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {themeOption === "light" && <Sun className="h-4 w-4" />}
              {themeOption === "green" && <Leaf className="h-4 w-4" />}
              {themeOption === "indigo" && <Sparkles className="h-4 w-4" />}
              {themeOption === "dark" && <Moon className="h-4 w-4" />}
              {isThemeUpdating ? (
                <span className="inline-block animate-spin">⌛</span>
              ) : (
                themeOption.charAt(0).toUpperCase() + themeOption.slice(1)
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Password Change */}
      <div>
        <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Change Password
        </h2>
        <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Current Password
            </label>
            <input
              type="password"
              {...register("currentPassword", {
                required: "Current password is required",
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
            />
            {errors.currentPassword && (
              <p className="mt-1 text-sm text-red-600">
                {errors.currentPassword.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <input
              type="password"
              {...register("newPassword", {
                required: "New password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
            />
            {errors.newPassword && (
              <p className="mt-1 text-sm text-red-600">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Confirm New Password
            </label>
            <input
              type="password"
              {...register("confirmPassword", {
                required: "Please confirm your password",
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>

      {/* Delete Account */}
      <div>
        <h2 className="text-lg font-medium mb-4 flex items-center gap-2 text-red-600">
          <Trash2 className="h-5 w-5" />
          Delete Account
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Once you delete your account, there is no going back. Please be
          certain.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Delete Account
        </button>
      </div>

      {showDeleteModal && (
        <DeleteAccountModal
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteAccount}
        />
      )}
    </div>
  );
};

export default UserSettings;