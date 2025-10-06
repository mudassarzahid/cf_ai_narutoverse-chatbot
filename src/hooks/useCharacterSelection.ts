import { useState, useCallback } from "react";
import type { Character } from "@/types";

export function useCharacterSelection(clearHistory?: () => void) {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    null
  );
  const [isCharacterSelected, setIsCharacterSelected] = useState(false);

  const getCharacters = useCallback(async () => {
    try {
      const response = await fetch("/api/characters");
      const data = (await response.json()) as {
        characters?: Character[];
        error?: string;
      };

      if (!response.ok) {
        return { error: data.error || "Failed to fetch characters" };
      }

      return { characters: data.characters || [] };
    } catch (error) {
      console.error("Error fetching characters:", error);
      return { error: "Failed to fetch characters" };
    }
  }, []);

  const selectCharacter = useCallback(
    (character: Character) => {
      if (clearHistory) {
        clearHistory();
      }
      setSelectedCharacter(character);
      setIsCharacterSelected(true);
    },
    [clearHistory]
  );

  const getCharacterDetails = useCallback(async (characterId: number) => {
    try {
      const response = await fetch(`/api/character/${characterId}`);
      const data = (await response.json()) as {
        character?: Character;
        error?: string;
      };

      if (!response.ok) {
        return { error: data.error || "Failed to fetch character details" };
      }

      return { character: data.character };
    } catch (error) {
      console.error("Error fetching character details:", error);
      return { error: "Failed to fetch character details" };
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedCharacter(null);
    setIsCharacterSelected(false);
  }, []);

  return {
    selectedCharacter,
    isCharacterSelected,
    getCharacters,
    getCharacterDetails,
    selectCharacter,
    clearSelection
  };
}
