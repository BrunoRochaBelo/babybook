import * as React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * A simple container component that applies consistent styling for cards.  
 * It forwards any provided props to the underlying div.
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className = '', ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`bg-card text-card-foreground rounded-2xl border border-border ${className}`}
      {...props}
    />
  );
});

Card.displayName = 'Card';