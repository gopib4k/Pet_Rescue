import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { apiService } from '../../services/api';
import type { AdminUserReport } from '../../services/api';
import toast, { Toaster } from 'react-hot-toast';
import { Edit2, X, AlertTriangle, Clock, CheckCircle, XCircle, Star, Heart } from 'lucide-react';

// --- Playful Status Badge Component ---
const StatusBadge: React.FC<{ status: AdminUserReport['report_status'] }> = ({ status }) => {
    let styles = '';
    let Icon = Clock;

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

const AdminUserReports: React.FC = () => {
    const [reports, setReports] = useState<AdminUserReport[]>([]);
    const [selectedReport, setSelectedReport] = useState<AdminUserReport | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [filters, setFilters] = useState({
        petName: '',
        requesterEmail: '',
        status: 'all',
    });

    const fetchUserReports = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiService.getAdminUserReports();
            setReports(data);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch user reports.');
            toast.error('Failed to fetch user reports.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
      fetchUserReports();
    }, [fetchUserReports]);

    const handleSaveChanges = async (updatedReport: AdminUserReport) => {
        const originalReport = reports.find(r => r.id === updatedReport.id);
        if (originalReport?.report_status === updatedReport.report_status) {
            setSelectedReport(null);
            return;
        }

        const promise = apiService.updateUserReportStatus(updatedReport.id, updatedReport.report_status);
        
        toast.promise(promise, {
            loading: 'Saving changes...',
            success: (savedReport) => {
                setReports(prevReports =>
                    prevReports.map(req => req.id === savedReport.id ? savedReport : req)
                );
                setSelectedReport(null);
                return `Status for report #${savedReport.id} updated successfully!`;
            },
            error: 'Failed to update status. Please try again.',
        });
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const filteredReports = useMemo(() => {
        return reports.filter(req =>
            (req.pet_report?.pet?.name || '').toLowerCase().includes(filters.petName.toLowerCase()) &&
            (req.created_by?.email || '').toLowerCase().includes(filters.requesterEmail.toLowerCase()) &&
            (filters.status === 'all' || req.report_status === filters.status)
        );
    }, [reports, filters]);

    const stats = useMemo(() => ({
        total: reports.length,
        pending: reports.filter(r => r.report_status === 'Pending').length,
        accepted: reports.filter(r => r.report_status === 'Accepted').length,
        reunited: reports.filter(r => r.report_status === 'Reunited').length,
        resolved: reports.filter(r => r.report_status === 'Resolved').length,
        rejected: reports.filter(r => r.report_status === 'Rejected').length,
    }), [reports]);

    if (loading) return (
      <div className="flex items-center justify-center h-screen p-6 bg-light-primary dark:bg-dark-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-light-accent dark:border-dark-accent"></div>
      </div>
    );
    
    return (
        <div className="min-h-screen p-6 bg-light-primary dark:bg-dark-background theme-transition">
            <Toaster position="top-center" reverseOrder={false} />
            <div>
                <h1 className="text-3xl font-bold text-light-text dark:text-dark-secondary">
                    User Reports Dashboard
                </h1>
                <p className="mt-2 text-light-secondary dark:text-dark-neutral">
                    Manage user-submitted reports on pets
                </p>
            </div>

            {/* Adjusted grid for better responsiveness */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 my-6">
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
                    <p className="text-sm font-medium text-light-secondary dark:text-dark-neutral">Reunited</p>
                    <p className="text-3xl font-bold text-light-text dark:text-dark-secondary">{stats.reunited}</p>
                </div>
                <div className="bg-light-neutral dark:bg-dark-primary rounded-lg shadow-lg p-6 text-center">
                    <p className="text-sm font-medium text-light-secondary dark:text-dark-neutral">Resolved</p>
                    <p className="text-3xl font-bold text-light-text dark:text-dark-secondary">{stats.resolved}</p>
                </div>
                <div className="bg-light-neutral dark:bg-dark-primary rounded-lg shadow-lg p-6 text-center">
                    <p className="text-sm font-medium text-light-secondary dark:text-dark-neutral">Rejected</p>
                    <p className="text-3xl font-bold text-light-text dark:text-dark-secondary">{stats.rejected}</p>
                </div>
            </div>

            <div className="bg-light-neutral dark:bg-dark-primary rounded-lg shadow-lg p-4 mb-6 border border-light-secondary/10 dark:border-dark-secondary/20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div><label className="block text-sm font-medium mb-1 text-light-text dark:text-dark-neutral">Pet Name</label><input type="text" name="petName" value={filters.petName} onChange={handleFilterChange} placeholder="Search..." className="w-full p-2 rounded border bg-light-primary/50 text-light-text placeholder:text-light-text/60 border-light-secondary/20 focus:ring-light-accent focus:border-light-accent dark:bg-dark-background dark:text-dark-secondary dark:placeholder:text-dark-neutral dark:border-dark-primary" /></div>
                    <div><label className="block text-sm font-medium mb-1 text-light-text dark:text-dark-neutral">Requester Email</label><input type="text" name="requesterEmail" value={filters.requesterEmail} onChange={handleFilterChange} placeholder="Search..." className="w-full p-2 rounded border bg-light-primary/50 text-light-text placeholder:text-light-text/60 border-light-secondary/20 focus:ring-light-accent focus:border-light-accent dark:bg-dark-background dark:text-dark-secondary dark:placeholder:text-dark-neutral dark:border-dark-primary" /></div>
                    <div><label className="block text-sm font-medium mb-1 text-light-text dark:text-dark-neutral">Status</label><select name="status" value={filters.status} onChange={handleFilterChange} className="w-full p-2 rounded border bg-light-primary/50 text-light-text border-light-secondary/20 focus:ring-light-accent focus:border-light-accent dark:bg-dark-background dark:text-dark-secondary dark:border-dark-primary"><option value="all">All</option><option value="Pending">Pending</option><option value="Accepted">Accepted</option><option value="Reunited">Reunited</option><option value="Resolved">Resolved</option><option value="Rejected">Rejected</option></select></div>
                </div>
            </div>

            <div className="bg-light-neutral dark:bg-dark-primary rounded-lg shadow-lg overflow-hidden border border-light-secondary/10 dark:border-dark-secondary/20">
                <div className="overflow-x-auto">
                    {error && <p className="p-6 text-red-500 dark:text-red-400 font-semibold">Error: {error}</p>}
                    <table className="w-full table-fixed">
                        <thead>
                            <tr className="border-b border-light-primary dark:border-dark-secondary/30 bg-light-primary/20 dark:bg-dark-background/20">
                                <th className="w-1/6 p-4 text-left text-xs font-semibold uppercase tracking-wider text-light-secondary dark:text-dark-neutral">Pet Name</th>
                                <th className="w-[12%] p-4 text-left text-xs font-semibold uppercase tracking-wider text-light-secondary dark:text-dark-neutral">Report Type</th>
                                <th className="w-1/4 p-4 text-left text-xs font-semibold uppercase tracking-wider text-light-secondary dark:text-dark-neutral">Pet Reported By</th>
                                <th className="w-1/4 p-4 text-left text-xs font-semibold uppercase tracking-wider text-light-secondary dark:text-dark-neutral">Requester</th>
                                <th className="w-1/6 p-4 text-left text-xs font-semibold uppercase tracking-wider text-light-secondary dark:text-dark-neutral">Message</th>
                                <th className="w-32 p-4 text-left text-xs font-semibold uppercase tracking-wider text-light-secondary dark:text-dark-neutral">Status</th>
                                <th className="w-20 p-4 text-left text-xs font-semibold uppercase tracking-wider text-light-secondary dark:text-dark-neutral">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-light-primary dark:divide-dark-secondary/20">
                            {filteredReports.length > 0 ? (
                                filteredReports.map((req) => (
                                    <tr key={req.id} className="hover:bg-light-primary/50 dark:hover:bg-dark-background">
                                        <td className="p-4 text-light-text dark:text-dark-secondary truncate" title={req.pet_report?.pet?.name}>{req.pet_report?.pet?.name || 'N/A'}</td>
                                        <td className="p-4 text-light-text dark:text-dark-secondary">{req.report_type}</td>
                                        <td className="p-4 text-light-text dark:text-dark-secondary truncate" title={req.pet_report_creator?.email}>{req.pet_report_creator?.email || 'N/A'}</td>
                                        <td className="p-4 text-light-text dark:text-dark-secondary truncate" title={req.created_by?.email}>{req.created_by?.email || 'N/A'}</td>
                                        <td className="p-4 text-light-text dark:text-dark-secondary truncate" title={req.message}>{req.message}</td>
                                        <td className="p-4"><StatusBadge status={req.report_status} /></td>
                                        <td className="p-4">
                                            <button onClick={() => setSelectedReport(req)} className="p-1 rounded-full text-light-secondary hover:bg-light-primary dark:text-dark-neutral dark:hover:bg-dark-background">
                                                <Edit2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={7} className="text-center py-8 text-light-secondary dark:text-dark-neutral">No user reports found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedReport && (
                <ReportReviewModal
                    report={selectedReport}
                    onClose={() => setSelectedReport(null)}
                    onSave={handleSaveChanges}
                />
            )}
        </div>
    );
};

const ReportReviewModal = ({ report, onClose, onSave }: { report: AdminUserReport, onClose: () => void, onSave: (req: AdminUserReport) => void }) => {
    const [formData, setFormData] = useState<AdminUserReport>(report);
    const modalRef = useRef<HTMLDivElement>(null);

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
        setFormData({ ...formData, report_status: e.target.value as AdminUserReport['report_status'] });
    };
    
    const formatDate = (dateString: string | undefined) => dateString ? new Date(dateString).toLocaleString() : 'N/A';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div ref={modalRef} className="w-full max-w-3xl rounded-lg shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto bg-light-neutral dark:bg-dark-primary border-t-4 border-light-accent dark:border-dark-accent" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-light-secondary hover:text-light-accent dark:text-dark-neutral dark:hover:text-dark-secondary">
                    <X size={24} />
                </button>

                <div className="mb-4">
                    <h3 className="text-2xl font-bold text-light-text dark:text-dark-secondary">Review Report: {formData.pet_report?.pet?.name || 'N/A'}</h3>
                </div>

                <div className="space-y-4">
                    <div><label className="block text-sm font-medium text-light-text dark:text-dark-neutral">Pet Reported By</label><input type="text" value={`${formData.pet_report_creator?.email || 'N/A'} (Original Status: ${formData.pet_report?.pet_status || 'N/A'})`} disabled className="w-full mt-1 p-2 rounded border bg-light-primary/50 text-light-secondary dark:bg-dark-background dark:text-dark-neutral border-light-secondary/20 dark:border-dark-primary disabled:cursor-not-allowed" /></div>
                    <div><label className="block text-sm font-medium text-light-text dark:text-dark-neutral">Requester ({formData.report_type})</label><input type="text" value={`${formData.created_by?.username || 'N/A'} (${formData.created_by?.email || 'N/A'})`} disabled className="w-full mt-1 p-2 rounded border bg-light-primary/50 text-light-secondary dark:bg-dark-background dark:text-dark-neutral border-light-secondary/20 dark:border-dark-primary disabled:cursor-not-allowed" /></div>
                    <div><label className="block text-sm font-medium text-light-text dark:text-dark-neutral">Message from Requester</label><textarea value={formData.message} disabled className="w-full min-h-[100px] mt-1 p-2 rounded border bg-light-primary/50 text-light-secondary dark:bg-dark-background dark:text-dark-neutral border-light-secondary/20 dark:border-dark-primary disabled:cursor-not-allowed" /></div>
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium mb-1 text-light-text dark:text-dark-neutral">Update Request Status</label>
                        <select id="status" name="status" value={formData.report_status} onChange={handleStatusChange} className="w-full p-2 rounded border bg-light-primary/50 text-light-text border-light-secondary/20 focus:ring-light-accent focus:border-light-accent dark:bg-dark-background dark:text-dark-secondary dark:border-dark-primary">
                            <option value="Pending">Pending</option>
                            <option value="Accepted">Accepted</option>
                            <option value="Reunited">Reunited</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-light-primary dark:border-dark-secondary/30">
                    <div className="text-sm text-light-secondary dark:text-dark-neutral">
                        <div><strong>Created:</strong> {formatDate(formData.created_date)} by {formData.created_by?.username || 'N/A'}</div>
                        <div><strong>Updated:</strong> {formatDate(formData.modified_date)} by {formData.modified_by?.username || 'N/A'}</div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => onSave(formData)} className="px-4 py-2 rounded-lg font-semibold transition-colors bg-green-600 hover:bg-green-700 text-white">
                            Save Changes
                        </button>
                        <button onClick={onClose} className="px-4 py-2 rounded-lg font-semibold transition-colors bg-light-secondary/80 hover:bg-light-secondary text-light-neutral dark:bg-dark-neutral/80 dark:hover:bg-dark-neutral dark:text-dark-background">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminUserReports;