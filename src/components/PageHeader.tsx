import { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  icon?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions, icon }: PageHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-4 mb-6 md:mb-8">
      <div className="space-y-1.5 min-w-0">
        {eyebrow && <p className="section-eyebrow">{eyebrow}</p>}
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-glow shrink-0 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-primary-foreground">
              {icon}
            </div>
          )}
          <h1 className="page-title truncate">{title}</h1>
        </div>
        {description && <p className="page-subtitle">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
