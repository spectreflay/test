import { api } from "../api";
import { networkStatus } from "../../utils/networkStatus";
import { handleOfflineAction } from "../../utils/offlineStorage";

export interface Category {
  _id: string;
  name: string;
  description?: string;
  store: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  store: string;
}

export const categoryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<Category[], string>({
      query: (storeId) => `categories/${storeId}`,
      providesTags: ["Categories"],
    }),
    createCategory: builder.mutation<Category, CreateCategoryRequest>({
      query: (categoryData) => ({
        url: "categories",
        method: "POST",
        body: categoryData,
      }),
      async onQueryStarted(category, { dispatch, queryFulfilled }) {
        const tempId = `temp_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const optimisticCategory = {
          _id: tempId,
          ...category,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (!networkStatus.isNetworkOnline()) {
          await handleOfflineAction("category", "create", optimisticCategory);
          dispatch(
            categoryApi.util.updateQueryData(
              "getCategories",
              category.store,
              (draft) => {
                draft.push(optimisticCategory);
              }
            )
          );
          return;
        }

        try {
          const { data: createdCategory } = await queryFulfilled;
          dispatch(
            categoryApi.util.updateQueryData(
              "getCategories",
              category.store,
              (draft) => {
                const index = draft.findIndex((cat) => cat._id === tempId);
                if (index !== -1) {
                  draft[index] = createdCategory;
                } else {
                  draft.push(createdCategory);
                }
              }
            )
          );
        } catch {
          dispatch(
            categoryApi.util.updateQueryData(
              "getCategories",
              category.store,
              (draft) => {
                const index = draft.findIndex((cat) => cat._id === tempId);
                if (index !== -1) {
                  draft.splice(index, 1);
                }
              }
            )
          );
        }
      },
      invalidatesTags: ["Categories"],
    }),
    updateCategory: builder.mutation<
      Category,
      Partial<Category> & Pick<Category, "_id">
    >({
      query: ({ _id, ...patch }) => ({
        url: `categories/${_id}`,
        method: "PUT",
        body: patch,
      }),
      async onQueryStarted({ _id, ...patch }, { dispatch, queryFulfilled }) {
        if (!networkStatus.isNetworkOnline()) {
          await handleOfflineAction("category", "update", { _id, ...patch });
          dispatch(
            categoryApi.util.updateQueryData(
              "getCategories",
              patch.store!,
              (draft) => {
                const index = draft.findIndex((cat) => cat._id === _id);
                if (index !== -1) {
                  Object.assign(draft[index], patch);
                }
              }
            )
          );
          return;
        }

        const patchResult = dispatch(
          categoryApi.util.updateQueryData(
            "getCategories",
            patch.store!,
            (draft) => {
              const index = draft.findIndex((cat) => cat._id === _id);
              if (index !== -1) {
                Object.assign(draft[index], patch);
              }
            }
          )
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: ["Categories"],
    }),
    deleteCategory: builder.mutation<void, string>({
      query: (id) => ({
        url: `categories/${id}`,
        method: "DELETE",
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        if (!networkStatus.isNetworkOnline()) {
          await handleOfflineAction("category", "delete", { _id: id });
          dispatch(
            categoryApi.util.updateQueryData("getCategories", "", (draft) => {
              const index = draft.findIndex((cat) => cat._id === id);
              if (index !== -1) {
                draft.splice(index, 1);
              }
            })
          );
          return;
        }

        const patchResult = dispatch(
          categoryApi.util.updateQueryData("getCategories", "", (draft) => {
            const index = draft.findIndex((cat) => cat._id === id);
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
      invalidatesTags: ["Categories"],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoryApi;
