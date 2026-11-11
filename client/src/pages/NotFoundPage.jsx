import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import BrandMark from '../components/layout/BrandMark';
import { useAuth } from '../context/AuthContext';
import { ROLE_HOME } from '../utils/constants';

export default function NotFoundPage() {
  const { isAuthenticated, user } = useAuth();
  const home = isAuthenticated ? ROLE_HOME[user.role] : '/login';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-100 px-4 text-center">
      <BrandMark className="mb-8" />
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-ink-900">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-500">
        The page you are looking for does not exist or may have been moved.
      </p>
      <Link
        to={home}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to dashboard
      </Link>
    </div>
  );
}
