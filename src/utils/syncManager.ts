import { networkStatus } from "./networkStatus";
import {
  getUnsynedSales,
  getUnsynedProducts,
  getUnsynedCategories,
  getUnsynedInventory,
  getUnsynedReports,
  markSaleAsSynced,
  markProductAsSynced,
  markCategoryAsSynced,
  markInventoryAsSynced,
  markReportAsSynced,
  deleteOfflineSale,
  deleteOfflineProduct,
  deleteOfflineCategory,
  deleteOfflineInventory,
  deleteOfflineReport,
  deleteOfflineDiscount,
  markDiscountAsSynced,
  getUnsynedDiscounts,
  initDB,
} from "./indexedDB";
import { createNotification } from "./notification";
import { store } from "../store";
import { saleApi } from "../store/services/saleService";
import { productApi } from "../store/services/productService";
import { categoryApi } from "../store/services/categoryService";
import { inventoryApi } from "../store/services/inventoryService";
import { toast } from "react-hot-toast";
import { discountApi } from "../store/services/discountService";

class SyncManager {
  private isSyncing: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private idMappings: Map<string, string> = new Map();

  constructor() {
    this.setupNetworkListener();
    this.startPeriodicSync();
  }

  private setupNetworkListener() {
    networkStatus.addCallback((online) => {
      if (online) {
        this.syncOfflineData();
      }
    });
  }

  private startPeriodicSync() {
    this.syncInterval = setInterval(() => {
      if (networkStatus.isNetworkOnline()) {
        this.syncOfflineData();
      }
    }, 60000); // Check every minute
  }

  private async syncProducts() {
    const unsynedProducts = await getUnsynedProducts();
    const processedIds = new Set<string>();

    for (const product of unsynedProducts) {
      if (processedIds.has(product.data._id)) continue;
      processedIds.add(product.data._id);

      try {
        switch (product.action) {
          case "create":
            if (product.data._id.startsWith("temp_")) {
              const { _id, ...productData } = product.data;
              
              // Update category ID if it's a temporary ID
              if (productData.category && productData.category.startsWith("temp_")) {
                productData.category = this.idMappings.get(productData.category) || productData.category;
              }

              const createdProduct = await store
                .dispatch(
                  productApi.endpoints.createProduct.initiate(productData)
                )
                .unwrap();

              // Store the mapping of temporary to server ID
              this.idMappings.set(_id, createdProduct._id);

              // Update local state
              store.dispatch(
                productApi.util.updateQueryData(
                  "getProducts",
                  productData.store,
                  (draft) => {
                    const index = draft.findIndex((p) => p._id === _id);
                    if (index !== -1) {
                      draft[index] = createdProduct;
                    }
                  }
                )
              );
            }
            break;

          case "update":
            const updateId =
              this.idMappings.get(product.data._id) || product.data._id;
            await store
              .dispatch(
                productApi.endpoints.updateProduct.initiate({
                  ...product.data,
                  _id: updateId,
                })
              )
              .unwrap();
            break;

          case "delete":
            const deleteId =
              this.idMappings.get(product.data._id) || product.data._id;
            await store
              .dispatch(productApi.endpoints.deleteProduct.initiate(deleteId))
              .unwrap();
            break;
        }

        await markProductAsSynced(product.id);
        await deleteOfflineProduct(product.id);
      } catch (error) {
        console.error("Failed to sync product:", error);
      }
    }

    return unsynedProducts.length;
  }

  private async syncCategories() {
    const unsynedCategories = await getUnsynedCategories();
    let syncedCount = 0;

    for (const category of unsynedCategories) {
      try {
        const { _id, ...categoryData } = category.data;
        const result = await store
          .dispatch(
            categoryApi.endpoints.createCategory.initiate(categoryData)
          )
          .unwrap();

        // Store the mapping of temporary to server ID
        this.idMappings.set(_id, result._id);

        await markCategoryAsSynced(category.id);
        await deleteOfflineCategory(category.id);
        syncedCount++;
      } catch (error) {
        console.error("Failed to sync category:", error);
      }
    }

    return syncedCount;
  }

  private async syncDiscounts() {
    const unsynedDiscounts = await getUnsynedDiscounts();
    let syncedCount = 0;

    for (const discount of unsynedDiscounts) {
      try {
        const { _id, ...discountData } = discount.data;

        // Update product IDs if they're temporary IDs
        if (discountData.products) {
          discountData.products = discountData.products.map((productId: string) => 
            this.idMappings.get(productId) || productId
          );
        }

        const result = await store
          .dispatch(
            discountApi.endpoints.createDiscount.initiate(discountData)
          )
          .unwrap();

        // Store the mapping of temporary to server ID
        this.idMappings.set(_id, result._id);

        await markDiscountAsSynced(discount.id);
        await deleteOfflineDiscount(discount.id);
        syncedCount++;
      } catch (error) {
        console.error("Failed to sync discount:", error);
      }
    }

    return syncedCount;
  }

  private async syncInventory() {
    const unsynedInventory = await getUnsynedInventory();
    let syncedCount = 0;

    for (const inventory of unsynedInventory) {
      try {
        // Update product references with server IDs
        const updatedData = {
          ...inventory.data,
          product:
            this.idMappings.get(inventory.data.product) ||
            inventory.data.product,
        };

        await store
          .dispatch(
            inventoryApi.endpoints.addStockMovement.initiate(updatedData)
          )
          .unwrap();

        await markInventoryAsSynced(inventory.id);
        await deleteOfflineInventory(inventory.id);
        syncedCount++;
      } catch (error) {
        console.error("Failed to sync inventory:", error);
      }
    }

    return syncedCount;
  }

  private async syncSales() {
    const unsynedSales = await getUnsynedSales();
  
    for (const sale of unsynedSales) {
      try {
        // Update sale items with server IDs for products and discounts
        const updatedItems = sale.data.items.map((item: any) => ({
          ...item,
          product: this.idMappings.get(item.product) || item.product,
          discounts: item.discounts.map((discount: any) => ({
            ...discount,
            _id: this.idMappings.get(discount._id) || discount._id
          }))
        }));
  
        const saleData = {
          ...sale.data,
          items: updatedItems,
        };
  
        // If the sale has a global discount, update its ID as well
        if (saleData.discount && saleData.discount._id) {
          saleData.discount = {
            ...saleData.discount,
            _id: this.idMappings.get(saleData.discount._id) || saleData.discount._id
          };
        }
  
        const result = await store
          .dispatch(saleApi.endpoints.createSale.initiate(saleData))
          .unwrap();
  
        // Update local state
        store.dispatch(
          saleApi.util.updateQueryData("getSales", sale.data.store, (draft) => {
            const index = draft.findIndex((s) => s._id === sale.data._id);
            if (index !== -1) {
              draft[index] = result;
            } else {
              draft.unshift(result);
            }
          })
        );
  
        await markSaleAsSynced(sale.id);
        await deleteOfflineSale(sale.id);
      } catch (error) {
        console.error("Failed to sync sale:", error);
      }
    }
  
    return unsynedSales.length;
  }

  private async syncReports() {
    const unsynedReports = await getUnsynedReports();
    for (const report of unsynedReports) {
      try {
        // Store reports locally until online
        await markReportAsSynced(report.id);
        await deleteOfflineReport(report.id);
      } catch (error) {
        console.error("Failed to sync report:", error);
      }
    }
    return unsynedReports.length;
  }


  public async syncOfflineData() {
    if (this.isSyncing) return;

    try {
      this.isSyncing = true;
      this.idMappings.clear();

      // Sync in the correct order: categories -> products -> discounts -> inventory -> sales -> reports
      const categoriesCount = await this.syncCategories();
      const productsCount = await this.syncProducts();
      const discountsCount = await this.syncDiscounts();
      const inventoryCount = await this.syncInventory();
      const salesCount = await this.syncSales();
      const reportsCount = await this.syncReports();

      const totalSynced =
        categoriesCount +
        productsCount +
        discountsCount +
        inventoryCount +
        salesCount +
        reportsCount;

      if (totalSynced > 0) {
        const message = `Successfully synchronized ${totalSynced} items`;
        await createNotification(store.dispatch, message, "system");
        toast.success(message);
      }
    } catch (error) {
      console.error("Error during sync process:", error);
      const errorMessage = "Some data failed to sync. Will retry later.";
      await createNotification(store.dispatch, errorMessage, "alert");
      toast.error(errorMessage);
    } finally {
      this.isSyncing = false;
      this.idMappings.clear();
    }
  }

  public cleanup() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
}

export const syncManager = new SyncManager();

