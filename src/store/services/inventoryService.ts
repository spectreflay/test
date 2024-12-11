import { api } from '../api';
import { createNotification } from '../../utils/notification';
import { getStockAlertMessage, shouldCreateStockAlert } from '../../utils/inventory';

export interface StockMovement {
  _id: string;
  product: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  reference?: string;
  store: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockAlert {
  _id: string;
  product: string;
  store: string;
  type: 'low_stock' | 'out_of_stock' | 'critical';
  threshold: number;
  status: 'active' | 'resolved';
  createdAt: string;
  updatedAt: string;
}

export const inventoryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getStockMovements: builder.query<StockMovement[], string>({
      query: (storeId) => `inventory/movements/${storeId}`,
      providesTags: ['Inventory'],
    }),
    addStockMovement: builder.mutation<StockMovement, Partial<StockMovement>>({
      query: (movement) => ({
        url: 'inventory/movements',
        method: 'POST',
        body: movement,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled, getState }) {
        try {
          await queryFulfilled;
          const state = getState() as any;
          const store = state.api.queries[`getStore(${arg.store})`]?.data;
          const product = state.api.queries[`getProducts(${arg.store})`]?.data?.find(
            (p: any) => p._id === arg.product
          );

          if (store?.settings && product) {
            const newStock = product.stock + (arg.quantity || 0);
            if (shouldCreateStockAlert(newStock, store.settings)) {
              const message = getStockAlertMessage(product.name, newStock, store.settings);
              await createNotification(dispatch, message, 'alert', arg.store);
            }
          }
        } catch (error) {
          console.error('Failed to process stock movement:', error);
        }
      },
      invalidatesTags: ['Inventory', 'Products'],
    }),
    getStockAlerts: builder.query<StockAlert[], string>({
      query: (storeId) => `inventory/alerts/${storeId}`,
      providesTags: ['Inventory'],
    }),
    updateStockAlert: builder.mutation<StockAlert, Partial<StockAlert> & Pick<StockAlert, '_id'>>({
      query: ({ _id, ...patch }) => ({
        url: `inventory/alerts/${_id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: ['Inventory'],
    }),
  }),
});

export const {
  useGetStockMovementsQuery,
  useAddStockMovementMutation,
  useGetStockAlertsQuery,
  useUpdateStockAlertMutation,
} = inventoryApi;