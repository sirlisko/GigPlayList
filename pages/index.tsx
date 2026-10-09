import React from "react";

import Head from "components/Head/Head";
import Search from "components/Home/Search";
import ExampleSheet from "components/Home/ExampleSheet";
import Footer from "components/Footer/Footer";
import Wordmark from "components/Logo/Logo";

const Home = () => {
  return (
    <main id="main-content" className="background">
      <Head />
      <header className="w-full max-w-5xl">
        <p>
          <Wordmark className="text-2xl" />
        </p>
      </header>
      <div className="grid w-full max-w-5xl flex-1 items-center gap-14 py-10 md:grid-cols-[1.15fr_0.85fr]">
        <div>
          <h1 className="display text-6xl sm:text-7xl lg:text-8xl">
            Know the setlist before the lights go down
          </h1>
          <p className="mb-8 mt-6 max-w-md text-lg text-white/80">
            Search for an artist. We read their recent setlists, put the songs
            in the order they&apos;re played, and save them as a Spotify
            playlist.
          </p>
          <Search />
        </div>
        <ExampleSheet />
      </div>
      <Footer />
    </main>
  );
};

export default Home;
