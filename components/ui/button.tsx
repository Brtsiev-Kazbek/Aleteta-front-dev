import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/*
 * Кнопки повторяют лендинг: основное действие — плотный чёрный прямоугольник
 * с малым радиусом, второстепенное — контур по stone-200. Никаких заливок
 * фирменным цветом и мягких теней: на продуктовых экранах они шумят.
 */
const buttonVariants = cva(
  /*
   * У выключенной кнопки свои цвета, а не общая прозрачность.
   *
   * Прозрачность гасит фон и надпись одновременно, и на чернильной кнопке
   * белый текст исчезает совсем: остаётся серый прямоугольник, по которому не
   * понять, что именно недоступно.
   */
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-body font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 disabled:pointer-events-none disabled:border-line disabled:bg-surface-2 disabled:text-fg-faint",
  {
    variants: {
      variant: {
        default: "bg-inverse text-inverse-fg hover:bg-inverse-3",
        destructive: "bg-danger-fg text-inverse-fg hover:opacity-90",
        outline:
          "border border-line bg-surface text-fg-muted hover:border-line-strong hover:bg-bg hover:text-fg",
        secondary: "bg-surface-2 text-fg hover:bg-surface-3",
        ghost: "text-fg-subtle hover:bg-surface-2 hover:text-fg",
        link: "text-fg underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-caption",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
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
