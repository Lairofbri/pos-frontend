import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface DataPoint {
  label: string
  value: number
}

interface TrendChartProps {
  data: DataPoint[]
  height?: number
  color?: string
}

export function TrendChart({ data, height = 180, color = '#C7662E' }: TrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.12} />
            <stop offset="100%" stopColor={color} stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#E8D6C0" strokeDasharray="3 3" strokeOpacity={0.5} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#8C8177' }}
          axisLine={{ stroke: '#E8D6C0' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#8C8177' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `$${v}`}
        />
        <Tooltip
          contentStyle={{
            background: '#FAF6F1',
            border: '1px solid #E8D6C0',
            borderRadius: 12,
            fontSize: 12,
            boxShadow: '0 4px 12px rgba(70,55,40,0.1)',
          }}
          formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Ventas']}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#gradient-${color.replace('#', '')})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
