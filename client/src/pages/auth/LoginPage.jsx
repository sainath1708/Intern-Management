import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRight, Eye, EyeOff, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import AuthLayout from '../../layouts/AuthLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { useAuth } from '../../context/AuthContext';
import { validateLogin } from '../../utils/validation';
import { ROLE_HOME } from '../../utils/constants';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

// Demo shortcuts are opt-in through Vite environment variables so production
// builds never ship administrator credentials inside the JavaScript bundle.
const demoAccounts = [
  {
    label: 'Admin demo',
    email: import.meta.env.VITE_DEMO_ADMIN_EMAIL || '',
    password: import.meta.env.VITE_DEMO_ADMIN_PASSWORD || '',
  },
  {
    label: 'Intern demo',
    email: import.meta.env.VITE_DEMO_INTERN_EMAIL || '',
    password: import.meta.env.VITE_DEMO_INTERN_PASSWORD || '',
  },
].filter((account) => account.email && account.password);

export default function LoginPage() {
  useDocumentTitle('Sign in');
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  if (isAuthenticated) {
    return <Navigate to={ROLE_HOME[user.role] || '/login'} replace />;
  }

  const update = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setServerError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateLogin(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    setServerError('');

    try {
      const signedInUser = await login({ email: values.email.trim(), password: values.password });
      toast.success(`Welcome back, ${signedInUser.name.split(' ')[0]}`);
      const requested = location.state?.from;
      const destination =
        requested && requested.startsWith(ROLE_HOME[signedInUser.role]) ? requested : ROLE_HOME[signedInUser.role];
      navigate(destination, { replace: true });
    } catch (error) {
      setServerError(error.message || 'Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (account) => {
    setValues({ email: account.email, password: account.password });
    setErrors({});
    setServerError('');
  };

  return (
    <AuthLayout>
      <div className="rounded-2xl border border-ink-200 bg-white p-6 shadow-raised sm:p-8">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          Secure sign in
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink-900">Welcome back</h1>
        <p className="mt-1 text-sm text-ink-500">
          Sign in to the Qubenix AI Intern Management System.
        </p>

        {serverError ? (
          <Alert tone="danger" className="mt-5">
            {serverError}
          </Alert>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
          <Input
            label="Email address"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@qubenix.ai"
            icon={Mail}
            value={values.email}
            onChange={update('email')}
            error={errors.email}
            required
          />

          <div>
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                icon={KeyRound}
                value={values.password}
                onChange={update('password')}
                error={errors.password}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-2 top-[34px] rounded p-1.5 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" loading={submitting} iconRight={ArrowRight}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        {demoAccounts.length > 0 ? (
          <div className="mt-7 border-t border-ink-100 pt-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Demo accounts</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => fillDemo(account)}
                  className="rounded-lg border border-ink-200 bg-ink-50 px-3 py-1.5 text-xs font-medium text-ink-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                >
                  {account.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-ink-400">
              Demo-only shortcuts configured through local environment variables. They are never enabled in the
              production build.
            </p>
          </div>
        ) : null}
      </div>

      <p className="mt-6 text-center text-xs text-ink-400">
        Access is restricted to Qubenix AI administrators and active interns.
      </p>
    </AuthLayout>
  );
}
