import React, { useState } from 'react';
import { supabase } from '../integrations/supabase/client';

function CreateGPTForm({ onGptCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

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
      // Note: In a real app, you'd want to generate these on the server side
      // for better security, but for this demo we'll use crypto.randomUUID()
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
      setShowForm(false);
      
      // Notify parent component
      if (onGptCreated) onGptCreated(data);
    } catch (error) {
      console.error('Error creating GPT:', error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!showForm) {
    return (
      <div>
        <h3 className="text-xl font-semibold mb-3">Create a New GPT</h3>
        <p className="text-gray-500 mb-4">
          Create a new GPT to start managing authentication for your custom GPT.
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Create GPT
        </button>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-semibold mb-3">Create a New GPT</h3>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-gray-700 mb-1">GPT Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        
        <div>
          <label htmlFor="description" className="block text-gray-700 mb-1">Description (optional)</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            rows="3"
          />
        </div>
        
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create GPT'}
          </button>
          
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateGPTForm;