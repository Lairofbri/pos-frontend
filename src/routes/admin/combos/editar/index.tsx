import { useParams } from 'react-router-dom'
import { ComboBuilder } from '../components/ComboBuilder'

export default function EditarComboPage() {
  const { id } = useParams<{ id: string }>()
  return <ComboBuilder comboId={id} />
}
