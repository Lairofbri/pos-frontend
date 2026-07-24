export function PageSkeleton() {
  return (
    <div className="animate-pulse flex flex-col gap-4 p-4">
      <div className="h-8 w-48 rounded-lg bg-bg-surface" />
      <div className="h-12 w-full rounded-lg bg-bg-surface" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 w-full rounded-lg bg-bg-surface" />
        ))}
      </div>
    </div>
  )
}
