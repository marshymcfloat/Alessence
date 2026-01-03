"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

export function useQueryState<T = string>(
  key: string,
  options: {
    defaultValue?: T;
    parse?: (value: string | null) => T | null;
  } = {}
) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Get current value
  const value = (() => {
    const param = searchParams.get(key);
    // If the param is missing, return default value
    if (param === null) return options.defaultValue;
    // If we have a parse function, use it
    if (options.parse) {
      return options.parse(param) ?? options.defaultValue;
    }
    // Otherwise return as is
    return (param as unknown as T);
  })();

  const setValue = useCallback(
    (newValue: T | ((prev: T) => T) | null) => {
      const currentParams = new URLSearchParams(Array.from(searchParams.entries()));

      // Resolve the new value if it's a function update
      // We need to cast 'value' to T because the calculated value above might be undefined if no default is provided
      // checking 'value' usage here is slightly tricky due to closure scope vs fresh render
      // But for simple replacement, usually we don't depend on 'prev' inside the setter in these usages.
      // However, to be robust:
      let resolvedValue: T | null;
      
      if (typeof newValue === "function") {
         // This re-calculates current value to ensure freshness if used inside callback
         const currentParam = currentParams.get(key);
         const currentVal = (currentParam !== null && options.parse ? options.parse(currentParam) : currentParam) ?? options.defaultValue;
         resolvedValue = (newValue as any)(currentVal);
      } else {
         resolvedValue = newValue;
      }

      if (resolvedValue === null || resolvedValue === undefined || resolvedValue === "") {
        currentParams.delete(key);
      } else {
        currentParams.set(key, String(resolvedValue));
      }

      const search = currentParams.toString();
      const query = search ? `?${search}` : "";

      router.push(`${pathname}${query}`, { scroll: false });
    },
    [key, options, pathname, router, searchParams]
  );

  return [value, setValue] as const;
}
