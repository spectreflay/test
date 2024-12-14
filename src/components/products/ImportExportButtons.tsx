import React, { useRef } from 'react';
import { Download, Upload } from 'lucide-react';
import { read, utils, writeFile } from 'xlsx';
import { toast } from 'react-hot-toast';
import { Product } from '../../store/services/productService';

interface ImportExportButtonsProps {
  products: Product[];
  categories: any[];
  onImport: (products: any[]) => void;
}

const ImportExportButtons: React.FC<ImportExportButtonsProps> = ({
  products,
  categories,
  onImport,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      // Prepare data for export
      const exportData = products.map(product => ({
        Name: product.name,
        Description: product.description || '',
        Price: product.price,
        Stock: product.stock,
        Category: categories.find(c => c._id === product.category)?.name || '',
        Image: product.image || '',
      }));
  
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
      ws['!cols'] = colWidths;
  
      // Add worksheet to workbook
      utils.book_append_sheet(wb, ws, 'Products');
  
      // Generate download
      const currentDate = new Date().toISOString().split('T')[0];
      const fileName = `products_${currentDate}.xlsx`;
      writeFile(wb, fileName); // Use writeFile instead of utils.writeFile
      toast.success('Products exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export products');
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
          const workbook = read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = utils.sheet_to_json(worksheet);

          // Validate and transform the data
          const transformedProducts = jsonData.map((row: any) => {
            const category = categories.find(c => c.name === row.Category);
            if (!category) {
              throw new Error(`Category "${row.Category}" not found`);
            }

            return {
              name: row.Name,
              description: row.Description,
              price: Number(row.Price),
              stock: Number(row.Stock),
              category: category._id,
              image: row.Image,
            };
          });

          onImport(transformedProducts);
          toast.success('Products imported successfully');
        } catch (error: any) {
          toast.error(`Import error: ${error.message}`);
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import products');
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
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