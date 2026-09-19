import {
  createContext,
  useContext,
  ReactNode,
  ReactElement,
  useState,
  useEffect,
} from "react";

export interface AuthUser {
  access_token: string;
}

interface SpotifyUser {
  id: string;
}

interface User {
  accessToken: string;
  user: SpotifyUser;
  expires: Date;
}

interface Props {
  children: ReactNode;
}

export const UserContext = createContext<{
  user?: User;
  setUser?: (arg: AuthUser, user: SpotifyUser) => void;
  logout?: () => void;
}>({});

export const AuthProvider = ({ children }: Props): ReactElement => {
  const [user, setUser] = useState<User>();
  const persistUser = ({ access_token }: AuthUser, user: SpotifyUser) => {
    const now = new Date();
    const auth: User = {
      accessToken: access_token,
      user,
      expires: new Date(now.setHours(now.getHours() + 1)),
    };
    setUser(auth);
    localStorage.setItem("spotAuth", JSON.stringify(auth));
  };
  const logout = () => {
    setUser(undefined);
    localStorage.removeItem("spotAuth");
  };
  useEffect(() => {
    try {
      const persistedAuth = localStorage.getItem("spotAuth");
      if (persistedAuth) {
        const auth = JSON.parse(persistedAuth);
        if (new Date(auth.expires).getTime() > new Date().getTime()) {
          setUser(auth);
        }
      }
    } catch {
      localStorage.removeItem("spotAuth");
    }
  }, []);
  return (
    <UserContext.Provider
      value={{
        user,
        setUser: persistUser,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
