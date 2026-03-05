import { useState } from 'react';
import { useParams } from 'react-router';
import { useCSATSurvey, useSubmitCSAT } from '../hooks/useCSATSurvey.js';
import { Spinner } from '../components/ui/Spinner.js';
import { Button } from '../components/ui/Button.js';
import { cn } from '../lib/cn.js';

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-2 justify-center" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
          className="focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary rounded"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className={cn(
              'h-10 w-10 transition-colors cursor-pointer',
              (hovered >= star || value >= star)
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-none text-gray-300',
            )}
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
            />
          </svg>
        </button>
      ))}
    </div>
  );
}

function ThankYouView({ tenantName, brandColor }: { tenantName: string; brandColor: string }) {
  return (
    <div className="text-center py-8">
      <div
        className="inline-flex items-center justify-center h-16 w-16 rounded-full mb-6"
        style={{ backgroundColor: brandColor }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
      <p className="text-gray-600 max-w-sm mx-auto">
        Your feedback helps {tenantName} improve their support. We appreciate you taking the time to respond.
      </p>
    </div>
  );
}

function AlreadySubmittedView({ tenantName }: { tenantName: string }) {
  return (
    <div className="text-center py-8">
      <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Already Submitted</h2>
      <p className="text-gray-600 max-w-sm mx-auto">
        You have already submitted your feedback for this ticket. Thank you for helping {tenantName} improve their service.
      </p>
    </div>
  );
}

export function CSATSurveyPage() {
  const { token } = useParams<{ token: string }>();
  const { data: survey, isLoading, error } = useCSATSurvey(token ?? '');
  const submitMutation = useSubmitCSAT(token ?? '');

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" label="Loading survey" />
      </div>
    );
  }

  if (error || !survey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md w-full mx-4 text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-50 mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.072 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Survey Link</h2>
          <p className="text-gray-600">
            This survey link is invalid or has expired. Please check the link and try again.
          </p>
        </div>
      </div>
    );
  }

  const brandColor = survey.brand_color || '#2563EB';

  const handleSubmit = () => {
    if (rating === 0) return;

    submitMutation.mutate(
      { rating, comment: comment.trim() || undefined },
      {
        onSuccess: () => {
          setSubmitted(true);
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 max-w-lg w-full">
        {/* Header */}
        <div
          className="rounded-t-lg px-6 py-4 text-white"
          style={{ backgroundColor: brandColor }}
        >
          <div className="flex items-center gap-3">
            {survey.logo_url ? (
              <img
                src={survey.logo_url}
                alt={`${survey.tenant_name} logo`}
                className="h-8 w-8 object-contain bg-white rounded"
              />
            ) : (
              <div className="h-8 w-8 rounded bg-white/20 flex items-center justify-center">
                <span className="text-sm font-bold">{survey.tenant_name.charAt(0)}</span>
              </div>
            )}
            <span className="font-semibold">{survey.tenant_name}</span>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {submitted ? (
            <ThankYouView tenantName={survey.tenant_name} brandColor={brandColor} />
          ) : survey.already_submitted ? (
            <AlreadySubmittedView tenantName={survey.tenant_name} />
          ) : (
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  How was your experience?
                </h2>
                <p className="text-sm text-gray-500">
                  Regarding ticket <span className="font-medium">{survey.ticket_number}</span>:
                  {' '}{survey.subject}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Handled by <span className="font-medium">{survey.agent_name}</span>
                </p>
              </div>

              {/* Star rating */}
              <div className="mb-6">
                <StarRating value={rating} onChange={setRating} />
                {rating > 0 && (
                  <p className="text-center text-sm text-gray-500 mt-2">
                    {rating === 1 && 'Very Dissatisfied'}
                    {rating === 2 && 'Dissatisfied'}
                    {rating === 3 && 'Neutral'}
                    {rating === 4 && 'Satisfied'}
                    {rating === 5 && 'Very Satisfied'}
                  </p>
                )}
              </div>

              {/* Comment */}
              <div className="mb-6">
                <label htmlFor="csat-comment" className="block text-sm font-medium text-gray-700 mb-1">
                  Additional comments (optional)
                </label>
                <textarea
                  id="csat-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us more about your experience..."
                  maxLength={500}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-400 text-right mt-1">
                  {comment.length}/500
                </p>
              </div>

              {/* Submit */}
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                disabled={rating === 0}
                isLoading={submitMutation.isPending}
                onClick={handleSubmit}
                style={{ backgroundColor: brandColor }}
              >
                Submit Feedback
              </Button>

              {submitMutation.isError && (
                <p className="text-sm text-red-600 text-center mt-3">
                  {submitMutation.error?.message || 'Failed to submit feedback. Please try again.'}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
