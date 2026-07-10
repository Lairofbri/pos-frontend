interface MetricValueProps {
  value: string
  label: string
  trend?: { value: string; up: boolean }
  prefix?: string
}

export function MetricValue({ value, label, trend, prefix }: MetricValueProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-baseline gap-1.5">
        {prefix && <span className="text-sm font-semibold text-text-secondary">{prefix}</span>}
        <span className="dashboard-metric-value">{value}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-secondary font-body">{label}</span>
        {trend && (
          <span className={`text-xs font-semibold font-mono ${trend.up ? 'dashboard-trend-up' : 'dashboard-trend-down'}`}>
            {trend.up ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
    </div>
  )
}
