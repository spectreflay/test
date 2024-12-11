import React from "react";
import { Package } from "lucide-react";

interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

interface TopProductsProps {
  products: TopProduct[];
}

const TopProducts: React.FC<TopProductsProps> = ({ products }) => {
  return (
    <div className="bg-card rounded-lg shadow p-6">
      <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
        <Package className="h-5 w-5" />
        Top Selling Products
      </h2>
      <div className="space-y-4">
        {products.map((product, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="w-6 text-gray-500">{index + 1}.</span>
              <div>
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-gray-500">
                  Sold: {product.quantity} units
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium">${product.revenue.toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopProducts;
