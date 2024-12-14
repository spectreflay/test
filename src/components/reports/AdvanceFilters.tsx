import React from 'react';
import { Filter, X } from 'lucide-react';

interface FilterOptions {
  status: string[];
  paymentMethod: string[];
  minAmount: string;
  maxAmount: string;
}

interface AdvancedFiltersProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  onReset: () => void;
  showFilters: boolean;
  onToggleFilters: () => void;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
  showFilters,
  onToggleFilters,
}) => {
  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const statusOptions = ['completed', 'refunded', 'pending_sync'];
  const paymentMethodOptions = ['cash', 'card', 'qr'];

  if (!showFilters) {
    return (
      <button
        onClick={onToggleFilters}
        className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover"
      >
        <Filter className="h-4 w-4" />
        Show Filters
      </button>
    );
  }

  return (
    <div className="bg-card p-4 rounded-lg shadow mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Advanced Filters
        </h3>
        <div className="flex gap-2">
          <button
            onClick={onReset}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
          >
            Reset
          </button>
          <button
            onClick={onToggleFilters}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <div className="space-y-2">
            {statusOptions.map((status) => (
              <label key={status} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.status.includes(status)}
                  onChange={(e) => {
                    const newStatus = e.target.checked
                      ? [...filters.status, status]
                      : filters.status.filter((s) => s !== status);
                    handleFilterChange('status', newStatus);
                  }}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="ml-2 text-sm capitalize">
                  {status.replace('_', ' ')}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Payment Method Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment Method
          </label>
          <div className="space-y-2">
            {paymentMethodOptions.map((method) => (
              <label key={method} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.paymentMethod.includes(method)}
                  onChange={(e) => {
                    const newMethods = e.target.checked
                      ? [...filters.paymentMethod, method]
                      : filters.paymentMethod.filter((m) => m !== method);
                    handleFilterChange('paymentMethod', newMethods);
                  }}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="ml-2 text-sm capitalize">{method}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Amount Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount Range
          </label>
          <div className="space-y-2">
            <input
              type="number"
              placeholder="Min Amount"
              value={filters.minAmount}
              onChange={(e) => handleFilterChange('minAmount', e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
            />
            <input
              type="number"
              placeholder="Max Amount"
              value={filters.maxAmount}
              onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedFilters;