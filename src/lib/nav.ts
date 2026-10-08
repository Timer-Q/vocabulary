import type { Location } from 'react-router-dom'

export function isWordSheet(pathname: string): boolean {
  return /^\/words\/[^/]+$/.test(pathname)
}

export function isWordGraph(pathname: string): boolean {
  return /^\/words\/[^/]+\/graph$/.test(pathname)
}

export function surfaceLocation(location: Location): { pathname: string; search: string } {
  if (isWordSheet(location.pathname)) {
    const background = (location.state as { background?: Location } | null)?.background
    if (background?.pathname) return { pathname: background.pathname, search: background.search || '' }
  }
  return { pathname: location.pathname, search: location.search }
}

export function wordBackground(location: Location): Location {
  if (isWordSheet(location.pathname)) {
    const background = (location.state as { background?: Location } | null)?.background
    if (background?.pathname) return background
  }
  return location
}

export function wordLocation(spelling: string, location: Location) {
  return {
    pathname: `/words/${encodeURIComponent(spelling)}`,
    search: '',
    hash: '',
    state: { background: wordBackground(location) },
  }
}

export function wordGraphPath(spelling: string): string {
  return `/words/${encodeURIComponent(spelling)}/graph`
}
