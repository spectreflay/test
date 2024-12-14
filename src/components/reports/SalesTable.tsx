import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import { Search } from "lucide-react";
import { Sale } from "../../store/services/saleService";
import AdvancedFilters from "./AdvanceFilters";
import Pagination from "../inventory/Pagination";

interface SalesTableProps {
  sales: Sale[];
}

interface FilterOptions {
  status: string[];
  paymentMethod: string[];
  minAmount: string;
  maxAmount: string;
}

const ITEMS_PER_PAGE = 10;

const SalesTable: React.FC<SalesTableProps> = ({ sales }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    status: [],
    paymentMethod: [],
    minAmount: "",
    maxAmount: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const formatProductInfo = (item: any) => {
    if (!item.product) return "Product not found";
    return `${item.product.name || "Unnamed Product"} x${item.quantity}`;
  };

  const formatDiscountInfo = (sale: Sale) => {
    const allDiscounts = sale.items.flatMap((item) => item.discounts || []);
    if (allDiscounts.length === 0) {
      return "No discounts";
    }

    return (
      <>
        {allDiscounts.map((discount, idx) => (
          <div key={idx} className="text-xs text-green-600">
            {discount.name} (-
            {discount.type === "percentage"
              ? `${discount.value}%`
              : `$${discount.value}`}
            )
          </div>
        ))}
      </>
    );
  };

  const resetFilters = () => {
    setFilters({
      status: [],
      paymentMethod: [],
      minAmount: "",
      maxAmount: "",
    });
  };

  const filteredSales = useMemo(() => {
    // First sort by date (latest first)
    const sortedSales = [...sales].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return sortedSales.filter((sale) => {
      // Search filter
      const searchString = `${sale._id} ${sale.paymentMethod} ${sale.items
        .map((item) => item.product?.name || "")
        .join(" ")}`.toLowerCase();
      if (!searchString.includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Status filter
      if (filters.status.length > 0) {
        const saleStatus = sale._id.startsWith("temp_")
          ? "completed"
          : sale.status;
        if (!filters.status.includes(saleStatus)) {
          return false;
        }
      }

      // Payment method filter
      if (
        filters.paymentMethod.length > 0 &&
        !filters.paymentMethod.includes(sale.paymentMethod)
      ) {
        return false;
      }

      // Amount range filter
      if (filters.minAmount && sale.total < parseFloat(filters.minAmount)) {
        return false;
      }
      if (filters.maxAmount && sale.total > parseFloat(filters.maxAmount)) {
        return false;
      }

      return true;
    });
  }, [sales, filters, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredSales.length / ITEMS_PER_PAGE);
  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-4 bg-card p-4 rounded-lg">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search sales..."
            className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
      </div>

      <AdvancedFilters
        filters={filters}
        onFilterChange={setFilters}
        onReset={resetFilters}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
      />

<div className="bg-card rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-card">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discounts
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-gray-200">
              {paginatedSales.map((sale) => (
                <tr key={sale._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {format(new Date(sale.createdAt), "MMM dd, yyyy HH:mm")}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {sale.items.map((item, idx) => (
                      <div key={idx}>{formatProductInfo(item)}</div>
                    ))}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {formatDiscountInfo(sale)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                    {sale.paymentMethod}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        sale.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {sale._id.startsWith("temp_") ? "completed" : sale.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground text-right">
                    ${sale.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};

export default SalesTable;
