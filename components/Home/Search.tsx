import React, {
  useState,
  useRef,
  useEffect,
  FormEvent,
  KeyboardEvent,
} from "react";
import { useRouter } from "next/router";
import { Search as SearchIcon, X as CloseIcon } from "lucide-react";
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

  const { data } = useSearchArtistByName(searchTerm);

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
      router.push("/[...artist]", `/${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    suppressAutoOpen.current = false;
    setSearchTerm(event.target.value);
  };

  const handleSuggestionSelect = (suggestion: ArtistInfo) => {
    suppressAutoOpen.current = true;
    setSearchTerm(suggestion.name);
    setIsOpen(false);
    setSuggestions([]);
    router.push(
      "/[...artist]",
      `/${encodeURIComponent(suggestion.name)}/${suggestion.id}`,
    );
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

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;

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

  return (
    <form
      className="w-full max-w-md mb-12 relative"
      onSubmit={onFormSubmit}
      ref={wrapperRef}
    >
      <div className="relative">
        <input
          id="search"
          type="text"
          placeholder="Search an Artist"
          autoComplete="off"
          spellCheck="false"
          autoFocus={true}
          ref={search}
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls="search-suggestions"
          aria-activedescendant={
            selectedIndex >= 0 ? `suggestion-${selectedIndex}` : undefined
          }
          className="w-full py-3 px-4 pr-12 rounded-full bg-white bg-opacity-20 backdrop-blur-md text-white placeholder-white placeholder-opacity-75 focus:outline-none focus:ring-2 focus:ring-white text-lg"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-14 top-1/2 transform -translate-y-1/2 text-white opacity-75 hover:opacity-100"
          >
            <CloseIcon size={20} />
          </button>
        )}
        <button
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white opacity-75 hover:opacity-100"
          type="submit"
          aria-label="Search"
        >
          <SearchIcon size={24} />
        </button>
      </div>
      {isOpen && suggestions.length > 0 && (
        <ul
          id="search-suggestions"
          role="listbox"
          className="absolute z-10 w-full mt-1 bg-opacity-95 backdrop-blur-md rounded-2xl shadow-lg overflow-hidden border"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              id={`suggestion-${index}`}
              role="option"
              aria-selected={index === selectedIndex}
              className={`px-6 py-3 cursor-pointer transition-colors duration-150 ease-in-out ${
                index === selectedIndex
                  ? "bg-blue-100 text-blue-500"
                  : "hover:bg-blue-50 hover:text-blue-500"
              }`}
              onClick={() => handleSuggestionSelect(suggestion)}
            >
              {suggestion.name}
              {suggestion.disambiguation
                ? ` (${suggestion.disambiguation})`
                : ""}
            </li>
          ))}
        </ul>
      )}
    </form>
  );
};

export default Search;
