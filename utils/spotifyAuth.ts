export const CODE_VERIFIER_STORAGE_KEY = "spotifyCodeVerifier";

export interface TokenSet {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

const requestToken = async (
  params: Record<string, string>,
): Promise<TokenSet | undefined> => {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ?? "",
      ...params,
    }),
  });
  if (!response.ok) {
    return undefined;
  }
  const { access_token, refresh_token, expires_in } = await response.json();
  return access_token ? { access_token, refresh_token, expires_in } : undefined;
};

export const exchangeCodeForToken = async (code: string) => {
  const codeVerifier = sessionStorage.getItem(CODE_VERIFIER_STORAGE_KEY);
  if (!codeVerifier) {
    return undefined;
  }
  sessionStorage.removeItem(CODE_VERIFIER_STORAGE_KEY);
  return requestToken({
    grant_type: "authorization_code",
    code,
    redirect_uri: `${window.location.protocol}//${window.location.host}/auth`,
    code_verifier: codeVerifier,
  });
};

export const refreshAccessToken = (refreshToken: string) =>
  requestToken({ grant_type: "refresh_token", refresh_token: refreshToken });
