import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { apiService } from '../../services/api';
import type { PetReport, PetType, AdminPetReport } from '../../services/api';
import { Edit2, X, AlertTriangle, Clock, CheckCircle, XCircle, Star, Heart } from 'lucide-react';

// --- UI Interface Definition ---
interface UILostPetReport {
  id: number;
  petName: string;
  user: string;
  location: string;
  petType: 'Dog' | 'Cat' | 'Other';
  breed: string;
  status: 'Pending' | 'Accepted'| 'Rejected' | 'Resolved' | 'Reunited';
  imageUrl: string;
  createdBy: string;
  modifiedBy: string;
}

// --- Data Mapping Functions ---
const getPetTypeString = (petType: string | PetType | undefined): 'Dog' | 'Cat' | 'Other' => {
  if (!petType) return 'Other';
  const typeName = typeof petType === 'string' ? petType : petType.type;
  if (typeName.toLowerCase().includes('dog')) return 'Dog';
  if (typeName.toLowerCase().includes('cat')) return 'Cat';
  return 'Other';
};

const mapApiToUi = (apiReport: AdminPetReport): UILostPetReport => {
  const location = apiReport.pet.address || 'N/A';
  const rawImageUrl = apiReport.image_url || apiReport.pet.image;
  const formattedModifiedDate = apiReport.modified_date ? new Date(apiReport.modified_date).toLocaleString() : 'N/A';

  return {
    id: apiReport.id,
    petName: apiReport.pet.name,
    user: apiReport.user,
    location: location,
    petType: getPetTypeString(apiReport.pet.pet_type),
    breed: apiReport.pet.breed || 'Unknown',
    status: apiReport.report_status,
    imageUrl: apiService.getImageUrl(rawImageUrl),
    createdBy: apiReport.user,
    modifiedBy: formattedModifiedDate,
  };
};

// --- Fun & Playful Status Badge Component ---
const StatusBadge: React.FC<{ status: UILostPetReport['status'] }> = ({ status }) => {
    let styles = '';
    let Icon = Clock; // Default icon

    switch (status) {
        case 'Pending':
            styles = 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700/50';
            Icon = Clock;
            break;
        case 'Accepted':
            styles = 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700/50';
            Icon = CheckCircle;
            break;
        case 'Rejected':
            styles = 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700/50';
            Icon = XCircle;
            break;
        case 'Resolved':
            styles = 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-700/50';
            Icon = Star;
            break;
        case 'Reunited':
            styles = 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/50 dark:text-cyan-300 dark:border-cyan-700/50';
            Icon = Heart;
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


// --- Main Component ---
const AdminLostRequests: React.FC = () => {
  const [reports, setReports] = useState<UILostPetReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<UILostPetReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    petName: '',
    user: '',
    location: '',
    petType: 'all',
    status: 'all',
  });

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const apiReports = await apiService.getAdminLostPets();
      const mappedReports = apiReports.map(mapApiToUi);
      setReports(mappedReports);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
      setError(`Failed to load reports: ${(err as Error).message}.`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);


  const handleSaveChanges = async (updatedReport: UILostPetReport) => {
    setSelectedReport(null);
    setIsLoading(true);
    setError(null);

    try {
        const apiUpdateData: Partial<PetReport> = {
            report_status: updatedReport.status as PetReport['report_status'],
            is_resolved: updatedReport.status === 'Resolved' || updatedReport.status === 'Reunited',
        };

        await apiService.updatePetReport(updatedReport.id, apiUpdateData);
        fetchReports();

    } catch (err) {
        console.error("Update failed:", err);
        setError(`Failed to update report ${updatedReport.id}: ${(err as Error).message}`);
        setIsLoading(false);
    }
  };


  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const filteredReports = useMemo(() => {
    return reports.filter(rep => {
      return (
        rep.petName.toLowerCase().includes(filters.petName.toLowerCase()) &&
        rep.user.toLowerCase().includes(filters.user.toLowerCase()) &&
        rep.location.toLowerCase().includes(filters.location.toLowerCase()) &&
        (filters.petType === 'all' || rep.petType === filters.petType) &&
        (filters.status === 'all' || rep.status === filters.status)
      );
    });
  }, [reports, filters]);

  const stats = useMemo(() => ({
    total: reports.length,
    pending: reports.filter(r => r.status === 'Pending').length,
    accepted: reports.filter(r => r.status === 'Accepted').length,
    rejected: reports.filter(r => r.status === 'Rejected').length,
    resolved: reports.filter(r => r.status === 'Resolved').length,
    reunited: reports.filter(r => r.status === 'Reunited').length,
  }), [reports]);

  if (isLoading) return (
    <div className="flex items-center justify-center h-screen p-6 bg-light-primary dark:bg-dark-background">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-light-accent dark:border-dark-accent"></div>
    </div>
  );

  return (
    <div className="min-h-screen p-6 bg-light-primary dark:bg-dark-background theme-transition">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-light-text dark:text-dark-secondary">
          Lost Pet Dashboard
        </h1>
        <p className="mt-2 text-light-secondary dark:text-dark-neutral">
          Monitor and manage lost pet reports
        </p>
      </div>

      {error && (
        <div className="my-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-600/50 rounded-lg flex items-center">
          <AlertTriangle className="w-5 h-5 mr-3 text-red-600 dark:text-red-400" />
          <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 my-6">
        <div className="bg-light-neutral dark:bg-dark-primary rounded-lg shadow-lg p-6 text-center">
            <p className="text-sm font-medium text-light-secondary dark:text-dark-neutral">Total Reports</p>
            <p className="text-3xl font-bold text-light-text dark:text-dark-secondary">{stats.total}</p>
        </div>
        <div className="bg-light-neutral dark:bg-dark-primary rounded-lg shadow-lg p-6 text-center">
            <p className="text-sm font-medium text-light-secondary dark:text-dark-neutral">Pending</p>
            <p className="text-3xl font-bold text-light-text dark:text-dark-secondary">{stats.pending}</p>
        </div>
        <div className="bg-light-neutral dark:bg-dark-primary rounded-lg shadow-lg p-6 text-center">
            <p className="text-sm font-medium text-light-secondary dark:text-dark-neutral">Accepted</p>
            <p className="text-3xl font-bold text-light-text dark:text-dark-secondary">{stats.accepted}</p>
        </div>
        <div className="bg-light-neutral dark:bg-dark-primary rounded-lg shadow-lg p-6 text-center">
            <p className="text-sm font-medium text-light-secondary dark:text-dark-neutral">Rejected</p>
            <p className="text-3xl font-bold text-light-text dark:text-dark-secondary">{stats.rejected}</p>
        </div>
        <div className="bg-light-neutral dark:bg-dark-primary rounded-lg shadow-lg p-6 text-center">
            <p className="text-sm font-medium text-light-secondary dark:text-dark-neutral">Resolved</p>
            <p className="text-3xl font-bold text-light-text dark:text-dark-secondary">{stats.resolved}</p>
        </div>
        <div className="bg-light-neutral dark:bg-dark-primary rounded-lg shadow-lg p-6 text-center">
            <p className="text-sm font-medium text-light-secondary dark:text-dark-neutral">Reunited</p>
            <p className="text-3xl font-bold text-light-text dark:text-dark-secondary">{stats.reunited}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-light-neutral dark:bg-dark-primary rounded-lg shadow-lg p-4 mb-6 border border-light-secondary/10 dark:border-dark-secondary/20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div><label className="block text-sm font-medium mb-1 text-light-text dark:text-dark-neutral">Pet Name</label><input type="text" name="petName" value={filters.petName} onChange={handleFilterChange} placeholder="Search..." className="w-full p-2 rounded border bg-light-primary/50 text-light-text placeholder:text-light-text/60 border-light-secondary/20 focus:ring-light-accent focus:border-light-accent dark:bg-dark-background dark:text-dark-secondary dark:placeholder:text-dark-neutral dark:border-dark-primary" /></div>
          <div><label className="block text-sm font-medium mb-1 text-light-text dark:text-dark-neutral">User</label><input type="text" name="user" value={filters.user} onChange={handleFilterChange} placeholder="Search..." className="w-full p-2 rounded border bg-light-primary/50 text-light-text placeholder:text-light-text/60 border-light-secondary/20 focus:ring-light-accent focus:border-light-accent dark:bg-dark-background dark:text-dark-secondary dark:placeholder:text-dark-neutral dark:border-dark-primary" /></div>
          <div><label className="block text-sm font-medium mb-1 text-light-text dark:text-dark-neutral">Location</label><input type="text" name="location" value={filters.location} onChange={handleFilterChange} placeholder="Search..." className="w-full p-2 rounded border bg-light-primary/50 text-light-text placeholder:text-light-text/60 border-light-secondary/20 focus:ring-light-accent focus:border-light-accent dark:bg-dark-background dark:text-dark-secondary dark:placeholder:text-dark-neutral dark:border-dark-primary" /></div>
          <div><label className="block text-sm font-medium mb-1 text-light-text dark:text-dark-neutral">Pet Type</label><select name="petType" value={filters.petType} onChange={handleFilterChange} className="w-full p-2 rounded border bg-light-primary/50 text-light-text border-light-secondary/20 focus:ring-light-accent focus:border-light-accent dark:bg-dark-background dark:text-dark-secondary dark:border-dark-primary"><option value="all">All</option><option value="Dog">Dog</option><option value="Cat">Cat</option><option value="Other">Other</option></select></div>
          <div><label className="block text-sm font-medium mb-1 text-light-text dark:text-dark-neutral">Status</label><select name="status" value={filters.status} onChange={handleFilterChange} className="w-full p-2 rounded border bg-light-primary/50 text-light-text border-light-secondary/20 focus:ring-light-accent focus:border-light-accent dark:bg-dark-background dark:text-dark-secondary dark:border-dark-primary"><option value="all">All</option><option value="Pending">Pending</option><option value="Accepted">Accepted</option><option value="Resolved">Resolved</option><option value="Reunited">Reunited</option><option value="Rejected">Rejected</option></select></div>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-light-neutral dark:bg-dark-primary rounded-lg shadow-lg p-6 overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-light-primary dark:border-dark-secondary/30">
              <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-light-secondary dark:text-dark-neutral">Pet Name</th>
              <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-light-secondary dark:text-dark-neutral">User</th>
              <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-light-secondary dark:text-dark-neutral">Last Seen Location</th>
              <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-light-secondary dark:text-dark-neutral">Pet Type</th>
              <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-light-secondary dark:text-dark-neutral">Breed</th>
              <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-light-secondary dark:text-dark-neutral">Status</th>
              <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-light-secondary dark:text-dark-neutral">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.length > 0 ? (
              filteredReports.map((rep) => (
                <tr key={rep.id} className="border-b border-light-primary dark:border-dark-secondary/20 hover:bg-light-primary/50 dark:hover:bg-dark-background">
                  <td className="py-3 px-4 text-light-text dark:text-dark-secondary">{rep.petName}</td>
                  <td className="py-3 px-4 text-light-text dark:text-dark-secondary">{rep.user}</td>
                  <td className="py-3 px-4 text-light-text dark:text-dark-secondary">{rep.location}</td>
                  <td className="py-3 px-4 text-light-text dark:text-dark-secondary">{rep.petType}</td>
                  <td className="py-3 px-4 text-light-text dark:text-dark-secondary">{rep.breed}</td>
                  <td className="py-3 px-4"><StatusBadge status={rep.status} /></td>
                  <td className="py-3 px-4">
                    <button onClick={() => setSelectedReport(rep)} className="p-1 rounded-full text-light-secondary hover:bg-light-primary dark:text-dark-neutral dark:hover:bg-dark-background">
                      <Edit2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={7} className="text-center py-4 text-light-secondary dark:text-dark-neutral">No lost pet reports found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {selectedReport && (
        <EditFormModal report={selectedReport} onClose={() => setSelectedReport(null)} onSave={handleSaveChanges} />
      )}
    </div>
  );
};

const EditFormModal = ({ report, onClose, onSave }: { report: UILostPetReport, onClose: () => void, onSave: (rep: UILostPetReport) => void }) => {
    const [formData, setFormData] = useState<UILostPetReport>(report);

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFormData({ ...formData, status: e.target.value as UILostPetReport['status'] });
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <div className="w-full max-w-3xl rounded-lg shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto bg-light-neutral dark:bg-dark-primary border-t-4 border-light-accent dark:border-dark-accent" onClick={(e) => e.stopPropagation()}>
          <button onClick={onClose} className="absolute top-4 right-4 text-light-secondary hover:text-light-accent dark:text-dark-neutral dark:hover:text-dark-secondary">
            <X size={24} />
          </button>

          <div className="mb-4">
            <h3 className="text-2xl font-bold text-light-text dark:text-dark-secondary">Review Lost Report ID: {formData.id}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="md:col-span-1">
                <div className="w-full h-auto aspect-square bg-light-primary dark:bg-dark-background rounded-lg flex items-center justify-center">
                    {formData.imageUrl ? (
                        <img src={formData.imageUrl} alt={formData.petName} className="w-full h-full object-cover rounded-lg shadow-md" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                        <p className="text-light-secondary dark:text-dark-neutral">No Image</p>
                    )}
                </div>
                <div className="mt-4 text-light-text dark:text-dark-secondary">
                    <h4 className="font-bold text-lg">{formData.petName}</h4>
                    <p className="text-sm text-light-secondary dark:text-dark-neutral"><span className="font-medium text-light-text dark:text-dark-secondary">Type:</span> {formData.petType}</p>
                    <p className="text-sm text-light-secondary dark:text-dark-neutral"><span className="font-medium text-light-text dark:text-dark-secondary">Breed:</span> {formData.breed}</p>
                </div>
            </div>
            <div className="md:col-span-1">
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-light-text dark:text-dark-neutral">Reported By</label><input type="text" value={formData.user} disabled className="w-full mt-1 p-2 rounded border bg-light-primary/50 text-light-secondary dark:bg-dark-background dark:text-dark-neutral border-light-secondary/20 dark:border-dark-primary disabled:cursor-not-allowed" /></div>
                <div><label className="block text-sm font-medium text-light-text dark:text-dark-neutral">Last Seen Location</label><input type="text" value={formData.location} disabled className="w-full mt-1 p-2 rounded border bg-light-primary/50 text-light-secondary dark:bg-dark-background dark:text-dark-neutral border-light-secondary/20 dark:border-dark-primary disabled:cursor-not-allowed" /></div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium mb-1 text-light-text dark:text-dark-neutral">Update Status</label>
                  <select id="status" name="status" value={formData.status} onChange={handleStatusChange} className="w-full p-2 rounded border bg-light-primary/50 text-light-text border-light-secondary/20 focus:ring-light-accent focus:border-light-accent dark:bg-dark-background dark:text-dark-secondary dark:border-dark-primary">
                    <option value="Pending">Pending</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Reunited">Reunited</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 p-4 rounded-lg text-sm bg-light-primary dark:bg-dark-background">
                <h5 className="font-semibold mb-2 text-light-text dark:text-dark-secondary">Audit Information</h5>
                <p className="text-light-secondary dark:text-dark-neutral">Created by: {formData.createdBy}</p>
                <p className="text-light-secondary dark:text-dark-neutral">Last Updated: {formData.modifiedBy}</p>
              </div>
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

export default AdminLostRequests;