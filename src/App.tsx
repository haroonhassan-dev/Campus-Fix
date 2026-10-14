import { useState, useEffect, useMemo } from 'react';
import type {
  Complaint,
  AddComplaintInput,
  ComplaintStatus,
  FilterState,
  ViewMode,
} from './types/frontend';
import {
  getComplaints,
  addComplaint,
  updateComplaintStatus,
  toggleUpvote,
} from './services/complaintService';

import Navbar from './components/Navbar';
import QuickNoticeBanner from './components/QuickNoticeBanner';
import DashboardOverview from './components/DashboardOverview';
import ComplaintFilters from './components/ComplaintFilters';
import ComplaintList from './components/ComplaintList';
import ComplaintForm from './components/ComplaintForm';
import ComplaintDetailModal from './components/ComplaintDetailModal';

const initialFilterState: FilterState = {
  search: '',
  status: 'all',
  category: 'All Categories',
  priority: 'all',
  sortBy: 'newest',
};

const priorityWeight: Record<string, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function App() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'list' | 'submit'>('dashboard');
  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<Complaint | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Fetch complaints on component mount using the agreed getComplaints() function
  useEffect(() => {
    let ignore = false;
    getComplaints()
      .then((data) => {
        if (!ignore) {
          setComplaints(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error('Failed to load complaints:', err);
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Show transient notification toast
  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Add a new complaint using the agreed addComplaint(input) function
  const handleAddComplaint = async (input: AddComplaintInput): Promise<Complaint> => {
    const created = await addComplaint(input);
    setComplaints((prev) => [created, ...prev]);
    showToast(`Ticket ${created.id} submitted successfully!`);
    return created;
  };

  // Update status using the agreed updateComplaintStatus(id, status) function
  const handleStatusChange = async (id: string, newStatus: ComplaintStatus) => {
    try {
      const updated = await updateComplaintStatus(id, newStatus);
      setComplaints((prev) =>
        prev.map((item) => (item.id === id ? updated : item))
      );
      if (selectedDetail && selectedDetail.id === id) {
        setSelectedDetail(updated);
      }
      showToast(`Ticket ${id} status updated to ${newStatus.toUpperCase()}`);
    } catch (err) {
      console.error('Status update error:', err);
    }
  };

  // Handle upvoting
  const handleUpvote = (id: string) => {
    const updated = toggleUpvote(id);
    if (updated) {
      setComplaints((prev) =>
        prev.map((item) => (item.id === id ? updated : item))
      );
      if (selectedDetail && selectedDetail.id === id) {
        setSelectedDetail(updated);
      }
    }
  };

  // Reset filters handler
  const handleResetFilters = () => {
    setFilters(initialFilterState);
  };

  // Quick status filter selector from stats card
  const handleQuickStatusFilter = (status: 'all' | ComplaintStatus) => {
    setFilters((prev) => ({ ...prev, status }));
    setActiveTab('list');
  };

  // Filter and sort complaints
  const filteredComplaints = useMemo(() => {
    return complaints
      .filter((item) => {
        // Status filter
        if (filters.status !== 'all' && item.status !== filters.status) {
          return false;
        }

        // Category filter
        if (
          filters.category !== 'All Categories' &&
          item.category !== filters.category
        ) {
          return false;
        }

        // Priority filter
        if (filters.priority !== 'all' && item.priority !== filters.priority) {
          return false;
        }

        // Search filter (keyword in title, description, location, id, or submitter)
        if (filters.search.trim()) {
          const query = filters.search.toLowerCase().trim();
          const matchTitle = item.title.toLowerCase().includes(query);
          const matchDesc = item.description.toLowerCase().includes(query);
          const matchLoc = item.location.toLowerCase().includes(query);
          const matchId = item.id.toLowerCase().includes(query);
          const matchCategory = item.category.toLowerCase().includes(query);
          const matchSubmitter = item.submittedBy.toLowerCase().includes(query);

          if (
            !matchTitle &&
            !matchDesc &&
            !matchLoc &&
            !matchId &&
            !matchCategory &&
            !matchSubmitter
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (filters.sortBy === 'oldest') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (filters.sortBy === 'priority') {
          return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
        }
        if (filters.sortBy === 'upvotes') {
          return (b.upvotes || 0) - (a.upvotes || 0);
        }
        return 0;
      });
  }, [complaints, filters]);

  // Status counts for badge numbers
  const statusCounts = useMemo(() => {
    return {
      all: complaints.length,
      pending: complaints.filter((c) => c.status === 'pending').length,
      inProgress: complaints.filter((c) => c.status === 'in-progress').length,
      resolved: complaints.filter((c) => c.status === 'resolved').length,
    };
  }, [complaints]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100 flex flex-col justify-between">
      {/* Toast Notification */}
      {toast && (
        <div
          id="toast-notification"
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 animate-in slide-in-from-bottom-5"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
            ✓
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      <div>
        {/* Development Mode Notice Banner */}
        <QuickNoticeBanner />

        {/* Global Navigation Bar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
          totalTicketsCount={complaints.length}
        />

        {/* Main Application Container */}
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <DashboardOverview
                complaints={complaints}
                onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
                onSelectStatusFilter={handleQuickStatusFilter}
                onViewDetails={(complaint) => setSelectedDetail(complaint)}
                onStatusChange={handleStatusChange}
                activeStatusFilter={filters.status}
              />

              {/* Complaints Section inside Dashboard */}
              <section aria-labelledby="all-complaints-section-title" className="space-y-4 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h2
                      id="all-complaints-section-title"
                      className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
                    >
                      Campus Facilities Log
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500">
                      Search, inspect, and update maintenance requests across campus buildings
                    </p>
                  </div>
                  <button
                    id="btn-switch-to-list-view"
                    type="button"
                    onClick={() => setActiveTab('list')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 self-start sm:self-auto"
                  >
                    Open Full Filtered View →
                  </button>
                </div>

                {/* Filter Toolbar */}
                <ComplaintFilters
                  filters={filters}
                  setFilters={setFilters}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                  statusCounts={statusCounts}
                  totalFilteredCount={filteredComplaints.length}
                  totalUnfilteredCount={complaints.length}
                  onResetFilters={handleResetFilters}
                />

                {/* Complaints Cards */}
                <ComplaintList
                  complaints={filteredComplaints}
                  isLoading={isLoading}
                  viewMode={viewMode}
                  onStatusChange={handleStatusChange}
                  onUpvote={handleUpvote}
                  onViewDetails={(complaint) => setSelectedDetail(complaint)}
                  onResetFilters={handleResetFilters}
                  onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
                />
              </section>
            </div>
          )}

          {/* List Tab */}
          {activeTab === 'list' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                  All Campus Complaints & Tickets
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Full registry of infrastructure and facility issues submitted across university premises.
                </p>
              </div>

              {/* Filter Toolbar */}
              <ComplaintFilters
                filters={filters}
                setFilters={setFilters}
                viewMode={viewMode}
                setViewMode={setViewMode}
                statusCounts={statusCounts}
                totalFilteredCount={filteredComplaints.length}
                totalUnfilteredCount={complaints.length}
                onResetFilters={handleResetFilters}
              />

              {/* Complaints List */}
              <ComplaintList
                complaints={filteredComplaints}
                isLoading={isLoading}
                viewMode={viewMode}
                onStatusChange={handleStatusChange}
                onUpvote={handleUpvote}
                onViewDetails={(complaint) => setSelectedDetail(complaint)}
                onResetFilters={handleResetFilters}
                onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
              />
            </div>
          )}

          {/* Submit Tab */}
          {activeTab === 'submit' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <ComplaintForm
                onSubmitComplaint={handleAddComplaint}
                onSuccessClose={() => setActiveTab('list')}
                isModal={false}
              />
            </div>
          )}
        </main>
      </div>

      {/* Modal: Quick Complaint Submission */}
      {isSubmitModalOpen && (
        <ComplaintForm
          onSubmitComplaint={handleAddComplaint}
          onSuccessClose={() => setIsSubmitModalOpen(false)}
          isModal={true}
        />
      )}

      {/* Modal: Complaint Deep Inspection Details */}
      {selectedDetail && (
        <ComplaintDetailModal
          complaint={selectedDetail}
          onClose={() => setSelectedDetail(null)}
          onStatusChange={handleStatusChange}
          onUpvote={handleUpvote}
        />
      )}

      {/* CampusFix Global Footer */}
      <footer className="mt-12 border-t border-slate-200 bg-white py-8 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-800 dark:text-slate-200">
              Campus<span className="text-blue-600">Fix</span>
            </span>
            <span>— University Facility Resolution System</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Frontend Visual Preview</span>
            <span>•</span>
            <span>Contracts: getComplaints | addComplaint | updateComplaintStatus</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;