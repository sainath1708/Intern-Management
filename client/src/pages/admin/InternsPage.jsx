import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, Pencil, Plus, Trash2, UserPlus, Users } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import SearchInput from '../../components/ui/SearchInput';
import Select from '../../components/ui/Select';
import Avatar from '../../components/ui/Avatar';
import { InternStatusBadge } from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { TableSkeleton } from '../../components/ui/Spinner';
import InternFormModal from '../../components/interns/InternFormModal';
import { deleteIntern, listInterns } from '../../services/internService';
import { DEPARTMENTS, INTERN_STATUSES, DEFAULT_PAGE_SIZE } from '../../utils/constants';
import { formatDate } from '../../utils/format';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export default function InternsPage() {
  useDocumentTitle('Interns');
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [page, setPage] = useState(1);

  const [data, setData] = useState({ items: [], pagination: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const hasFilters = Boolean(debouncedSearch || department || status);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await listInterns({
        search: debouncedSearch,
        department,
        status,
        page,
        limit: DEFAULT_PAGE_SIZE,
      });
      setData(result);
    } catch (requestError) {
      setError(requestError.message || 'Unable to load interns.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, department, status, page, refreshKey]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, department, status]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (intern) => {
    setEditing(intern);
    setFormOpen(true);
  };

  const handleSaved = () => {
    setRefreshKey((key) => key + 1);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      const result = await deleteIntern(deleting.id);
      toast.success(result?.message || 'Intern removed');
      setDeleting(null);
      if (data.items.length === 1 && page > 1) setPage((current) => current - 1);
      else handleSaved();
    } catch (requestError) {
      toast.error(requestError.message || 'Unable to delete this intern.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setDepartment('');
    setStatus('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Interns"
        description="Create login accounts, maintain profiles and keep departments organised."
        actions={
          <Button icon={Plus} onClick={openCreate}>
            Add intern
          </Button>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-ink-100 p-4 lg:flex-row lg:items-center">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name or email…"
            className="w-full lg:max-w-sm"
            ariaLabel="Search interns"
          />
          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
            <Select value={department} onChange={(event) => setDepartment(event.target.value)} aria-label="Filter by department">
              <option value="">All departments</option>
              {DEPARTMENTS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
            <Select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status">
              <option value="">All statuses</option>
              {INTERN_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {item === 'active' ? 'Active' : 'Inactive'}
                </option>
              ))}
            </Select>
            {hasFilters ? (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="col-span-2 sm:col-span-1">
                Clear
              </Button>
            ) : null}
          </div>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : loading ? (
          <TableSkeleton rows={6} columns={6} />
        ) : data.items.length === 0 ? (
          <EmptyState
            icon={hasFilters ? Users : UserPlus}
            title={hasFilters ? 'No interns match these filters' : 'No interns yet'}
            description={
              hasFilters
                ? 'Try a different search term or clear the filters to see the full team.'
                : 'Add your first intern to create their login account and profile.'
            }
            action={
              hasFilters ? (
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button icon={Plus} onClick={openCreate}>
                  Add intern
                </Button>
              )
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Intern</th>
                    <th>Department</th>
                    <th className="hidden xl:table-cell">Phone</th>
                    <th className="hidden lg:table-cell">Joining date</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((intern) => (
                    <tr key={intern.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar name={intern.name} size="sm" />
                          <div className="min-w-0">
                            <Link
                              to={`/admin/interns/${intern.id}`}
                              className="block truncate text-sm font-semibold text-ink-800 hover:text-brand-700"
                            >
                              {intern.name}
                            </Link>
                            <p className="truncate text-xs text-ink-500">{intern.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap">{intern.department}</td>
                      <td className="hidden whitespace-nowrap xl:table-cell">{intern.phone}</td>
                      <td className="hidden whitespace-nowrap lg:table-cell">{formatDate(intern.joiningDate)}</td>
                      <td>
                        <InternStatusBadge status={intern.status} />
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/admin/interns/${intern.id}`}
                            className="rounded-lg p-2 text-ink-400 transition hover:bg-ink-100 hover:text-ink-800"
                            aria-label={`View ${intern.name}`}
                            title="View profile"
                          >
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => openEdit(intern)}
                            className="rounded-lg p-2 text-ink-400 transition hover:bg-ink-100 hover:text-ink-800"
                            aria-label={`Edit ${intern.name}`}
                            title="Edit intern"
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleting(intern)}
                            className="rounded-lg p-2 text-ink-400 transition hover:bg-rose-50 hover:text-rose-600"
                            aria-label={`Delete ${intern.name}`}
                            title="Delete intern"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              pagination={data.pagination}
              onPageChange={setPage}
              loading={loading}
              itemLabel="interns"
            />
          </>
        )}
      </Card>

      <InternFormModal
        open={formOpen}
        intern={editing}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title={`Delete ${deleting?.name || 'intern'}?`}
        description="Interns with task or submission history are archived instead of deleted, so historical records are never lost. Interns without history are removed completely."
        confirmLabel="Delete intern"
        variant="danger"
      >
        {deleting ? (
          <div className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            The linked login account will be deactivated. This action cannot be undone from the dashboard.
          </div>
        ) : null}
      </ConfirmDialog>
    </div>
  );
}
