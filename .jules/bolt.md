## 2024-05-22 - Timer Interval Optimization
**Learning:** Frequent interval updates (like countdown timers) should use functional state updates and avoid including the changing value in the `useEffect` dependency array. Including the value causes the interval to be cleared and recreated every tick, which is inefficient and can cause drift.
**Action:** Always verify `useEffect` dependencies for timers and use functional state updates `setState(prev => prev - 1)` to keep the effect stable.
