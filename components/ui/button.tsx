import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition-[background,color,box-shadow,transform] duration-200 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-bg shadow-[0_0_0_1px_rgb(41_212_255/0.4),0_8px_30px_-8px_rgb(41_212_255/0.6)] hover:shadow-[0_0_0_1px_rgb(41_212_255/0.7),0_10px_40px_-6px_rgb(41_212_255/0.8)] hover:brightness-110",
        secondary:
          "border border-line-strong bg-white/[0.03] text-fg hover:bg-white/[0.07] hover:border-white/25",
        ghost: "text-muted hover:text-fg hover:bg-white/[0.05]",
        gold: "bg-gold text-bg shadow-[0_8px_30px_-8px_rgb(245_196_81/0.6)] hover:brightness-110",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps extends ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
