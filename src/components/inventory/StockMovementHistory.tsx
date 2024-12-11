import React from 'react';
import { format } from 'date-fns';
import { StockMovement } from '../../store/services/inventoryService';

interface StockMovementHistoryProps {
  movements: StockMovement[];
}

const StockMovementHistory: React.FC<StockMovementHistoryProps> = ({ movements }) => {
  const latestMovements = movements.slice(0, 10); // Limit to 10 most recent movements

  return (
    <div className="bg-card shadow-md rounded-lg overflow-hidden mt-6">
      <h2 className="text-xl font-semibold p-4 border-b text-foreground">Recent Stock Movements (Last 10)</h2>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-card">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">Quantity</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">Reason</th>
          </tr>
        </thead>
        <tbody className="bg-card divide-y divide-gray-200">
          {latestMovements.map((movement) => (
            <tr key={movement._id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                {format(new Date(movement.createdAt), 'MMM dd, yyyy HH:mm')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                {movement.type === 'in' ? 'Stock In' : movement.type === 'out' ? 'Stock Out' : 'Adjustment'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                {movement.type === 'out' ? `-${movement.quantity}` : `+${movement.quantity}`}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                {movement.reason}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StockMovementHistory;

