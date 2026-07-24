const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173'

export function url(path: string): string {
  return `${BASE_URL}${path}`
}
