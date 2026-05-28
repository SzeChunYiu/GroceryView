/** True when the pathname is an operator-only backstage route. */
export function isBackstagePath(pathname: string): boolean {
  return pathname.startsWith('/admin');
}
