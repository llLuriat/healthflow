import { LucideIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="p-12 text-center">
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: 'var(--hf-primary-light)' }}
        >
          <Icon 
            className="w-8 h-8"
            style={{ color: 'var(--hf-primary)' }}
          />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        
        <p className="text-gray-600 mb-6 max-w-sm mx-auto">
          {description}
        </p>
        
        {actionLabel && onAction && (
          <Button
            onClick={onAction}
            className="text-white"

          >
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
