'use client';
import { useState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { useSupabase } from '../auth/SupabaseProvider';

const GPTManager = ({ gpts, selectedGPT, setSelectedGPT, onClose, onGptChange }) => {
  const { supabase, session } = useSupabase();
  const [showAdd, setShowAdd] = useState(false);
  const [newGPT, setNewGPT] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Default actions for new GPTs
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

  const handleAdd = async () => {
    if (!newGPT.name.trim()) {
      setError('GPT Name is required.');
      return;
    }
    setLoading(true);
    setError('');

    const { data, error: insertError } = await supabase
      .from('gpts')
      .insert({
        name: newGPT.name,
        description: newGPT.description,
        // user_id is no longer needed here; the database will set it automatically
        settings: defaultSettings,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error adding GPT:', insertError);
      setError(insertError.message); // Show the actual error
    } else {
      setNewGPT({ name: '', description: '' });
      setShowAdd(false);
      await onGptChange(); // Refetch GPTs
      setSelectedGPT(data); // Select the new GPT
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this GPT? This action cannot be undone.')) {
      return;
    }
    setLoading(true);
    const { error: deleteError } = await supabase
      .from('gpts')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting GPT:', deleteError);
    } else {
      await onGptChange(); // Refetch GPTs
      // If the deleted GPT was the selected one, clear selection or select first available
      if (selectedGPT && selectedGPT.id === id) {
        setSelectedGPT(null);
      }
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#161b22] border border-gray-700 rounded-lg p-6 w-full max-w-md relative">
        <button className="absolute top-3 right-3 text-gray-400 hover:text-white" onClick={onClose} disabled={loading}>
          <X size={20} />
        </button>
        <h2 className="text-xl font-bold mb-4 text-white">My GPTs</h2>
        {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
        <ul className="mb-4 max-h-40 overflow-y-auto">
          {(!gpts || gpts.length === 0) && <li className="text-gray-400">No GPTs yet.</li>}
          {gpts && gpts.map(gpt => (
            <li key={gpt.id} className={`flex items-center justify-between px-2 py-1 rounded group ${selectedGPT && selectedGPT.id === gpt.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`}>
              <button className="flex-1 text-left" onClick={() => setSelectedGPT(gpt)}>
                <span className="font-semibold">{gpt.name}</span>
                {gpt.description && <p className="text-xs text-gray-400 group-hover:text-gray-300">{gpt.description}</p>}
              </button>
              <button className="ml-2 text-red-500 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity" onClick={() => handleDelete(gpt.id)} disabled={loading}>
                <X size={16} />
              </button>
            </li>
          ))}
        </ul>
        {showAdd ? (
          <div className="mb-2">
            <input
              className="w-full mb-2 px-3 py-2 rounded bg-[#0d1117] border border-gray-700 text-white focus:ring-blue-500 focus:border-blue-500"
              placeholder="GPT Name"
              value={newGPT.name}
              onChange={e => setNewGPT(g => ({ ...g, name: e.target.value }))}
            />
            <input
              className="w-full mb-2 px-3 py-2 rounded bg-[#0d1117] border border-gray-700 text-white focus:ring-blue-500 focus:border-blue-500"
              placeholder="Description (optional)"
              value={newGPT.description}
              onChange={e => setNewGPT(g => ({ ...g, description: e.target.value }))}
            />
            <div className="flex gap-2 items-center">
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-800" onClick={handleAdd} disabled={loading}>
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Add'}
              </button>
              <button className="px-4 py-2 bg-gray-700 text-white rounded" onClick={() => setShowAdd(false)} disabled={loading}>Cancel</button>
            </div>
          </div>
        ) : (
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={() => setShowAdd(true)} disabled={loading}>
            <Plus size={16} /> Add New GPT
          </button>
        )}
      </div>
    </div>
  );
};

export default GPTManager;