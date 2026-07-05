import { createContext, ReactNode } from "react";
import { useLocalStorage } from "../hooks";

// Define the auth type
interface Auth {
  token?: string;
  user?: {
    id: string;
    email: string;
    imageSrc: string;
  };
}

// Define the auth context type including both state and setter
interface AuthContextType {
  auth: Auth;
  setAuth: (auth: Auth) => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Create context with default values
export const AuthContext = createContext<AuthContextType>({
  auth: {},
  setAuth: () => {},
});

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [auth, setAuth] = useLocalStorage<Auth>("auth", {});

  return (
    <AuthContext.Provider value={{ auth, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
