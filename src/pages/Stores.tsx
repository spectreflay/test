import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Store, Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  useGetStoresQuery,
  useDeleteStoreMutation,
  useUpdateStoreMutation,
} from "../store/services/storeService";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { useGetCurrentSubscriptionQuery } from "../store/services/subscriptionService";
import {
  checkSubscriptionLimit,
  showUpgradePrompt,
} from "../utils/subscriptionLimits";
import UpgradeModal from "../components/subscription/UpgradeModal";

interface EditStoreForm {
  name: string;
  address: string;
  phone: string;
}

const Stores = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const {
    data: stores,
    isLoading,
    error,
    refetch,
  } = useGetStoresQuery(undefined, {
    skip: !user,
    refetchOnMountOrArgChange: true,
  });
  const { data: subscription } = useGetCurrentSubscriptionQuery();
  const [deleteStore] = useDeleteStoreMutation();
  const [updateStore] = useUpdateStoreMutation();
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<any>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    if (user) {
      refetch();
    }
  }, [user?.email, refetch]);

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this store?")) {
      try {
        await deleteStore(id).unwrap();
        toast.success("Store deleted successfully");
      } catch (error) {
        toast.error("Failed to delete store");
      }
    }
  };

  const handleStoreSelect = (storeId: string) => {
    localStorage.setItem("selectedStoreId", storeId);
    navigate(`/stores/${storeId}/dashboard`);
  };

  const handleCreateStore = () => {
    const canCreateStore = checkSubscriptionLimit(
      subscription,
      "maxStores",
      stores?.length || 0
    );

    if (!canCreateStore) {
      setShowUpgradeModal(true);
      return;
    }

    navigate("/stores/create");
  };

  const handleEdit = (store: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingStore(store);
    setIsEditModalOpen(true);
  };

  const handleUpdateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateStore({
        _id: editingStore._id,
        name: editingStore.name,
        address: editingStore.address,
        phone: editingStore.phone,
      }).unwrap();
      toast.success("Store updated successfully");
      setIsEditModalOpen(false);
      setEditingStore(null);
    } catch (error) {
      toast.error("Failed to update store");
    }
  };

  if (!user || isLoading) {
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
    <div className="">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
          <Store className="h-6 w-6" />
          Stores
        </h1>
        <button
          onClick={handleCreateStore}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Store
        </button>
      </div>

      {!stores || stores.length === 0 ? (
        <div className="text-center py-12">
          <Store className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No stores</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new store.
          </p>
          <div className="mt-6">
            <button
              onClick={handleCreateStore}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-hover"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Store
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <div
              key={store._id}
              className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleStoreSelect(store._id)}
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Store className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {store.name}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-sm text-gray-900">
                          {store.address}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={(e) => handleEdit(store, e)}
                    className="text-primary hover:text-primary-hover"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(store._id);
                    }}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Store Modal */}
      {isEditModalOpen && editingStore && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Edit Store</h2>
            <form onSubmit={handleUpdateStore} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Store Name
                </label>
                <input
                  type="text"
                  value={editingStore.name}
                  onChange={(e) =>
                    setEditingStore({ ...editingStore, name: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <textarea
                  value={editingStore.address}
                  onChange={(e) =>
                    setEditingStore({
                      ...editingStore,
                      address: e.target.value,
                    })
                  }
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={editingStore.phone}
                  onChange={(e) =>
                    setEditingStore({ ...editingStore, phone: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingStore(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Update Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUpgradeModal && (
        <UpgradeModal
          feature="stores"
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
    </div>
  );
};

export default Stores;
