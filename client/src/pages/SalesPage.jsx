import { useEffect, useState } from 'react';
import { getLeads, updateLead } from '../api';
import { toast } from 'react-toastify';

const stages = ['new', 'contacted', 'converted', 'lost'];

const stageColors = {
  new: 'bg-blue-50 border-blue-200',
  contacted: 'bg-yellow-50 border-yellow-200',
  converted: 'bg-green-50 border-green-200',
  lost: 'bg-red-50 border-red-200',
};

const priorityColors = {
  High: 'text-red-600 bg-red-100',
  Medium: 'text-orange-600 bg-orange-100',
  Low: 'text-green-600 bg-green-100',
};

export default function SalesPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchLeads();
  }, [token]);

  async function fetchLeads() {
    setLoading(true);
    try {
      const allLeads = await getLeads(token);
      setLeads(allLeads);
    } catch (error) {
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  }

  const handleMove = async (lead, direction) => {
    const currentIndex = stages.indexOf(lead.status);
    let newStatus;
    if (direction === 'next' && currentIndex < stages.length - 1) {
      newStatus = stages[currentIndex + 1];
    } else if (direction === 'prev' && currentIndex > 0) {
      newStatus = stages[currentIndex - 1];
    }

    if (newStatus) {
      try {
        const updated = await updateLead(token, lead._id, { status: newStatus });
        setLeads(prev => prev.map(l => l._id === lead._id ? { ...l, status: newStatus } : l));
        toast.success(`Moved to ${newStatus}`);
      } catch (err) {
        toast.error('Failed to update status');
      }
    }
  };

  const calculateTotal = (status) => {
    return leads
      .filter(l => l.status === status)
      .reduce((sum, l) => sum + (Number(l.value) || 0), 0)
      .toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-50 to-purple-50 p-6 flex flex-col">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Sales Pipeline</h1>
          <p className="text-gray-500 mt-1">Manage your deals and track progress.</p>
        </div>
        <button onClick={fetchLeads} className="px-4 py-2 bg-white text-indigo-600 font-semibold rounded-lg shadow hover:bg-indigo-50 transition">
          Refresh
        </button>
      </header>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-500 text-lg">Loading pipeline...</div>
      ) : (
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-6 min-w-max pb-4">
            {stages.map(stage => {
              const stageLeads = leads.filter(l => l.status === stage);
              return (
                <div key={stage} className={`w-80 flex-shrink-0 flex flex-col rounded-xl border ${stageColors[stage]} shadow-sm max-h-[80vh]`}>
                  {/* Column Header */}
                  <div className="p-4 border-b border-gray-200/50 bg-white/50 backdrop-blur rounded-t-xl sticky top-0 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-gray-800 capitalize text-lg">{stage}</h3>
                      <span className="text-xs text-gray-500 font-medium">{stageLeads.length} Deals</span>
                    </div>
                    <div className="text-sm font-bold text-gray-700 bg-white/80 px-2 py-1 rounded shadow-sm">
                      {calculateTotal(stage)}
                    </div>
                  </div>

                  {/* Cards Container */}
                  <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                    {stageLeads.map(lead => (
                      <div key={lead._id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow group relative">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-800 truncate pr-2">{lead.name}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[lead.priority] || 'text-gray-600 bg-gray-100'}`}>
                            {lead.priority || 'Medium'}
                          </span>
                        </div>

                        <div className="text-2xl font-bold text-gray-900 mb-1">
                          {(Number(lead.value) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </div>

                        <div className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                          <span className="truncate max-w-[150px]">{lead.platform}</span> •
                          <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
                        </div>

                        {/* Assignee */}
                        {lead.assignedTo && (
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                              {lead.assignedTo.name?.[0] || 'U'}
                            </div>
                            <span className="text-xs text-gray-600 truncate">{lead.assignedTo.name}</span>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            disabled={stage === 'new'}
                            onClick={() => handleMove(lead, 'prev')}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                            title="Move Back"
                          >
                            ←
                          </button>
                          <button
                            disabled={stage === 'lost'}
                            onClick={() => handleMove(lead, 'next')}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                            title="Move Next"
                          >
                            →
                          </button>
                        </div>
                      </div>
                    ))}
                    {stageLeads.length === 0 && (
                      <div className="text-center py-8 text-gray-400 text-sm italic">
                        No deals here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
