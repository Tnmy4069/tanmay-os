import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border-2 px-2.5 py-0.5 text-[11px] font-extrabold tracking-wide",
  {
    variants: {
      variant: {
        default: "border-primary/30 bg-primary/15 text-[color:var(--primary-deep)] dark:text-primary",
        secondary: "border-border bg-secondary text-secondary-foreground",
        destructive: "border-destructive/30 bg-destructive/15 text-destructive",
        outline: "border-border text-muted-foreground",
        success: "border-[color:var(--success)]/40 bg-[color:var(--primary-soft)] text-[color:var(--primary-deep)] dark:text-primary",
        warning: "border-[color:var(--warning)]/50 bg-[color:var(--warning)]/20 text-[color:var(--warning-foreground)]",
        info: "border-[color:var(--info)]/40 bg-[color:var(--info)]/15 text-[color:var(--info)]",
        xp: "border-[color:var(--xp)]/40 bg-[color:var(--xp)]/15 text-[color:var(--xp)]",
        streak: "border-[color:var(--streak)]/40 bg-[color:var(--streak)]/15 text-[color:var(--streak)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
