import React, { useEffect } from "react";
import { useRouter } from "next/router";
import Spotify from "spotify-web-api-js";
import { AuthUser, useAuth } from "components/UserContext/UserContext";
import { Audio as Loader } from "react-loader-spinner";
import LoginBanner from "components/LoginBanner/LoginBanner";
import Link from "next/link";
import { ArrowLeft, Frown } from "lucide-react";
import Head from "components/Head/Head";

const AUTH_KEYS: Array<keyof AuthUser> = ["access_token", "expires_on"];

export const auth = (): AuthUser => {
  const params = new URLSearchParams(window.location.hash.substring(1));
  window.location.hash = "";
  return AUTH_KEYS.reduce((acc, key) => {
    const value = params.get(key);
    if (value) {
      acc[key] = value;
    }
    return acc;
  }, {} as AuthUser);
};

const Home = () => {
  const { isReady, push, query } = useRouter();
  const { setUser } = useAuth();
  useEffect(() => {
    const query = auth();
    if (query.access_token && setUser) {
      const s = new Spotify();
      s.setAccessToken(query.access_token);
      s.getMe().then((value) => {
        setUser(query, value);
        const redirect = localStorage.getItem("redirect") ?? "/";
        push(redirect);
      });
    }
  }, [isReady]);
  return (
    <main className="background">
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
