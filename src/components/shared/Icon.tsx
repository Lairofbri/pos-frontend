import { createElement } from 'react'
import { getIcon } from '../../constants/icons'

export function Icon({ name, className = 'size-5' }: { name: string; className?: string }) {
  return createElement(getIcon(name), { className })
}
