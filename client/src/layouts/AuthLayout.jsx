import { ClipboardCheck, ListChecks, Users } from 'lucide-react';
import BrandMark from '../components/layout/BrandMark';

const highlights = [
  { icon: Users, title: 'Intern profiles', text: 'Onboard interns with linked, secure login accounts.' },
  { icon: ListChecks, title: 'Task workflow', text: 'Assign priorities and deadlines, then track progress.' },
  { icon: ClipboardCheck, title: 'Review loop', text: 'Approve work or request changes with clear feedback.' },
];

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-ink-100 lg:grid lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden overflow-hidden bg-ink-950 px-10 py-12 lg:flex lg:flex-col lg:justify-between xl:px-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.55]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(99,102,241,0.22), transparent 45%), radial-gradient(circle at 85% 75%, rgba(56,189,248,0.12), transparent 40%)',
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
          aria-hidden="true"
        />

        <div className="relative">
          <BrandMark inverted />
        </div>

        <div className="relative max-w-lg">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-200">
            Internal access
          </span>
          <h1 className="mt-6 text-balance text-4xl font-semibold leading-tight tracking-tight text-white">
            One workspace for every intern, task and review.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-300">
            Qubenix AI administrators onboard interns, assign work and review submissions. Interns track their
            own progress in the same system.
          </p>

          <ul className="mt-10 space-y-5">
            {highlights.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-brand-300">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-400">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center justify-between text-[11px] text-ink-500">
          <p>© {new Date().getFullYear()} Qubenix AI Pvt. Ltd.</p>
          <p>Intern Management System</p>
        </div>
      </div>

      <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-6 flex justify-center lg:hidden">
            <BrandMark />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
