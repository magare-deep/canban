import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <h1 className="text-6xl font-extrabold text-brand-600 dark:text-brand-400 mb-2">404</h1>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Page Not Found</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
        The task or workspace section you requested could not be located.
      </p>
      <Link
        to="/dashboard"
        className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-sm transition-all"
      >
        Return to Dashboard
      </Link>
    </div>
  );
};
