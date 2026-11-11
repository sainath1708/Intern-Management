import { CalendarDays, Building2, Mail, Phone, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/ui/PageHeader';
import Card, { CardBody, CardHeader } from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';
import { Badge, InternStatusBadge } from '../components/ui/Badge';
import InfoItem from '../components/ui/InfoItem';
import { formatDate } from '../utils/format';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function ProfilePage() {
  useDocumentTitle('My profile');
  const { user, isAdmin } = useAuth();
  const intern = user?.intern;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My profile"
        description="Your account details in the Qubenix AI Intern Management System."
      />

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardBody className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <Avatar name={user?.name} size="lg" className="ring-4 ring-white shadow-card" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-ink-900">{user?.name}</h2>
                <Badge tone={isAdmin ? 'brand' : 'info'} dot={false}>
                  <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                  {isAdmin ? 'Administrator' : 'Intern'}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-ink-500">{user?.email}</p>
              {intern ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge tone="neutral" dot={false}>
                    <Building2 className="h-3 w-3" aria-hidden="true" />
                    {intern.department}
                  </Badge>
                  <InternStatusBadge status={intern.status} />
                </div>
              ) : null}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Account" description="Managed by Qubenix AI administrators." icon={UserRound} />
          <CardBody className="space-y-5">
            <InfoItem icon={Mail} label="Email address">
              {user?.email}
            </InfoItem>
            <InfoItem icon={ShieldCheck} label="Access level">
              <span className="capitalize">{user?.role}</span>
            </InfoItem>
            <InfoItem icon={CalendarDays} label="Account created">
              {formatDate(user?.createdAt)}
            </InfoItem>
          </CardBody>
        </Card>
      </div>

      {intern ? (
        <Card>
          <CardHeader title="Intern details" description="Maintained by your administrator." icon={Building2} />
          <CardBody className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <InfoItem icon={Building2} label="Department">
              {intern.department}
            </InfoItem>
            <InfoItem icon={Phone} label="Phone">
              {intern.phone}
            </InfoItem>
            <InfoItem icon={CalendarDays} label="Joining date">
              {formatDate(intern.joiningDate)}
            </InfoItem>
            <InfoItem icon={UserRound} label="Profile status">
              <InternStatusBadge status={intern.status} />
            </InfoItem>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
