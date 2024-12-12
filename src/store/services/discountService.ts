import { api } from '../api';
import { networkStatus } from '../../utils/networkStatus';
import { handleOfflineAction } from '../../utils/offlineStorage';

export interface Discount {
  _id: string;
  name: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  startDate: string;
  endDate: string;
  minPurchase?: number;
  maxDiscount?: number;
  applicableProducts: string[];
  active: boolean;
  store: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDiscountRequest {
  name: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  startDate: string;
  endDate: string;
  minPurchase?: number;
  maxDiscount?: number;
  applicableProducts?: string[];
  active: boolean;
  store: string;
}

export const discountApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDiscounts: builder.query<Discount[], string>({
      query: (storeId) => `discounts/${storeId}`,
      providesTags: ['Discounts'],
    }),
    createDiscount: builder.mutation<Discount, CreateDiscountRequest>({
      query: (discountData) => ({
        url: 'discounts',
        method: 'POST',
        body: discountData,
      }),
      async onQueryStarted(discount, { dispatch, queryFulfilled }) {
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const optimisticDiscount = {
          _id: tempId,
          ...discount,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (!networkStatus.isNetworkOnline()) {
          await handleOfflineAction('discount', 'create', optimisticDiscount);
          dispatch(
            discountApi.util.updateQueryData('getDiscounts', discount.store, (draft) => {
              draft.push(optimisticDiscount);
            })
          );
          return;
        }

        try {
          const { data: createdDiscount } = await queryFulfilled;
          dispatch(
            discountApi.util.updateQueryData('getDiscounts', discount.store, (draft) => {
              const index = draft.findIndex((d) => d._id === tempId);
              if (index !== -1) {
                draft[index] = createdDiscount;
              } else {
                draft.push(createdDiscount);
              }
            })
          );
        } catch {
          dispatch(
            discountApi.util.updateQueryData('getDiscounts', discount.store, (draft) => {
              const index = draft.findIndex((d) => d._id === tempId);
              if (index !== -1) {
                draft.splice(index, 1);
              }
            })
          );
        }
      },
      invalidatesTags: ['Discounts'],
    }),
    updateDiscount: builder.mutation<Discount, Partial<Discount> & Pick<Discount, '_id'>>({
      query: ({ _id, ...patch }) => ({
        url: `discounts/${_id}`,
        method: 'PUT',
        body: patch,
      }),
      async onQueryStarted({ _id, ...patch }, { dispatch, queryFulfilled }) {
        if (!networkStatus.isNetworkOnline()) {
          await handleOfflineAction('discount', 'update', { _id, ...patch });
          dispatch(
            discountApi.util.updateQueryData('getDiscounts', patch.store!, (draft) => {
              const index = draft.findIndex((d) => d._id === _id);
              if (index !== -1) {
                Object.assign(draft[index], patch);
              }
            })
          );
          return;
        }

        const patchResult = dispatch(
          discountApi.util.updateQueryData('getDiscounts', patch.store!, (draft) => {
            const index = draft.findIndex((d) => d._id === _id);
            if (index !== -1) {
              Object.assign(draft[index], patch);
            }
          })
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: ['Discounts'],
    }),
    deleteDiscount: builder.mutation<void, string>({
      query: (id) => ({
        url: `discounts/${id}`,
        method: 'DELETE',
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        if (!networkStatus.isNetworkOnline()) {
          await handleOfflineAction('discount', 'delete', { _id: id });
          dispatch(
            discountApi.util.updateQueryData('getDiscounts', '', (draft) => {
              const index = draft.findIndex((d) => d._id === id);
              if (index !== -1) {
                draft.splice(index, 1);
              }
            })
          );
          return;
        }

        const patchResult = dispatch(
          discountApi.util.updateQueryData('getDiscounts', '', (draft) => {
            const index = draft.findIndex((d) => d._id === id);
            if (index !== -1) {
              draft.splice(index, 1);
            }
          })
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: ['Discounts'],
    }),
  }),
});

export const {
  useGetDiscountsQuery,
  useCreateDiscountMutation,
  useUpdateDiscountMutation,
  useDeleteDiscountMutation,
} = discountApi;