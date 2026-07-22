import { useEffect, useState } from 'react'

/**
 * Returns `value`, but delayed by `delayMs` after the last change.
 * Used to avoid firing a request (or a URL update) on every keystroke.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
