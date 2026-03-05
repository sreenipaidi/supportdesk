import { useAuthStore } from '../../stores/auth.store.js';
import { useUIStore } from '../../stores/ui.store.js';
import { Avatar } from '../ui/Avatar.js';
import { DropdownMenu } from '../ui/DropdownMenu.js';
import { useAuth } from '../../hooks/useAuth.js';

export function TopBar() {
  const user = useAuthStore((s) => s.user);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const { logout } = useAuth();

  return (
    <header
      className="h-16 bg-surface border-b border-border flex items-center justify-between px-4 lg:px-6"
      role="banner"
    >
      {/* Left: hamburger */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md text-text-secondary hover:bg-surface-alt hover:text-text-primary transition-colors"
          aria-label="Toggle sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Right: notifications + user menu */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button
          className="p-2 rounded-md text-text-secondary hover:bg-surface-alt hover:text-text-primary transition-colors relative"
          aria-label="View notifications"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
          </svg>
        </button>

        {/* User menu */}
        {user && (
          <DropdownMenu
            trigger={
              <div className="flex items-center gap-2 cursor-pointer p-1 rounded-md hover:bg-surface-alt transition-colors">
                <Avatar name={user.full_name} size="sm" />
                <span className="text-sm font-medium text-text-primary hidden md:block">
                  {user.full_name}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-text-secondary hidden md:block" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            }
            items={[
              {
                label: 'Profile',
                onClick: () => {
                  window.location.href = '/profile';
                },
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                ),
              },
              {
                label: 'Log Out',
                onClick: () => {
                  void logout();
                },
                danger: true,
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                  </svg>
                ),
              },
            ]}
          />
        )}
      </div>
    </header>
  );
}
