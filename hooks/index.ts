"use client";

import { useState, useEffect, useContext, ReactNode } from "react";
import { AuthContext } from "../contexts";
import { createPortal } from "react-dom";

interface PortalProps {
  children: ReactNode;
}

export const useLocalStorage = <T>(
  key: string = "value",
  initialValue: T = [] as unknown as T,
) => {
  const [value, setValue] = useState<T>(initialValue);

  // 1. Hydration & Cross-Tab Synchronization
  useEffect(() => {
    if (typeof window === "undefined") return;

    // A. Read or Initialize on mount
    const storedValue = window.localStorage.getItem(key);
    if (storedValue !== null) {
      try {
        setValue(JSON.parse(storedValue));
      } catch {
        setValue(storedValue as unknown as T);
      }
    } else {
      window.localStorage.setItem(
        key,
        typeof initialValue === "object"
          ? JSON.stringify(initialValue)
          : String(initialValue),
      );
    }

    // B. Listen for changes across other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setValue(JSON.parse(e.newValue));
        } catch {
          setValue(e.newValue as unknown as T);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [key]);

  // 2. Updater function
  const updateValue = (newValue: T | ((val: T) => T)) => {
    try {
      // `newValue` can be a single value or a function and we should accept both
      setValue((prevValue) => {
        const valueToStore = newValue instanceof Function ? newValue(prevValue) : newValue;

        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            key,
            typeof valueToStore === "object"
              ? JSON.stringify(valueToStore)
              : String(valueToStore),
          );
        }

        return valueToStore;
      });
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [value, updateValue] as const;
};

export const useAuth = () => {
  const { auth, setAuth } = useContext(AuthContext);

  return { auth, setAuth };
};

export const useDebounce = <T>(value: T, delay: number = 500): T => {
  const [debounceValue, setDebounceValue] = useState<T>(value);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebounceValue(value);
    }, delay);

    return () => clearTimeout(timeout);
  }, [value, delay]);

  return debounceValue;
};

export const usePortal = (domNode?: HTMLElement | null) => {
  const portalRoot =
    domNode || (document.getElementById("portal-root") as HTMLElement);

  if (!portalRoot) {
    throw new Error(
      "Portal root element not found. Ensure it exists in your HTML.",
    );
  }

  // Define the Portal component
  const Portal = ({ children }: PortalProps) => {
    return createPortal(children, portalRoot);
  };

  return { Portal };
};
