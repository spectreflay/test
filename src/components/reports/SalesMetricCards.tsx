import React from 'react';
import { TrendingUp, ShoppingBag, CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { SalesMetrics } from '../../utils/report';

interface SalesMetricsCardsProps {
  currentMetrics: SalesMetrics;
  previousMetrics: SalesMetrics;
}

const SalesMetricsCards: React.FC<SalesMetricsCardsProps> = ({ 
  currentMetrics, 
  previousMetrics 
}) => {
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const metrics = [
    {
      title: 'Total Sales',
      value: `$${currentMetrics.totalSales.toFixed(2)}`,
      icon: TrendingUp,
      growth: calculateGrowth(currentMetrics.totalSales, previousMetrics.totalSales)
    },
    {
      title: 'Total Orders',
      value: currentMetrics.totalOrders,
      icon: ShoppingBag,
      growth: calculateGrowth(currentMetrics.totalOrders, previousMetrics.totalOrders)
    },
    {
      title: 'Average Order Value',
      value: `$${currentMetrics.averageOrderValue.toFixed(2)}`,
      icon: CreditCard,
      growth: calculateGrowth(currentMetrics.averageOrderValue, previousMetrics.averageOrderValue)
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {metrics.map((metric, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{metric.title}</p>
              <p className="text-2xl font-semibold mt-1">{metric.value}</p>
              <div className="flex items-center mt-2">
                {metric.growth > 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm ml-1 ${
                  metric.growth > 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {Math.abs(metric.growth).toFixed(1)}%
                </span>
                <span className="text-sm text-gray-500 ml-1">vs previous period</span>
              </div>
            </div>
            <div className="p-3 bg-indigo-100 rounded-full">
              <metric.icon className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SalesMetricsCards;