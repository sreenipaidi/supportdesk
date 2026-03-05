import { useState } from 'react';
import { Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { useAuth } from '../hooks/useAuth.js';
import { ApiError } from '../api/client.js';

const registerSchema = z.object({
  company_name: z.string().min(1, 'Company name is required.').max(100),
  full_name: z.string().min(1, 'Full name is required.').max(100),
  email: z.string().email('Please enter a valid email address.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(128),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { company_name: '', full_name: '', email: '', password: '' },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      await registerUser(data);
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
        <h1 className="text-2xl font-bold text-text-primary">Create your account</h1>
        <p className="text-sm text-text-secondary mt-1">
          Set up your support platform in minutes
        </p>
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
          label="Company name"
          type="text"
          placeholder="Acme Corp"
          error={errors.company_name?.message}
          disabled={isSubmitting}
          {...register('company_name')}
        />

        <Input
          label="Your name"
          type="text"
          placeholder="Jane Smith"
          autoComplete="name"
          error={errors.full_name?.message}
          disabled={isSubmitting}
          {...register('full_name')}
        />

        <Input
          label="Email address"
          type="email"
          placeholder="admin@company.com"
          autoComplete="email"
          error={errors.email?.message}
          disabled={isSubmitting}
          {...register('email')}
        />

        <Input
          label="Password"
          type="password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          error={errors.password?.message}
          helperText="Must be at least 8 characters."
          disabled={isSubmitting}
          {...register('password')}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          disabled={isSubmitting}
          className="w-full"
        >
          Create Account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        Already have an account?{' '}
        <Link to="/login" className="text-primary hover:text-primary-hover font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
