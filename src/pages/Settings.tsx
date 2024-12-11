import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Settings as SettingsIcon, Save, AlertTriangle } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  useGetStoreQuery,
  useUpdateStoreMutation,
} from "../store/services/storeService";
import type { StoreSettings } from "../store/services/storeService";

const Settings = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const { data: store, isLoading, error } = useGetStoreQuery(storeId!);
  const [updateStore] = useUpdateStoreMutation();

  const [settings, setSettings] = useState<StoreSettings>({
    lowStockThreshold: 10,
    outOfStockThreshold: 0,
    criticalStockThreshold: 5,
    enableStockAlerts: true,
    enableNotifications: true,
    automaticReorder: false,
    reorderPoint: 5,
    taxRate: 0,
    currency: "USD",
    timeZone: "UTC",
    receiptFooter: "",
  });

  useEffect(() => {
    if (store?.settings) {
      setSettings(store.settings);
    }
  }, [store]);

  const handleSave = async () => {
    try {
      await updateStore({
        _id: storeId!,
        settings,
      }).unwrap();
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600">
        Failed to load stores. Please try again later.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
          <SettingsIcon className="h-6 w-6" />
          Settings
        </h1>
        <button
          onClick={handleSave}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="p-6 space-y-6">
          {/* Stock Management Settings */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Stock Alert Settings
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {[
                {
                  label: "Low Stock Threshold",
                  value: settings.lowStockThreshold,
                  key: "lowStockThreshold",
                  helper: "Alert when product stock falls below this number",
                },
                {
                  label: "Critical Stock Threshold",
                  value: settings.criticalStockThreshold,
                  key: "criticalStockThreshold",
                  helper: "Urgent alert when stock reaches critical level",
                },
                {
                  label: "Out of Stock Threshold",
                  value: settings.outOfStockThreshold,
                  key: "outOfStockThreshold",
                  helper: "Consider product out of stock at this level",
                },
                {
                  label: "Reorder Point",
                  value: settings.reorderPoint,
                  key: "reorderPoint",
                  helper: "Stock level at which to reorder inventory",
                },
              ].map(({ label, value, key, helper }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700">
                    {label}
                  </label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        [key]: parseInt(e.target.value, 10) || 0,
                      }))
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">{helper}</p>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              {[
                {
                  label: "Enable Stock Alerts",
                  checked: settings.enableStockAlerts,
                  key: "enableStockAlerts",
                },
                {
                  label: "Enable Automatic Reorder",
                  checked: settings.automaticReorder,
                  key: "automaticReorder",
                },
              ].map(({ label, checked, key }) => (
                <div className="flex items-center" key={key}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        [key]: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    {label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* General Settings */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {[
              {
                label: "Currency",
                value: settings.currency,
                key: "currency",
                options: [
                  { value: "USD", label: "USD ($)" },
                  { value: "EUR", label: "EUR (€)" },
                  { value: "GBP", label: "GBP (£)" },
                  { value: "JPY", label: "JPY (¥)" },
                ],
              },
              {
                label: "Time Zone",
                value: settings.timeZone,
                key: "timeZone",
                options: [
                  { value: "UTC", label: "UTC" },
                  { value: "America/New_York", label: "Eastern Time" },
                  { value: "America/Chicago", label: "Central Time" },
                  { value: "America/Denver", label: "Mountain Time" },
                  { value: "America/Los_Angeles", label: "Pacific Time" },
                ],
              },
            ].map(({ label, value, key, options }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700">
                  {label}
                </label>
                <select
                  value={value}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      [key]: e.target.value,
                    }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={settings.taxRate}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    taxRate: parseFloat(e.target.value) || 0,
                  }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Receipt Footer Message
            </label>
            <textarea
              value={settings.receiptFooter}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  receiptFooter: e.target.value,
                }))
              }
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Thank you for your business!"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
