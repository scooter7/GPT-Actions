'use client';
import { useState, useEffect } from 'react';
import { useSupabase } from '../auth/SupabaseProvider';

const Toggle = ({ label, enabled, onToggle }) => (
  <div className="flex items-center justify-between py-3">
    <span className="text-gray-300">{label}</span>
    <button
      onClick={onToggle}
      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 ${
        enabled ? 'bg-blue-600' : 'bg-gray-600'
      }`}
    >
      <span
        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

const Actions = ({ selectedGPT }) => {
  const { supabase } = useSupabase();
  const [actions, setActions] = useState({});
  const [loading, setLoading] = useState(false);

  // Default actions and their initial states
  const defaultActions = {
    'Email Verification': true,
    'User Message Tracking': false,
    'Weather Assistance': true,
    'YouTube Summary': true,
    'Website Scraper': false,
    'Current Time': true,
    'Stock Prices': true,
    'IMDb Movies': false,
  };

  useEffect(() => {
    if (selectedGPT) {
      // Merge default actions with saved settings, prioritizing saved settings
      setActions({ ...defaultActions, ...(selectedGPT.settings || {}) });
    } else {
      setActions(defaultActions);
    }
  }, [selectedGPT]);

  const handleToggle = async (action) => {
    if (!selectedGPT) {
      console.error("Please select a GPT first.");
      return;
    }

    setLoading(true);
    const newActions = { ...actions, [action]: !actions[action] };
    setActions(newActions); // Optimistic update

    const { error } = await supabase
      .from('gpts')
      .update({ settings: newActions })
      .eq('id', selectedGPT.id);

    if (error) {
      console.error('Error updating GPT settings:', error);
      setActions(prev => ({ ...prev, [action]: !prev[action] })); // Revert on error
    } else {
      console.log('Setting updated successfully!');
    }
    setLoading(false);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Actions {selectedGPT && <span className="text-blue-400">({selectedGPT.name})</span>}</h2>
      <div className="bg-[#161b22] border border-gray-700 rounded-lg p-6 divide-y divide-gray-700">
        {Object.entries(actions).map(([label, enabled]) => (
          <Toggle 
            key={label}
            label={label}
            enabled={enabled}
            onToggle={() => handleToggle(label)}
            disabled={loading} // Disable toggles during save
          />
        ))}
      </div>
    </div>
  );
};

export default Actions;