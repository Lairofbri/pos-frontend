interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
}

const sizes = { sm: 'size-4', md: 'size-6', lg: 'size-8' }

export function Spinner({ size = 'md' }: SpinnerProps) {
  return (
    <div className={`${sizes[size]} border-2 border-border border-t-accent rounded-full animate-spin`} />
  )
}
