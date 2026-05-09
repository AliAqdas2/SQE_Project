import { Link } from "wouter";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
      <Link href="/dashboard" className="hover:text-foreground transition-colors" data-testid="breadcrumb-home">
        <Home className="h-4 w-4" />
      </Link>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <ChevronRight className="h-4 w-4" />
          {item.href ? (
            <Link 
              href={item.href} 
              className="hover:text-foreground transition-colors"
              data-testid={`breadcrumb-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium" data-testid={`breadcrumb-current-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
