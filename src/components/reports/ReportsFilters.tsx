import React from "react";
import { Download } from "lucide-react";
import DateRangePicker from "./DateRangePicker";

interface ReportFiltersProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onExport: () => void;
}

const ReportFilters: React.FC<ReportFiltersProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onExport,
}) => {
  return (
    <div className="bg-card p-4 rounded-lg shadow flex flex-col sm:flex-row justify-between items-center gap-4">
      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={onStartDateChange}
        onEndDateChange={onEndDateChange}
      />
      <button
        onClick={onExport}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover"
      >
        <Download className="h-4 w-4 mr-2" />
        Export to Excel
      </button>
    </div>
  );
};

export default ReportFilters;
