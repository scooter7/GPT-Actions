import React, { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import Instructions from './Instructions';
import Users from './Users';
import Analytics from './Analytics';
import Actions from './Actions';
import CreateGPTForm from './CreateGPTForm';

function Dashboard({ session }) {
  const [gpts, setGpts] = useState([]);
  const [selectedGpt, setSelectedGpt] = useState(null);
  const [activeTab, setActiveTab] = useState('instructions');
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchGpts();
  }, []);

  const fetchGpts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gpts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setGpts(data || []);
      if (data && data.length > 0 && !selectedGpt) {
        setSelectedGpt(data[0]);
      }
    } catch (err) {
      console.error('Error fetching GPTs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGptCreated = (newGpt) => {
    setGpts([newGpt, ...gpts]);
    setSelectedGpt(newGpt);
    setShowCreateForm(false);
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error.message);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'instructions':
        return <Instructions gpt={selectedGpt} />;
      case 'users':
        return <Users gpt={selectedGpt} />;
      case 'analytics':
        return <Analytics gpt={selectedGpt} />;
      case 'actions':
        return <Actions gpt={selectedGpt} />;
      default:
        return <Instructions gpt={selectedGpt} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">GPT Auth</h1>
          <div className="flex items-center">
            <span className="mr-4 text-gray-600">{session.user.email}</span>
            <button
              onClick={handleSignOut}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full md:w-64 space-y-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold">My GPTs</h2>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-2 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  + New
                </button>
              </div>
              
              {loading ? (
                <div className="text-center py-4">Loading...</div>
              ) : gpts.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No GPTs yet. Create your first one!
                </div>
              ) : (
                <ul className="space-y-1">
                  {gpts.map(gpt => (
                    <li key={gpt.id}>
                      <button
                        onClick={() => setSelectedGpt(gpt)}
                        className={`w-full text-left px-3 py-2 rounded ${
                          selectedGpt && selectedGpt.id === gpt.id
                            ? 'bg-blue-100 text-blue-700'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {gpt.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            {showCreateForm && (
              <div className="bg-white p-4 rounded-lg shadow">
                <CreateGPTForm 
                  onGptCreated={handleGptCreated} 
                  onCancel={() => setShowCreateForm(false)}
                />
              </div>
            )}
          </div>
          
          {/* Main content */}
          <div className="flex-1">
            {selectedGpt ? (
              <div className="bg-white rounded-lg shadow">
                <div className="border-b border-gray-200">
                  <div className="px-6 py-4">
                    <h2 className="text-xl font-semibold">{selectedGpt.name}</h2>
                    {selectedGpt.description && (
                      <p className="text-gray-500 mt-1">{selectedGpt.description}</p>
                    )}
                  </div>
                  <nav className="flex px-6">
                    {['instructions', 'users', 'analytics', 'actions'].map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-3 font-medium text-sm capitalize ${
                          activeTab === tab
                            ? 'border-b-2 border-blue-500 text-blue-600'
                            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </nav>
                </div>
                <div className="p-6">
                  {renderTabContent()}
                </div>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <p className="text-gray-500">
                  {gpts.length === 0
                    ? "Create your first GPT to get started"
                    : "Select a GPT from the sidebar"}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;