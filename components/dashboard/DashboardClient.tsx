'use client';
import { useEffect, useState } from 'react';
import { Client, User } from '@/types';
import { getClients, getFolders } from '@/lib/api';

interface DashboardClientProps {
  user: User;
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [folderCount, setFolderCount] = useState(0);

  useEffect(() => {
    getClients()
      .then(setClients)
      .catch(err => console.error('Failed to load clients:', err));
    getFolders()
      .then(folders => setFolderCount(folders.length))
      .catch(err => console.error('Failed to load folders:', err));
  }, []);

  const stats = [
    { label: 'Total Clients', value: clients.length, icon: '👥', color: '#1B3A6B' },
    { label: 'Report Folders', value: folderCount, icon: '📁', color: '#C9A84C' },
    { label: 'Active Sessions', value: 1, icon: '🟢', color: '#16a34a' },
    { label: 'Role', value: user.role.charAt(0).toUpperCase() + user.role.slice(1), icon: '👤', color: '#6366f1' },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user.username}!</h1>
        <p className="text-gray-500 mt-1">Here&apos;s your content system overview.</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map(stat => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{stat.icon}</span>
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: stat.color }}
              />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Active clients */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Active Clients</h2>
        </div>
        {clients.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <div className="text-4xl mb-3">👥</div>
            <p>No clients yet. <a href="/clients" className="underline" style={{ color: '#1B3A6B' }}>Add your first client</a></p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {clients.map(client => (
              <div key={client.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <div className="font-medium text-gray-900">{client.name}</div>
                  <div className="text-sm text-gray-500">{client.niche} • {client.website}</div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full font-medium text-white" style={{ background: '#1B3A6B' }}>
                  Active
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
