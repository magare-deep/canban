import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldCheck, 
  UserCheck, 
  Search, 
  CheckCircle2,
  Calendar as CalendarIcon,
  Clock3,
  CheckSquare,
  ListTodo,
  Clock,
  Filter,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { User, Role, Task } from '../types';
import { apiFetch } from '../services/api';
import { UserAvatar } from '../components/common/UserAvatar';

export const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tasks' | 'employees'>('tasks');

  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  // Date Filter for Admin Tasks Overview
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

  const [taskDateFilter, setTaskDateFilter] = useState<'all' | 'today' | 'tomorrow' | 'custom'>('all');
  const [customDate, setCustomDate] = useState<string>('');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');

  // Pagination State for Tasks
  const [currentPage, setCurrentPage] = useState(1);
  const TASKS_PER_PAGE = 10;

  const fetchData = async () => {
    try {
      setLoading(true);
      const [userRes, taskRes] = await Promise.all([
        apiFetch<{ success: boolean; users: User[] }>('/auth/users'),
        apiFetch<{ success: boolean; tasks: Task[] }>('/tasks')
      ]);

      if (userRes && userRes.success && Array.isArray(userRes.users)) {
        setUsers(userRes.users.filter(Boolean));
      }
      if (taskRes && taskRes.success && Array.isArray(taskRes.tasks)) {
        setTasks(taskRes.tasks.filter(Boolean));
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset pagination to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [taskDateFilter, customDate, employeeFilter, search]);

  const handleRoleChange = async (userId: string, newRole: Role) => {
    try {
      const res = await apiFetch<{ success: boolean; message: string; user: User }>(`/auth/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole })
      });

      if (res && res.success && res.user) {
        setUsers(users.map(u => (u && u.id === userId) ? res.user : u).filter(Boolean));
        setMessage(`Updated role for ${res.user.name} to ${newRole.toUpperCase()}`);
        setTimeout(() => setMessage(null), 4000);
      }
    } catch (err) {
      console.error('Error changing user role:', err);
    }
  };

  const safeUsers = (users || []).filter(Boolean);
  const safeTasks = (tasks || []).filter(Boolean);

  const filteredUsers = safeUsers.filter(u => 
    u && (
      (u.name && u.name.toLowerCase().includes(search.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
      (u.department && u.department.toLowerCase().includes(search.toLowerCase()))
    )
  );

  const filteredAdminTasks = safeTasks.filter(t => {
    if (!t) return false;
    if (customDate && t.dueDate !== customDate) return false;
    if (!customDate && taskDateFilter === 'today' && t.dueDate !== todayStr) return false;
    if (!customDate && taskDateFilter === 'tomorrow' && t.dueDate !== tomorrowStr) return false;
    if (employeeFilter !== 'all' && t.assigneeId !== employeeFilter) return false;
    return true;
  });

  // Calculate Paginated Tasks (10 Per Page)
  const totalPages = Math.ceil(filteredAdminTasks.length / TASKS_PER_PAGE) || 1;
  const paginatedAdminTasks = filteredAdminTasks.slice(
    (currentPage - 1) * TASKS_PER_PAGE,
    currentPage * TASKS_PER_PAGE
  );

  const adminCount = safeUsers.filter(u => u && u.role === 'admin').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Completed</span>;
      case 'in_progress':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 flex items-center gap-1"><Clock className="w-3 h-3" /> In Progress</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300 flex items-center gap-1"><ListTodo className="w-3 h-3" /> To Do</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-xl shadow-blue-500/10">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Admin Control Panel
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Admin Dashboard & Team Tasks
        </h1>
        <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-xl">
          Monitor employee daily tasks (Today vs Tomorrow) and manage consultant role permissions.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Members</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{safeUsers.length}</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Administrators</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{adminCount}</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xl">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Team Tasks</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{safeTasks.length}</p>
          </div>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-sm font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <span>{message}</span>
        </div>
      )}

      {/* View Switcher Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl max-w-md">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
            activeTab === 'tasks'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Date-Wise Employee Tasks
        </button>

        <button
          onClick={() => setActiveTab('employees')}
          className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
            activeTab === 'employees'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Consultant Directory
        </button>
      </div>

      {/* Tab 1: Date-Wise Employee Tasks Monitor (Paginated - 10 Tasks per page) */}
      {activeTab === 'tasks' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Filter className="w-4 h-4 text-blue-500" /> Filter Date:
              </span>

              <button
                onClick={() => {
                  setTaskDateFilter('all');
                  setCustomDate('');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  taskDateFilter === 'all' && !customDate
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                All Dates
              </button>

              <button
                onClick={() => {
                  setTaskDateFilter('today');
                  setCustomDate('');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  taskDateFilter === 'today' && !customDate
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Today ({todayStr})
              </button>

              <button
                onClick={() => {
                  setTaskDateFilter('tomorrow');
                  setCustomDate('');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  taskDateFilter === 'tomorrow' && !customDate
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Tomorrow ({tomorrowStr})
              </button>

              {/* Interactive Date Picker Filter */}
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border transition-all ${
                customDate 
                  ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-500 text-blue-600 dark:text-blue-300 font-bold' 
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                <CalendarIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => {
                    setCustomDate(e.target.value);
                    if (e.target.value) setTaskDateFilter('custom');
                  }}
                  className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                />
                {customDate && (
                  <button
                    onClick={() => {
                      setCustomDate('');
                      setTaskDateFilter('all');
                    }}
                    className="p-0.5 rounded-full hover:bg-red-100 text-red-500 transition-colors"
                    title="Clear date filter"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Employee:</span>
              <select
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Employees</option>
                {safeUsers.map(u => (
                  u ? <option key={u.id} value={u.id}>{u.name}</option> : null
                ))}
              </select>
            </div>
          </div>

          {filteredAdminTasks.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm font-medium">
                {customDate ? `No employee tasks found for date ${customDate}.` : 'No employee tasks found for the selected date filter.'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">Task Details</th>
                      <th className="py-3.5 px-4">Employee Name</th>
                      <th className="py-3.5 px-4">Scheduled Date</th>
                      <th className="py-3.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedAdminTasks.map((task) => {
                      if (!task) return null;
                      return (
                        <tr key={task.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                            {task.title || task.description}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <UserAvatar src={task.assignee?.avatar} name={task.assignee?.name} className="w-6 h-6" iconClassName="w-3.5 h-3.5 text-slate-500" />
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{task.assignee?.name || 'Unassigned'}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-blue-600 dark:text-blue-400">
                            {task.dueDate === todayStr ? '📅 Today' : task.dueDate === tomorrowStr ? '🌅 Tomorrow' : `📆 ${task.dueDate}`}
                          </td>
                          <td className="py-3.5 px-4">
                            {getStatusBadge(task.status)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Clean Pagination Bar (10 Tasks per page) */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Showing {Math.min((currentPage - 1) * TASKS_PER_PAGE + 1, filteredAdminTasks.length)} to {Math.min(currentPage * TASKS_PER_PAGE, filteredAdminTasks.length)} of {filteredAdminTasks.length} tasks
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-7 h-7 rounded-xl text-xs font-bold transition-all ${
                        currentPage === page
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 flex items-center gap-1"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab 2: Employee Directory */}
      {activeTab === 'employees' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or department..."
                className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span>Loading consultant directory...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Consultant</th>
                    <th className="py-3.5 px-4 hidden sm:table-cell">Department</th>
                    <th className="py-3.5 px-4">Role Access</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUsers.map((u) => {
                    if (!u) return null;
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <UserAvatar src={u.avatar} name={u.name} className="w-9 h-9" iconClassName="w-4 h-4 text-slate-500" />
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white leading-tight">{u.name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 hidden sm:table-cell text-slate-600 dark:text-slate-400">
                          {u.department || 'Consulting'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            u.role === 'admin'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                              : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                          }`}>
                            {u.role === 'admin' ? '🛡️ Admin' : '👤 Consultant'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                            className="px-2.5 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="user">Set as Consultant</option>
                            <option value="admin">Set as Admin</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
