import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { networkStatus } from '../utils/networkStatus';

const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = React.useState(networkStatus.isNetworkOnline());

  React.useEffect(() => {
    const handleNetworkChange = (online: boolean) => setIsOnline(online);
    networkStatus.addCallback(handleNetworkChange);
    return () => networkStatus.removeCallback(handleNetworkChange);
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
      <WifiOff className="h-5 w-5" />
      <span>Offline Mode - Sales will sync when connection is restored</span>
    </div>
  );
}

export default OfflineIndicator;