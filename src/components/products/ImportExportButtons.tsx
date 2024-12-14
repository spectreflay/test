import React, { useRef, useState } from "react";
import { Download, Upload, AlertTriangle } from "lucide-react";
import { read, utils, writeFile } from "xlsx";
import { toast } from "react-hot-toast";
import {
  Product,
  useUpdateProductMutation,
} from "../../store/services/productService";
import { useCreateCategoryMutation } from "../../store/services/categoryService";

interface ImportExportButtonsProps {
  products: Product[];
  categories: any[];
  onImport: (products: any[]) => void;
  storeId: string;
}

interface DuplicateHandlingModalProps {
  duplicates: Array<{
    existing: Product;
    imported: any;
  }>;
  onResolve: (
    resolutions: Array<{ action: "skip" | "update" | "create"; product: any }>
  ) => void;
  onClose: () => void;
}

const DuplicateHandlingModal: React.FC<DuplicateHandlingModalProps> = ({
  duplicates,
  onResolve,
  onClose,
}) => {
  const [resolutions, setResolutions] = useState<
    Array<{ action: "skip" | "update" | "create"; product: any }>
  >(duplicates.map((d) => ({ action: "skip", product: d.imported })));

  const handleResolutionChange = (
    index: number,
    action: "skip" | "update" | "create"
  ) => {
    const newResolutions = [...resolutions];
    newResolutions[index] = { ...newResolutions[index], action };
    setResolutions(newResolutions);
  };

  const handleSubmit = () => {
    onResolve(resolutions);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-2 mb-4 text-amber-600">
          <AlertTriangle className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Duplicate Products Found</h2>
        </div>

        <p className="mb-4 text-gray-600">
          Some products in your import file already exist in your inventory.
          Please choose how to handle each duplicate:
        </p>

        <div className="space-y-4">
          {duplicates.map((duplicate, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <h3 className="font-medium text-gray-900">
                    Existing Product
                  </h3>
                  <div className="mt-2 text-sm text-gray-600">
                    <p>Name: {duplicate.existing.name}</p>
                    <p>Price: ${duplicate.existing.price}</p>
                    <p>Stock: {duplicate.existing.stock}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    Imported Product
                  </h3>
                  <div className="mt-2 text-sm text-gray-600">
                    <p>Name: {duplicate.imported.name}</p>
                    <p>Price: ${duplicate.imported.price}</p>
                    <p>Stock: {duplicate.imported.stock}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name={`resolution-${index}`}
                    checked={resolutions[index].action === "skip"}
                    onChange={() => handleResolutionChange(index, "skip")}
                    className="mr-2"
                  />
                  Skip
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name={`resolution-${index}`}
                    checked={resolutions[index].action === "update"}
                    onChange={() => handleResolutionChange(index, "update")}
                    className="mr-2"
                  />
                  Update Existing
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name={`resolution-${index}`}
                    checked={resolutions[index].action === "create"}
                    onChange={() => handleResolutionChange(index, "create")}
                    className="mr-2"
                  />
                  Create New
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

const ImportExportButtons: React.FC<ImportExportButtonsProps> = ({
  products,
  categories,
  onImport,
  storeId,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [updateProduct] = useUpdateProductMutation();
  const [createCategory] = useCreateCategoryMutation();
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateProducts, setDuplicateProducts] = useState<
    Array<{ existing: Product; imported: any }>
  >([]);
  const [pendingImport, setPendingImport] = useState<any[]>([]);

  const handleExport = () => {
    try {
      const exportData = products.map((product) => {
        const categoryId = product.category._id;
        const category = categories.find((c) => c._id === categoryId);
        return {
          Name: product.name,
          Description: product.description || "",
          Price: product.price,
          Stock: product.stock,
          Category: category ? category.name : "",
          Image: product.image || "",
        };
      });

      const wb = utils.book_new();
      const ws = utils.json_to_sheet(exportData);

      const colWidths = [
        { wch: 30 }, // Name
        { wch: 40 }, // Description
        { wch: 10 }, // Price
        { wch: 10 }, // Stock
        { wch: 20 }, // Category
        { wch: 50 }, // Image
      ];
      ws["!cols"] = colWidths;

      utils.book_append_sheet(wb, ws, "Products");

      const currentDate = new Date().toISOString().split("T")[0];
      writeFile(wb, `products_${currentDate}.xlsx`);
      toast.success("Products exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export products");
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = read(data, { type: "array" });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = utils.sheet_to_json(worksheet);

          // Create a map of existing categories
          const categoryMap = new Map(
            categories.map((c) => [c.name.toLowerCase(), c])
          );
          const newCategories = new Set<string>();

          // First pass: collect all unique new categories
          for (const row of jsonData as any[]) {
            const categoryName = row.Category?.trim();
            if (categoryName && !categoryMap.has(categoryName.toLowerCase())) {
              newCategories.add(categoryName);
            }
          }

          // Create new categories
          for (const categoryName of newCategories) {
            try {
              const newCategory = await createCategory({
                name: categoryName,
                store: storeId,
              }).unwrap();
              categoryMap.set(categoryName.toLowerCase(), newCategory);
            } catch (error) {
              console.error(
                `Failed to create category ${categoryName}:`,
                error
              );
              toast.error(`Failed to create category: ${categoryName}`);
            }
          }

          // Transform the data and check for duplicates
          const transformedProducts = [];
          const duplicates = [];

          for (const row of jsonData as any[]) {
            const categoryName = row.Category?.trim();
            const category = categoryName
              ? categoryMap.get(categoryName.toLowerCase())
              : categories[0];

            if (!category) {
              throw new Error(
                `Category "${categoryName}" could not be created`
              );
            }

            const transformedProduct = {
              name: row.Name,
              description: row.Description,
              price: Number(row.Price),
              stock: Number(row.Stock),
              category: category._id,
              image: row.Image,
              store: storeId,
            };

            // Check for duplicates
            const existingProduct = products.find(
              (p) =>
                p.name.toLowerCase() === transformedProduct.name.toLowerCase()
            );

            if (existingProduct) {
              duplicates.push({
                existing: existingProduct,
                imported: transformedProduct,
              });
            } else {
              transformedProducts.push(transformedProduct);
            }
          }

          if (duplicates.length > 0) {
            setDuplicateProducts(duplicates);
            setPendingImport(transformedProducts);
            setShowDuplicateModal(true);
          } else {
            // If no duplicates, directly import the products
            onImport(transformedProducts);
            toast.success("Products imported successfully");
          }
        } catch (error: any) {
          toast.error(`Import error: ${error.message}`);
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import products");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDuplicateResolution = async (
    resolutions: Array<{ action: "skip" | "update" | "create"; product: any }>
  ) => {
    const productsToImport = [];

    // Include non-duplicate products from pendingImport
    productsToImport.push(...pendingImport);

    for (const { action, product } of resolutions) {
      switch (action) {
        case "skip":
          // Do nothing
          break;
        case "update":
          // Find the existing product and prepare update data
          const existingProduct = products.find(
            (p) => p.name.toLowerCase() === product.name.toLowerCase()
          );
          if (existingProduct) {
            const { _id, ...updateData } = product; // Exclude _id from the update data
            productsToImport.push({
              ...updateData,
              _id: existingProduct._id, // Use the existing product's _id
              isUpdate: true, // Flag to indicate this is an update
            });
          }
          break;
        case "create":
          // Add as a new product with a slightly modified name
          productsToImport.push({
            ...product,
            name: `${product.name} (Copy)`,
          });
          break;
      }
    }

    // Call the update mutation for each product to be updated
    for (const product of productsToImport) {
      if (product.isUpdate) {
        try {
          await updateProduct({ _id: product._id, ...product }).unwrap();
          toast.success(`Product ${product.name} updated successfully.`);
        } catch (error) {
          console.error(`Failed to update product ${product.name}:`, error);
          toast.error(`Failed to update product: ${product.name}`);
        }
      }
    }

    // After processing all resolutions, call onImport with the new products
    onImport(productsToImport);
    toast.success("Products imported successfully");
  };

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={handleExport}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </button>
        <label className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 cursor-pointer">
          <Upload className="h-4 w-4 mr-2" />
          Import
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".xlsx,.xls"
            className="hidden"
          />
        </label>
      </div>

      {showDuplicateModal && (
        <DuplicateHandlingModal
          duplicates={duplicateProducts}
          onResolve={handleDuplicateResolution}
          onClose={() => {
            setShowDuplicateModal(false);
            setDuplicateProducts([]);
            setPendingImport([]);
          }}
        />
      )}
    </>
  );
};

export default ImportExportButtons;
