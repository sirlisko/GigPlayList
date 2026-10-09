import React, {
  useState,
  useRef,
  useEffect,
  FormEvent,
  KeyboardEvent,
} from "react";
import { useRouter } from "next/router";
import {
  LoaderCircle,
  Search as SearchIcon,
  X as CloseIcon,
} from "lucide-react";
import { useSearchArtistByName } from "services/searchArtist";
import { ArtistInfo } from "types";

const Search = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<ArtistInfo[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const search = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLFormElement>(null);
  const suppressAutoOpen = useRef(false);
  const router = useRouter();

  // Picking a suggestion fills the input with its name; searching for it
  // again would only burn MusicBrainz's one-request-a-second allowance.
  const [pickedName, setPickedName] = useState<string>();
  // The result page waits for its data before showing, so say it's coming.
  const [isNavigating, setIsNavigating] = useState(false);
  const { data, query, isLoading, isError } = useSearchArtistByName(
    searchTerm === pickedName ? undefined : searchTerm,
  );

  const goTo = (as: string) => {
    setIsNavigating(true);
    router
      .push("/[...artist]", as)
      .then((navigated) => {
        if (!navigated) setIsNavigating(false);
      })
      .catch(() => setIsNavigating(false));
  };

  useEffect(() => {
    if (suppressAutoOpen.current) {
      return;
    }
    if (data && searchTerm.length > 1) {
      const newSuggestions = data.artists.slice(0, 5);
      setSuggestions(newSuggestions);
      setSelectedIndex(-1);
      setIsOpen(newSuggestions.length > 0);
    } else if (searchTerm.length <= 1) {
      setSuggestions([]);
      setIsOpen(false);
    }
  }, [data, searchTerm]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const onFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
      handleSuggestionSelect(suggestions[selectedIndex]);
    } else if (searchTerm) {
      goTo(`/${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    suppressAutoOpen.current = false;
    setSearchTerm(event.target.value);
  };

  const handleSuggestionSelect = (suggestion: ArtistInfo) => {
    suppressAutoOpen.current = true;
    setPickedName(suggestion.name);
    setSearchTerm(suggestion.name);
    setIsOpen(false);
    setSuggestions([]);
    goTo(`/${encodeURIComponent(suggestion.name)}/${suggestion.id}`);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSelectedIndex(-1);
    setIsOpen(false);
    setSuggestions([]);
    if (search.current) {
      search.current.focus();
    }
  };

  const reopen = () => {
    if (suggestions.length > 0 && !suppressAutoOpen.current) setIsOpen(true);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (event.key === "ArrowDown") reopen();
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev,
        );
        break;
      case "ArrowUp":
        event.preventDefault();
        setSelectedIndex((prev) => (prev > -1 ? prev - 1 : -1));
        break;
      case "Enter":
        if (selectedIndex >= 0) {
          event.preventDefault();
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const settled =
    !isNavigating && !suppressAutoOpen.current && query === searchTerm;
  const searchStatus = !settled
    ? null
    : isError
      ? `Artist suggestions are busy right now. Press Enter to search for “${searchTerm}” anyway.`
      : data?.artists.length === 0
        ? `No artists match “${searchTerm}”. Check the spelling.`
        : null;

  return (
    <form
      className="w-full max-w-md relative"
      onSubmit={onFormSubmit}
      ref={wrapperRef}
    >
      <div className="relative">
        <input
          id="search"
          type="text"
          placeholder="Who are you going to see?"
          aria-label="Artist"
          autoComplete="off"
          spellCheck="false"
          autoFocus={true}
          ref={search}
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={reopen}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls="search-suggestions"
          aria-activedescendant={
            selectedIndex >= 0 ? `suggestion-${selectedIndex}` : undefined
          }
          className="w-full rounded-full border border-white/30 bg-white/10 py-3.5 pl-5 pr-24 text-lg text-white placeholder-white/60 focus:border-white focus:outline-none"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={clearSearch}
            aria-label="Clear search"
            className="absolute right-14 top-1/2 transform -translate-y-1/2 text-white opacity-75 hover:opacity-100"
          >
            <CloseIcon size={20} />
          </button>
        )}
        <button
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white opacity-75 hover:opacity-100"
          type="submit"
          aria-label={isNavigating ? "Loading artist" : "Search"}
          disabled={isNavigating}
        >
          {isNavigating || isLoading ? (
            <LoaderCircle
              size={24}
              className="animate-spin motion-reduce:animate-none"
            />
          ) : (
            <SearchIcon size={24} />
          )}
        </button>
        <p role="status" className="sr-only">
          {isNavigating ? `Loading ${searchTerm}` : ""}
        </p>
      </div>
      <p role="status" className="mt-3 text-sm text-white/75 empty:hidden">
        {searchStatus}
      </p>
      {isOpen && suggestions.length > 0 && (
        <ul
          id="search-suggestions"
          role="listbox"
          className="absolute z-10 mt-2 w-full overflow-hidden rounded-md bg-paper py-1 text-ink shadow-2xl"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              id={`suggestion-${index}`}
              role="option"
              aria-selected={index === selectedIndex}
              className={`cursor-pointer px-5 py-2.5 ${
                index === selectedIndex
                  ? "bg-highlighter/70"
                  : "hover:bg-highlighter/40"
              }`}
              onClick={() => handleSuggestionSelect(suggestion)}
            >
              <span className="font-semibold">{suggestion.name}</span>
              {suggestion.disambiguation ? (
                <span className="block text-sm text-ink/65">
                  {suggestion.disambiguation}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </form>
  );
};

export default Search;
