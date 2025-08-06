'use client';
import { useState } from 'react';

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
  const [actions, setActions] = useState({
    'Email Verification': true,
    'User Message Tracking': false,
    'Weather Assistance': true,
    'YouTube Summary': true,
    'Website Scraper': false,
    'Current Time': true,
    'Stock Prices': true,
    'IMDb Movies': false,
  });

  const handleToggle = (action) => {
    setActions(prev => ({ ...prev, [action]: !prev[action] }));
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
          />
        ))}
      </div>
    </div>
  );
};

export default Actions;