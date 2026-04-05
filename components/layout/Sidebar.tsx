'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User } from '@/types';

interface SidebarProps {
  user: User;
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/content-generator', label: 'Content Generator', icon: '✍️' },
  { href: '/clients', label: 'Clients', icon: '👥' },
  { href: '/reports', label: 'Reports', icon: '📁' },
  { href: '/settings', label: 'Settings', icon: '⚙️', adminOnly: true },
];

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const visibleItems = navItems.filter(item => !item.adminOnly || user.role === 'admin');

  return (
    <div className="flex flex-col h-full" style={{ background: '#1B3A6B' }}>
      {/* Logo */}
      <div className="p-6 border-b border-blue-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-lg" style={{ background: '#C9A84C' }}>
            IM
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">IM Content</div>
            <div className="text-blue-300 text-xs">System</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {visibleItems.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'text-white'
                  : 'text-blue-200 hover:text-white hover:bg-blue-800'
              }`}
              style={isActive ? { background: '#C9A84C' } : {}}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="p-4 border-t border-blue-800">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: '#C9A84C' }}>
            {user.username[0].toUpperCase()}
          </div>
          <div>
            <div className="text-white text-sm font-medium">{user.username}</div>
            <div className="text-blue-300 text-xs capitalize">{user.role}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 text-blue-200 hover:text-white hover:bg-blue-800 rounded-lg text-sm transition-all text-left"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
