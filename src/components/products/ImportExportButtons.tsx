import React, { useRef } from "react";
import { Download, Upload } from "lucide-react";
import { read, utils, writeFile } from "xlsx";
import { toast } from "react-hot-toast";
import { Product } from "../../store/services/productService";
import { useCreateCategoryMutation } from "../../store/services/categoryService";

interface ImportExportButtonsProps {
  products: Product[];
  categories: any[];
  onImport: (products: any[]) => void;
  storeId: string;
}

const ImportExportButtons: React.FC<ImportExportButtonsProps> = ({
  products,
  categories,
  onImport,
  storeId,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [createCategory] = useCreateCategoryMutation();

  const handleExport = () => {
    try {
      // Prepare data for export
      const exportData = products.map((product) => {
        const categoryId = product.category._id; // Access the _id property
        const category = categories.find((c) => c._id === categoryId);
        return {
          Name: product.name,
          Description: product.description || "",
          Price: product.price,
          Stock: product.stock,
          Category: category ? category.name : "", // Ensure category is found
          Image: product.image || "",
        };
      });
  
      // Create workbook and worksheet
      const wb = utils.book_new();
      const ws = utils.json_to_sheet(exportData);
  
      // Add column widths
      const colWidths = [
        { wch: 30 }, // Name
        { wch: 40 }, // Description
        { wch: 10 }, // Price
        { wch: 10 }, // Stock
        { wch: 20 }, // Category
        { wch: 50 }, // Image
      ];
      ws["!cols"] = colWidths;
  
      // Add worksheet to workbook
      utils.book_append_sheet(wb, ws, "Products");
  
      // Generate download
      const currentDate = new Date().toISOString().split("T")[0];
      const fileName = `products_${currentDate}.xlsx`;
      writeFile(wb, fileName);
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
          jsonData.forEach((row: any) => {
            const categoryName = row.Category?.trim();
            if (categoryName && !categoryMap.has(categoryName.toLowerCase())) {
              newCategories.add(categoryName);
            }
          });

          // Create new categories
          for (const categoryName of newCategories) {
            try {
              const newCategory = await createCategory({
                name: categoryName,
                store: storeId,
              }).unwrap();
              categoryMap.set(categoryName.toLowerCase(), newCategory);
              toast.success(`Created new category: ${categoryName}`);
            } catch (error) {
              console.error(
                `Failed to create category ${categoryName}:`,
                error
              );
              toast.error(`Failed to create category: ${categoryName}`);
            }
          }

          // Transform the data
          const transformedProducts = jsonData.map((row: any) => {
            const categoryName = row.Category?.trim();
            const category = categoryName
              ? categoryMap.get(categoryName.toLowerCase())
              : categories[0]; // Use default category if none specified

            if (!category) {
              throw new Error(
                `Category "${categoryName}" could not be created`
              );
            }

            return {
              name: row.Name,
              description: row.Description,
              price: Number(row.Price),
              stock: Number(row.Stock),
              category: category._id,
              image: row.Image,
              store: storeId,
            };
          });

          onImport(transformedProducts);
          toast.success("Products imported successfully");
        } catch (error: any) {
          toast.error(`Import error: ${error.message}`);
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import products");
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
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
  );
};

export default ImportExportButtons;
