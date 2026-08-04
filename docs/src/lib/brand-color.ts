/**
 * Returns the current brand accent color from the CSS variable.
 * Falls back to black/white based on dark mode if the variable isn't available
 * (e.g. during SSR).
 *
 * Usage in React components:
 *   const brand = getBrandColor()          // reads --brand at call time
 *   const brandFg = getBrandFgColor()      // reads --brand-fg
 */
export function getBrandColor(): string {
  if (typeof window === 'undefined') return '#000000';
  const val = getComputedStyle(document.documentElement)
    .getPropertyValue('--brand')
    .trim();
  return val || (document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000');
}

export function getBrandFgColor(): string {
  if (typeof window === 'undefined') return '#ffffff';
  const val = getComputedStyle(document.documentElement)
    .getPropertyValue('--brand-fg')
    .trim();
  return val || (document.documentElement.classList.contains('dark') ? '#000000' : '#ffffff');
}

/**
 * Hook-style helper: resolves the brand color reactively based on isDark.
 * Pass the component's isDark state to get the correct value.
 */
export function resolveBrandColor(isDark: boolean): string {
  // If we have a real CSS env use it, otherwise derive from isDark
  if (typeof window !== 'undefined') {
    return getBrandColor();
  }
  return isDark ? '#ffffff' : '#000000';
}

export function resolveBrandFgColor(isDark: boolean): string {
  if (typeof window !== 'undefined') {
    return getBrandFgColor();
  }
  return isDark ? '#000000' : '#ffffff';
}
