import React, { useState, useEffect, useRef } from 'react';
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Filter,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { apiService } from '../../services/api';
import type { AdminUser } from '../../services/api';

type ExtendedAdminUser = AdminUser & {
  profile_image?: string | null;
  phone?: string | null;
  address?: string | null;
  gender?: string | null;
  created_at?: string | null;
};

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<ExtendedAdminUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const [genderFilter, setGenderFilter] = useState<string>('');
  const [superuserFilter, setSuperuserFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const filtersRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [genderFilter, superuserFilter]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string> = {};
      if (genderFilter) params.gender = genderFilter;
      if (superuserFilter) params.superuser = superuserFilter;

      const data: any = await apiService.getAdminUsers(params);

      let items: ExtendedAdminUser[] = [];
      if (Array.isArray(data)) items = data as ExtendedAdminUser[];
      else if (data && Array.isArray((data as any).results)) items = (data as any).results as ExtendedAdminUser[];
      else {
        console.warn('Unexpected users response shape:', data);
        items = [];
      }

      setUsers(items);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      (u.username ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-light-primary dark:bg-dark-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-light-accent dark:border-dark-accent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10 space-y-6 p-6 bg-light-primary dark:bg-dark-background theme-transition">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-light-text dark:text-dark-secondary">
            Users Management
          </h1>
          <p className="mt-2 text-light-secondary dark:text-dark-neutral">
            Manage registered users on the platform
          </p>
        </div>
        <div className="bg-light-accent/10 text-light-accent dark:bg-dark-accent/10 dark:text-dark-accent px-4 py-2 rounded-lg font-medium">
          Total Users: {users.length}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-600/50 rounded-lg flex items-center">
            <AlertTriangle className="w-5 h-5 mr-3 text-red-600 dark:text-red-400" />
            <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Search + Filters */}
      <div className="bg-light-neutral dark:bg-dark-primary rounded-lg shadow p-4 border border-light-secondary/10 dark:border-dark-secondary/20 flex items-center gap-3 relative">
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 rounded-xl bg-light-primary/50 text-light-text placeholder:text-light-text/60 border border-light-secondary/20 focus:ring-2 focus:ring-light-accent focus:border-light-accent dark:bg-dark-background dark:text-dark-secondary dark:placeholder:text-dark-neutral dark:border-dark-primary"
        />

        <div className="relative">
          <button
            onClick={() => setShowFilters((s) => !s)}
            className="ml-3 inline-flex items-center gap-2 px-3 py-2 border rounded-xl transition-colors bg-light-primary text-light-secondary border-light-secondary/20 hover:bg-light-secondary/10 dark:bg-dark-background dark:text-dark-neutral dark:border-dark-primary dark:hover:bg-dark-primary/50"
            aria-expanded={showFilters}
            aria-haspopup="true"
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm">Filters</span>
          </button>

          {showFilters && (
            <div ref={filtersRef} className="absolute right-0 mt-2 w-72 rounded-lg shadow-lg border p-4 z-40 bg-light-neutral dark:bg-dark-primary border-light-secondary/20 dark:border-dark-primary">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-light-text dark:text-dark-secondary">Filters</h4>
                <button
                  onClick={() => {
                    setGenderFilter('');
                    setSuperuserFilter('');
                  }}
                  className="text-xs text-light-accent dark:text-dark-accent hover:underline"
                >
                  Clear
                </button>
              </div>

              <div className="space-y-3">
                {/* Gender */}
                <div>
                  <label className="text-xs font-medium flex items-center gap-2 mb-1 text-light-text dark:text-dark-neutral">
                    <UserIcon className="w-4 h-4" />
                    Gender
                  </label>
                  <select
                    value={genderFilter}
                    onChange={(e) => setGenderFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 bg-light-primary/50 text-light-text border-light-secondary/20 focus:ring-light-accent dark:bg-dark-background dark:text-dark-secondary dark:border-dark-primary"
                  >
                    <option value="">All</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Role */}
                <div>
                  <label className="text-xs font-medium flex items-center gap-2 mb-1 text-light-text dark:text-dark-neutral">
                    <Users className="w-4 h-4" />
                    Role
                  </label>
                  <select
                    value={superuserFilter}
                    onChange={(e) => setSuperuserFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 bg-light-primary/50 text-light-text border-light-secondary/20 focus:ring-light-accent dark:bg-dark-background dark:text-dark-secondary dark:border-dark-primary"
                  >
                    <option value="">All</option>
                    <option value="true">Admin</option>
                    <option value="false">User</option>
                  </select>
                </div>

                <div className="flex justify-end mt-2">
                  <button className="px-3 py-1 rounded-lg text-sm font-semibold transition-transform bg-light-accent text-light-neutral dark:bg-dark-accent dark:text-dark-secondary hover:opacity-90" onClick={() => setShowFilters(false)}>
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((u) => (
          <div key={u.id} className="bg-light-neutral dark:bg-dark-primary rounded-lg shadow-lg p-6 border border-light-secondary/10 dark:border-dark-secondary/20 hover:shadow-xl hover:border-light-accent/50 dark:hover:border-dark-accent/50 transition-all duration-300 relative group cursor-pointer">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-r from-light-secondary to-light-accent dark:from-dark-primary dark:to-dark-accent rounded-full flex items-center justify-center overflow-hidden shadow-lg border-2 border-light-neutral dark:border-dark-primary group-hover:scale-110 transition-transform">
                {u.profile_image ? (
                  <img src={apiService.getImageUrl(u.profile_image)} alt={u.username} className="w-14 h-14 rounded-full object-cover" />
                ) : (
                  <UserIcon className="w-7 h-7 text-light-neutral dark:text-dark-secondary" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-lg text-light-text dark:text-dark-secondary group-hover:text-light-accent dark:group-hover:text-dark-accent transition-colors">
                  {u.username}
                </h3>
                <p className="text-light-secondary dark:text-dark-neutral text-sm">{u.gender ?? 'Not specified'}</p>
              </div>
            </div>

            <div className="space-y-2 text-light-secondary dark:text-dark-neutral">
              <div className="flex items-center space-x-2 text-sm">
                <Mail className="w-4 h-4" />
                <span>{u.email}</span>
              </div>
              {u.phone && (
                <div className="flex items-center space-x-2 text-sm">
                  <Phone className="w-4 h-4" />
                  <span>{u.phone}</span>
                </div>
              )}
              {u.address && (
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>{u.address}</span>
                </div>
              )}
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="w-4 h-4" />
                <span>Joined {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Unknown'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && !error && (
        <div className="text-center py-12 bg-light-neutral dark:bg-dark-primary rounded-lg">
          <UserIcon className="w-14 h-14 mx-auto mb-4 text-light-secondary/20 dark:text-dark-secondary/20" />
          <h3 className="text-light-text dark:text-dark-secondary text-xl font-bold mb-2">No users found</h3>
          <p className="text-light-secondary dark:text-dark-neutral">Try adjusting your filters or search terms.</p>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;