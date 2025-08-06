'use client'
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '../auth/SupabaseProvider';
import Header from './Header';
import Sidebar from './Sidebar';
import Instructions from './Instructions';
import SimpleTestInstructions from './SimpleTestInstructions';
import Users from './Users';
import Analytics from './Analytics';
import Actions from './Actions';
import GPTManager from './GPTManager';
import { Loader2 } from 'lucide-react';

export default function DashboardClientContent({ initialGpts, initialSelectedGPT }) {
  const { supabase } = useSupabase();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('Instructions');
  const [gpts, setGpts] = useState(initialGpts);
  const [selectedGPT, setSelectedGPT] = useState(initialSelectedGPT);
  const [showGPTManager, setShowGPTManager] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchGpts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('gpts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching GPTs:', error);
      setGpts([]);
    } else {
      const gptData = data || [];
      setGpts(gptData);
      setSelectedGPT(currentSelectedGPT => {
        if (!currentSelectedGPT && gptData.length > 0) {
          return gptData[0];
        } else if (currentSelectedGPT) {
          const updatedSelected = gptData.find(g => g.id === currentSelectedGPT.id);
          return updatedSelected || (gptData.length > 0 ? gptData[0] : null);
        }
        return currentSelectedGPT;
      });
    }
    setLoading(false);
  }, [supabase]);

  const handleSelectGpt = (gpt) => {
    setSelectedGPT(gpt);
    setShowGPTManager(false);
  }

  const renderContent = () => {
    if (loading && gpts.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <Loader2 className="animate-spin h-12 w-12" />
          <p className="mt-4">Loading your GPTs...</p>
        </div>
      );
    }
    if (!selectedGPT) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <p className="mb-4 text-center">No GPT selected. Click <span className="text-blue-400 underline cursor-pointer" onClick={() => setShowGPTManager(true)}>My GPTs</span> to add your first GPT.</p>
        </div>
      );
    }
    switch (activeTab) {
      case 'Instructions':
        return <Instructions selectedGPT={selectedGPT} />;
      case 'Test Instructions':
        return <SimpleTestInstructions selectedGPT={selectedGPT} />;
      case 'Users':
        return <Users selectedGPT={selectedGPT} />;
      case 'Analytics':
        return <Analytics selectedGPT={selectedGPT} />;
      case 'Actions':
        return <Actions selectedGPT={selectedGPT} />;
      default:
        return <Instructions selectedGPT={selectedGPT} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#0d1117] text-white">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMyGPTs={() => setShowGPTManager(true)} />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
      {showGPTManager && (
        <GPTManager
          gpts={gpts}
          selectedGPT={selectedGPT}
          setSelectedGPT={handleSelectGpt}
          onClose={() => setShowGPTManager(false)}
          onGptChange={fetchGpts}
        />
      )}
    </div>
  );
}