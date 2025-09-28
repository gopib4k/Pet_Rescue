import React, { useState, useEffect } from 'react';
import { Users, Heart, AlertCircle, Search, UserPlus, CheckCircle } from 'lucide-react';
import { apiService } from '../../services/api';

interface Stats {
  totalUsers: number;
  totalPets: number;
  lostRequests: number;
  foundRequests: number;
  adoptRequests: number;
  resolvedCases: number;
}

const AdminOverview: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalPets: 0,
    lostRequests: 0,
    foundRequests: 0,
    adoptRequests: 0,
    resolvedCases: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      // Fetch various stats from different endpoints
      const [users, pets, reports, adoptions] = await Promise.all([
        apiService.getProfiles(),
        apiService.getPets(),
        apiService.getPetReports(),
        apiService.getPetAdoptions(),
      ]);

      const lostReports = reports.filter(r => r.pet_status === 'Lost');
      const foundReports = reports.filter(r => r.pet_status === 'Found');
      const resolvedReports = reports.filter(r => r.is_resolved);

      setStats({
        totalUsers: users.length,
        totalPets: pets.length,
        lostRequests: lostReports.length,
        foundRequests: foundReports.length,
        adoptRequests: adoptions.length,
        resolvedCases: resolvedReports.length,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      bgColor: 'bg-light-secondary/10 dark:bg-dark-secondary/10',
      textColor: 'text-light-secondary dark:text-dark-secondary'
    },
    {
      title: 'Total Pets',
      value: stats.totalPets,
      icon: Heart,
      bgColor: 'bg-light-accent/10 dark:bg-dark-accent/10',
      textColor: 'text-light-accent dark:text-dark-accent'
    },
    {
      title: 'Lost Requests',
      value: stats.lostRequests,
      icon: AlertCircle,
      bgColor: 'bg-light-text/10 dark:bg-dark-neutral/10',
      textColor: 'text-light-text dark:text-dark-neutral'
    },
    {
      title: 'Found Requests',
      value: stats.foundRequests,
      icon: Search,
      bgColor: 'bg-light-text/10 dark:bg-dark-neutral/10',
      textColor: 'text-light-text dark:text-dark-neutral'
    },
    {
      title: 'Adopt Requests',
      value: stats.adoptRequests,
      icon: UserPlus,
      bgColor: 'bg-light-secondary/10 dark:bg-dark-secondary/10',
      textColor: 'text-light-secondary dark:text-dark-secondary'
    },
    {
      title: 'Resolved Cases',
      value: stats.resolvedCases,
      icon: CheckCircle,
      bgColor: 'bg-light-accent/10 dark:bg-dark-accent/10',
      textColor: 'text-light-accent dark:text-dark-accent'
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-light-accent dark:border-dark-accent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-h-screen p-6 bg-light-neutral dark:bg-dark-background theme-transition">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-light-text dark:text-dark-secondary">
          Admin Overview
        </h1>
        <p className="mt-2 text-light-secondary dark:text-dark-neutral">
          Monitor and manage your pet rescue platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-light-primary dark:bg-dark-primary rounded-lg shadow-lg p-6 border border-light-secondary/5 dark:border-dark-secondary/20 hover:shadow-xl hover:border-light-accent/50 dark:hover:border-dark-accent/50 transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-light-secondary dark:text-dark-neutral mb-1">{card.title}</p>
                  <p className="text-3xl font-bold text-light-text dark:text-dark-secondary">{card.value}</p>
                </div>
                <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${card.textColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-light-primary dark:bg-dark-primary rounded-lg shadow-lg p-6 border border-light-secondary/5 dark:border-dark-secondary/20">
        <h2 className="text-xl font-semibold text-light-text dark:text-dark-secondary mb-4">Platform Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="font-medium text-light-text dark:text-dark-secondary">Success Rate</h3>
            <div className="w-full bg-light-neutral dark:bg-dark-background rounded-full h-2.5">
              <div 
                className="bg-light-accent dark:bg-dark-accent h-2.5 rounded-full" 
                style={{ width: `${stats.resolvedCases > 0 ? (stats.resolvedCases / (stats.lostRequests + stats.foundRequests)) * 100 : 0}%` }}
              ></div>
            </div>
            <p className="text-sm text-light-secondary dark:text-dark-neutral">{stats.resolvedCases} cases resolved</p>
          </div>
          <div className="space-y-3">
            <h3 className="font-medium text-light-text dark:text-dark-secondary">Platform Activity</h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-light-secondary dark:text-dark-neutral">Active</span>
              </div>
              <div className="text-sm text-light-secondary dark:text-dark-neutral">{stats.totalUsers} registered users</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;