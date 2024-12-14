import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from "../store/services/categoryService";
import { handleOfflineAction } from "../utils/offlineStorage";
import { networkStatus } from "../utils/networkStatus";
import OfflineIndicator from "../components/OfflineIndicator";
import { getUnsynedCategories } from "../utils/indexedDB";
import {
  saveCategoriesToLocalStorage,
  getCategoriesFromLocalStorage,
  clearCategoriesFromLocalStorage,
} from "../utils/offlineStorage";

interface CategoryForm {
  name: string;
  description: string;
}

const Categories = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const { data: apiCategories, isLoading } = useGetCategoriesQuery(storeId!, {
    skip: !networkStatus.isNetworkOnline(),
  });
  const [createCategory] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [localCategories, setLocalCategories] = useState<any[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryForm>();

  // Initialize categories from localStorage or API
  useEffect(() => {
    const initializeCategories = async () => {
      if (networkStatus.isNetworkOnline() && apiCategories) {
        // If online and we have API data, save to localStorage and use it
        saveCategoriesToLocalStorage(storeId!, apiCategories);
        setLocalCategories(apiCategories);
      } else {
        // If offline, try to get data from localStorage
        const storedCategories = getCategoriesFromLocalStorage(storeId!);
        if (storedCategories) {
          setLocalCategories(storedCategories);
        }
      }
    };

    initializeCategories();
  }, [storeId, apiCategories]);

  // Load offline categories
  useEffect(() => {
    const fetchOfflineCategories = async () => {
      const unsynedCategories = await getUnsynedCategories();
      setLocalCategories((prevCategories) => {
        const updatedCategories = [...prevCategories];
        unsynedCategories.forEach((unsynedCategory) => {
          const index = updatedCategories.findIndex(
            (c) => c._id === unsynedCategory.data._id
          );
          if (index !== -1) {
            if (unsynedCategory.action === "delete") {
              updatedCategories.splice(index, 1);
            } else {
              updatedCategories[index] = {
                ...updatedCategories[index],
                ...unsynedCategory.data,
              };
            }
          } else if (unsynedCategory.action === "create") {
            updatedCategories.push(unsynedCategory.data);
          }
        });
        return updatedCategories;
      });
    };

    fetchOfflineCategories();
  }, []);

  const onSubmit = async (data: CategoryForm) => {
    try {
      const categoryData = {
        ...data,
        store: storeId!,
      };

      if (editingCategory) {
        const updateData = {
          _id: editingCategory._id,
          ...categoryData,
        };

        if (!networkStatus.isNetworkOnline()) {
          const handled = await handleOfflineAction(
            "category",
            "update",
            updateData
          );
          if (handled) {
            setLocalCategories((prevCategories) =>
              prevCategories.map((cat) =>
                cat._id === updateData._id ? { ...cat, ...updateData } : cat
              )
            );
            saveCategoriesToLocalStorage(storeId!, localCategories);
            toast.success("Category updated. Will sync when online.");
            setIsModalOpen(false);
            reset();
            setEditingCategory(null);
            return;
          }
        }

        await updateCategory(updateData).unwrap();
        toast.success("Category updated successfully");
      } else {
        const tempId = `temp_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const newCategory = {
          _id: tempId,
          ...categoryData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (!networkStatus.isNetworkOnline()) {
          const handled = await handleOfflineAction(
            "category",
            "create",
            newCategory
          );
          if (handled) {
            setLocalCategories((prevCategories) => [
              ...prevCategories,
              newCategory,
            ]);
            saveCategoriesToLocalStorage(storeId!, [
              ...localCategories,
              newCategory,
            ]);
            toast.success("Category created. Will sync when online.");
            setIsModalOpen(false);
            reset();
            return;
          }
        }

        const createdCategory = await createCategory(categoryData).unwrap();
        setLocalCategories((prevCategories) => [
          ...prevCategories,
          createdCategory,
        ]);
        saveCategoriesToLocalStorage(storeId!, [
          ...localCategories,
          createdCategory,
        ]);
        toast.success("Category created successfully");
      }
      setIsModalOpen(false);
      reset();
      setEditingCategory(null);
    } catch (error) {
      toast.error("Operation failed");
      setIsModalOpen(false);
      reset();
      setEditingCategory(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        if (!networkStatus.isNetworkOnline()) {
          const handled = await handleOfflineAction("category", "delete", {
            _id: id,
          });
          if (handled) {
            const updatedCategories = localCategories.filter(
              (cat) => cat._id !== id
            );
            setLocalCategories(updatedCategories);
            saveCategoriesToLocalStorage(storeId!, updatedCategories);
            toast.success("Category deleted. Will sync when online.");
            return;
          }
        }

        await deleteCategory(id).unwrap();
        const updatedCategories = localCategories.filter(
          (cat) => cat._id !== id
        );
        setLocalCategories(updatedCategories);
        saveCategoriesToLocalStorage(storeId!, updatedCategories);
        toast.success("Category deleted successfully");
      } catch (error) {
        toast.error("Failed to delete category");
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
          <h1 className="text-2xl font-semibold text-foreground">Categories</h1>
          <button
            onClick={() => {
              setEditingCategory(null);
              reset();
              setIsModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </button>
        </div>

        <div className="bg-card shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-card">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-primary uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-primary uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-right text-sm font-medium text-primary uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-gray-200">
              {localCategories?.map((category) => (
                <tr key={category._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                    {category.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {category.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setEditingCategory(category);
                        reset({
                          name: category.name,
                          description: category.description,
                        });
                        setIsModalOpen(true);
                      }}
                      className="text-gray-500 hover:text-primary-hover mr-4"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(category._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">
              {editingCategory ? "Edit Category" : "Add Category"}
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

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingCategory(null);
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
                  {editingCategory ? "Update" : "Create"}
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

export default Categories;
