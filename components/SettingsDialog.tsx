import React, { useState, useEffect } from 'react';

// --- Settings Dialog Component ---
interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string) => void;
  currentApiKey: string;
}
export const SettingsDialog = ({ isOpen, onClose, onSave, currentApiKey }: SettingsDialogProps) => {
  const [key, setKey] = useState(currentApiKey);

  useEffect(() => {
    setKey(currentApiKey);
  }, [currentApiKey]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(key);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 w-full max-w-md m-4">
        <h2 className="text-xl font-bold text-white mb-4">Settings</h2>
        <div className="space-y-2">
          <label htmlFor="apiKey" className="text-sm font-medium text-slate-400 block">Smartlead API Key</label>
          <input
            id="apiKey"
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Enter your API key"
            className="w-full bg-slate-900 border border-slate-600 rounded-md py-2 px-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <button onClick={onClose} className="bg-slate-700 text-white font-semibold py-2 px-4 rounded-md hover:bg-slate-600 transition-colors">Cancel</button>
          <button onClick={handleSave} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">Save</button>
        </div>
      </div>
    </div>
  );
};