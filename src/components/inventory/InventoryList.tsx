import React from 'react';
import { format } from 'date-fns';
import { Edit2, AlertTriangle, Clock } from 'lucide-react';
import { Product } from '../../store/services/productService';
import { StoreSettings } from '../../store/services/storeService';
import { getStockStatusColor, checkStockLevel } from '../../utils/inventory';
import { Category } from '../../store/services/categoryService';

interface InventoryListProps {
  products: Product[];
  storeSettings: StoreSettings;
  onEdit: (product: Product) => void;
  onViewHistory: (product: Product) => void;
  currentPage: number;
  itemsPerPage: number;
  categories: Category[];
}

const InventoryList: React.FC<InventoryListProps> = ({
  products,
  storeSettings,
  onEdit,
  onViewHistory,
  currentPage,
  itemsPerPage,
  categories,
}) => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedProducts = products.slice(startIndex, endIndex);

  const getStockStatus = (stock: number) => {
    const status = checkStockLevel(stock, storeSettings);
    switch (status) {
      case 'out_of_stock':
        return { text: 'Out of Stock', icon: true };
      case 'critical':
        return { text: 'Critical', icon: true };
      case 'low':
        return { text: 'Low Stock', icon: true };
      default:
        return { text: 'In Stock', icon: false };
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat._id === categoryId);
    return category ? category.name : 'Uncategorized';
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Product
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Stock
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Price
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Last Updated
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {displayedProducts.map((product) => {
            const stockStatus = getStockStatus(product.stock);
            const statusColor = getStockStatusColor(product.stock, storeSettings);
            
            return (
              <tr key={product._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {product.image && (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-10 w-10 rounded-full mr-3"
                      />
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {product.description}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getCategoryName(product.category._id)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className={`${statusColor} font-medium`}>
                      {product.stock}
                    </span>
                    {stockStatus.icon && (
                      <AlertTriangle className="ml-2 h-4 w-4 text-amber-500" />
                    )}
                  </div>
                  <span className={`text-xs ${statusColor}`}>
                    {stockStatus.text}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${product.price.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(product.updatedAt), 'MMM dd, yyyy HH:mm')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onEdit(product)}
                    className="text-indigo-600 hover:text-indigo-900 mr-2"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onViewHistory(product)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    <Clock className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryList;

