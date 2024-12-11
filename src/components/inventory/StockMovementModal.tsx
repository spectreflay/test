import React from 'react';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface StockMovementModalProps {
  product: any;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

interface StockMovementForm {
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
}

const StockMovementModal = ({ product, onClose, onSubmit }: StockMovementModalProps) => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<StockMovementForm>();
  const movementType = watch('type');

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Record Stock Movement</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          <h3 className="font-medium">{product.name}</h3>
          <p className="text-sm text-gray-500">Current Stock: {product.stock}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Movement Type</label>
            <select
              {...register('type', { required: 'Movement type is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="in">Stock In (New Inventory)</option>
              <option value="out">Stock Out</option>
              <option value="adjustment">Stock Adjustment (Set New Total)</option>
            </select>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {movementType === 'adjustment' ? 'New Total Stock' : 'Quantity'}
            </label>
            <input
              type="number"
              {...register('quantity', { 
                required: 'Quantity is required',
                min: { value: 0, message: "Quantity cannot be negative" },
                validate: (value) => 
                  movementType !== 'adjustment' || 
                  value !== product.stock || 
                  "New total must be different from current stock",
                valueAsNumber: true
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            {errors.quantity && (
              <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
            )}
            {movementType === 'adjustment' && (
              <p className="mt-1 text-sm text-gray-500">
                This will set the total stock to the new value you enter.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Reason</label>
            <textarea
              {...register('reason', { required: 'Reason is required' })}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder={movementType === 'adjustment' ? 'Explain the reason for this adjustment' : 'Provide details for this stock movement'}
            />
            {errors.reason && (
              <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Record Movement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockMovementModal;

