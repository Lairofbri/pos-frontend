import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
/* eslint-disable react-refresh/only-export-components */

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold font-body transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-border bg-bg-surface text-text-secondary",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-danger/30 bg-danger/10 text-danger",
        danger:
          "border-danger/30 bg-danger/10 text-danger",
        outline: "text-foreground",
        success:
          "border-success/30 bg-success/10 text-success",
        warning:
          "border-pos-accent/30 bg-pos-accent/10 text-pos-accent",
        info:
          "border-info/30 bg-info/10 text-info",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
