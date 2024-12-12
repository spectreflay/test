import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Tag, Plus, Edit2, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import {
  useGetDiscountsQuery,
  useCreateDiscountMutation,
  useUpdateDiscountMutation,
  useDeleteDiscountMutation,
} from "../store/services/discountService";
import { handleOfflineAction } from "../utils/offlineStorage";
import { networkStatus } from "../utils/networkStatus";
import OfflineIndicator from "../components/sales/OfflineIndicator";
import { getUnsynedDiscounts } from "../utils/indexedDB";
import {
  saveDiscountsToLocalStorage,
  getDiscountsFromLocalStorage,
  clearDiscountsFromLocalStorage,
} from "../utils/offlineStorage";

interface DiscountForm {
  name: string;
  type: "percentage" | "fixed";
  value: number;
  startDate: string;
  endDate: string;
  description: string;
  minPurchase?: number;
  maxDiscount?: number;
  applicableProducts: string[];
  active: boolean;
}

const Discounts = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const { data: apiDiscounts, isLoading } = useGetDiscountsQuery(storeId!, {
    skip: !networkStatus.isNetworkOnline(),
  });
  const [createDiscount] = useCreateDiscountMutation();
  const [updateDiscount] = useUpdateDiscountMutation();
  const [deleteDiscount] = useDeleteDiscountMutation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<any>(null);
  const [localDiscounts, setLocalDiscounts] = useState<any[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DiscountForm>();

  // Initialize discounts from localStorage or API
  useEffect(() => {
    const initializeDiscounts = async () => {
      if (networkStatus.isNetworkOnline() && apiDiscounts) {
        // If online and we have API data, save to localStorage and use it
        saveDiscountsToLocalStorage(storeId!, apiDiscounts);
        setLocalDiscounts(apiDiscounts);
      } else {
        // If offline, try to get data from localStorage
        const storedDiscounts = getDiscountsFromLocalStorage(storeId!);
        if (storedDiscounts) {
          setLocalDiscounts(storedDiscounts);
        }
      }
    };

    initializeDiscounts();
  }, [storeId, apiDiscounts]);

  // Load offline discounts
  useEffect(() => {
    const fetchOfflineDiscounts = async () => {
      const unsynedDiscounts = await getUnsynedDiscounts();
      setLocalDiscounts((prevDiscounts) => {
        const updatedDiscounts = [...prevDiscounts];
        unsynedDiscounts.forEach((unsynedDiscount) => {
          const index = updatedDiscounts.findIndex(
            (d) => d._id === unsynedDiscount.data._id
          );
          if (index !== -1) {
            if (unsynedDiscount.action === "delete") {
              updatedDiscounts.splice(index, 1);
            } else {
              updatedDiscounts[index] = {
                ...updatedDiscounts[index],
                ...unsynedDiscount.data,
              };
            }
          } else if (unsynedDiscount.action === "create") {
            updatedDiscounts.push(unsynedDiscount.data);
          }
        });
        return updatedDiscounts;
      });
    };

    fetchOfflineDiscounts();
  }, []);

  const onSubmit = async (data: DiscountForm) => {
    try {
      const discountData = {
        ...data,
        store: storeId!,
      };

      if (editingDiscount) {
        const updateData = {
          _id: editingDiscount._id,
          ...discountData,
        };

        if (!networkStatus.isNetworkOnline()) {
          const handled = await handleOfflineAction(
            "discount",
            "update",
            updateData
          );
          if (handled) {
            setLocalDiscounts((prevDiscounts) =>
              prevDiscounts.map((disc) =>
                disc._id === updateData._id ? { ...disc, ...updateData } : disc
              )
            );
            saveDiscountsToLocalStorage(storeId!, localDiscounts);
            toast.success("Discount updated. Will sync when online.");
            setIsModalOpen(false);
            reset();
            setEditingDiscount(null);
            return;
          }
        }

        await updateDiscount(updateData).unwrap();
        toast.success("Discount updated successfully");
      } else {
        const tempId = `temp_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const newDiscount = {
          _id: tempId,
          ...discountData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (!networkStatus.isNetworkOnline()) {
          const handled = await handleOfflineAction(
            "discount",
            "create",
            newDiscount
          );
          if (handled) {
            setLocalDiscounts((prevDiscounts) => [...prevDiscounts, newDiscount]);
            saveDiscountsToLocalStorage(storeId!, [
              ...localDiscounts,
              newDiscount,
            ]);
            toast.success("Discount created. Will sync when online.");
            setIsModalOpen(false);
            reset();
            return;
          }
        }

        const createdDiscount = await createDiscount(discountData).unwrap();
        setLocalDiscounts((prevDiscounts) => [...prevDiscounts, createdDiscount]);
        saveDiscountsToLocalStorage(storeId!, [
          ...localDiscounts,
          createdDiscount,
        ]);
        toast.success("Discount created successfully");
      }
      setIsModalOpen(false);
      reset();
      setEditingDiscount(null);
    } catch (error) {
      toast.error("Operation failed");
      setIsModalOpen(false);
      reset();
      setEditingDiscount(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this discount?")) {
      try {
        if (!networkStatus.isNetworkOnline()) {
          const handled = await handleOfflineAction("discount", "delete", {
            _id: id,
          });
          if (handled) {
            const updatedDiscounts = localDiscounts.filter((d) => d._id !== id);
            setLocalDiscounts(updatedDiscounts);
            saveDiscountsToLocalStorage(storeId!, updatedDiscounts);
            toast.success("Discount deleted. Will sync when online.");
            return;
          }
        }

        await deleteDiscount(id).unwrap();
        const updatedDiscounts = localDiscounts.filter((d) => d._id !== id);
        setLocalDiscounts(updatedDiscounts);
        saveDiscountsToLocalStorage(storeId!, updatedDiscounts);
        toast.success("Discount deleted successfully");
      } catch (error) {
        toast.error("Failed to delete discount");
      }
    }
  };

  if (isLoading && networkStatus.isNetworkOnline()) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Tag className="h-6 w-6" />
            Discounts & Promotions
          </h1>
          <button
            onClick={() => {
              setEditingDiscount(null);
              reset();
              setIsModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Discount
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {localDiscounts?.map((discount) => (
            <div
              key={discount._id}
              className="bg-card overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-primary">
                      {discount.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-400">
                      {discount.description}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      discount.active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {discount.active ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Type:</span>{" "}
                    {discount.type === "percentage"
                      ? "Percentage"
                      : "Fixed Amount"}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Value:</span>{" "}
                    {discount.type === "percentage"
                      ? `${discount.value}%`
                      : `$${discount.value}`}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Valid:</span>{" "}
                    {new Date(discount.startDate).toLocaleDateString()} -{" "}
                    {new Date(discount.endDate).toLocaleDateString()}
                  </p>
                  {discount.minPurchase && (
                    <p className="text-sm">
                      <span className="font-medium">Min Purchase:</span> $
                      {discount.minPurchase}
                    </p>
                  )}
                  {discount.maxDiscount && (
                    <p className="text-sm">
                      <span className="font-medium">Max Discount:</span> $
                      {discount.maxDiscount}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setEditingDiscount(discount);
                      reset(discount);
                      setIsModalOpen(true);
                    }}
                    className="text-primary hover:text-primary-hover"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(discount._id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">
              {editingDiscount ? "Edit Discount" : "Add Discount"}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  {...register("name", { required: "Name is required" })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  {...register("description")}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Type
                  </label>
                  <select
                    {...register("type", { required: "Type is required" })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Value
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("value", {
                      required: "Value is required",
                      min: 0,
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Start Date
                  </label>
                  <input
                    type="date"
                    {...register("startDate", {
                      required: "Start date is required",
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    End Date
                  </label>
                  <input
                    type="date"
                    {...register("endDate", {
                      required: "End date is required",
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Min Purchase
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("minPurchase")}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Max Discount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("maxDiscount")}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <div className="mt-1">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      {...register("active")}
                      className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <span className="ml-2">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingDiscount(null);
                    reset();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  {editingDiscount ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <OfflineIndicator />
    </>
  );
};

export default Discounts;