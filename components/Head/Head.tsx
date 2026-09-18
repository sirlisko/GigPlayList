import React from "react";
import Head from "next/head";

import Favicons from "./Favicons";

const HeadSection = () => (
  <>
    <Head>
      <title>GigPlayList - Prepare the playlist for your next gig!</title>
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="author" content="Luca Lischetti" />
      <link
        type="text/plain"
        rel="author"
        href="https://gigplaylist.sirlisko.com/humans.txt"
      />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, shrink-to-fit=no"
      />
      <meta
        name="keywords"
        content="gigplaylist, music, gig, setlists, playlist, concerts, spotify"
      />
      <meta
        name="description"
        content="GigPlayList curates playlists for upcoming gigs based on setlists and artist data."
      />
      <meta property="og:url" content="https://gigplaylist.sirlisko.com" />
      <meta property="og:type" content="website" />
      <meta
        property="og:description"
        content="GigPlayList curates playlists for upcoming gigs based on setlists and artist data."
      />
      <meta
        property="og:title"
        content="GigPlayList - Prepare the playlist for your next gig!"
      />
      <meta
        property="og:image"
        content="https://gigplaylist.sirlisko.com/web-app-manifest-512x512.png"
      />
      <meta property="og:image:width" content="512" />
      <meta property="og:image:height" content="512" />
      <meta name="twitter:card" content="summary" />
      <meta
        name="twitter:title"
        content="GigPlayList - Prepare the playlist for your next gig!"
      />
      <meta
        name="twitter:description"
        content="GigPlayList curates playlists for upcoming gigs based on setlists and artist data."
      />
      <meta
        name="twitter:image"
        content="https://gigplaylist.sirlisko.com/web-app-manifest-512x512.png"
      />
    </Head>
    <Favicons />
  </>
);

export default HeadSection;
