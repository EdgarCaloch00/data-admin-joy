import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { api } from "@/lib/api";

interface AuthContextType {
  user: JWTPayload | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface JWTPayload {
  id: string;
  name: string;
  email: string;
  user_role: {
    name: string;
    code: string;
  };
  iat: number;
}

const decodeJWT = (token: string): JWTPayload => {
  try {
    const base64Payload = token.split(".")[1];
    const payload = atob(base64Payload);
    return JSON.parse(payload);
  } catch (error) {
    console.error("Error decoding JWT:", error);
    throw new Error("Invalid token format");
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<JWTPayload | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const userData = localStorage.getItem("user_data");

    if (token && userData) {
      try {
        const parsedUserData = JSON.parse(userData);
        if (parsedUserData) {
          setUser(parsedUserData);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
        // Clean up invalid data
        localStorage.removeItem("user_data");
        localStorage.removeItem("auth_token");
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.login({ email, password });
    const token = response.token; // Assuming the API returns a token

    if (!token) {
      throw new Error("No token received from server");
    }

    const userData = decodeJWT(token);

    if (
      userData.user_role.code !== "admin" &&
      userData.user_role.code !== "superadmin"
    ) {
      throw new Error("Usuario no autorizado");
    }
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem("user_data", JSON.stringify(userData));
    localStorage.setItem("auth_token", token);
  };

  const logout = () => {
    api.clearToken();
    localStorage.removeItem("user_data");
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
