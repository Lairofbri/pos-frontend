import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { queryDefaults } from '../../../config/queries'
import { listarCombos } from './api'
import { DataTable, type Column } from '../../../components/shared/DataTable'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { Combo } from '../../../types'

const columns: Column<Combo>[] = [
  { key: 'nombre', header: 'Nombre', sortable: true },
  {
    key: 'precio',
    header: 'Precio',
    sortable: true,
    render: (c) => <span className="font-mono">${c.precio?.toFixed(2)}</span>,
  },
  {
    key: 'costo_estimado',
    header: 'Costo est.',
    sortable: true,
    render: (c) => (
      <span className="font-mono text-xs text-text-secondary">
        {c.costo_estimado != null ? `$${c.costo_estimado.toFixed(2)}` : '—'}
      </span>
    ),
  },
  {
    key: 'productos',
    header: 'Productos',
    render: (c) => <span className="text-xs text-text-secondary">{c.productos?.length ?? 0} items</span>,
  },
  {
    key: 'disponible',
    header: 'Inventario',
    render: (c) =>
      c.disponible === false ? (
        <Badge variant="warning">Faltante</Badge>
      ) : (
        <Badge variant="success">Completo</Badge>
      ),
  },
  {
    key: 'activo',
    header: 'Estado',
    render: (c) => <Badge variant={c.activo ? 'success' : 'danger'}>{c.activo ? 'Activo' : 'Inactivo'}</Badge>,
  },
]

export default function CombosPage() {
  const navigate = useNavigate()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['combos'],
    queryFn: () => listarCombos(true),
    ...queryDefaults('combos'),
  })

  return (
    <div className="px-4 pb-4">
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={() => navigate('/admin/combos/crear')}>Nuevo Combo</Button>
      </div>
      <DataTable
        data={data ?? []}
        columns={columns}
        onRowClick={(c) => navigate(`/admin/combos/editar/${c.id}`)}
        isLoading={isLoading}
        error={error as Error | null}
        onRetry={() => refetch()}
        keyExtractor={(c) => c.id}
      />
    </div>
  )
}
