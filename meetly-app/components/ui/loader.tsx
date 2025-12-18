import { cn } from "@/lib/utils"

interface LoaderProps {
  size?: "sm" | "md" | "lg"
  color?: "primary" | "white" | "black"
  className?: string
}

export function Loader({ size = "md", color = "primary", className }: LoaderProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  }

  const colorClasses = {
    primary: "border-primary",
    white: "border-white",
    black: "border-black"
  }

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-t-transparent",
        sizeClasses[size],
        colorClasses[color],
        className
      )}
    />
  )
}