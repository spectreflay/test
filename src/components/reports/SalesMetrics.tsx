import React from "react";
import { DollarSign, ShoppingBag, TrendingUp } from "lucide-react";
import ReportCard from "./ReportCard";

interface SalesMetricsProps {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
}

const SalesMetrics: React.FC<SalesMetricsProps> = ({
  totalSales,
  totalOrders,
  averageOrderValue,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <ReportCard
        title="Total Sales"
        value={`$${totalSales.toFixed(2)}`}
        icon={DollarSign}
      />
      <ReportCard title="Total Orders" value={totalOrders} icon={ShoppingBag} />
      <ReportCard
        title="Average Order Value"
        value={`$${averageOrderValue.toFixed(2)}`}
        icon={TrendingUp}
      />
    </div>
  );
};

export default SalesMetrics;
