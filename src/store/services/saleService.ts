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

          // Use the productApi to fetch products instead of using fetch directly
          const productsResult = await dispatch(
            productApi.endpoints.getProducts.initiate(arg.store)
          );

          if (productsResult.data) {
            // Check stock levels after sale
            productsResult.data.forEach(
              (product: { name: string; stock: number }) => {
                if (product.stock <= 10) {
                  createNotification(
                    dispatch,
                    getLowStockMessage(product.name, product.stock),
                    "alert",
                    arg.store
                  );
                }
              }
            );
          } else {
            throw new Error("Failed to fetch products");
          }
        } catch (error) {
          console.error("Error in createSale:", error);
          // Handle error if needed
        }
      },
      invalidatesTags: ["Sales", "Products", "Inventory"],
    }),
    getSales: builder.query<Sale[], string>({
      query: (storeId) => `sales/${storeId}`,
      providesTags: ["Sales"],
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
