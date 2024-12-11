import { format, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';
import { Sale } from '../store/services/saleService';

export interface SalesMetrics {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: Array<{
    productId: string;
    name: string;
    quantity: number;
    revenue: number;
  }>;
  paymentMethodBreakdown: {
    [key: string]: {
      count: number;
      total: number;
    };
  };
}

export const calculateSalesMetrics = (sales: Sale[]): SalesMetrics => {
  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalOrders = sales.length;
  const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  // Calculate top products
  const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
  sales.forEach(sale => {
    sale.items.forEach(item => {
      if (!item.product) return;
      const existing = productMap.get(item.product._id) || { 
        name: item.product.name, 
        quantity: 0, 
        revenue: 0 
      };
      productMap.set(item.product._id, {
        name: item.product.name,
        quantity: existing.quantity + item.quantity,
        revenue: existing.revenue + (item.price * item.quantity)
      });
    });
  });

  const topProducts = Array.from(productMap.entries())
    .map(([productId, data]) => ({
      productId,
      ...data
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Calculate payment method breakdown
  const paymentMethodBreakdown = sales.reduce((acc, sale) => {
    const method = sale.paymentMethod;
    if (!acc[method]) {
      acc[method] = { count: 0, total: 0 };
    }
    acc[method].count += 1;
    acc[method].total += sale.total;
    return acc;
  }, {} as { [key: string]: { count: number; total: number } });

  return {
    totalSales,
    totalOrders,
    averageOrderValue,
    topProducts,
    paymentMethodBreakdown
  };
};

export const generateDailySalesData = (sales: Sale[], startDate: Date, endDate: Date) => {
  const dailyData = new Map<string, number>();
  
  // Initialize all dates with 0
  eachDayOfInterval({ start: startDate, end: endDate }).forEach(date => {
    dailyData.set(format(date, 'yyyy-MM-dd'), 0);
  });

  // Fill in actual sales data
  sales.forEach(sale => {
    const date = format(new Date(sale.createdAt), 'yyyy-MM-dd');
    dailyData.set(date, (dailyData.get(date) || 0) + sale.total);
  });

  return Array.from(dailyData.entries()).map(([date, total]) => ({
    date: format(new Date(date), 'MMM dd'),
    sales: total
  }));
};

export const generateHourlyData = (sales: Sale[]) => {
  const hourlyData = new Array(24).fill(0);
  
  sales.forEach(sale => {
    const hour = new Date(sale.createdAt).getHours();
    hourlyData[hour] += sale.total;
  });

  return hourlyData.map((total, hour) => ({
    hour: `${hour.toString().padStart(2, '0')}:00`,
    sales: total
  }));
};

export const calculateGrowthRate = (currentValue: number, previousValue: number): number => {
  if (previousValue === 0) return currentValue > 0 ? 100 : 0;
  return ((currentValue - previousValue) / previousValue) * 100;
};