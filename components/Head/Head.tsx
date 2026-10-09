import React from "react";
import Head from "next/head";

import Favicons from "./Favicons";

export const SITE_URL = "https://gigplaylist.sirlisko.com";

const DEFAULT_TITLE = "GigPlayList: know the setlist before the gig";
const DEFAULT_DESCRIPTION =
  "See the songs an artist has been playing live, in running order, and save them as a Spotify playlist.";

interface HeadProps {
  title?: string;
  description?: string;
  path?: string;
  // An absolute URL to a 1200x630 image; defaults to the home card.
  image?: string;
  imageAlt?: string;
}

const HeadSection = ({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  path = "",
  image,
  imageAlt = "GigPlayList: know the setlist before the lights go down",
}: HeadProps) => {
  const url = `${SITE_URL}${path}`;
  const shareImage = image ?? `${SITE_URL}/api/og`;
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="author" content="Luca Lischetti" />
        <link type="text/plain" rel="author" href={`${SITE_URL}/humans.txt`} />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <meta
          name="keywords"
          content="gigplaylist, music, gig, setlists, playlist, concerts, spotify"
        />
        <meta name="description" content={description} />
        <link rel="canonical" href={url} />
        <meta property="og:url" content={url} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="GigPlayList" />
        {/* Mirrors `stage` in tailwind.config.js. */}
        <meta name="theme-color" content="#252320" />
        <meta property="og:description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:image" content={shareImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={imageAlt} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={shareImage} />
        <meta name="twitter:image:alt" content={imageAlt} />
      </Head>
      <Favicons />
    </>
  );
};

export default HeadSection;
