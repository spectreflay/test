import React from 'react';
import { WifiOff } from 'lucide-react';
import { networkStatus } from '../utils/networkStatus';
import { syncAllOfflineData } from '../utils/offlineSync';

const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = React.useState(networkStatus.isNetworkOnline());
  const [isSyncing, setIsSyncing] = React.useState(false);

  React.useEffect(() => {
    const handleNetworkChange = (online: boolean) => {
      setIsOnline(online);
      if (online) {
        handleSync();
      }
    };

    networkStatus.addCallback(handleNetworkChange);
    return () => networkStatus.removeCallback(handleNetworkChange);
  }, []);

  const handleSync = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    try {
      await syncAllOfflineData();
    } finally {
      setIsSyncing(false);
    }
  };

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
      <WifiOff className="h-5 w-5" />
      <span>You're offline. Changes will sync when connection is restored.</span>
    </div>
  );
};

export default OfflineIndicator;