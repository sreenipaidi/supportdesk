import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { useAuth } from '../hooks/useAuth.js';
import { ApiError } from '../api/client.js';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters.')
      .max(128),
    confirmPassword: z.string().min(1, 'Please confirm your password.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-text-primary mb-2">Invalid Link</h1>
        <p className="text-sm text-text-secondary mb-6">
          This password reset link is invalid or has expired.
        </p>
        <Link
          to="/forgot-password"
          className="text-primary hover:text-primary-hover text-sm font-medium"
        >
          Request a new reset link
        </Link>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="text-center">
        <div className="mb-4">
          <svg
            className="h-12 w-12 text-success mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Password reset</h1>
        <p className="text-sm text-text-secondary mb-6">
          Your password has been successfully reset. You can now sign in with your new password.
        </p>
        <Link
          to="/login"
          className="inline-block bg-primary text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-primary-hover transition-colors"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const onSubmit = async (data: ResetPasswordFormData) => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      await resetPassword(token, data.password);
      setIsSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Reset your password</h1>
        <p className="text-sm text-text-secondary mt-1">Enter your new password below.</p>
      </div>

      {serverError && (
        <div
          className="mb-4 p-3 bg-danger-light border border-danger/20 text-danger text-sm rounded-md"
          role="alert"
        >
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input
          label="New password"
          type="password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          error={errors.password?.message}
          disabled={isSubmitting}
          {...register('password')}
        />

        <Input
          label="Confirm password"
          type="password"
          placeholder="Re-enter your password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          disabled={isSubmitting}
          {...register('confirmPassword')}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          disabled={isSubmitting}
          className="w-full"
        >
          Reset Password
        </Button>
      </form>
    </div>
  );
}
