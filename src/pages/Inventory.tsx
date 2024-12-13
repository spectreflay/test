import React, { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Package, History, FileDown } from "lucide-react";
import { toast } from "react-hot-toast";
import { useGetProductsQuery } from "../store/services/productService";
import { useGetStoreQuery } from "../store/services/storeService";
import { useGetCategoriesQuery } from "../store/services/categoryService";
import {
  useGetStockMovementsQuery,
  useAddStockMovementMutation,
  useGetStockAlertsQuery,
} from "../store/services/inventoryService";
import InventoryFilters from "../components/inventory/InventoryFilters";
import InventoryList from "../components/inventory/InventoryList";
import Pagination from "../components/inventory/Pagination";
import StockMovementModal from "../components/inventory/StockMovementModal";
import StockMovementHistory from "../components/inventory/StockMovementHistory";
import ProductStockHistoryModal from "../components/inventory/ProductStockHistoryModal";
import * as XLSX from "xlsx";
import { networkStatus } from "../utils/networkStatus";
import { handleOfflineAction } from "../utils/offlineStorage";
import OfflineIndicator from "../components/sales/OfflineIndicator";
import {
  getProductsFromLocalStorage,
  saveProductsToLocalStorage,
  getCategoriesFromLocalStorage,
  saveCategoriesToLocalStorage,
  getStockMovementsFromLocalStorage,
  saveStockMovementsToLocalStorage,
  getStoreFromLocalStorage,
  saveStoreToLocalStorage,
} from "../utils/offlineStorage";
import { syncManager } from "../utils/syncManager";

const ITEMS_PER_PAGE = 10;

const Inventory = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const isOnline = networkStatus.isNetworkOnline();

  // Only fetch from API if online
  const { data: apiProducts, isLoading: productsLoading } = useGetProductsQuery(
    storeId!,
    {
      skip: !isOnline,
    }
  );
  const { data: apiCategories, isLoading: categoriesLoading } =
    useGetCategoriesQuery(storeId!, {
      skip: !isOnline,
    });
  const { data: apiStockMovements } = useGetStockMovementsQuery(storeId!, {
    skip: !isOnline,
  });
  const { data: apiStore } = useGetStoreQuery(storeId!, {
    skip: !isOnline,
  });

  // Local state for offline data
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [stockMovements, setStockMovements] = useState<any[]>([]);
  const [store, setStore] = useState<any>(null);

  // UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [currentPage, setCurrentPage] = useState(1);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showProductHistoryModal, setShowProductHistoryModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [addStockMovement] = useAddStockMovementMutation();

  // Initialize data from localStorage or API
  useEffect(() => {
    const initializeData = async () => {
      if (isOnline) {
        // If online and we have API data, save to localStorage and use it
        if (apiProducts) {
          saveProductsToLocalStorage(storeId!, apiProducts);
          setProducts(apiProducts);
        }
        if (apiCategories) {
          saveCategoriesToLocalStorage(storeId!, apiCategories);
          setCategories(apiCategories);
        }
        if (apiStockMovements) {
          saveStockMovementsToLocalStorage(storeId!, apiStockMovements);
          setStockMovements(apiStockMovements);
        }
        if (apiStore) {
          saveStoreToLocalStorage(storeId!, apiStore);
          setStore(apiStore);
        }
      } else {
        // If offline, get data from localStorage
        const storedProducts = getProductsFromLocalStorage(storeId!);
        const storedCategories = getCategoriesFromLocalStorage(storeId!);
        const storedMovements = getStockMovementsFromLocalStorage(storeId!);
        const storedStore = getStoreFromLocalStorage(storeId!);

        if (storedProducts) setProducts(storedProducts);
        if (storedCategories) setCategories(storedCategories);
        if (storedMovements) setStockMovements(storedMovements);
        if (storedStore) setStore(storedStore);
      }
    };

    initializeData();
  }, [
    storeId,
    apiProducts,
    apiCategories,
    apiStockMovements,
    apiStore,
    isOnline,
  ]);

  // Initialize sync when component mounts
  useEffect(() => {
    if (networkStatus.isNetworkOnline()) {
      syncManager.syncOfflineData();
    }
  }, []);

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    if (searchTerm) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(
        (product) => product.category._id === selectedCategory
      );
    }

    const [field, direction] = sortBy.startsWith("-")
      ? [sortBy.substring(1), "desc"]
      : [sortBy, "asc"];

    filtered.sort((a: any, b: any) => {
      let comparison = 0;
      switch (field) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "stock":
        case "price":
          comparison = a[field] - b[field];
          break;
        case "createdAt":
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        default:
          comparison = 0;
      }
      return direction === "desc" ? -comparison : comparison;
    });

    return filtered;
  }, [products, searchTerm, selectedCategory, sortBy]);

  const totalPages = Math.ceil(
    (filteredProducts?.length || 0) / ITEMS_PER_PAGE
  );

  const handleEdit = (product: any) => {
    setSelectedProduct(product);
    setShowMovementModal(true);
  };

  const handleViewHistory = (product: any) => {
    setSelectedProduct(product);
    setShowProductHistoryModal(true);
  };

  const handleStockMovement = async (data: any) => {
    try {
      let quantity;
      if (data.type === "adjustment") {
        quantity = Number(data.quantity) - selectedProduct.stock;
      } else {
        quantity =
          data.type === "out" ? -Number(data.quantity) : Number(data.quantity);
      }

      const movementData = {
        product: selectedProduct._id,
        type: data.type,
        quantity,
        reason: data.reason,
        store: storeId,
      };

      if (!networkStatus.isNetworkOnline()) {
        // Handle offline stock movement
        const handled = await handleOfflineAction(
          "inventory",
          "create",
          movementData
        );
        if (handled) {
          // Update local product stock
          const updatedProducts = products.map((p) =>
            p._id === selectedProduct._id
              ? { ...p, stock: p.stock + quantity }
              : p
          );
          setProducts(updatedProducts);
          saveProductsToLocalStorage(storeId!, updatedProducts);

          // Add to local stock movements
          const newMovement = {
            ...movementData,
            _id: `temp_${Date.now()}`,
            createdAt: new Date().toISOString(),
          };
          const updatedMovements = [...stockMovements, newMovement];
          setStockMovements(updatedMovements);
          saveStockMovementsToLocalStorage(storeId!, updatedMovements);

          toast.success("Stock movement saved offline. Will sync when online.");
          setShowMovementModal(false);
          setSelectedProduct(null);
          return;
        }
      }

      await addStockMovement(movementData).unwrap();
      toast.success("Stock movement recorded successfully");
      setShowMovementModal(false);
      setSelectedProduct(null);
    } catch (error) {
      toast.error("Failed to record stock movement");
    }
  };

  const handleExportToExcel = () => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(
      stockMovements.map((movement) => ({
        Date: new Date(movement.createdAt).toLocaleString(),
        Product:
          products.find((p) => p._id === movement.product)?.name || "Unknown",
        Type: movement.type,
        Quantity: movement.quantity,
        Reason: movement.reason,
        Status: movement._id.startsWith("temp_") ? "Pending Sync" : "Synced",
      }))
    );

    XLSX.utils.book_append_sheet(workbook, worksheet, "Stock Movements");
    const currentDate = new Date().toISOString().split("T")[0];
    XLSX.writeFile(workbook, `stock_movements_${currentDate}.xlsx`);
  };

  if (!store?.settings) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Package className="h-6 w-6" />
            Inventory Management
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowMovementModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover"
            >
              <History className="h-4 w-4 mr-2" />
              Record Movement
            </button>
            <button
              onClick={handleExportToExcel}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export to Excel
            </button>
          </div>
        </div>

        <InventoryFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedCategory={selectedCategory}
          categories={categories}
          onCategoryChange={setSelectedCategory}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        <InventoryList
          products={filteredProducts}
          storeSettings={store.settings}
          onEdit={handleEdit}
          onViewHistory={handleViewHistory}
          currentPage={currentPage}
          itemsPerPage={ITEMS_PER_PAGE}
          categories={categories}
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />

        <StockMovementHistory movements={stockMovements} />

        {showMovementModal && selectedProduct && (
          <StockMovementModal
            product={selectedProduct}
            onClose={() => {
              setShowMovementModal(false);
              setSelectedProduct(null);
            }}
            onSubmit={handleStockMovement}
          />
        )}

        {showProductHistoryModal && selectedProduct && (
          <ProductStockHistoryModal
            product={selectedProduct}
            stockMovements={stockMovements}
            onClose={() => {
              setShowProductHistoryModal(false);
              setSelectedProduct(null);
            }}
          />
        )}
      </div>
      <OfflineIndicator />
    </>
  );
};

export default Inventory;
