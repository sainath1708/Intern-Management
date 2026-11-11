import { Link, useLocation } from 'react-router-dom';
import { LogOut, Menu, ShieldCheck, UserRound } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';

const sectionLabels = [
  { prefix: '/admin/interns', label: 'Interns' },
  { prefix: '/admin/tasks', label: 'Tasks' },
  { prefix: '/admin/submissions', label: 'Submissions' },
  { prefix: '/admin', label: 'Dashboard' },
  { prefix: '/intern/tasks', label: 'My tasks' },
  { prefix: '/intern', label: 'Dashboard' },
  { prefix: '/profile', label: 'My profile' },
];

export default function Topbar({ onMenuClick, onLogout }) {
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  const current = sectionLabels.find(
    (item) => location.pathname === item.prefix || location.pathname.startsWith(`${item.prefix}/`),
  );

  return (
    <header className="sticky top-0 z-30 border-b border-ink-200 bg-white/85 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-lg p-2 text-ink-500 transition hover:bg-ink-100 hover:text-ink-900 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-ink-400">Qubenix AI</p>
            <p className="truncate text-sm font-semibold text-ink-900">{current?.label || 'Workspace'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge tone={isAdmin ? 'brand' : 'info'} dot={false} className="hidden sm:inline-flex">
            <ShieldCheck className="h-3 w-3" aria-hidden="true" />
            {isAdmin ? 'Administrator' : 'Intern'}
          </Badge>
          <Link
            to="/profile"
            className="flex items-center gap-2 rounded-full border border-ink-200 bg-white py-1 pl-1 pr-3 transition hover:border-ink-300 hover:bg-ink-50"
          >
            <Avatar name={user?.name} size="sm" />
            <span className="hidden text-xs font-semibold text-ink-700 sm:block">{user?.name}</span>
            <UserRound className="h-3.5 w-3.5 text-ink-400 sm:hidden" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className="hidden rounded-lg p-2 text-ink-400 transition hover:bg-ink-100 hover:text-rose-600 sm:block"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
