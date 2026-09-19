import React from "react";
import type { AppProps } from "next/app";

import "assets/stylesheets/style.css";

import { AuthProvider } from "components/UserContext/UserContext";
import ErrorBoundary from "components/ErrorBoundary/ErrorBoundary";

const MyApp = ({ Component, pageProps }: AppProps) => (
  <ErrorBoundary>
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:text-black focus:px-4 focus:py-2 focus:rounded"
    >
      Skip to content
    </a>
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  </ErrorBoundary>
);

export default MyApp;
