import React from "react";
import { format } from "date-fns";
import { Sale } from "../../store/services/saleService";

interface SalesTableProps {
  sales: Sale[];
}

const SalesTable: React.FC<SalesTableProps> = ({ sales }) => {
  const formatDiscounts = (sale: Sale) => {
    const allDiscounts = sale.items.flatMap(item => item.discounts || []);
    if (allDiscounts.length === 0) return "No discounts";

    return allDiscounts.map(discount => (
      `${discount.name} (${discount.type === 'percentage' ? `${discount.value}%` : `$${discount.value}`})`
    )).join(", ");
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Items
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Discounts
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sales.map((sale) => (
              <tr key={sale._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {format(new Date(sale.createdAt), "MMM dd, yyyy HH:mm")}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {sale.items.map((item) => (
                    <div key={item.product?._id}>
                      {item.product?.name} x{item.quantity}
                    </div>
                  ))}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                  {sale.paymentMethod}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {formatDiscounts(sale)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      sale.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {sale.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  ${sale.total.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalesTable;