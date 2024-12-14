import { api } from "../api";
import {
  createNotification,
  getLowStockMessage,
} from "../../utils/notification";
import { CartItem } from "../../components/sales/types";
import { productApi } from "./productService";

export interface Sale {
  _id: string;
  store: string;
  items: Array<{
    product: {
      _id: string;
      name: string;
      price: number;
    } | null;
    quantity: number;
    modifiers: Array<{
      name: string;
      option: {
        name: string;
        price: number;
      };
    }>;
    discounts: Array<{
      name: string;
      type: "percentage" | "fixed";
      value: number;
    }>;
    price: number;
  }>;
  total: number;
  paymentMethod: "cash" | "card" | "qr";
  paymentDetails: Record<string, unknown>;
  status: "completed" | "refunded";
  createdAt: string;
  updatedAt: string;
}

export interface CreateSaleRequest {
  store: string;
  items: Array<{
    product: string;
    quantity: number;
    modifiers: Array<{
      name: string;
      option: {
        name: string;
        price: number;
      };
    }>;
    discounts: Array<{
      name: string;
      type: "percentage" | "fixed";
      value: number;
    }>;
    price: number;
  }>;
  total: number;
  paymentMethod: "cash" | "card" | "qr";
  paymentDetails: Record<string, unknown>;
}

export interface SaleMetrics {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
}

export const saleApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createSale: builder.mutation<Sale, CreateSaleRequest>({
      query: (saleData) => ({
        url: "sales",
        method: "POST",
        body: saleData,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          // Update the sales list cache and invalidate related queries
          dispatch(saleApi.util.invalidateTags(['Sales']));

          // Check stock levels after sale
          const productsResult = await dispatch(
            productApi.endpoints.getProducts.initiate(arg.store)
          );

          if (productsResult.data) {
            productsResult.data.forEach((product) => {
              if (product.stock <= 10) {
                createNotification(
                  dispatch,
                  getLowStockMessage(product.name, product.stock),
                  "alert",
                  arg.store
                );
              }
            });
          }
        } catch (error) {
          console.error("Error in createSale:", error);
        }
      },
      invalidatesTags: ["Sales", "Products", "Inventory"],
    }),
    getSales: builder.query<Sale[], string>({
      query: (storeId) => `sales/${storeId}`,
      providesTags: ["Sales"],
      transformResponse: (response: Sale[]) => {
        // Sort sales by date (newest first)
        return [...response].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      },
    }),
    getSaleMetrics: builder.query<
      SaleMetrics,
      { storeId: string; startDate: string; endDate: string }
    >({
      query: ({ storeId, startDate, endDate }) =>
        `sales/${storeId}/metrics?startDate=${startDate}&endDate=${endDate}`,
      providesTags: ["Sales"],
    }),
    refundSale: builder.mutation<Sale, string>({
      query: (saleId) => ({
        url: `sales/${saleId}/refund`,
        method: "POST",
      }),
      invalidatesTags: ["Sales", "Products", "Inventory"],
    }),
  }),
});

export const {
  useCreateSaleMutation,
  useGetSalesQuery,
  useGetSaleMetricsQuery,
  useRefundSaleMutation,
} = saleApi;