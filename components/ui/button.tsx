import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-sm font-extrabold tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-45 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border-b-4 border-[color:var(--primary-deep)] hover:brightness-105 active:border-b-0 active:translate-y-1",
        destructive:
          "bg-destructive text-destructive-foreground border-b-4 border-red-700 hover:brightness-105 active:border-b-0 active:translate-y-1",
        outline:
          "border-2 border-border bg-card text-foreground hover:bg-secondary active:translate-y-px",
        secondary:
          "bg-secondary text-secondary-foreground border-b-4 border-border hover:brightness-105 active:border-b-0 active:translate-y-1",
        ghost: "hover:bg-secondary hover:text-foreground rounded-2xl",
        link: "text-primary underline-offset-4 hover:underline",
        success:
          "bg-[color:var(--success)] text-[color:var(--success-foreground)] border-b-4 border-[color:var(--primary-deep)] hover:brightness-105 active:border-b-0 active:translate-y-1",
        info:
          "bg-[color:var(--info)] text-[color:var(--info-foreground)] border-b-4 border-sky-700 hover:brightness-105 active:border-b-0 active:translate-y-1",
      },
      size: {
        default: "h-12 px-5 py-2 sm:h-11",
        sm: "h-9 px-3.5 text-xs rounded-xl",
        lg: "h-14 px-8 text-base",
        icon: "h-11 w-11 sm:h-10 sm:w-10 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
