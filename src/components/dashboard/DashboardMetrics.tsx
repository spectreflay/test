import React from 'react';
import { LayoutGrid, TrendingUp, Package, Receipt } from 'lucide-react';
import DashboardCard from './DashboardCard';
import { Store } from '../../store/services/storeService';

interface DashboardMetricsProps {
  store: Store;
  storeId: string;
}

const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ store, storeId }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <DashboardCard
        title="Store Info"
        value={store?.name || 'Loading...'}
        icon={LayoutGrid}
        color="bg-blue-500"
      />
      <DashboardCard
        title="Today's Sales"
        value="$0.00"
        icon={TrendingUp}
        link={`/stores/${storeId}/sales`}
        color="bg-green-500"
      />
      <DashboardCard
        title="Products"
        value="View All"
        icon={Package}
        link={`/stores/${storeId}/products`}
        color="bg-purple-500"
      />
      <DashboardCard
        title="Reports"
        value="View All"
        icon={Receipt}
        link={`/stores/${storeId}/reports`}
        color="bg-yellow-500"
      />
    </div>
  );
};

export default DashboardMetrics;