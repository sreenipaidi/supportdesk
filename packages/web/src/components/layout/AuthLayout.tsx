import { Outlet } from 'react-router';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-surface-alt flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary mb-4">
            <span className="text-white font-bold text-xl">SD</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-surface rounded-xl shadow-md border border-border p-6 sm:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
