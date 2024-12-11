import { api } from "../api";
import { createNotification } from "../../utils/notification";
import { getStockAlertMessage, shouldCreateStockAlert } from "../../utils/inventory";

export interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  store: string;
  stock: number;
  image?: string;
  modifiers?: Array<{
    name: string;
    options: Array<{
      name: string;
      price: number;
    }>;
  }>;
  discounts?: Array<{
    name: string;
    type: "percentage" | "fixed";
    value: number;
    startDate: string;
    endDate: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  category: string;
  store: string;
  stock: number;
  image?: string;
  modifiers?: Product["modifiers"];
  discounts?: Product["discounts"];
}

export const productApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<Product[], string>({
      query: (storeId) => `products/${storeId}`,
      providesTags: ["Products"],
      async onCacheEntryAdded(
        arg,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, dispatch, getState }
      ) {
        try {
          await cacheDataLoaded;

          const state = getState() as any;
          const store = state.api.queries[`getStore(${arg})`]?.data;

          if (store?.settings) {
            const products = await cacheDataLoaded;
            products.forEach((product) => {
              if (shouldCreateStockAlert(product.stock, store.settings)) {
                const message = getStockAlertMessage(product.name, product.stock, store.settings);
                createNotification(dispatch, message, 'alert', product.store);
              }
            });
          }

          await cacheEntryRemoved;
        } catch (error) {
          console.error('Error checking product stock levels:', error);
        }
      },
    }),
    createProduct: builder.mutation<Product, CreateProductRequest>({
      query: (productData) => ({
        url: "products",
        method: "POST",
        body: productData,
      }),
      invalidatesTags: ["Products"],
    }),
    updateProduct: builder.mutation<
      Product,
      Partial<Product> & Pick<Product, "_id">
    >({
      query: ({ _id, ...patch }) => ({
        url: `products/${_id}`,
        method: "PUT",
        body: patch,
      }),
      invalidatesTags: ["Products"],
    }),
    deleteProduct: builder.mutation<void, string>({
      query: (id) => ({
        url: `products/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Products", "Categories", "Inventory"],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = productApi;