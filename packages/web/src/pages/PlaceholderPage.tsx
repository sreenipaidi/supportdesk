import { Card } from '../components/ui/Card.js';

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">{title}</h1>
      <Card padding="lg">
        <div className="text-center py-8">
          <svg
            className="h-12 w-12 text-gray-300 mx-auto mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <p className="text-text-secondary text-sm">
            {description || 'This page is under construction.'}
          </p>
        </div>
      </Card>
    </div>
  );
}
