import React, { useState } from 'react';
import { supabase } from '../integrations/supabase/client';

function CreateGPTForm({ onGptCreated, onCancel }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Default settings for new GPTs
      const defaultSettings = {
        'Email Verification': true,
        'User Message Tracking': false,
        'Weather Assistance': true,
        'YouTube Summary': true,
        'Website Scraper': false,
        'Current Time': true,
        'Stock Prices': true,
        'IMDb Movies': false,
      };

      // Generate UUIDs for client_id and client_secret
      const clientId = crypto.randomUUID();
      const clientSecret = crypto.randomUUID();

      const { data, error } = await supabase
        .from('gpts')
        .insert({
          name,
          description,
          settings: defaultSettings,
          client_id: clientId,
          client_secret: clientSecret
        })
        .select()
        .single();

      if (error) throw error;

      // Reset form
      setName('');
      setDescription('');
      
      // Notify parent component
      if (onGptCreated) onGptCreated(data);
    } catch (error) {
      console.error('Error creating GPT:', error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Create New GPT</h3>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-gray-700 mb-1 text-sm">GPT Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            required
          />
        </div>
        
        <div>
          <label htmlFor="description" className="block text-gray-700 mb-1 text-sm">Description (optional)</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            rows="2"
          />
        </div>
        
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create GPT'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300 transition"
              disabled={loading}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default CreateGPTForm;