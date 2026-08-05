import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  CheckCircle2, 
  Clock, 
  ListTodo, 
  Plus, 
  ShieldCheck, 
  X, 
  Sparkles, 
  Clock3, 
  Trash2, 
  User as UserIcon, 
  Briefcase, 
  TrendingUp, 
  Target, 
  Zap, 
  Calendar as CalendarIcon,
  ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { Task, TaskStatus, User } from '../types';
import { apiFetch } from '../services/api';
import { UserAvatar } from '../components/common/UserAvatar';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selected Employee Modal State for Admin
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);

  // Modal state for creating task
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Date calculations
  const todayDateObj = new Date();
  const todayStr = todayDateObj.toISOString().split('T')[0];

  const tomorrowDateObj = new Date();
  tomorrowDateObj.setDate(tomorrowDateObj.getDate() + 1);
  const tomorrowStr = tomorrowDateObj.toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Today & Tomorrow Numbered Task Input Lists: 1) ... 2) ...
  const [todayTasksList, setTodayTasksList] = useState<string[]>(['']);
  const [tomorrowTasksList, setTomorrowTasksList] = useState<string[]>(['']);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [taskRes, userRes] = await Promise.all([
        apiFetch<{ success: boolean; tasks: Task[] }>('/tasks'),
        apiFetch<{ success: boolean; users: User[] }>('/auth/users')
      ]);

      if (taskRes && taskRes.success && Array.isArray(taskRes.tasks)) {
        setTasks(taskRes.tasks.filter(Boolean));
      }
      if (userRes && userRes.success && Array.isArray(userRes.users)) {
        setEmployees(userRes.users.filter(Boolean));
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Robust Safe Date Matching Helper
  const isMatchDate = (taskDueDate?: string | null, targetDateStr?: string) => {
    if (!taskDueDate || !targetDateStr) return false;
    if (taskDueDate === targetDateStr) return true;
    try {
      const parsed = new Date(taskDueDate);
      if (isNaN(parsed.getTime())) return false;
      return parsed.toISOString().split('T')[0] === targetDateStr;
    } catch (e) {
      return false;
    }
  };

  // Handlers for Today's task creation inputs
  const handleTodayTaskChange = (index: number, value: string) => {
    const updated = [...todayTasksList];
    updated[index] = value;
    setTodayTasksList(updated);
  };

  const addTodayTaskField = () => {
    setTodayTasksList([...todayTasksList, '']);
  };

  const removeTodayTaskField = (index: number) => {
    if (todayTasksList.length <= 1) {
      setTodayTasksList(['']);
      return;
    }
    setTodayTasksList(todayTasksList.filter((_, i) => i !== index));
  };

  // Handlers for Tomorrow's task creation inputs
  const handleTomorrowTaskChange = (index: number, value: string) => {
    const updated = [...tomorrowTasksList];
    updated[index] = value;
    setTomorrowTasksList(updated);
  };

  const addTomorrowTaskField = () => {
    setTomorrowTasksList([...tomorrowTasksList, '']);
  };

  const removeTomorrowTaskField = (index: number) => {
    if (tomorrowTasksList.length <= 1) {
      setTomorrowTasksList(['']);
      return;
    }
    setTomorrowTasksList(tomorrowTasksList.filter((_, i) => i !== index));
  };

  // Submit Today & Tomorrow tasks to database
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();

    const validToday = todayTasksList.map(t => t.trim()).filter(Boolean);
    const validTomorrow = tomorrowTasksList.map(t => t.trim()).filter(Boolean);

    if (validToday.length === 0 && validTomorrow.length === 0) return;

    const targetAssigneeId = selectedEmployee ? selectedEmployee.id : user?.id;

    try {
      // Save Today's Tasks
      for (const itemText of validToday) {
        await apiFetch<{ success: boolean; task: Task }>('/tasks', {
          method: 'POST',
          body: JSON.stringify({
            title: itemText.substring(0, 60),
            description: itemText,
            priority: 'medium',
            category: 'Daily Task',
            dueDate: todayStr,
            estimatedHours: 2,
            assigneeId: targetAssigneeId
          })
        });
      }

      // Save Tomorrow's Tasks
      for (const itemText of validTomorrow) {
        await apiFetch<{ success: boolean; task: Task }>('/tasks', {
          method: 'POST',
          body: JSON.stringify({
            title: itemText.substring(0, 60),
            description: itemText,
            priority: 'medium',
            category: 'Daily Task',
            dueDate: tomorrowStr,
            estimatedHours: 2,
            assigneeId: targetAssigneeId
          })
        });
      }

      await fetchData();
      setIsModalOpen(false);
      setTodayTasksList(['']);
      setTomorrowTasksList(['']);
    } catch (err) {
      console.error('Error saving numbered tasks:', err);
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const res = await apiFetch<{ success: boolean; task: Task }>(`/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      if (res && res.success) {
        setTasks(tasks.map(t => (t && t.id === taskId) ? res.task : t).filter(Boolean));
      }
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  // Safe filter for tasks
  const safeTasks = (tasks || []).filter(Boolean);
  const safeEmployees = (employees || []).filter(Boolean);
  // Filter out Admin accounts from Employee Profiles list
  const consultantEmployees = safeEmployees.filter(emp => emp && emp.role !== 'admin');

  const userFilteredTasks = safeTasks.filter(t => {
    if (!t) return false;
    if (user?.role === 'admin') return true;
    if (!t.assigneeId && !t.assignee) return true;
    if (t.assigneeId === user?.id) return true;
    if (t.assignee?.id === user?.id) return true;
    if (t.assignee?.email?.toLowerCase() === user?.email?.toLowerCase()) return true;
    return true;
  });

  // Today's vs Tomorrow's tasks
  const todayTasks = userFilteredTasks.filter(t => t && (isMatchDate(t.dueDate, todayStr) || t.dueDate === todayStr));
  const tomorrowTasks = userFilteredTasks.filter(t => t && (isMatchDate(t.dueDate, tomorrowStr) || t.dueDate === tomorrowStr));

  const totalUserTasks = userFilteredTasks.length;
  const completedUserTasks = userFilteredTasks.filter(t => t && t.status === 'completed').length;
  const completionRate = totalUserTasks > 0 ? Math.round((completedUserTasks / totalUserTasks) * 100) : 0;

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-300 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Completed</span>;
      case 'in_progress':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/90 dark:text-blue-300 flex items-center gap-1"><Clock className="w-3 h-3" /> In Progress</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300 flex items-center gap-1"><ListTodo className="w-3 h-3" /> To Do</span>;
    }
  };

  const getTasksForEmployee = (empId: string) => {
    return safeTasks.filter(t => t && (t.assigneeId === empId || t.assignee?.id === empId));
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-xl shadow-blue-500/10 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md flex items-center gap-1">
                {user?.role === 'admin' && <ShieldCheck className="w-3.5 h-3.5" />}
                {user?.role === 'admin' ? 'Admin Executive Panel' : 'Consultant Workspace'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name || 'User'}! 👋
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-xl">
              {user?.role === 'admin' 
                ? 'Manage daily tasks for Today & Tomorrow across all consultants.' 
                : 'Here are your daily tasks for Today and Tomorrow.'}
            </p>
          </div>

          {/* New Daily Task Button (Only for Consultants, Hidden for Admin) */}
          {user?.role !== 'admin' && (
            <button
              onClick={() => {
                setSelectedEmployee(null);
                setIsModalOpen(true);
              }}
              className="self-start md:self-auto px-5 py-3 rounded-2xl bg-white text-blue-700 hover:bg-slate-100 font-bold text-sm shadow-lg flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Daily Task
            </button>
          )}
        </div>
      </div>

      {/* MODERN ANALYTICS BANNER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        
        {/* Completion Rate */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Completion Performance</h3>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">{completionRate}% Efficiency</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-1 rounded-full flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> High
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
              <span>Completed ({completedUserTasks})</span>
              <span>Total ({totalUserTasks})</span>
            </div>
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700/60">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500" 
                style={{ width: `${completionRate}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Today's Focus */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xl">
            <Clock3 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Today's Tasks ({todayStr})</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{todayTasks.length} Scheduled</p>
          </div>
        </div>

        {/* Tomorrow's Focus */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xl">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tomorrow's Tasks ({tomorrowStr})</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{tomorrowTasks.length} Scheduled</p>
          </div>
        </div>

      </div>

      {/* ADMIN ONLY: EMPLOYEE PROFILES CARDS (EXCLUDES ADMIN ACCOUNTS) */}
      {user?.role === 'admin' && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-blue-600" />
              Employee Profiles & Team Task Status
            </h2>
            <span className="text-xs text-slate-500 font-medium">Click any profile card to view employee tasks</span>
          </div>

          {loading ? (
            <div className="py-6 text-center text-slate-400">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span>Loading team profiles...</span>
            </div>
          ) : consultantEmployees.length === 0 ? (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">No consultant profiles registered yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {consultantEmployees.map((emp) => {
                if (!emp) return null;
                const empTasks = getTasksForEmployee(emp.id);
                const empTodayTasks = empTasks.filter(t => t && isMatchDate(t.dueDate, todayStr));
                const empTomorrowTasks = empTasks.filter(t => t && isMatchDate(t.dueDate, tomorrowStr));
                const empCompleted = empTasks.filter(t => t && t.status === 'completed').length;

                return (
                  <div
                    key={emp.id}
                    onClick={() => setSelectedEmployee(emp)}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-blue-500/50 transition-all duration-200 cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <UserAvatar src={emp.avatar} name={emp.name} className="w-12 h-12 shadow-sm" iconClassName="w-6 h-6 text-slate-500" />
                        <div className="overflow-hidden">
                          <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight group-hover:text-blue-600 transition-colors truncate">
                            {emp.name}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                            {emp.title || 'Consultant'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="p-2.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50">
                          <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Today</p>
                          <p className="text-lg font-extrabold text-blue-700 dark:text-blue-300">{empTodayTasks.length}</p>
                        </div>

                        <div className="p-2.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50">
                          <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Tomorrow</p>
                          <p className="text-lg font-extrabold text-indigo-700 dark:text-indigo-300">{empTomorrowTasks.length}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-semibold">{empCompleted}/{empTasks.length} Completed</span>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:underline flex items-center gap-1">
                        View Employee Tasks <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TODAY'S & TOMORROW'S TASKS SECTIONS (ONLY VISIBLE FOR STANDARD CONSULTANTS, NOT ADMIN) */}
      {user?.role !== 'admin' && (
        <div className="space-y-8 pt-4 border-t border-slate-200/80 dark:border-slate-800">
          
          {/* TODAY'S TASKS SECTION */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock3 className="w-5 h-5 text-blue-600" />
                <span>Today's Tasks ({todayStr})</span>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold">
                  {todayTasks.length}
                </span>
              </h2>
            </div>

            {loading ? (
              <div className="py-8 text-center text-slate-400">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span>Loading Today's tasks...</span>
              </div>
            ) : todayTasks.length === 0 ? (
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">No tasks scheduled for Today yet. Click "+ New Daily Task" to create tasks!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {todayTasks.map((task, idx) => {
                  if (!task) return null;
                  return (
                    <div key={task.id} className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
                      <div className="flex items-start gap-3">
                        <span className="text-xs font-extrabold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-xl flex-shrink-0">
                          {idx + 1})
                        </span>
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug">
                            {task.title || task.description}
                          </h3>
                          {task.description && task.description !== task.title && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          {task.assignee?.name && (
                            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1 font-medium">
                              <UserAvatar src={task.assignee.avatar} name={task.assignee.name} className="w-4 h-4" iconClassName="w-2.5 h-2.5 text-slate-500" />
                              <span>{task.assignee.name}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        {getStatusBadge(task.status)}
                        {task.status !== 'completed' && (
                          <button
                            onClick={() => handleUpdateStatus(task.id, task.status === 'todo' ? 'in_progress' : 'completed')}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all shadow-sm active:scale-95"
                          >
                            {task.status === 'todo' ? 'Start Task' : 'Complete Task'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* TOMORROW'S TASKS SECTION */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-indigo-600" />
                <span>Tomorrow's Tasks ({tomorrowStr})</span>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                  {tomorrowTasks.length}
                </span>
              </h2>
            </div>

            {loading ? (
              <div className="py-8 text-center text-slate-400">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span>Loading Tomorrow's tasks...</span>
              </div>
            ) : tomorrowTasks.length === 0 ? (
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">No tasks scheduled for Tomorrow yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tomorrowTasks.map((task, idx) => {
                  if (!task) return null;
                  return (
                    <div key={task.id} className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
                      <div className="flex items-start gap-3">
                        <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-xl flex-shrink-0">
                          {idx + 1})
                        </span>
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug">
                            {task.title || task.description}
                          </h3>
                          {task.description && task.description !== task.title && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          {task.assignee?.name && (
                            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1 font-medium">
                              <UserAvatar src={task.assignee.avatar} name={task.assignee.name} className="w-4 h-4" iconClassName="w-2.5 h-2.5 text-slate-500" />
                              <span>{task.assignee.name}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        {getStatusBadge(task.status)}
                        {task.status !== 'completed' && (
                          <button
                            onClick={() => handleUpdateStatus(task.id, task.status === 'todo' ? 'in_progress' : 'completed')}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all shadow-sm active:scale-95"
                          >
                            {task.status === 'todo' ? 'Start Task' : 'Complete Task'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* EMPLOYEE TASKS DRAWER MODAL */}
      {selectedEmployee && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 w-full max-w-2xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 my-auto max-h-[85vh] overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <UserAvatar src={selectedEmployee.avatar} name={selectedEmployee.name} className="w-11 h-11" iconClassName="w-5 h-5 text-slate-500" />
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">{selectedEmployee.name}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{selectedEmployee.email} • {selectedEmployee.title || 'Consultant'}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content: Scrollable Body Inside Card Boundaries */}
            {(() => {
              const empTasks = getTasksForEmployee(selectedEmployee.id);
              const empTodayTasks = empTasks.filter(t => t && isMatchDate(t.dueDate, todayStr));
              const empTomorrowTasks = empTasks.filter(t => t && isMatchDate(t.dueDate, tomorrowStr));

              return (
                <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                  {/* Today's Tasks */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                      <Clock3 className="w-4 h-4" />
                      <span>Today's Tasks ({todayStr})</span>
                    </h3>

                    {empTodayTasks.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No tasks assigned for Today.</p>
                    ) : (
                      <div className="space-y-2">
                        {empTodayTasks.map((t, idx) => (
                          <div key={t.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-3">
                            <div className="flex items-start gap-2.5">
                              <span className="text-xs font-extrabold text-slate-400">{idx + 1})</span>
                              <div>
                                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">{t.title || t.description}</p>
                              </div>
                            </div>
                            {getStatusBadge(t.status)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tomorrow's Tasks */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                      <Clock3 className="w-4 h-4" />
                      <span>Tomorrow's Tasks ({tomorrowStr})</span>
                    </h3>

                    {empTomorrowTasks.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No tasks assigned for Tomorrow.</p>
                    ) : (
                      <div className="space-y-2">
                        {empTomorrowTasks.map((t, idx) => (
                          <div key={t.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-3">
                            <div className="flex items-start gap-2.5">
                              <span className="text-xs font-extrabold text-slate-400">{idx + 1})</span>
                              <div>
                                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">{t.title || t.description}</p>
                              </div>
                            </div>
                            {getStatusBadge(t.status)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Actions Footer Fixed inside Modal Card */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 font-bold text-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add Task For {selectedEmployee.name}
              </button>

              <button
                onClick={() => setSelectedEmployee(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Close
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* Task Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 my-auto max-h-[85vh] overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    {selectedEmployee ? `Add Tasks for ${selectedEmployee.name}` : 'Create Daily Tasks'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Add tasks for Today & Tomorrow in 1) 2) format</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="flex-1 overflow-y-auto space-y-5 pr-2">
              
              {/* 1. Date Selection */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">Date Selection</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>

              {/* 2. Today's Tasks Section */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock3 className="w-4 h-4" />
                    <span>Today's Tasks ({todayStr})</span>
                  </label>
                  <button
                    type="button"
                    onClick={addTodayTaskField}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Task</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {todayTasksList.map((taskText, idx) => (
                    <div key={`today-${idx}`} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 w-6 text-right flex-shrink-0">
                        {idx + 1})
                      </span>
                      <input
                        type="text"
                        value={taskText}
                        onChange={(e) => handleTodayTaskChange(idx, e.target.value)}
                        className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                      {todayTasksList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTodayTaskField(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Tomorrow's Tasks Section */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock3 className="w-4 h-4" />
                    <span>Tomorrow's Tasks ({tomorrowStr})</span>
                  </label>
                  <button
                    type="button"
                    onClick={addTomorrowTaskField}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Task</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {tomorrowTasksList.map((taskText, idx) => (
                    <div key={`tomorrow-${idx}`} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 w-6 text-right flex-shrink-0">
                        {idx + 1})
                      </span>
                      <input
                        type="text"
                        value={taskText}
                        onChange={(e) => handleTomorrowTaskChange(idx, e.target.value)}
                        className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      />
                      {tomorrowTasksList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTomorrowTaskField(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 flex items-center gap-1.5 transition-transform active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Save All Tasks</span>
                </button>
              </div>

            </form>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
