import React, { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';

function Actions({ gpt }) {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    if (gpt && gpt.settings) {
      setSettings(gpt.settings);
    } else {
      // Default settings if none exist
      setSettings({
        'Email Verification': true,
        'User Message Tracking': true,
        'Weather Assistance': true,
        'YouTube Summary': true,
        'Website Scraper': false,
        'Current Time': true,
        'Stock Prices': true,
        'IMDb Movies': false,
      });
    }
  }, [gpt]);

  const handleToggle = async (setting) => {
    const updatedSettings = {
      ...settings,
      [setting]: !settings[setting]
    };
    
    setSettings(updatedSettings);
    setSaveStatus('Saving...');
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('gpts')
        .update({ settings: updatedSettings })
        .eq('id', gpt.id);
        
      if (error) throw error;
      setSaveStatus('Saved!');
      
      // Clear the save status after a delay
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (err) {
      console.error('Error updating settings:', err);
      setSaveStatus('Error saving');
      
      // Revert the setting on error
      setSettings(settings);
    } finally {
      setLoading(false);
    }
  };

  if (!gpt) {
    return <div className="text-center py-8">Select a GPT to manage actions</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Actions</h3>
        {saveStatus && (
          <span className={`text-sm ${saveStatus === 'Saved!' ? 'text-green-500' : saveStatus === 'Error saving' ? 'text-red-500' : 'text-gray-500'}`}>
            {saveStatus}
          </span>
        )}
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200">
        {Object.entries(settings).map(([setting, enabled], index) => (
          <div 
            key={setting}
            className={`flex items-center justify-between p-4 ${
              index < Object.entries(settings).length - 1 ? 'border-b border-gray-200' : ''
            }`}
          >
            <span className="font-medium">{setting}</span>
            <button
              onClick={() => handleToggle(setting)}
              disabled={loading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                enabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Actions;