import React from 'react';
import { useParams } from 'react-router-dom';
import { useGetStoreQuery } from '../store/services/storeService';
import DashboardMetrics from '../components/dashboard/DashboardMetrics';

const Dashboard = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const { data: store } = useGetStoreQuery(storeId!);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      <DashboardMetrics store={store} storeId={storeId!} />
    </div>
  );
};

export default Dashboard;