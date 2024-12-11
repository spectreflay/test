import React, { useState } from 'react';
import { X } from 'lucide-react';
import Profile from './Profile';
import UserSettings from './UserSettings';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex space-x-4">
            <button
              className={`text-lg font-semibold ${activeTab === 'profile' ? 'text-primary' : 'text-gray-500'}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </button>
            <button
              className={`text-lg font-semibold ${activeTab === 'settings' ? 'text-primary' : 'text-gray-500'}`}
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </button>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6">
          {activeTab === 'profile' ? <Profile /> : <UserSettings />}
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
