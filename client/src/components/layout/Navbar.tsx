import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { 
  User as UserIcon, 
  LogOut, 
  ShieldCheck, 
  ChevronDown,
  Bell,
  Calendar as CalendarIcon,
  X,
  CheckCircle2,
  Clock,
  ListTodo,
  Code2,
  Users
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { UserAvatar } from '../common/UserAvatar';
import { Task } from '../../types';
import { apiFetch } from '../../services/api';

interface NavbarProps {
  onToggleMobileSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const { user, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const navigate = useNavigate();

  // Calendar History State
  const todayStr = new Date().toISOString().split('T')[0];
  const [historyDate, setHistoryDate] = useState(todayStr);
  const [historicalTasks, setHistoricalTasks] = useState<Task[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Fetch historical tasks for chosen date
  const fetchTasksForDate = async (targetDate: string) => {
    try {
      setLoadingHistory(true);
      const res = await apiFetch<{ success: boolean; tasks: Task[] }>('/tasks');
      if (res.success && res.tasks) {
        const filtered = res.tasks.filter(t => t.dueDate === targetDate);
        setHistoricalTasks(filtered);
      }
    } catch (err) {
      console.error('Error loading task history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (calendarOpen) {
      fetchTasksForDate(historyDate);
    }
  }, [calendarOpen, historyDate]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Completed</span>;
      case 'in_progress':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 flex items-center gap-1"><Clock className="w-3 h-3" /> In Progress</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300 flex items-center gap-1"><ListTodo className="w-3 h-3" /> To Do</span>;
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        
        {/* Mobile Brand Logo */}
        <Link to="/dashboard" className="flex items-center gap-2.5 lg:hidden">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex-shrink-0 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
            <Code2 className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white leading-tight">
              Dev<span className="text-blue-600 dark:text-blue-400">Nectar</span>
            </span>
            <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
              Consultancy
            </span>
          </div>
        </Link>

        {/* Right Controls: Admin Panel, History, Notifications & User Menu */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          
          {/* Admin Dashboard Quick Access Button */}
          <Link
            to="/admin/employees"
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/80 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
            title="Admin Control Panel"
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Admin Panel</span>
          </Link>

          {/* Calendar Task History Button */}
          <button 
            onClick={() => setCalendarOpen(true)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative flex items-center gap-1.5 cursor-pointer"
            title="Task History Calendar"
          >
            <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline text-xs font-bold text-slate-700 dark:text-slate-200">History</span>
          </button>

          {/* Notifications Button */}
          <button 
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-white dark:ring-slate-900"></span>
          </button>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
            >
              <UserAvatar src={user?.avatar} name={user?.name} className="w-8 h-8" iconClassName="w-4 h-4 text-slate-500" />
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                  {user?.name}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  {user?.role === 'admin' && <ShieldCheck className="w-3 h-3 text-blue-500" />}
                  {user?.role === 'admin' ? 'Administrator' : 'Consultant'}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 z-50 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 animate-fade-in">
                  <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider mb-0.5">DevNectar Consultancy</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        user?.role === 'admin' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' 
                          : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                      }`}>
                        {user?.role === 'admin' ? '🛡️ Admin' : '👤 Team Member'}
                      </span>
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/admin/employees"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4 text-blue-500" />
                      Admin Control Panel
                    </Link>

                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-slate-500" />
                      Profile & Preferences
                    </Link>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Calendar History Modal Popup */}
      {calendarOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 my-auto max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Previous Task History</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Pick any date to view archived tasks</p>
                </div>
              </div>
              <button
                onClick={() => setCalendarOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Date Picker Control */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">Select Date to View Tasks:</label>
              <input
                type="date"
                value={historyDate}
                onChange={(e) => setHistoryDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 font-semibold"
              />
            </div>

            {/* Task List for Selected Historical Date */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Tasks Recorded for {historyDate === todayStr ? 'Today' : historyDate} ({historicalTasks.length}):
              </h3>

              {loadingHistory ? (
                <div className="py-8 text-center text-slate-400">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <span className="text-xs">Loading task archive...</span>
                </div>
              ) : historicalTasks.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4">
                  <p className="text-xs text-slate-400 italic">No tasks recorded for date {historyDate}.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {historicalTasks.map((t, idx) => (
                    <div key={t.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-3">
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-bold text-slate-400">{idx + 1})</span>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{t.title || t.description}</p>
                          {t.assignee?.name && (
                            <p className="text-[10px] text-slate-500">Assignee: {t.assignee.name}</p>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(t.status)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setCalendarOpen(false)}
                className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md"
              >
                Close History
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}
    </header>
  );
};
