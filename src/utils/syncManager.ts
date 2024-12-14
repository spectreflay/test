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

interface IdMapping {
  [tempId: string]: string;
}
class SyncManager {
  private isSyncing: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private idMappings: IdMapping = {};

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
    const actionsMap = new Map<
      string,
      { action: string; data: any; offlineId: string; synced: boolean }[]
    >();

    // Group actions by product ID
    for (const product of unsynedProducts) {
      const productId = product.data._id;
      if (!actionsMap.has(productId)) {
        actionsMap.set(productId, []);
      }
      actionsMap.get(productId)!.push({
        action: product.action,
        data: product.data,
        offlineId: product.id,
        synced: false,
      });
    }

    for (const [productId, actions] of actionsMap) {
      if (processedIds.has(productId)) continue;
      processedIds.add(productId);

      try {
        let serverProductId = productId;

        for (const action of actions) {
          if (action.synced) continue;

          switch (action.action) {
            case "create":
              if (productId.startsWith("temp_")) {
                const { _id, ...productDataWithoutId } = action.data;
                const createdProduct = await store
                  .dispatch(
                    productApi.endpoints.createProduct.initiate(
                      productDataWithoutId
                    )
                  )
                  .unwrap();
                serverProductId = createdProduct._id;
                
                // Store the ID mapping
                this.idMappings[productId] = serverProductId;

                // Update local state
                store.dispatch(
                  productApi.util.updateQueryData(
                    "getProducts",
                    action.data.store,
                    (draft) => {
                      const index = draft.findIndex((p) => p._id === productId);
                      if (index !== -1) {
                        draft[index] = createdProduct;
                      } else {
                        draft.push(createdProduct);
                      }
                    }
                  )
                );
              }
              break;
            case "update":
              await store
                .dispatch(
                  productApi.endpoints.updateProduct.initiate({
                    ...action.data,
                    _id: serverProductId,
                  })
                )
                .unwrap();
              break;
            case "delete":
              await store
                .dispatch(
                  productApi.endpoints.deleteProduct.initiate(serverProductId)
                )
                .unwrap();
              store.dispatch(
                productApi.util.updateQueryData(
                  "getProducts",
                  action.data.store,
                  (draft) => {
                    return draft.filter((p) => p._id !== serverProductId);
                  }
                )
              );
              break;
          }

          action.synced = true;
          await markProductAsSynced(action.offlineId);
          await deleteOfflineProduct(action.offlineId);
        }
      } catch (error) {
        console.error("Failed to sync product:", error);
        // If there's an error, we keep the unsynced offline data for future sync attempts
      }
    }

    return unsynedProducts.length;
  }
  private async syncCategories() {
    const unsynedCategories = await getUnsynedCategories();
    const processedIds = new Set<string>();
    const actionsMap = new Map<
      string,
      { action: string; data: any; offlineId: string; synced: boolean }[]
    >();

    // Group actions by category ID
    for (const category of unsynedCategories) {
      const categoryId = category.data._id;
      if (!actionsMap.has(categoryId)) {
        actionsMap.set(categoryId, []);
      }
      actionsMap.get(categoryId)!.push({
        action: category.action,
        data: category.data,
        offlineId: category.id,
        synced: false,
      });
    }

    for (const [categoryId, actions] of actionsMap) {
      if (processedIds.has(categoryId)) continue;
      processedIds.add(categoryId);

      try {
        let serverCategoryId = categoryId;
        let latestCategoryData = actions[actions.length - 1].data;

        for (const action of actions) {
          if (action.synced) continue;

          switch (action.action) {
            case "create":
              if (categoryId.startsWith("temp_")) {
                const createdCategory = await store
                  .dispatch(
                    categoryApi.endpoints.createCategory.initiate(action.data)
                  )
                  .unwrap();
                serverCategoryId = createdCategory._id;

                // Update local state
                store.dispatch(
                  categoryApi.util.updateQueryData(
                    "getCategories",
                    action.data.store,
                    (draft) => {
                      const index = draft.findIndex(
                        (c) => c._id === categoryId
                      );
                      if (index !== -1) {
                        draft[index] = createdCategory;
                      } else {
                        draft.push(createdCategory);
                      }
                    }
                  )
                );
              }
              break;
            case "update":
              await store
                .dispatch(
                  categoryApi.endpoints.updateCategory.initiate({
                    ...action.data,
                    _id: serverCategoryId,
                  })
                )
                .unwrap();
              break;
            case "delete":
              await store
                .dispatch(
                  categoryApi.endpoints.deleteCategory.initiate(
                    serverCategoryId
                  )
                )
                .unwrap();
              store.dispatch(
                categoryApi.util.updateQueryData(
                  "getCategories",
                  action.data.store,
                  (draft) => {
                    return draft.filter((c) => c._id !== serverCategoryId);
                  }
                )
              );
              break;
          }

          action.synced = true;
          await markCategoryAsSynced(action.offlineId);
          await deleteOfflineCategory(action.offlineId);
        }
      } catch (error) {
        console.error("Failed to sync category:", error);
        // If there's an error, we keep the unsynced offline data for future sync attempts
      }
    }

    return unsynedCategories.length;
  }

  private async syncDiscounts() {
    const unsynedDiscounts = await getUnsynedDiscounts();
    const processedIds = new Set<string>();
    const actionsMap = new Map<
      string,
      { action: string; data: any; offlineId: string; synced: boolean }[]
    >();

    // Group actions by discount ID
    for (const discount of unsynedDiscounts) {
      const discountId = discount.data._id;
      if (!actionsMap.has(discountId)) {
        actionsMap.set(discountId, []);
      }
      actionsMap.get(discountId)!.push({
        action: discount.action,
        data: discount.data,
        offlineId: discount.id,
        synced: false,
      });
    }

    for (const [discountId, actions] of actionsMap) {
      if (processedIds.has(discountId)) continue;
      processedIds.add(discountId);

      try {
        let serverDiscountId = discountId;

        for (const action of actions) {
          if (action.synced) continue;

          switch (action.action) {
            case "create":
              if (discountId.startsWith("temp_")) {
                const { _id, ...discountDataWithoutId } = action.data;
                const createdDiscount = await store
                  .dispatch(
                    discountApi.endpoints.createDiscount.initiate(
                      discountDataWithoutId
                    )
                  )
                  .unwrap();

                serverDiscountId = createdDiscount._id;
                // Store the mapping of temporary to real ID
                this.tempToRealIdMap.set(discountId, serverDiscountId);

                // Update local state
                store.dispatch(
                  discountApi.util.updateQueryData(
                    "getDiscounts",
                    action.data.store,
                    (draft) => {
                      const index = draft.findIndex((d) => d._id === discountId);
                      if (index !== -1) {
                        draft[index] = createdDiscount;
                      } else {
                        draft.push(createdDiscount);
                      }
                    }
                  )
                );
              }
              break;
            case "update":
              await store
                .dispatch(
                  discountApi.endpoints.updateDiscount.initiate({
                    ...action.data,
                    _id: serverDiscountId,
                  })
                )
                .unwrap();
              break;
            case "delete":
              await store
                .dispatch(
                  discountApi.endpoints.deleteDiscount.initiate(serverDiscountId)
                )
                .unwrap();
              store.dispatch(
                discountApi.util.updateQueryData(
                  "getDiscounts",
                  action.data.store,
                  (draft) => {
                    return draft.filter((d) => d._id !== serverDiscountId);
                  }
                )
              );
              break;
          }

          action.synced = true;
          await markDiscountAsSynced(action.offlineId);
          await deleteOfflineDiscount(action.offlineId);
        }
      } catch (error) {
        console.error("Failed to sync discount:", error);
        // If there's an error, we keep the unsynced offline data for future sync attempts
      }
    }

    return unsynedDiscounts.length;
  }

  private async syncInventory() {
    const unsynedInventory = await getUnsynedInventory();
    const processedIds = new Set<string>();
    const actionsMap = new Map<
      string,
      { action: string; data: any; offlineId: string; synced: boolean }[]
    >();

    // Group actions by inventory ID
    for (const inventory of unsynedInventory) {
      const inventoryId = inventory.data._id;
      if (!actionsMap.has(inventoryId)) {
        actionsMap.set(inventoryId, []);
      }
      actionsMap.get(inventoryId)!.push({
        action: inventory.action,
        data: inventory.data,
        offlineId: inventory.id,
        synced: false,
      });
    }

    for (const [inventoryId, actions] of actionsMap) {
      if (processedIds.has(inventoryId)) continue;
      processedIds.add(inventoryId);

      try {
        for (const action of actions) {
          if (action.synced) continue;

          switch (action.action) {
            case "create":
            case "update":
              await store
                .dispatch(
                  inventoryApi.endpoints.addStockMovement.initiate(action.data)
                )
                .unwrap();
              break;
          }

          action.synced = true;
          await markInventoryAsSynced(action.offlineId);
          await deleteOfflineInventory(action.offlineId);
        }
      } catch (error) {
        console.error("Failed to sync inventory:", error);
        // If there's an error, we keep the unsynced offline data for future sync attempts
      }
    }

    return unsynedInventory.length;
  }

  private async syncSales() {
    const unsynedSales = await getUnsynedSales();
    let syncedCount = 0;

    for (const sale of unsynedSales) {
      try {
        // Update sale data with real product IDs
        const updatedSaleData = {
          ...sale.data,
          items: sale.data.items.map((item: any) => ({
            ...item,
            product: this.idMappings[item.product] || item.product,
          })),
        };

        const result = await store
          .dispatch(saleApi.endpoints.createSale.initiate(updatedSaleData))
          .unwrap();

        // Get all active subscriptions for getSales queries
        const subscriptions = store.getState().api.subscriptions;
        const salesQueries = Object.entries(subscriptions)
          .filter(([key]) => key.startsWith('getSales'))
          .map(([key]) => {
            const match = key.match(/getSales\((.*?)\)/);
            return match ? match[1] : null;
          })
          .filter(Boolean);

        // Update all active getSales queries
        salesQueries.forEach(storeId => {
          store.dispatch(
            saleApi.util.updateQueryData(
              "getSales",
              storeId,
              (draft) => {
                const index = draft.findIndex((s) => s._id === sale.data._id);
                if (index !== -1) {
                  draft[index] = result;
                } else {
                  draft.unshift(result);
                }
                return draft;
              }
            )
          );
        });

        store.dispatch(saleApi.util.invalidateTags(['Sales']));

        await markSaleAsSynced(sale.id);
        await deleteOfflineSale(sale.id);
        syncedCount++;
      } catch (error) {
        console.error("Failed to sync sale:", error);
      }
    }

    return syncedCount;
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

  private tempToRealIdMap = new Map<string, string>();

  public async syncOfflineData() {
    if (this.isSyncing) return;

    try {
      this.isSyncing = true;
      this.idMappings = {};

      // Sync in the correct order: categories -> products -> discounts -> inventory -> sales -> reports
      const [
        categoriesCount,
        productsCount,
        discountsCount,
        inventoryCount,
        salesCount,
        reportsCount,
      ] = await Promise.all([
        this.syncCategories(),
        this.syncProducts(),
        this.syncDiscounts(),
        this.syncInventory(),
        this.syncSales(),
        this.syncReports(),
      ]);

      const syncedEntities = [
        { type: "product", count: productsCount },
        { type: "category", count: categoriesCount },
        { type: "discount", count: discountsCount },
        { type: "inventory", count: inventoryCount },
        { type: "sale", count: salesCount },
        { type: "report", count: reportsCount },
      ].filter((entity) => entity.count > 0);

      const totalSynced = syncedEntities.reduce(
        (sum, entity) => sum + entity.count,
        0
      );

      if (totalSynced > 0) {
        // Show individual entity sync notifications
        for (const entity of syncedEntities) {
          const message = `Successfully synchronized ${entity.count} ${
            entity.type
          }${entity.count > 1 ? "s" : ""}`;
          await createNotification(store.dispatch, message, "system");
          toast.success(message);
        }

        // Show overall sync notification
        const overallMessage = `Successfully synchronized ${totalSynced} total item${
          totalSynced > 1 ? "s" : ""
        }`;
        await createNotification(store.dispatch, overallMessage, "system");
        toast.success(overallMessage);
      }
    } catch (error) {
      console.error("Error during sync process:", error);
      const errorMessage = "Some data failed to sync. Will retry later.";
      await createNotification(store.dispatch, errorMessage, "alert");
      toast.error(errorMessage);
    } finally {
      this.isSyncing = false;
      this.tempToRealIdMap.clear();
    }
  }

  private async updateOfflineSaleReferences() {
    const db = await initDB();
    const unsynedSales = await getUnsynedSales();

    for (const sale of unsynedSales) {
      let needsUpdate = false;
      const updatedItems = sale.data.items.map((item) => {
        const updatedItem = { ...item };

        // Update product reference
        if (item.product.startsWith("temp_")) {
          const realProductId = this.tempToRealIdMap.get(item.product);
          if (realProductId) {
            updatedItem.product = realProductId;
            needsUpdate = true;
          }
        }

        // Update discount references
        if (item.discounts?.length) {
          updatedItem.discounts = item.discounts.map((discount) => {
            if (discount._id?.startsWith("temp_")) {
              const realDiscountId = this.tempToRealIdMap.get(discount._id);
              return realDiscountId
                ? { ...discount, _id: realDiscountId }
                : discount;
            }
            return discount;
          });
          needsUpdate = true;
        }

        return updatedItem;
      });

      if (needsUpdate) {
        const updatedSale = {
          ...sale,
          data: {
            ...sale.data,
            items: updatedItems,
          },
        };

        // Update the sale in IndexedDB
        const tx = db.transaction("offlineSales", "readwrite");
        await tx.store.put(updatedSale);
      }
    }
  }

  public cleanup() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
}

export const syncManager = new SyncManager();

