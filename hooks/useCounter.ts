import { useState, useCallback } from 'react';

interface UseCounterOutput {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  setCount: (value: number) => void;
}

/**
 * A simple counter hook.
 * @param initialValue The initial value for the counter (default: 0).
 * @returns An object with the current count and functions to manipulate it.
 */
const useCounter = (initialValue: number = 0): UseCounterOutput => {
  const [count, setCount] = useState(initialValue);

  const increment = useCallback(() => setCount((prevCount) => prevCount + 1), []);
  const decrement = useCallback(() => setCount((prevCount) => prevCount - 1), []);
  const reset = useCallback(() => setCount(initialValue), [initialValue]);

  return {
    count,
    increment,
    decrement,
    reset,
    setCount,
  };
};

export default useCounter;

// Example Usage:
// import useCounter from '@/hooks/useCounter';
//
// function MyComponent() {
//   const { count, increment, decrement, reset } = useCounter(5);
//
//   return (
//     <div>
//       <p>Count: {count}</p>
//       <button onClick={increment}>Increment</button>
//       <button onClick={decrement}>Decrement</button>
//       <button onClick={reset}>Reset to 5</button>
//     </div>
//   );
// }
