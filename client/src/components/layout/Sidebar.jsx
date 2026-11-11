import { NavLink } from 'react-router-dom';
import {
  ClipboardCheck,
  LayoutDashboard,
  ListChecks,
  LogOut,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import BrandMark from './BrandMark';
import Avatar from '../ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/format';

const adminNav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/interns', label: 'Interns', icon: Users },
  { to: '/admin/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/admin/submissions', label: 'Submissions', icon: ClipboardCheck },
];

const internNav = [
  { to: '/intern', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/intern/tasks', label: 'My tasks', icon: ListChecks },
];

export default function Sidebar({ mobileOpen, onClose, onLogout }) {
  const { user, isAdmin } = useAuth();
  const navItems = isAdmin ? adminNav : internNav;

  return (
    <>
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-ink-950/50 backdrop-blur-[1px] lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-ink-950 text-ink-300 transition-transform duration-200 ease-out lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Main navigation"
      >
        <div className="flex h-16 items-center justify-between border-b border-white/5 px-5">
          <BrandMark inverted />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-400 transition hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-6">
          <div>
            <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-500">Workspace</p>
            <ul className="mt-2 space-y-1">
              {navItems.map(({ to, label, icon: Icon, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                        isActive
                          ? 'bg-brand-500/15 text-white ring-1 ring-inset ring-brand-500/30'
                          : 'text-ink-300 hover:bg-white/5 hover:text-white',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={cn('h-4 w-4', isActive ? 'text-brand-300' : 'text-ink-400')}
                          aria-hidden="true"
                        />
                        {label}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-500">Account</p>
            <ul className="mt-2 space-y-1">
              <li>
                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                      isActive ? 'bg-white/5 text-white' : 'text-ink-300 hover:bg-white/5 hover:text-white',
                    )
                  }
                >
                  <UserRound className="h-4 w-4 text-ink-400" aria-hidden="true" />
                  My profile
                </NavLink>
              </li>
            </ul>
          </div>
        </nav>

        <div className="border-t border-white/5 p-3">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <Avatar name={user?.name} size="sm" className="ring-2 ring-white/10" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
              <p className="truncate text-[11px] capitalize text-ink-400">{user?.role}</p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-lg p-1.5 text-ink-400 transition hover:bg-white/10 hover:text-white"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
