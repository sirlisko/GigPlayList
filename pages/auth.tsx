import React, { useEffect } from "react";
import { useRouter } from "next/router";
import Spotify from "spotify-web-api-js";
import { AuthUser, useAuth } from "components/UserContext/UserContext";
import { Audio as Loader } from "react-loader-spinner";
import LoginBanner from "components/LoginBanner/LoginBanner";
import { CODE_VERIFIER_STORAGE_KEY } from "components/LoginBanner/LoginBanner";
import Link from "next/link";
import { ArrowLeft, Frown } from "lucide-react";
import Head from "components/Head/Head";

export const exchangeCodeForToken = async (
  code: string,
): Promise<AuthUser | undefined> => {
  const codeVerifier = sessionStorage.getItem(CODE_VERIFIER_STORAGE_KEY);
  if (!codeVerifier) {
    return undefined;
  }
  sessionStorage.removeItem(CODE_VERIFIER_STORAGE_KEY);
  const redirectUri = `${window.location.protocol}//${window.location.host}/auth`;
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ?? "",
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });
  if (!response.ok) {
    return undefined;
  }
  const { access_token } = await response.json();
  return access_token ? { access_token } : undefined;
};

const Home = () => {
  const { isReady, push, query } = useRouter();
  const { setUser } = useAuth();
  useEffect(() => {
    if (!isReady || typeof query.code !== "string") {
      return;
    }
    const code = query.code;
    exchangeCodeForToken(code).then((auth) => {
      if (auth && setUser) {
        const s = new Spotify();
        s.setAccessToken(auth.access_token);
        s.getMe().then((value) => {
          setUser(auth, value);
          const redirect = localStorage.getItem("redirect") ?? "/";
          push(redirect);
        });
      }
    });
  }, [isReady]);
  return (
    <main id="main-content" className="background">
      <Head />
      {query.error ? (
        <div className="flex flex-col items-center">
          <div className="m-auto text-center text-2xl p-3">
            <Frown height={100} width={100} />
          </div>
          <div className="m-auto text-center text-2xl p-3">
            Ops, an error occured
          </div>
          <div style={{ margin: "2rem" }}>
            <LoginBanner />
          </div>
          <Link href="/" passHref>
            <button
              className="text-white hover:text-gray-300 flex"
              aria-label="Go to homepage"
            >
              <ArrowLeft size={24} className="mr-3" />
              Go back to the Home
            </button>
          </Link>
        </div>
      ) : (
        <div className="m-auto text-center text-2xl p-3">
          <Loader height={80} width={80} ariaLabel="loading" color="white" />
        </div>
      )}
    </main>
  );
};

export default Home;
