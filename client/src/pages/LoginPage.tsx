import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Lock, 
  Mail, 
  User as UserIcon, 
  ArrowRight, 
  AlertCircle,
  Briefcase,
  Code2
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export const LoginPage: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const { login, register, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  // Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('devnectar_remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    // Persist remembered email if checked
    if (rememberMe && email) {
      localStorage.setItem('devnectar_remembered_email', email);
    } else {
      localStorage.removeItem('devnectar_remembered_email');
    }

    let success = false;
    if (isRegister) {
      success = await register(name, email, password, title, 'Consulting');
    } else {
      success = await login(email, password);
    }

    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex items-center justify-center p-3 bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-900 text-white relative">
      {/* Background Glow Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassmorphism Card */}
      <div className={`w-full max-w-md sm:max-w-lg bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl shadow-black/60 z-10 relative flex flex-col justify-center my-auto transition-all duration-300 ease-out ${
        isRegister 
          ? 'p-5 sm:p-6' 
          : 'p-6 sm:p-7'
      }`}>
        
        {/* Company Header */}
        <div className={`flex flex-col items-center text-center transition-all duration-300 ${isRegister ? 'mb-3' : 'mb-4'}`}>
          <div className={`rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 transition-all duration-300 ${
            isRegister ? 'w-11 h-11 mb-1.5 scale-95' : 'w-12 h-12 mb-2 scale-100'
          }`}>
            <Code2 className={isRegister ? 'w-5 h-5 text-white' : 'w-6 h-6 text-white'} />
          </div>
          <h1 className={`font-extrabold tracking-tight text-white leading-tight transition-all duration-300 ${
            isRegister ? 'text-xl sm:text-2xl' : 'text-xl sm:text-2xl'
          }`}>
            Dev<span className="text-blue-400">Nectar</span>
          </h1>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-400/90 mt-0.5">
            Consultancy Portal
          </p>
        </div>

        {/* Sliding Tab Switcher */}
        <div className={`relative flex bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/50 transition-all duration-300 ${isRegister ? 'mb-3' : 'mb-4'}`}>
          {/* Animated Highlight Pill */}
          <div 
            className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-md transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1) ${
              isRegister ? 'left-[calc(50%+3px)]' : 'left-1.5'
            }`}
          />

          <button
            type="button"
            onClick={() => { setIsRegister(false); clearError(); }}
            className={`relative z-10 flex-1 font-semibold py-2 text-xs sm:text-sm transition-all duration-200 text-center ${
              !isRegister ? 'text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>

          <button
            type="button"
            onClick={() => { setIsRegister(true); clearError(); }}
            className={`relative z-10 flex-1 font-semibold py-2 text-xs sm:text-sm transition-all duration-200 text-center ${
              isRegister ? 'text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-3.5 p-2.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs sm:text-sm flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span className="truncate">{error}</span>
          </div>
        )}

        {/* Animated Form Container */}
        <div key={isRegister ? 'register-form' : 'login-form'} className="animate-tab-switch">
          <form onSubmit={handleSubmit} className="space-y-3">
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full pl-10 pr-4 py-2 bg-slate-800/90 border border-slate-700 focus:border-blue-500 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Job Title</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Job Title"
                      className="w-full pl-10 pr-4 py-2 bg-slate-800/90 border border-slate-700 focus:border-blue-500 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className={`block font-semibold text-slate-300 ${isRegister ? 'text-[11px] mb-1' : 'text-xs font-semibold text-slate-300 mb-1'}`}>Work Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 border border-slate-700 focus:border-blue-500 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div>
              <label className={`block font-semibold text-slate-300 ${isRegister ? 'text-[11px] mb-1' : 'text-xs font-semibold text-slate-300 mb-1'}`}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 border border-slate-700 focus:border-blue-500 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Remember Me & Forgot Password Row */}
            {!isRegister && (
              <div className="flex items-center justify-between text-xs text-slate-300 pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500/20 cursor-pointer accent-blue-600"
                  />
                  <span>Remember me</span>
                </label>
                <a 
                  href="#" 
                  onClick={(e) => e.preventDefault()} 
                  className="text-blue-400 hover:text-blue-300 font-medium hover:underline transition-colors"
                >
                  Forgot password?
                </a>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isRegister ? 'Sign Up to DevNectar' : 'Sign In to DevNectar'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center text-xs text-slate-500 font-medium mt-4">
          DevNectar Consultancy © 2026
        </div>
      </div>
    </div>
  );
};
