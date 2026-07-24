import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
/* eslint-disable react-refresh/only-export-components */

import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/Spinner"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold font-body transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-pos-accent text-white border-2 border-pos-accent hover:bg-pos-accent-hover active:bg-pos-accent-hover",
        primary:
          "bg-pos-accent text-white border-2 border-pos-accent hover:bg-pos-accent-hover active:bg-pos-accent-hover",
        destructive:
          "bg-danger text-white border-2 border-danger hover:brightness-110",
        danger:
          "bg-danger text-white border-2 border-danger hover:brightness-110",
        outline:
          "bg-transparent text-text-primary border-2 border-border hover:border-pos-accent hover:text-pos-accent",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "bg-transparent text-text-secondary border-2 border-transparent hover:text-text-primary hover:bg-bg-surface",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2.5",
        sm: "h-9 rounded-md px-3 py-1.5 text-sm",
        lg: "h-11 rounded-md px-7 py-3.5 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  icon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, icon, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={props.disabled || loading}
        {...props}
      >
        {loading ? <Spinner size="sm" /> : icon}
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
