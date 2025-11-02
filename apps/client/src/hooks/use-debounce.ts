import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce a changing value.
 * The debounced value will only update after the specified delay
 * if the original value doesn't change during that time.
 *
 * @template T - The type of the value to debounce
 * @param value - The current value that may change frequently
 * @param delay - Delay in milliseconds to wait before updating the debounced value
 * @returns The debounced value
 */
function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set a timeout to update the debounced value after the delay
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clear the timeout if value or delay changes before the timer completes
    return () => {
      clearTimeout(timeoutId);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
