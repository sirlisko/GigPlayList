import React, { useEffect, useState } from "react";
import { useAuth } from "components/UserContext/UserContext";
import { useRouter } from "next/router";
import { createPkcePair } from "utils/pkce";

import { LogIn } from "lucide-react";

export const CODE_VERIFIER_STORAGE_KEY = "spotifyCodeVerifier";

interface Props {
  onCreatePlaylist?: () => void;
  showDesc?: boolean;
}

const LoginBanner = ({ onCreatePlaylist, showDesc }: Props) => {
  const [redirect, setRedirect] = useState<string>();
  const { user } = useAuth();
  const { isReady, asPath, push } = useRouter();
  useEffect(() => {
    const authEndpoint = "https://accounts.spotify.com/authorize";
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const redirectUri = `${window.location.protocol}//${window.location.host}/auth`;
    const scopes = ["playlist-modify-public"];
    createPkcePair().then(({ codeVerifier, codeChallenge }) => {
      sessionStorage.setItem(CODE_VERIFIER_STORAGE_KEY, codeVerifier);
      setRedirect(
        `${authEndpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes.join(
          "%20",
        )}&response_type=code&code_challenge_method=S256&code_challenge=${codeChallenge}&show_dialog=true`,
      );
    });
  }, [isReady]);
  const onClick = () => {
    if (redirect) {
      localStorage.setItem("redirect", asPath);
      push(redirect);
    }
  };
  return (
    <div suppressHydrationWarning={true}>
      {redirect && (
        <>
          {user ? (
            <button
              className="w-full max-w-xs mx-auto py-3 bg-green-500 text-white rounded-full font-bold hover:bg-green-600 transition-all flex items-center justify-center"
              onClick={onCreatePlaylist}
            >
              Save your playlist to Spotify
            </button>
          ) : (
            <div onClick={onClick}>
              <button className="w-full max-w-xs mx-auto p-3 bg-green-500 text-white rounded-full font-bold hover:bg-green-600 transition-all flex items-center justify-center">
                <LogIn size={18} className="mr-2" />
                LOGIN TO SPOTIFY
              </button>
              {showDesc && (
                <p className="mt-2 text-sm opacity-75">to save your playlist</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LoginBanner;
