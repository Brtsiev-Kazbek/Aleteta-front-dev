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
   * понять, что именно недоступно. Здесь же выключенное состояние сообщает
   * ровно то, что должно: «действие есть, но пока нельзя».
   */
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-body-sm font-medium transition-[background-color,border-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/45 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:border-line disabled:bg-surface-2 disabled:text-fg-faint disabled:shadow-none",
  {
    variants: {
      variant: {
        /*
         * Основное действие — чернильное, а не фирменного цвета. В продукте,
         * где цветом размечены состояния документа (проверено, требует
         * внимания, ошибка), синяя кнопка спорит с ними за внимание и
         * выигрывает не по делу. Чернильная не спорит ни с чем.
         *
         * Токен `fg`, а не `inverse`: кнопка обязана перевернуться вместе с
         * темой, а обложка лендинга — нет.
         */
        default: "bg-fg text-surface shadow-raise hover:bg-fg-muted",
        destructive: "bg-danger text-inverse-fg shadow-raise hover:opacity-90",
        outline:
          "border border-line bg-surface text-fg-muted shadow-raise hover:border-line-strong hover:text-fg",
        secondary: "bg-surface-2 text-fg hover:bg-surface-3",
        ghost: "text-fg-subtle hover:bg-surface-2 hover:text-fg",
        link: "text-brand underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-3.5",
        sm: "h-8 px-3 text-caption",
        lg: "h-11 px-6 text-body",
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
