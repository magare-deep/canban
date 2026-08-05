import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  ChevronLeft,
  ChevronRight,
  Code2
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { UserAvatar } from '../common/UserAvatar';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse
}) => {
  const { user } = useAuthStore();
  const location = useLocation();

  const navItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
      adminOnly: false
    },
    {
      label: 'Consultant Directory',
      icon: Users,
      path: '/admin/employees',
      adminOnly: true
    },
    {
      label: 'My Profile',
      icon: UserCheck,
      path: '/profile',
      adminOnly: false
    }
  ];

  return (
    <aside
      className={`hidden lg:block h-screen sticky top-0 z-20 transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300">
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex-shrink-0 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
              <Code2 className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white leading-tight">
                  Dev<span className="text-blue-600 dark:text-blue-400">Nectar</span>
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  Consultancy HQ
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
          {navItems.map((item) => {
            if (item.adminOnly && user?.role !== 'admin') return null;

            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                {!collapsed && (
                  <span className="truncate flex-1">{item.label}</span>
                )}
                {!collapsed && item.adminOnly && (
                  <span className="px-1.5 py-0.5 text-[10px] uppercase font-extrabold rounded bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300">
                    Admin
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* User Status Card */}
        {!collapsed && (
          <div className="p-3 m-3 rounded-2xl bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-slate-800/50 dark:to-slate-800/20 border border-blue-100/60 dark:border-slate-800/60">
            <div className="flex items-center gap-3">
              <UserAvatar src={user?.avatar} name={user?.name} className="w-9 h-9" iconClassName="w-4 h-4 text-slate-500" />
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.title || 'Consultant'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
