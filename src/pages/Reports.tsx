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
import { networkStatus } from "../utils/networkStatus";
import { handleOfflineAction } from "../utils/offlineStorage";
import OfflineIndicator from "../components/sales/OfflineIndicator";
import {
  getSalesFromLocalStorage,
  saveSalesToLocalStorage,
} from "../utils/offlineStorage";
import { syncManager } from "../utils/syncManager";
import { calculateSalesMetrics, generateDailySalesData } from "../utils/report";

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
  const [localSales, setLocalSales] = useState<any[]>([]);

  const isFreeTier = subscription?.subscription.name === "free";

  // Initialize sales from localStorage or API
  useEffect(() => {
    const initializeSales = async () => {
      if (networkStatus.isNetworkOnline() && apiSales) {
        // If online and we have API data, save to localStorage and use it
        saveSalesToLocalStorage(storeId!, apiSales);
        setLocalSales(apiSales);
      } else {
        // If offline, try to get data from localStorage
        const storedSales = getSalesFromLocalStorage(storeId!);
        if (storedSales) {
          setLocalSales(storedSales);
        }
      }
    };

    initializeSales();
  }, [storeId, apiSales]);

  // Initialize sync when component mounts
  useEffect(() => {
    if (networkStatus.isNetworkOnline()) {
      syncManager.syncOfflineData();
    }
  }, []);

  const filteredSales = useMemo(() => {
    if (!localSales) return [];

    return localSales.filter((sale) => {
      const saleDate = parseISO(sale.createdAt);
      return isWithinInterval(saleDate, {
        start: startOfDay(parseISO(startDate)),
        end: endOfDay(parseISO(endDate)),
      });
    });
  }, [localSales, startDate, endDate]);

  const metrics = useMemo(() => {
    return calculateSalesMetrics(filteredSales);
  }, [filteredSales]);

  const chartData = useMemo(() => {
    return generateDailySalesData(
      filteredSales,
      parseISO(startDate),
      parseISO(endDate)
    );
  }, [filteredSales, startDate, endDate]);

  const exportToExcel = async () => {
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

    // Save report data offline if we're not online
    if (!networkStatus.isNetworkOnline()) {
      const reportData = {
        startDate,
        endDate,
        data,
        exportedAt: new Date().toISOString(),
      };

      await handleOfflineAction("report", "create", reportData);
      return;
    }

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
          <TopProducts products={metrics.topProducts} />
        </div>
      </div>

      {!isFreeTier && <SalesTable sales={filteredSales} />}

      {showUpgradeModal && (
        <UpgradeModal
          feature="advanced reports"
          onClose={() => setShowUpgradeModal(false)}
        />
      )}

      <OfflineIndicator />
    </div>
  );
};

export default Reports;