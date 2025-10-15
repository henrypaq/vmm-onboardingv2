import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function LoadingSpinner({ 
  size = 'md', 
  text = 'Loading...', 
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} text-primary animate-spin`} />
      {text && (
        <p className={`${textSizeClasses[size]} font-medium text-gray-700`}>
          {text}
        </p>
      )}
    </div>
  );
}

interface LoadingDialogProps {
  title: string;
  description?: string;
  className?: string;
}

export function LoadingDialog({ 
  title, 
  description, 
  className = '' 
}: LoadingDialogProps) {
  return (
    <div className={`min-h-screen bg-white flex items-center justify-center p-4 ${className}`}>
      <div className="text-center max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <LoadingSpinner size="lg" text={title} />
          {description && (
            <p className="mt-4 text-sm text-gray-600">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
