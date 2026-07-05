import { useState, useEffect, useContext, ReactNode } from "react";
import { AuthContext } from "../contexts";
import { createPortal } from "react-dom";

interface PortalProps {
  children: ReactNode;
}

export const useLocalStorage = <T>(
  key: string = "value",
  initialValue: T = [] as T
) => {
  // utility to check if a value can be parsed as JSON
  const isJsonParsable = (value: string): boolean => {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  };
  // check if it client or not
  const isClient: boolean = typeof window === "undefined";
  // retrieve the stored value from localStorage
  const storedValue = isClient ? localStorage.getItem(key) : null;
  // initialize the state with the stored value or the initial value
  const [value, setValue] = useState(
    storedValue !== null
      ? isJsonParsable(storedValue)
        ? JSON.parse(storedValue)
        : storedValue
      : initialValue
  );

  // update the localStorage whenever the value changes
  useEffect(() => {
    if (isClient) {
      localStorage.setItem(
        key,
        typeof value === "object" ? JSON.stringify(value) : value
      );
    }
  }, [key, value, isClient]);

  // function to update the value in localStorage and state
  const updateValue = <T>(newValue: T) => {
    setValue(newValue);
  };

  return [value, updateValue];
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
  const portalRoot = domNode || document.getElementById("portal-root") as HTMLElement;

  if (!portalRoot) {
    throw new Error(
      "Portal root element not found. Ensure it exists in your HTML."
    );
  }

  // Define the Portal component
  const Portal = ({ children }: PortalProps) => {
    return createPortal(children, portalRoot);
  };

  return { Portal };
};
