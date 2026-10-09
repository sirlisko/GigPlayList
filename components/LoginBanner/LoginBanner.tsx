import React, { useEffect, useState } from "react";
import { useAuth } from "components/UserContext/UserContext";
import { useRouter } from "next/router";
import { createPkcePair } from "utils/pkce";
import { CODE_VERIFIER_STORAGE_KEY } from "utils/spotifyAuth";

import { LogIn } from "lucide-react";

// Holds the page a save was requested from, so it can resume after login.
export const SAVE_AFTER_LOGIN_STORAGE_KEY = "gigplaylist:saveAfterLogin";

interface Props {
  onCreatePlaylist?: () => void;
  label?: string;
}

const BUTTON =
  "flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-spotify px-5 py-2.5 font-semibold text-black transition-colors hover:bg-[#3be477]";

const LoginBanner = ({ onCreatePlaylist, label }: Props) => {
  const [redirect, setRedirect] = useState<string>();
  const { user } = useAuth();
  const { isReady, asPath, push } = useRouter();
  useEffect(() => {
    const authEndpoint = "https://accounts.spotify.com/authorize";
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const redirectUri = `${window.location.protocol}//${window.location.host}/auth`;
    // Reading private playlists lets a private GigPlayList be found and
    // updated next time instead of duplicated.
    const scopes = [
      "playlist-modify-public",
      "playlist-modify-private",
      "playlist-read-private",
    ];
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
      if (onCreatePlaylist) {
        sessionStorage.setItem(SAVE_AFTER_LOGIN_STORAGE_KEY, asPath);
      }
      push(redirect);
    }
  };
  return (
    <div suppressHydrationWarning={true}>
      {redirect && (
        <>
          {user ? (
            <button className={BUTTON} onClick={onCreatePlaylist}>
              {label}
            </button>
          ) : (
            <button className={BUTTON} onClick={onClick}>
              <LogIn size={18} aria-hidden="true" />
              {onCreatePlaylist ? label : "Log in to Spotify"}
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default LoginBanner;
