import {
  createContext,
  useContext,
  ReactNode,
  ReactElement,
  useState,
  useEffect,
} from "react";

import { refreshAccessToken, TokenSet } from "utils/spotifyAuth";

interface SpotifyUser {
  id: string;
}

interface User {
  accessToken: string;
  refreshToken?: string;
  user: SpotifyUser;
  expires: Date;
}

interface Props {
  children: ReactNode;
}

const STORAGE_KEY = "spotAuth";
// Refresh a little early so a save never starts with a token about to lapse.
const EXPIRY_MARGIN_MS = 60 * 1000;

const toUser = (
  { access_token, refresh_token, expires_in = 3600 }: TokenSet,
  user: SpotifyUser,
  previousRefreshToken?: string,
): User => ({
  accessToken: access_token,
  // Spotify doesn't always rotate the refresh token.
  refreshToken: refresh_token ?? previousRefreshToken,
  user,
  expires: new Date(Date.now() + expires_in * 1000),
});

const isFresh = ({ expires }: User) =>
  new Date(expires).getTime() - EXPIRY_MARGIN_MS > Date.now();

export const UserContext = createContext<{
  user?: User;
  setUser?: (token: TokenSet, user: SpotifyUser) => void;
  getAccessToken?: () => Promise<string | undefined>;
  logout?: () => void;
}>({});

export const AuthProvider = ({ children }: Props): ReactElement => {
  const [user, setUser] = useState<User>();
  const persist = (auth: User) => {
    setUser(auth);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
  };
  const logout = () => {
    setUser(undefined);
    localStorage.removeItem(STORAGE_KEY);
  };
  const refresh = async (current: User) => {
    if (!current.refreshToken) {
      return undefined;
    }
    const token = await refreshAccessToken(current.refreshToken).catch(
      () => undefined,
    );
    if (!token) {
      return undefined;
    }
    const next = toUser(token, current.user, current.refreshToken);
    persist(next);
    return next;
  };
  const getAccessToken = async () => {
    if (!user) {
      return undefined;
    }
    if (isFresh(user)) {
      return user.accessToken;
    }
    const next = await refresh(user);
    if (!next) {
      logout();
    }
    return next?.accessToken;
  };
  useEffect(() => {
    try {
      const persistedAuth = localStorage.getItem(STORAGE_KEY);
      if (persistedAuth) {
        const auth: User = JSON.parse(persistedAuth);
        if (isFresh(auth)) {
          setUser(auth);
        } else {
          refresh(auth).then((next) => {
            if (!next) {
              localStorage.removeItem(STORAGE_KEY);
            }
          });
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);
  return (
    <UserContext.Provider
      value={{
        user,
        setUser: (token, spotifyUser) => persist(toUser(token, spotifyUser)),
        getAccessToken,
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
