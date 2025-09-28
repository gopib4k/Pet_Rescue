import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { apiService } from '../../services/api';
import type { PetAdoption } from '../../services/api';
import { Edit2, X, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface AdoptionRequest {
  id: number;
  petName: string;
  requestorName: string;
  requestorEmail: string;
  message: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdBy: string;
  modifiedBy: string;
}

// --- Fun & Playful Status Badge Component ---
const StatusBadge: React.FC<{ status: AdoptionRequest['status'] }> = ({ status }) => {
    let styles = '';
    let Icon = Clock;

    switch (status) {
        case 'Pending':
            styles = 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700/50';
            Icon = Clock;
            break;
        case 'Approved':
            styles = 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700/50';
            Icon = CheckCircle;
            break;
        case 'Rejected':
            styles = 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700/50';
            Icon = XCircle;
            break;
        default:
            styles = 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
    }

    return (
        <span className={`inline-flex items-center gap-x-1.5 py-1 px-2.5 rounded-full text-xs font-medium border ${styles}`}>
            <Icon className="w-3.5 h-3.5" />
            {status}
        </span>
    );
};

const AdminAdoptRequests: React.FC = () => {
  const [requests, setRequests] = useState<AdoptionRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<AdoptionRequest | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    petName: '',
    requestorEmail: '',
    status: 'all',
  });

  const fetchAdoptionRequests = useCallback(async () => {
    try {
      setLoading(true);
      const data: PetAdoption[] = await apiService.getPetAdoptions();
      
      const normalizedData: AdoptionRequest[] = data.map(item => ({
        id: item.id,
        petName: item.pet?.name || 'N/A', 
        requestorName: item.requestor?.username || 'Unknown User',
        requestorEmail: item.requestor?.email || 'no-email@provided.com',
        message: item.message || '',
        status: item.status,
        createdBy: item.created_by?.username || '--',
        modifiedBy: item.modified_by?.username || '--',
      }));
      setRequests(normalizedData);
    } catch (err) {
      console.error("Failed to fetch adoption requests:", err);
      setError("Could not load adoption requests. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdoptionRequests();
  }, [fetchAdoptionRequests]);

  const handleSaveChanges = async (updatedRequest: AdoptionRequest) => {
    setSelectedRequest(null);
    setLoading(true);
    setError(null);

    try {
      const adoptionDataToUpdate: Partial<PetAdoption> = {
        status: updatedRequest.status,
      };
      
      await apiService.updatePetAdoption(updatedRequest.id, adoptionDataToUpdate);
      fetchAdoptionRequests();

    } catch (err) {
      console.error("Failed to update adoption request:", err);
      setError("Failed to save changes. Please try again.");
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const filteredRequests = useMemo(() => {
    return requests.filter(req =>
      req.petName.toLowerCase().includes(filters.petName.toLowerCase()) &&
      req.requestorEmail.toLowerCase().includes(filters.requestorEmail.toLowerCase()) &&
      (filters.status === 'all' || req.status === filters.status)
    );
  }, [requests, filters]);

  const stats = useMemo(() => ({
    total: requests.length,
    pending: requests.filter(r => r.status === 'Pending').length,
    approved: requests.filter(r => r.status === 'Approved').length,
    rejected: requests.filter(r => r.status === 'Rejected').length,
  }), [requests]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen p-6 bg-light-primary dark:bg-dark-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-light-accent dark:border-dark-accent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-light-primary dark:bg-dark-background theme-transition">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-light-text dark:text-dark-secondary">
          Adoption Request Dashboard
        </h1>
        <p className="mt-2 text-light-secondary dark:text-dark-neutral">
          Monitor and manage pet adoption requests
        </p>
      </div>
      
      {error && (
        <div className="my-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-600/50 rounded-lg flex items-center">
            <AlertTriangle className="w-5 h-5 mr-3 text-red-600 dark:text-red-400" />
            <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 my-6">
        <div className="bg-light-neutral dark:bg-dark-primary rounded-lg shadow-lg p-6 text-center">
          <p className="text-sm font-medium text-light-secondary dark:text-dark-neutral">Total Requests</p>
          <p className="text-3xl font-bold text-light-text dark:text-dark-secondary">{stats.total}</p>
        </div>
        <div className="bg-light-neutral dark:bg-dark-primary rounded-lg shadow-lg p-6 text-center">
          <p className="text-sm font-medium text-light-secondary dark:text-dark-neutral">Pending</p>
          <p className="text-3xl font-bold text-light-text dark:text-dark-secondary">{stats.pending}</p>
        </div>
        <div className="bg-light-neutral dark:bg-dark-primary rounded-lg shadow-lg p-6 text-center">
          <p className="text-sm font-medium text-light-secondary dark:text-dark-neutral">Approved</p>
          <p className="text-3xl font-bold text-light-text dark:text-dark-secondary">{stats.approved}</p>
        </div>
        <div className="bg-light-neutral dark:bg-dark-primary rounded-lg shadow-lg p-6 text-center">
          <p className="text-sm font-medium text-light-secondary dark:text-dark-neutral">Rejected</p>
          <p className="text-3xl font-bold text-light-text dark:text-dark-secondary">{stats.rejected}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-light-neutral dark:bg-dark-primary rounded-lg shadow-lg p-4 mb-6 border border-light-secondary/10 dark:border-dark-secondary/20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-light-text dark:text-dark-neutral">Pet Name</label>
            <input type="text" name="petName" value={filters.petName} onChange={handleFilterChange} placeholder="Search..." className="w-full p-2 rounded border bg-light-primary/50 text-light-text placeholder:text-light-text/60 border-light-secondary/20 focus:ring-light-accent focus:border-light-accent dark:bg-dark-background dark:text-dark-secondary dark:placeholder:text-dark-neutral dark:border-dark-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-light-text dark:text-dark-neutral">Requestor Email</label>
            <input type="text" name="requestorEmail" value={filters.requestorEmail} onChange={handleFilterChange} placeholder="Search..." className="w-full p-2 rounded border bg-light-primary/50 text-light-text placeholder:text-light-text/60 border-light-secondary/20 focus:ring-light-accent focus:border-light-accent dark:bg-dark-background dark:text-dark-secondary dark:placeholder:text-dark-neutral dark:border-dark-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-light-text dark:text-dark-neutral">Status</label>
            <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full p-2 rounded border bg-light-primary/50 text-light-text border-light-secondary/20 focus:ring-light-accent focus:border-light-accent dark:bg-dark-background dark:text-dark-secondary dark:border-dark-primary">
              <option value="all">All</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-light-neutral dark:bg-dark-primary rounded-lg shadow-lg p-6 overflow-x-auto">
        <table className="w-full table-fixed">
          <thead>
            <tr className="border-b border-light-primary dark:border-dark-secondary/30">
              <th className="w-1/6 py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-light-secondary dark:text-dark-neutral">Pet Name</th>
              <th className="w-1/4 py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-light-secondary dark:text-dark-neutral">Requestor</th>
              <th className="w-2/5 py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-light-secondary dark:text-dark-neutral">Message</th>
              <th className="w-32 py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-light-secondary dark:text-dark-neutral">Status</th>
              <th className="w-20 py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-light-secondary dark:text-dark-neutral">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.length > 0 ? (
              filteredRequests.map((req) => (
                <tr key={req.id} className="border-b border-light-primary dark:border-dark-secondary/20 hover:bg-light-primary/50 dark:hover:bg-dark-background">
                  <td className="py-3 px-4 text-light-text dark:text-dark-secondary truncate" title={req.petName}>{req.petName}</td>
                  <td className="py-3 px-4 text-light-text dark:text-dark-secondary truncate" title={req.requestorName}>{req.requestorName}</td>
                  <td className="py-3 px-4 text-light-text dark:text-dark-secondary truncate" title={req.message}>{req.message}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="py-3 px-4">
                    <button onClick={() => setSelectedRequest(req)} className="p-1 rounded-full text-light-secondary hover:bg-light-primary dark:text-dark-neutral dark:hover:bg-dark-background">
                      <Edit2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} className="text-center py-4 text-light-secondary dark:text-dark-neutral">No adoption requests found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {selectedRequest && (
        <EditFormModal request={selectedRequest} onClose={() => setSelectedRequest(null)} onSave={handleSaveChanges} />
      )}
    </div>
  );
};

const EditFormModal = ({ request, onClose, onSave }: { request: AdoptionRequest, onClose: () => void, onSave: (req: AdoptionRequest) => void }) => {
  const [formData, setFormData] = useState<AdoptionRequest>(request);
  const modalRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, status: e.target.value as AdoptionRequest['status'] });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div ref={modalRef} className="w-full max-w-3xl rounded-lg shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto bg-light-neutral dark:bg-dark-primary border-t-4 border-light-accent dark:border-dark-accent" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-light-secondary hover:text-light-accent dark:text-dark-neutral dark:hover:text-dark-secondary">
          <X size={24} />
        </button>

        <div className="mb-4">
          <h3 className="text-2xl font-bold text-light-text dark:text-dark-secondary">Review Request: {formData.petName}</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-light-text dark:text-dark-neutral">Requestor</label>
            <input type="text" value={`${formData.requestorName} (${formData.requestorEmail})`} disabled className="w-full p-2 mt-1 rounded border bg-light-primary/50 text-light-secondary dark:bg-dark-background dark:text-dark-neutral border-light-secondary/20 dark:border-dark-primary disabled:cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm font-medium text-light-text dark:text-dark-neutral">Motive for Adoption</label>
            <textarea value={formData.message} disabled className="w-full p-2 mt-1 rounded border bg-light-primary/50 text-light-secondary dark:bg-dark-background dark:text-dark-neutral border-light-secondary/20 dark:border-dark-primary disabled:cursor-not-allowed min-h-[100px]" />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium mb-1 text-light-text dark:text-dark-neutral">Update Request Status</label>
            <select id="status" name="status" value={formData.status} onChange={handleStatusChange} className="w-full p-2 rounded border bg-light-primary/50 text-light-text border-light-secondary/20 focus:ring-light-accent focus:border-light-accent dark:bg-dark-background dark:text-dark-secondary dark:border-dark-primary">
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <div className="mt-6 p-4 rounded-lg text-sm bg-light-primary dark:bg-dark-background">
            <h5 className="font-semibold mb-2 text-light-text dark:text-dark-secondary">Audit Information</h5>
            <p className="text-light-secondary dark:text-dark-neutral">Created by: {formData.createdBy}</p>
            <p className="text-light-secondary dark:text-dark-neutral">Modified by: {formData.modifiedBy}</p>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-light-primary dark:border-dark-secondary/30">
          <button onClick={() => onSave(formData)} className="px-4 py-2 rounded-lg font-semibold transition-colors bg-green-600 hover:bg-green-700 text-white">
            Save Changes
          </button>
          <button onClick={onClose} className="px-4 py-2 rounded-lg font-semibold transition-colors bg-light-secondary/80 hover:bg-light-secondary text-light-neutral dark:bg-dark-neutral/80 dark:hover:bg-dark-neutral dark:text-dark-background">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminAdoptRequests;