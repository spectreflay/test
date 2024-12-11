import { api } from '../api';
import { networkStatus } from '../../utils/networkStatus';
import { handleOfflineAction } from '../../utils/offlineStorage';

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
      providesTags: ['Products'],
    }),
    createProduct: builder.mutation<Product, CreateProductRequest>({
      query: (productData) => ({
        url: 'products',
        method: 'POST',
        body: productData,
      }),
      async onQueryStarted(product, { dispatch, queryFulfilled }) {
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const optimisticProduct = {
          _id: tempId,
          ...product,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (!networkStatus.isNetworkOnline()) {
          await handleOfflineAction('product', 'create', optimisticProduct);
          dispatch(
            productApi.util.updateQueryData('getProducts', product.store, (draft) => {
              draft.push(optimisticProduct);
            })
          );
          return;
        }

        try {
          const { data: createdProduct } = await queryFulfilled;
          dispatch(
            productApi.util.updateQueryData('getProducts', product.store, (draft) => {
              const index = draft.findIndex((prod) => prod._id === tempId);
              if (index !== -1) {
                draft[index] = createdProduct;
              } else {
                draft.push(createdProduct);
              }
            })
          );
        } catch {
          dispatch(
            productApi.util.updateQueryData('getProducts', product.store, (draft) => {
              const index = draft.findIndex((prod) => prod._id === tempId);
              if (index !== -1) {
                draft.splice(index, 1);
              }
            })
          );
        }
      },
      invalidatesTags: ['Products'],
    }),
    updateProduct: builder.mutation<Product, Partial<Product> & Pick<Product, '_id'>>({
      query: ({ _id, ...patch }) => ({
        url: `products/${_id}`,
        method: 'PUT',
        body: patch,
      }),
      async onQueryStarted({ _id, ...patch }, { dispatch, queryFulfilled }) {
        if (!networkStatus.isNetworkOnline()) {
          await handleOfflineAction('product', 'update', { _id, ...patch });
          dispatch(
            productApi.util.updateQueryData('getProducts', patch.store!, (draft) => {
              const index = draft.findIndex((prod) => prod._id === _id);
              if (index !== -1) {
                Object.assign(draft[index], patch);
              }
            })
          );
          return;
        }

        const patchResult = dispatch(
          productApi.util.updateQueryData('getProducts', patch.store!, (draft) => {
            const index = draft.findIndex((prod) => prod._id === _id);
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
      invalidatesTags: ['Products'],
    }),
    deleteProduct: builder.mutation<void, string>({
      query: (id) => ({
        url: `products/${id}`,
        method: 'DELETE',
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        if (!networkStatus.isNetworkOnline()) {
          await handleOfflineAction('product', 'delete', { _id: id });
          dispatch(
            productApi.util.updateQueryData('getProducts', '', (draft) => {
              const index = draft.findIndex((prod) => prod._id === id);
              if (index !== -1) {
                draft.splice(index, 1);
              }
            })
          );
          return;
        }

        const patchResult = dispatch(
          productApi.util.updateQueryData('getProducts', '', (draft) => {
            const index = draft.findIndex((prod) => prod._id === id);
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
      invalidatesTags: ['Products', 'Categories', 'Inventory'],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = productApi;

