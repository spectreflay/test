import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Package, Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useGetCategoriesQuery } from "../store/services/categoryService";
import {
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} from "../store/services/productService";
import { useGetCurrentSubscriptionQuery } from "../store/services/subscriptionService";
import { checkSubscriptionLimit } from "../utils/subscriptionLimits";
import ProductForm from "../components/products/ProductForm";
import ImportExportButtons from "../components/products/ImportExportButtons";
import UpgradeModal from "../components/subscription/UpgradeModal";
import { handleOfflineAction } from "../utils/offlineStorage";
import { networkStatus } from "../utils/networkStatus";
import OfflineIndicator from "../components/OfflineIndicator";
import { getUnsynedProducts } from "../utils/indexedDB";
import {
  saveProductsToLocalStorage,
  getProductsFromLocalStorage,
} from "../utils/offlineStorage";
import {
  saveCategoriesToLocalStorage,
  getCategoriesFromLocalStorage,
} from "../utils/offlineStorage";

const Products = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const { data: apiProducts, isLoading } = useGetProductsQuery(storeId!, {
    skip: !networkStatus.isNetworkOnline(),
  });
  const { data: apiCategories } = useGetCategoriesQuery(storeId!, {
    skip: !networkStatus.isNetworkOnline(),
  });
  const { data: subscription } = useGetCurrentSubscriptionQuery();
  const [createProduct] = useCreateProductMutation();
  const [updateProduct] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [modifiers, setModifiers] = useState<any[]>([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [localProducts, setLocalProducts] = useState<any[]>([]);
  const [localCategories, setLocalCategories] = useState<any[]>([]);

  // Initialize products and categories from localStorage or API
  useEffect(() => {
    const initializeData = async () => {
      if (networkStatus.isNetworkOnline() && apiProducts && apiCategories) {
        // If online and we have API data, save to localStorage and use it
        saveProductsToLocalStorage(storeId!, apiProducts);
        saveCategoriesToLocalStorage(storeId!, apiCategories);
        setLocalProducts(apiProducts);
        setLocalCategories(apiCategories);
      } else {
        // If offline, try to get data from localStorage
        const storedProducts = getProductsFromLocalStorage(storeId!);
        const storedCategories = getCategoriesFromLocalStorage(storeId!);
        if (storedProducts) {
          setLocalProducts(storedProducts);
        }
        if (storedCategories) {
          setLocalCategories(storedCategories);
        }
      }
    };

    initializeData();
  }, [storeId, apiProducts, apiCategories]);

  // Load offline products
  useEffect(() => {
    const fetchOfflineProducts = async () => {
      const unsynedProducts = await getUnsynedProducts();
      setLocalProducts((prevProducts) => {
        const updatedProducts = [...prevProducts];
        unsynedProducts.forEach((unsynedProduct) => {
          const index = updatedProducts.findIndex(
            (p) => p._id === unsynedProduct.data._id
          );
          if (index !== -1) {
            if (unsynedProduct.action === "delete") {
              updatedProducts.splice(index, 1);
            } else {
              updatedProducts[index] = {
                ...updatedProducts[index],
                ...unsynedProduct.data,
              };
            }
          } else if (unsynedProduct.action === "create") {
            updatedProducts.push(unsynedProduct.data);
          }
        });
        return updatedProducts;
      });
    };

    fetchOfflineProducts();
  }, []);

  const resetForm = () => {
    setEditingProduct(null);
    setModifiers([]);
    setIsModalOpen(false);
  };

  const handleAddModifier = () => {
    setModifiers([
      ...modifiers,
      { name: "", options: [{ name: "", price: 0 }] },
    ]);
  };

  const handleAddModifierOption = (modifierIndex: number) => {
    const newModifiers = [...modifiers];
    newModifiers[modifierIndex] = {
      ...newModifiers[modifierIndex],
      options: [...newModifiers[modifierIndex].options, { name: "", price: 0 }],
    };
    setModifiers(newModifiers);
  };

  const handleModifierChange = (
    index: number,
    field: string,
    value: string
  ) => {
    const newModifiers = [...modifiers];
    newModifiers[index] = { ...newModifiers[index], [field]: value };
    setModifiers(newModifiers);
  };

  const handleModifierOptionChange = (
    modifierIndex: number,
    optionIndex: number,
    field: string,
    value: string | number
  ) => {
    const newModifiers = [...modifiers];
    const newOptions = [...newModifiers[modifierIndex].options];
    newOptions[optionIndex] = {
      ...newOptions[optionIndex],
      [field]: field === "price" ? Number(value) : value,
    };
    newModifiers[modifierIndex] = {
      ...newModifiers[modifierIndex],
      options: newOptions,
    };
    setModifiers(newModifiers);
  };

  const handleRemoveModifier = (modifierIndex: number) => {
    setModifiers(modifiers.filter((_, index) => index !== modifierIndex));
  };

  const handleRemoveModifierOption = (
    modifierIndex: number,
    optionIndex: number
  ) => {
    const newModifiers = [...modifiers];
    newModifiers[modifierIndex] = {
      ...newModifiers[modifierIndex],
      options: newModifiers[modifierIndex].options.filter(
        (_: any, index: number) => index !== optionIndex
      ),
    };
    setModifiers(newModifiers);
  };

  const handleAddProduct = () => {
    const canAddProduct = checkSubscriptionLimit(
      subscription,
      "maxProducts",
      localProducts?.length || 0
    );

    if (!canAddProduct) {
      setShowUpgradeModal(true);
      return;
    }

    setEditingProduct(null);
    setModifiers([]);
    setIsModalOpen(true);
  };

  const handleImportProducts = async (products: any[]) => {
    const remainingSlots = subscription?.subscription.maxProducts - (localProducts?.length || 0);
    
    if (products.length > remainingSlots) {
      toast.error(`Cannot import ${products.length} products. You only have ${remainingSlots} slots available in your current plan.`);
      return;
    }

    try {
      for (const product of products) {
        const productData = {
          ...product,
          store: storeId,
        };

        if (!networkStatus.isNetworkOnline()) {
          const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const newProduct = {
            _id: tempId,
            ...productData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          await handleOfflineAction('product', 'create', newProduct);
          setLocalProducts(prev => [...prev, newProduct]);
          saveProductsToLocalStorage(storeId!, [...localProducts, newProduct]);
        } else {
          const result = await createProduct(productData).unwrap();
          setLocalProducts(prev => [...prev, result]);
          saveProductsToLocalStorage(storeId!, [...localProducts, result]);
        }
      }
    } catch (error) {
      console.error('Error importing products:', error);
      toast.error('Failed to import some products');
    }
  };

  const onSubmit = async (data: any) => {
    try {
      const productData = {
        ...data,
        store: storeId,
        modifiers: modifiers.map((modifier) => ({
          ...modifier,
          options: modifier.options.map((option: any) => ({
            ...option,
            price: Number(option.price),
          })),
        })),
        price: Number(data.price),
        stock: Number(data.stock),
      };

      if (editingProduct) {
        const updateData = {
          _id: editingProduct._id,
          ...productData,
        };

        if (!networkStatus.isNetworkOnline()) {
          const handled = await handleOfflineAction(
            "product",
            "update",
            updateData
          );
          if (handled) {
            setLocalProducts((prevProducts) =>
              prevProducts.map((p) =>
                p._id === updateData._id ? { ...p, ...updateData } : p
              )
            );
            saveProductsToLocalStorage(storeId!, localProducts);
            toast.success("Product updated. Will sync when online.");
            setIsModalOpen(false);
            resetForm();
            return;
          }
        }

        await updateProduct(updateData).unwrap();
        toast.success("Product updated successfully");
      } else {
        const tempId = `temp_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const newProduct = {
          _id: tempId,
          ...productData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (!networkStatus.isNetworkOnline()) {
          const handled = await handleOfflineAction(
            "product",
            "create",
            newProduct
          );
          if (handled) {
            setLocalProducts((prevProducts) => [...prevProducts, newProduct]);
            saveProductsToLocalStorage(storeId!, [
              ...localProducts,
              newProduct,
            ]);
            toast.success("Product created. Will sync when online.");
            setIsModalOpen(false);
            resetForm();
            return;
          }
        }

        const createdProduct = await createProduct(productData).unwrap();
        setLocalProducts((prevProducts) => [...prevProducts, createdProduct]);
        saveProductsToLocalStorage(storeId!, [
          ...localProducts,
          createdProduct,
        ]);
        toast.success("Product created successfully");
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Operation failed");
      setIsModalOpen(false);
      resetForm();
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        if (!networkStatus.isNetworkOnline()) {
          const handled = await handleOfflineAction("product", "delete", {
            _id: id,
          });
          if (handled) {
            const updatedProducts = localProducts.filter((p) => p._id !== id);
            setLocalProducts(updatedProducts);
            saveProductsToLocalStorage(storeId!, updatedProducts);
            toast.success("Product deleted. Will sync when online.");
            return;
          }
        }

        await deleteProduct(id).unwrap();
        const updatedProducts = localProducts.filter((p) => p._id !== id);
        setLocalProducts(updatedProducts);
        saveProductsToLocalStorage(storeId!, updatedProducts);
        toast.success("Product deleted successfully");
      } catch (error) {
        toast.error("Failed to delete product");
      }
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Package className="h-6 w-6" />
            Products
          </h1>
          <div className="flex gap-4">
            <ImportExportButtons
              products={localProducts}
              categories={localCategories}
              onImport={handleImportProducts}
            />
            <button
              onClick={handleAddProduct}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {localProducts?.map((product) => (
            <div
              key={product._id}
              className="bg-card overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-shadow"
            >
              {product.image && (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <h3 className="text-lg font-medium text-primary">
                  {product.name}
                </h3>
                <p className="mt-1 text-sm text-gray-400">
                  {product.description}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-lg font-bold text-primary">
                    ${product.price.toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-400">
                    Stock: {product.stock}
                  </span>
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setEditingProduct(product);
                      setModifiers(product.modifiers || []);
                      setIsModalOpen(true);
                    }}
                    className="text-primary hover:text-primary-hover"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(product._id)}
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
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {editingProduct ? "Edit Product" : "Add Product"}
            </h2>
            <ProductForm
              categories={localCategories || []}
              initialData={editingProduct}
              onSubmit={onSubmit}
              onCancel={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              modifiers={modifiers}
              onModifierChange={handleModifierChange}
              onModifierOptionChange={handleModifierOptionChange}
              onAddModifier={handleAddModifier}
              onAddModifierOption={handleAddModifierOption}
              onRemoveModifier={handleRemoveModifier}
              onRemoveModifierOption={handleRemoveModifierOption}
            />
          </div>
        </div>
      )}

      {showUpgradeModal && (
        <UpgradeModal
          feature="products"
          onClose={() => setShowUpgradeModal(false)}
        />
      )}

      <OfflineIndicator />
    </>
  );
};

export default Products;