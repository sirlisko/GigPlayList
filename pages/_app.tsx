import React from "react";
import type { AppProps } from "next/app";
import { Archivo, Permanent_Marker } from "next/font/google";

import "assets/stylesheets/style.css";

import { AuthProvider } from "components/UserContext/UserContext";
import ErrorBoundary from "components/ErrorBoundary/ErrorBoundary";

const archivo = Archivo({
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  variable: "--font-archivo",
});

const marker = Permanent_Marker({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-marker",
});

const MyApp = ({ Component, pageProps }: AppProps) => (
  <div className={`${archivo.variable} ${marker.variable} font-sans`}>
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
  </div>
);

export default MyApp;
