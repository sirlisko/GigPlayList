import React from "react";

import Head from "components/Head/Head";
import Search from "components/Home/Search";
import ExampleSheet from "components/Home/ExampleSheet";
import Footer from "components/Footer/Footer";

const Home = () => {
  return (
    <main id="main-content" className="background">
      <Head />
      <div className="grid w-full max-w-5xl flex-1 items-center gap-14 py-10 md:grid-cols-[1.15fr_0.85fr]">
        <div>
          <h1 className="display text-6xl sm:text-7xl lg:text-8xl">
            Know the setlist before the lights go down
          </h1>
          <p className="mb-8 mt-6 max-w-md text-lg text-white/80">
            Search an artist. We read their recent setlists, put the songs in
            the order they play them, and save it to your Spotify.
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
