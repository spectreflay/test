import React, { useState } from 'react';
import { generateEAN13 } from '../../utils/barcode';
import { Barcode, Copy, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface BarcodeGeneratorProps {
  value: string;
  onChange: (value: string) => void;
}

const BarcodeGenerator: React.FC<BarcodeGeneratorProps> = ({ value, onChange }) => {
  const handleGenerate = () => {
    const newBarcode = generateEAN13();
    onChange(newBarcode);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    toast.success('Barcode copied to clipboard');
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Barcode
      </label>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Barcode className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Enter or generate barcode"
          />
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          className="p-2 text-gray-600 hover:text-gray-900 border rounded-md"
          title="Generate new barcode"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="p-2 text-gray-600 hover:text-gray-900 border rounded-md"
          title="Copy barcode"
        >
          <Copy className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default BarcodeGenerator;