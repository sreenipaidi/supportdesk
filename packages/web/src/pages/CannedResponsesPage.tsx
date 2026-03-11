import { useState } from 'react';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Input, Textarea } from '../components/ui/Input.js';
import { useUIStore } from '../stores/ui.store.js';
import { useAuthStore } from '../stores/auth.store.js';
import {
  useCannedResponses,
  useCreateCannedResponse,
  useUpdateCannedResponse,
  useDeleteCannedResponse,
} from '../hooks/useCannedResponses.js';
import type { CannedResponse } from '@busybirdies/shared';

interface FormState {
  title: string;
  body: string;
  category: string;
}

interface CannedResponseModalProps {
  existing?: CannedResponse;
  onClose: () => void;
}

function CannedResponseModal({ existing, onClose }: CannedResponseModalProps) {
  const addToast = useUIStore((s) => s.addToast);
  const create = useCreateCannedResponse();
  const update = useUpdateCannedResponse(existing?.id ?? '');
  const isPending = create.isPending || update.isPending;

  const [form, setForm] = useState<FormState>({
    title: existing?.title ?? '',
    body: existing?.body ?? '',
    category: existing?.category ?? '',
  });

  const [errors, setErrors] = useState<Partial<FormState>>({});

  const validate = () => {
    const e: Partial<FormState> = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.body.trim()) e.body = 'Body is required';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    const payload = {
      title: form.title.trim(),
      body: form.body.trim(),
      category: form.category.trim() || undefined,
    };

    try {
      if (existing) {
        await update.mutateAsync(payload);
        addToast({ type: 'success', message: 'Canned response updated.' });
      } else {
        await create.mutateAsync(payload);
        addToast({ type: 'success', message: 'Canned response created.' });
      }
      onClose();
    } catch {
      addToast({ type: 'error', message: 'Failed to save canned response.' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-surface rounded-xl shadow-lg border border-border w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-text-primary">
            {existing ? 'Edit Canned Response' : 'New Canned Response'}
          </h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Title</label>
            <Input
              value={form.title}
              onChange={(e) => { setForm((f) => ({ ...f, title: e.target.value })); setErrors((err) => ({ ...err, title: undefined })); }}
              placeholder="e.g. Greeting message"
              error={errors.title}
              disabled={isPending}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Category <span className="text-text-secondary font-normal">(optional)</span></label>
            <Input
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              placeholder="e.g. Billing, Technical, Onboarding"
              disabled={isPending}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Body</label>
            <Textarea
              value={form.body}
              onChange={(e) => { setForm((f) => ({ ...f, body: e.target.value })); setErrors((err) => ({ ...err, body: undefined })); }}
              placeholder="Type the canned response content..."
              className="min-h-[140px]"
              disabled={isPending}
            />
            {errors.body && <p className="text-xs text-danger mt-1">{errors.body}</p>}
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <Button variant="secondary" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button onClick={handleSave} isLoading={isPending} disabled={isPending}>
            {existing ? 'Save Changes' : 'Create'}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface CannedResponsesPageProps {
  adminView?: boolean;
}

export function CannedResponsesPage({ adminView = false }: CannedResponsesPageProps) {
  const addToast = useUIStore((s) => s.addToast);
  const user = useAuthStore((s) => s.user);
  const deleteMutation = useDeleteCannedResponse();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingResponse, setEditingResponse] = useState<CannedResponse | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading } = useCannedResponses({
    search: search || undefined,
    category: categoryFilter || undefined,
    per_page: 50,
  });

  const responses = data?.data ?? [];

  // Get unique categories
  const categories = Array.from(new Set(responses.map((r) => r.category).filter(Boolean))) as string[];

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this canned response?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      addToast({ type: 'success', message: 'Canned response deleted.' });
    } catch {
      addToast({ type: 'error', message: 'Failed to delete canned response.' });
    }
    setDeletingId(null);
  };

  const canEdit = (response: CannedResponse) =>
    user?.role === 'admin' || response.created_by.id === user?.id;

  return (
    <div>
      {(modalOpen || editingResponse) && (
        <CannedResponseModal
          existing={editingResponse}
          onClose={() => { setModalOpen(false); setEditingResponse(undefined); }}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {adminView ? 'Shared Canned Responses' : 'Canned Responses'}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Reusable reply templates to speed up your responses.
          </p>
        </div>
        <Button onClick={() => { setEditingResponse(undefined); setModalOpen(true); }}>
          + New Response
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or content..."
          className="flex-1 rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <Card padding="none">
        {isLoading ? (
          <div className="text-center py-12 text-text-secondary text-sm">Loading...</div>
        ) : responses.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-text-primary font-medium">No canned responses yet</p>
            <p className="text-sm text-text-secondary mt-1">Create reusable templates to reply faster.</p>
            <Button className="mt-4" onClick={() => setModalOpen(true)}>+ New Response</Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {responses.map((response) => (
              <div key={response.id} className="flex items-start gap-4 px-5 py-4 hover:bg-surface-alt transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-text-primary">{response.title}</span>
                    {response.category && (
                      <span className="px-2 py-0.5 rounded text-xs bg-surface-alt border border-border text-text-secondary">
                        {response.category}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-secondary line-clamp-2">{response.body}</p>
                  <p className="text-xs text-text-secondary mt-1">
                    By {response.created_by.full_name} · {new Date(response.updated_at).toLocaleDateString()}
                  </p>
                </div>
                {canEdit(response) && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => { setEditingResponse(response); setModalOpen(true); }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => { setDeletingId(response.id); void handleDelete(response.id); }}
                      isLoading={deletingId === response.id && deleteMutation.isPending}
                      disabled={deleteMutation.isPending}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
