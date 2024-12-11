import { openDB, DBSchema, IDBPDatabase } from "idb";

interface OfflineDB extends DBSchema {
  offlineSales: {
    key: string;
    value: {
      id: string;
      data: any;
      createdAt: number;
      synced: boolean;
    };
  };
  offlineProducts: {
    key: string;
    value: {
      id: string;
      action: "create" | "update" | "delete";
      data: any;
      createdAt: number;
      synced: boolean;
    };
  };
  offlineCategories: {
    key: string;
    value: {
      id: string;
      action: "create" | "update" | "delete";
      data: any;
      createdAt: number;
      synced: boolean;
    };
  };
  offlineInventory: {
    key: string;
    value: {
      id: string;
      action: "create" | "update";
      data: any;
      createdAt: number;
      synced: boolean;
    };
  };
  offlineReports: {
    key: string;
    value: {
      id: string;
      data: any;
      createdAt: number;
      synced: boolean;
    };
  };
}

const DB_NAME = "pos_offline_db";
const DB_VERSION = 2;

export const initDB = async (): Promise<IDBPDatabase<OfflineDB>> => {
  return openDB<OfflineDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // Create stores if they don't exist
      if (!db.objectStoreNames.contains("offlineSales")) {
        db.createObjectStore("offlineSales", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("offlineProducts")) {
        db.createObjectStore("offlineProducts", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("offlineCategories")) {
        db.createObjectStore("offlineCategories", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("offlineInventory")) {
        db.createObjectStore("offlineInventory", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("offlineReports")) {
        db.createObjectStore("offlineReports", { keyPath: "id" });
      }
    },
  });
};

// Generic function to save offline data
const saveOfflineData = async (
  storeName: keyof OfflineDB,
  data: any,
  action?: "create" | "update" | "delete"
): Promise<string> => {
  const db = await initDB();
  const id = `${storeName}_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  const offlineData = {
    id,
    action,
    data,
    createdAt: Date.now(),
    synced: false,
  };

  await db.add(storeName, offlineData);
  return id;
};

// Generic function to get unsynced data
const getUnsynedData = async (storeName: keyof OfflineDB) => {
  const db = await initDB();
  const allData = await db.getAll(storeName);
  return allData.filter((item) => !item.synced);
};

// Generic function to mark data as synced
const markAsSynced = async (storeName: keyof OfflineDB, id: string) => {
  const db = await initDB();
  const item = await db.get(storeName, id);
  if (item) {
    item.synced = true;
    await db.put(storeName, item);
  }
};

// Generic function to delete offline data
const deleteOfflineData = async (storeName: keyof OfflineDB, id: string) => {
  const db = await initDB();
  await db.delete(storeName, id);
};

// Specific functions for each entity type
export const saveOfflineProduct = async (
  data: any,
  action: "create" | "update" | "delete"
) => {
  return saveOfflineData("offlineProducts", data, action);
};

export const saveOfflineCategory = async (
  data: any,
  action: "create" | "update" | "delete"
) => {
  return saveOfflineData("offlineCategories", data, action);
};

export const saveOfflineInventory = async (
  data: any,
  action: "create" | "update"
) => {
  return saveOfflineData("offlineInventory", data, action);
};

export const saveOfflineReport = async (data: any) => {
  return saveOfflineData("offlineReports", data);
};

export const saveOfflineSale = async (data: any) => {
  return saveOfflineData("offlineSales", data);
};

export const getUnsynedProducts = async () => {
  return getUnsynedData("offlineProducts");
};

export const getUnsynedCategories = async () => {
  return getUnsynedData("offlineCategories");
};

export const getUnsynedInventory = async () => {
  return getUnsynedData("offlineInventory");
};

export const getUnsynedReports = async () => {
  return getUnsynedData("offlineReports");
};

export const getUnsynedSales = async () => {
  return getUnsynedData("offlineSales");
};

export const markProductAsSynced = async (id: string) => {
  return markAsSynced("offlineProducts", id);
};

export const markCategoryAsSynced = async (id: string) => {
  return markAsSynced("offlineCategories", id);
};

export const markInventoryAsSynced = async (id: string) => {
  return markAsSynced("offlineInventory", id);
};

export const markReportAsSynced = async (id: string) => {
  return markAsSynced("offlineReports", id);
};

export const markSaleAsSynced = async (id: string) => {
  return markAsSynced("offlineSales", id);
};

export const deleteOfflineProduct = async (id: string) => {
  return deleteOfflineData("offlineProducts", id);
};

export const deleteOfflineCategory = async (id: string) => {
  return deleteOfflineData("offlineCategories", id);
};

export const deleteOfflineInventory = async (id: string) => {
  return deleteOfflineData("offlineInventory", id);
};

export const deleteOfflineReport = async (id: string) => {
  return deleteOfflineData("offlineReports", id);
};

export const deleteOfflineSale = async (id: string) => {
  return deleteOfflineData("offlineSales", id);
};
