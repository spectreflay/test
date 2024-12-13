import React, { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import { BarChart2 } from "lucide-react";
import { format, parseISO, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { utils, writeFile } from "xlsx";
import { useGetSalesQuery } from "../store/services/saleService";
import { useGetCurrentSubscriptionQuery } from "../store/services/subscriptionService";
import SalesChart from "../components/reports/SalesChart";
import ReportFilters from "../components/reports/ReportsFilters";
import SalesMetrics from "../components/reports/SalesMetrics";
import SalesTable from "../components/reports/SalesTable";
import TopProducts from "../components/reports/TopProducts";
import UpgradeModal from "../components/subscription/UpgradeModal";
import { getSalesFromLocalStorage } from "../utils/offlineStorage";
import { networkStatus } from "../utils/networkStatus";

const Reports = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const { data: apiSales } = useGetSalesQuery(storeId!, {
    skip: !networkStatus.isNetworkOnline(),
  });
  const { data: subscription } = useGetCurrentSubscriptionQuery();
  const [startDate, setStartDate] = useState(
    format(new Date().setDate(new Date().getDate() - 30), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [sales, setSales] = useState<any[]>([]);

  const isFreeTier = subscription?.subscription.name === "free";

  // Initialize sales data from API or localStorage
  useEffect(() => {
    const initializeSales = async () => {
      if (networkStatus.isNetworkOnline() && apiSales) {
        setSales(apiSales);
      } else {
        const storedSales = getSalesFromLocalStorage(storeId!);
        if (storedSales) {
          setSales(storedSales);
        }
      }
    };

    initializeSales();
  }, [storeId, apiSales]);

  const filteredSales = useMemo(() => {
    if (!sales) return [];

    return sales.filter((sale) => {
      const saleDate = parseISO(sale.createdAt);
      return isWithinInterval(saleDate, {
        start: startOfDay(parseISO(startDate)),
        end: endOfDay(parseISO(endDate)),
      });
    });
  }, [sales, startDate, endDate]);

  const metrics = useMemo(() => {
    const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalOrders = filteredSales.length;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    return {
      totalSales,
      totalOrders,
      averageOrderValue,
    };
  }, [filteredSales]);

  const chartData = useMemo(() => {
    const dailySales = filteredSales.reduce((acc: any, sale) => {
      const date = format(parseISO(sale.createdAt), "MMM dd");
      acc[date] = (acc[date] || 0) + sale.total;
      return acc;
    }, {});

    return Object.entries(dailySales).map(([name, sales]) => ({
      name,
      sales,
    }));
  }, [filteredSales]);

  const topProducts = useMemo(() => {
    const productMap = new Map();

    filteredSales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (!item.product) return;

        const existing = productMap.get(item.product._id) || {
          name: item.product.name,
          quantity: 0,
          revenue: 0,
        };

        existing.quantity += item.quantity;
        existing.revenue += item.quantity * item.price;
        productMap.set(item.product._id, existing);
      });
    });

    return Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredSales]);

  const exportToExcel = () => {
    if (isFreeTier) {
      setShowUpgradeModal(true);
      return;
    }

    const data = filteredSales.map((sale) => ({
      Date: format(parseISO(sale.createdAt), "yyyy-MM-dd HH:mm:ss"),
      "Order ID": sale._id,
      "Payment Method": sale.paymentMethod,
      Total: sale.total,
      Items: sale.items
        .map((item) => `${item.product?.name || "Unknown"} (x${item.quantity})`)
        .join(", "),
      Status: sale.status,
    }));

    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Sales Report");
    writeFile(wb, `sales-report-${startDate}-to-${endDate}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          <BarChart2 className="h-6 w-6" />
          Reports
        </h1>
      </div>

      <ReportFilters
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onExport={exportToExcel}
      />

      <SalesMetrics {...metrics} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-card p-6 rounded-lg shadow">
            <h2 className="text-lg font-medium mb-4">Sales Trend</h2>
            <SalesChart data={chartData} />
          </div>
        </div>

        <div className="lg:col-span-1">
          <TopProducts products={topProducts} />
        </div>
      </div>

      {!isFreeTier && <SalesTable sales={filteredSales} />}

      {showUpgradeModal && (
        <UpgradeModal
          feature="advanced reports"
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
    </div>
  );
};

export default Reports;