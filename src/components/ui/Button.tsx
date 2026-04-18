import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/src/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 uppercase tracking-widest font-cyber group relative overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(57,255,20,0.2)] hover:bg-primary/90 hover:shadow-[0_0_25px_rgba(57,255,20,0.4)] active:scale-95",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]",
        outline:
          "border-2 border-primary/50 bg-transparent text-primary hover:bg-primary/10 shadow-[0_0_10px_rgba(57,255,20,0.1)] hover:shadow-[0_0_20px_rgba(57,255,20,0.2)]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-primary/10 hover:text-primary transition-colors",
        link: "text-primary underline-offset-4 hover:underline",
        cyber: "bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-dark-navy shadow-[0_0_15px_rgba(57,255,20,0.3)] hover:shadow-[0_0_30px_rgba(57,255,20,0.6)] transition-all duration-300",
      },
      size: {
        default: "h-11 px-8 py-2",
        sm: "h-9 rounded-md px-4 text-xs",
        lg: "h-14 rounded-md px-12 text-base",
        icon: "h-10 w-10",
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
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
