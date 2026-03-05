import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Input, Textarea } from '../components/ui/Input.js';
import { Select } from '../components/ui/Select.js';
import { useCreateTicket } from '../hooks/useTickets.js';
import { useUIStore } from '../stores/ui.store.js';

const PRIORITY_OPTIONS = [
  { value: '', label: 'Select priority', disabled: true },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

interface FormErrors {
  subject?: string;
  description?: string;
  priority?: string;
}

export function CreateTicketPage() {
  const navigate = useNavigate();
  const addToast = useUIStore((s) => s.addToast);
  const createTicket = useCreateTicket();

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('');
  const [tags, setTags] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!subject.trim()) {
      newErrors.subject = 'Please enter a subject for the ticket.';
    } else if (subject.trim().length > 200) {
      newErrors.subject = 'Subject must be 200 characters or fewer.';
    }

    if (!description.trim()) {
      newErrors.description = 'Please provide a description of the issue.';
    } else if (description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters.';
    }

    if (!priority) {
      newErrors.priority = 'Please select a priority level.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [subject, description, priority]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validate()) return;

      const tagList = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      try {
        const ticket = await createTicket.mutateAsync({
          subject: subject.trim(),
          description: description.trim(),
          priority,
          tags: tagList.length > 0 ? tagList : undefined,
        });
        addToast({
          type: 'success',
          message: `Ticket ${ticket.ticket_number} created successfully.`,
        });
        navigate(`/tickets/${ticket.id}`);
      } catch {
        addToast({
          type: 'error',
          message: 'Failed to create ticket. Please try again.',
        });
      }
    },
    [subject, description, priority, tags, validate, createTicket, addToast, navigate],
  );

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back link */}
      <Link
        to="/tickets"
        className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-primary transition-colors mb-4"
        aria-label="Back to tickets list"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
            clipRule="evenodd"
          />
        </svg>
        Back to tickets
      </Link>

      <h1 className="text-2xl font-bold text-text-primary mb-6">
        Create New Ticket
      </h1>

      <Card padding="lg">
        <form onSubmit={handleSubmit} noValidate aria-label="Create ticket form">
          <div className="space-y-5">
            {/* Subject */}
            <Input
              label="Subject"
              id="ticket-subject"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                if (errors.subject) {
                  setErrors((prev) => ({ ...prev, subject: undefined }));
                }
              }}
              placeholder="Brief description of the issue"
              required
              maxLength={200}
              error={errors.subject}
              aria-required="true"
            />

            {/* Description */}
            <Textarea
              label="Description"
              id="ticket-description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) {
                  setErrors((prev) => ({ ...prev, description: undefined }));
                }
              }}
              placeholder="Describe the issue in detail (minimum 20 characters)..."
              required
              className="min-h-[160px]"
              error={errors.description}
              aria-required="true"
            />

            {/* Priority */}
            <Select
              label="Priority"
              id="ticket-priority"
              options={PRIORITY_OPTIONS}
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                if (errors.priority) {
                  setErrors((prev) => ({ ...prev, priority: undefined }));
                }
              }}
              error={errors.priority}
              aria-required="true"
            />

            {/* Tags */}
            <Input
              label="Tags"
              id="ticket-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Comma-separated tags (e.g., billing, login)"
              helperText="Optional. Separate multiple tags with commas."
            />

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/tickets')}
                disabled={createTicket.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={createTicket.isPending}
                disabled={createTicket.isPending}
                aria-label="Submit new ticket"
              >
                Create Ticket
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
