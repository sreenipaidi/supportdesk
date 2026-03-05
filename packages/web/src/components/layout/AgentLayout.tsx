import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar.js';
import { TopBar } from './TopBar.js';
import { useUIStore } from '../../stores/ui.store.js';
import { useMediaQuery } from '../../hooks/useMediaQuery.js';
import { cn } from '../../lib/cn.js';

export function AgentLayout() {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const isMobile = useMediaQuery('(max-width: 767px)');

  return (
    <div className="min-h-screen bg-surface-alt">
      {/* Mobile overlay */}
      {isMobile && !sidebarCollapsed && (
        <div
          className="fixed inset-0 z-20 bg-black/50"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - on mobile, hide when collapsed */}
      <div
        className={cn(
          isMobile && sidebarCollapsed && '-translate-x-full',
          'transition-transform duration-200',
        )}
      >
        <Sidebar />
      </div>

      {/* Main content */}
      <div
        className={cn(
          'transition-all duration-200',
          isMobile ? 'ml-0' : sidebarCollapsed ? 'ml-16' : 'ml-60',
        )}
      >
        <TopBar />
        <main className="p-4 lg:p-6" role="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
