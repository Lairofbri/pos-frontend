import { createElement } from 'react'
import { getIcon } from '../../constants/icons'

export function Icon({ name, className = 'w-5 h-5' }: { name: string; className?: string }) {
  return createElement(getIcon(name), { className })
}
