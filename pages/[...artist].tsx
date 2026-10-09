import React from "react";
import type { GetStaticPaths, GetStaticProps } from "next";
import { useRouter } from "next/router";
import { SWRConfig } from "swr";

import Head, { SITE_URL } from "components/Head/Head";
import Result from "components/Result/Result";
import ResultSkeleton from "components/Result/ResultSkeleton";
import Footer from "components/Footer/Footer";
import { useArtistData } from "services/artistData";
import { useTracks } from "services/tracks";
import { artistDataKey, tracksKey } from "services/keys";
import { useViewParams } from "components/Result/useViewParams";
import { getArtistTracks } from "server/apis/spotify";
import { getArtistSetlistSummary } from "server/artistSetlist";
import { typicalSetLength } from "utils/setlistView";

const REVALIDATE_SECONDS = 60 * 60;
// A failed upstream call shouldn't pin an empty page for a whole hour.
const RETRY_SECONDS = 60;

interface Share {
  title: string;
  description: string;
  path: string;
  image: string;
}

interface ResultPageProps {
  fallback?: Record<string, unknown>;
  share?: Share;
}

const ResultContent = ({ artist }: { artist?: string[] }) => {
  const { isLoading: isLoadingArtist } = useArtistData(
    artist?.[0],
    artist?.[1],
  );
  const { tour } = useViewParams();
  const { isLoading: isLoadingTracks } = useTracks(
    artist?.[0],
    artist?.[1],
    tour,
  );
  const isLoading = !artist || isLoadingArtist || isLoadingTracks;

  return (
    <main id="main-content">
      {isLoading ? (
        <ResultSkeleton name={artist?.[0]} />
      ) : (
        <Result artistQuery={artist} />
      )}
      {!isLoading && <Footer showCredits className="text-white bg-black" />}
    </main>
  );
};

const ResultPage = ({ fallback, share }: ResultPageProps) => {
  const router = useRouter();
  const artist = router.query.artist as string[] | undefined;

  return (
    <SWRConfig value={{ fallback: fallback ?? {} }}>
      <Head {...share} />
      <ResultContent artist={artist} />
    </SWRConfig>
  );
};

// Pages render on first request and refresh hourly. Visitors navigating in
// the app get the skeleton straight away; crawlers get the finished page, so
// shared links carry the artist's own title and image.
export const getStaticPaths: GetStaticPaths = async () => ({
  paths: [],
  fallback: true,
});

// Props must be plain JSON, and node-vibrant returns class instances.
const plain = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

export const getStaticProps: GetStaticProps<ResultPageProps> = async ({
  params,
}) => {
  const [artistName, artistId] = (params?.artist as string[]) ?? [];
  if (!artistName) {
    return { notFound: true };
  }

  const [artistData, setList] = await Promise.allSettled([
    getArtistTracks(artistName, artistId),
    getArtistSetlistSummary(artistName, artistId),
  ]);

  const fallback: Record<string, unknown> = {};
  if (artistData.status === "fulfilled") {
    fallback[artistDataKey(artistName, artistId) as string] = plain(
      artistData.value,
    );
  }
  if (setList.status === "fulfilled") {
    fallback[tracksKey(artistName, artistId) as string] = plain(setList.value);
  }

  const name =
    artistData.status === "fulfilled" ? artistData.value.name : artistName;
  const summary = setList.status === "fulfilled" ? setList.value : undefined;
  const songs = summary ? typicalSetLength(summary) : 0;
  const path = `/${[artistName, artistId]
    .filter(Boolean)
    .map((part) => encodeURIComponent(part as string))
    .join("/")}`;

  const share: Share = {
    title: `${name} setlist: what to expect live | GigPlayList`,
    description:
      summary && songs > 0
        ? `The ${songs} songs ${name} play most, from ${summary.totalSetLists} recent concerts${
            summary.tour ? ` on the ${summary.tour} tour` : ""
          }. Save them as a Spotify playlist.`
        : `What ${name} play live, from their recent setlists. Save it as a Spotify playlist.`,
    path,
    image: `${SITE_URL}/api/og?${new URLSearchParams({
      artist: artistName,
      ...(artistId ? { id: artistId } : {}),
    })}`,
  };

  const complete =
    artistData.status === "fulfilled" && setList.status === "fulfilled";

  return {
    props: { fallback, share },
    revalidate: complete ? REVALIDATE_SECONDS : RETRY_SECONDS,
  };
};

export default ResultPage;
