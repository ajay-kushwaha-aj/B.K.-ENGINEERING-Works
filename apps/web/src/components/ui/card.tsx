import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  isGlass?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", isGlass = false, children, ...props }, ref) => {
    const cardClass = isGlass
      ? `glass rounded-2xl shadow-md p-6 ${className}`
      : `bg-card text-card-foreground rounded-2xl border border-border shadow-sm p-6 ${className}`;

    return (
      <div ref={ref} className={cardClass} {...props}>
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";

export const CardHeader = ({ className = "", children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`flex flex-col space-y-1.5 mb-4 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ className = "", children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={`text-xl font-bold tracking-tight text-foreground ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ className = "", children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={`text-sm text-muted-foreground ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent = ({ className = "", children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={className} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ className = "", children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`flex items-center mt-6 pt-4 border-t border-border ${className}`} {...props}>
    {children}
  </div>
);
