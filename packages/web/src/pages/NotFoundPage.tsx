import { Link } from 'react-router';
import { Button } from '../components/ui/Button.js';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-alt px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-primary mb-4">404</p>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Page not found</h1>
        <p className="text-sm text-text-secondary mb-6 max-w-md">
          The page you are looking for does not exist or you may not have permission to access it.
        </p>
        <Link to="/">
          <Button variant="primary">Go to Home</Button>
        </Link>
      </div>
    </div>
  );
}
