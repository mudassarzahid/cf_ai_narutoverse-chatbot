import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/card/Card";
import { Button } from "@/components/button/Button";
import { Avatar } from "@/components/avatar/Avatar";
import {
  UserIcon,
  MagnifyingGlassIcon,
  SunIcon,
  MoonIcon
} from "@phosphor-icons/react";
import type { Character } from "@/types";

interface CharacterSelectorProps {
  onCharacterSelect: (character: Character) => void;
  onGetCharacters: () => Promise<{ characters?: Character[]; error?: string }>;
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

export function CharacterSelector({
  onCharacterSelect,
  onGetCharacters,
  theme,
  onToggleTheme
}: CharacterSelectorProps) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    null
  );
  const [clickedCharacter, setClickedCharacter] = useState<Character | null>(
    null
  );

  useEffect(() => {
    const loadCharacters = async () => {
      try {
        setLoading(true);
        const result = await onGetCharacters();
        if (result.error) {
          setError(result.error);
        } else if (result.characters) {
          setCharacters(result.characters);
        }
      } catch (err) {
        setError("Failed to load characters");
        console.error("Error loading characters:", err);
      } finally {
        setLoading(false);
      }
    };

    loadCharacters();
  }, [onGetCharacters]);

  const filteredCharacters = useMemo(() => {
    if (!searchQuery.trim()) {
      return characters;
    }
    const query = searchQuery.toLowerCase();
    const allMatches = characters.filter(char =>
      char.name.toLowerCase().includes(query) ||
      char.summary.toLowerCase().includes(query)
    );

    allMatches.sort((a, b) => {
      const aIsNameMatch = a.name.toLowerCase().includes(query);
      const bIsNameMatch = b.name.toLowerCase().includes(query);

      if (aIsNameMatch && !bIsNameMatch) {
        return -1;
      }
      if (!aIsNameMatch && bIsNameMatch) {
        return 1;
      }
      return 0;
    });

    return allMatches;
  }, [characters, searchQuery]);

  const handleCharacterClick = (character: Character) => {
    if (clickedCharacter) return;
    setClickedCharacter(character);
    setSelectedCharacter(character);
    setTimeout(() => {
      onCharacterSelect(character);
    }, 500);
  };

  const truncateSummary = (summary: string, maxLength: number = 100) => {
    if (summary.length <= maxLength) return summary;
    return summary.substring(0, maxLength) + "...";
  };

  if (loading) {
    return (
      <div className="h-[100vh] w-full p-4 flex justify-center items-center modern-bg">
        <Card className="p-8 max-w-md mx-auto glass hover-lift animate-fade-in">
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-slate-600 mx-auto"></div>
              <div
                className="absolute inset-0 rounded-full h-12 w-12 border-4 border-transparent border-t-slate-500 mx-auto animate-spin"
                style={{
                  animationDirection: "reverse",
                  animationDuration: "1.5s"
                }}
              ></div>
            </div>
            <div>
              <p className="text-slate-900 dark:text-slate-100 font-semibold text-lg">
                Loading Naruto characters...
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[100vh] w-full p-4 flex justify-center items-center modern-bg">
        <Card className="p-8 max-w-md mx-auto glass hover-lift animate-fade-in">
          <div className="text-center space-y-6">
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full p-4 inline-flex shadow-lg">
              <UserIcon size={32} />
            </div>
            <div>
              <h3 className="font-bold text-xl text-slate-900 dark:text-slate-100 mb-2">
                Error Loading Characters
              </h3>
              <p className="text-slate-700 dark:text-slate-300 text-sm">
                {error}
              </p>
            </div>
            <Button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-6 py-3 rounded-2xl font-semibold hover:scale-105 transition-all duration-300 shadow-lg"
            >
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[100vh] w-full p-4 flex justify-center items-center modern-bg overflow-hidden">
      <div className="h-[calc(100vh-2rem)] w-full mx-auto max-w-4xl flex flex-col glass shadow-2xl rounded-2xl overflow-hidden relative animate-slide-in-up">
        {/* Header */}
        <div className="px-6 py-6 border-b border-white/20 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1 animate-fade-in">
              <h1 className="tracking-tight font-semibold text-[2.3rem] lg:text-5xl leading-9 text-slate-900 dark:text-slate-100">
                <span className="bg-clip-text text-transparent bg-gradient-to-b from-[#FF705B] to-[#FFB457]">
                  NarutoVerse Chatbot&nbsp;
                </span>
              </h1>
              <p className="w-full text-lg lg:text-xl text-slate-700 dark:text-slate-300 block max-w-full mt-4">
                Chat with your favorite NarutoVerse characters!
              </p>
            </div>
            <Button
              variant="ghost"
              size="md"
              shape="circular"
              className="h-10 w-10 hover:bg-white/20 hover:scale-110 transition-all duration-300"
              onClick={onToggleTheme}
            >
              {theme === "dark" ? (
                <SunIcon size={20} className="text-orange-300" />
              ) : (
                <MoonIcon size={20} className="text-blue-400" />
              )}
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-4 border-b border-white/20 backdrop-blur-md">
          <div className="relative animate-slide-in-up">
            <MagnifyingGlassIcon
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search characters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-slate-300 dark:border-slate-600 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500 focus:border-transparent transition-all duration-300"
            />
          </div>
        </div>

        {/* Character Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredCharacters.length === 0 ? (
            <div className="text-center py-16 animate-fade-in">
              <div className="bg-gradient-to-r from-gray-400 to-gray-600 text-white rounded-full p-6 inline-flex shadow-lg mb-6">
                <UserIcon size={48} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                No characters found
              </h3>
              <p className="text-slate-700 dark:text-slate-300">
                Try adjusting your search terms
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCharacters.map((character, index) => (
                // biome-ignore lint: This is fine
                <div
                  key={character.id}
                  className={`character-card p-6 cursor-pointer glass hover-lift transition-all duration-300 ${
                    clickedCharacter?.id === character.id
                      ? "ring-2 ring-green-500 bg-gradient-to-br from-green-500/20 to-green-600/20 scale-105 shadow-lg"
                      : selectedCharacter?.id === character.id
                        ? "ring-2 ring-slate-500 bg-gradient-to-br from-slate-500/20 to-slate-600/20"
                        : "hover:bg-white/10"
                  } animate-slide-in-up ${clickedCharacter ? "pointer-events-none" : ""}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => handleCharacterClick(character)}
                >
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <Avatar
                        username={character.name}
                        image={character.image_url}
                        className="w-16 h-16 flex-shrink-0 ring-2 ring-white/20 hover:ring-white/40 transition-all duration-300"
                      />
                      {clickedCharacter?.id === character.id && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg mb-2 truncate text-slate-900 dark:text-slate-100">
                        {character.name}
                      </h3>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {clickedCharacter?.id === character.id
                          ? "Starting chat..."
                          : truncateSummary(character.summary)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
