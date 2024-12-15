import React, { useEffect, useState } from 'react';
import { Scan } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  isEnabled?: boolean;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, isEnabled = true }) => {
  const [buffer, setBuffer] = useState('');
  const [lastKeyTime, setLastKeyTime] = useState(0);
  const TIMEOUT = 100; // Time window for barcode scanning in milliseconds

  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentTime = new Date().getTime();
      
      // If it's been too long since the last keystroke, reset the buffer
      if (currentTime - lastKeyTime > TIMEOUT) {
        setBuffer('');
      }
      
      // Update the last key time
      setLastKeyTime(currentTime);

      // Only accept numeric input and common barcode characters
      if (/[\d\-]/.test(e.key)) {
        setBuffer(prev => prev + e.key);
      }

      // Enter key signals end of barcode
      if (e.key === 'Enter' && buffer) {
        onScan(buffer);
        setBuffer('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [buffer, lastKeyTime, onScan, isEnabled]);

  return (
    <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
      <Scan className="h-5 w-5 text-gray-500" />
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-700">Barcode Scanner</p>
        <p className="text-xs text-gray-500">
          {isEnabled ? 'Ready to scan' : 'Scanner disabled'}
        </p>
      </div>
      {buffer && (
        <div className="px-2 py-1 bg-gray-200 rounded text-sm">
          {buffer}
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner;