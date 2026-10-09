import React from "react";
import Head from "next/head";

import Favicons from "./Favicons";

export const SITE_URL = "https://gigplaylist.sirlisko.com";

const DEFAULT_TITLE = "GigPlayList - Prepare the playlist for your next gig!";
const DEFAULT_DESCRIPTION =
  "GigPlayList curates playlists for upcoming gigs based on setlists and artist data.";

interface HeadProps {
  title?: string;
  description?: string;
  path?: string;
  // An absolute 1200x630 image switches the share card to the large layout.
  image?: string;
}

const HeadSection = ({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  path = "",
  image,
}: HeadProps) => {
  const url = `${SITE_URL}${path}`;
  const shareImage = image ?? `${SITE_URL}/web-app-manifest-512x512.png`;
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
        <meta property="og:description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:image" content={shareImage} />
        <meta property="og:image:width" content={image ? "1200" : "512"} />
        <meta property="og:image:height" content={image ? "630" : "512"} />
        <meta
          name="twitter:card"
          content={image ? "summary_large_image" : "summary"}
        />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={shareImage} />
      </Head>
      <Favicons />
    </>
  );
};

export default HeadSection;
