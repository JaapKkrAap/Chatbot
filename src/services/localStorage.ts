import { Character } from '@/types/character-card';

const STORAGE_KEY = 'character_library';

export const localStorageService = {
  getAllCharacters(): Character[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading characters from localStorage:', error);
      return [];
    }
  },

  getCharacter(id: string): Character | null {
    const characters = this.getAllCharacters();
    return characters.find(char => char.id === id) || null;
  },

  saveCharacter(character: Character): void {
    const characters = this.getAllCharacters();
    const index = characters.findIndex(char => char.id === character.id);

    const now = new Date().toISOString();
    const updatedCharacter = {
      ...character,
      updated_at: now,
    };

    if (index >= 0) {
      characters[index] = updatedCharacter;
    } else {
      characters.push({ ...updatedCharacter, created_at: now });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
  },

  deleteCharacter(id: string): void {
    const characters = this.getAllCharacters();
    const filtered = characters.filter(char => char.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  duplicateCharacter(id: string): Character | null {
    const character = this.getCharacter(id);
    if (!character) return null;

    const now = new Date().toISOString();
    const duplicate: Character = {
      ...character,
      id: crypto.randomUUID(),
      name: `${character.name} (Copy)`,
      created_at: now,
      updated_at: now,
    };

    this.saveCharacter(duplicate);
    return duplicate;
  },

  exportLibrary(): string {
    const characters = this.getAllCharacters();
    return JSON.stringify(characters, null, 2);
  },

  importLibrary(jsonData: string): { success: boolean; count: number; error?: string } {
    try {
      const imported = JSON.parse(jsonData) as Character[];
      if (!Array.isArray(imported)) {
        return { success: false, count: 0, error: 'Invalid format: expected an array' };
      }

      const existing = this.getAllCharacters();
      const merged = [...existing];
      let importCount = 0;

      imported.forEach(char => {
        // Generate new ID if conflicts exist
        const id = merged.find(c => c.id === char.id)
          ? crypto.randomUUID()
          : char.id;

        merged.push({
          ...char,
          id,
          created_at: char.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        importCount++;
      });

      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return { success: true, count: importCount };
    } catch (error) {
      return { success: false, count: 0, error: String(error) };
    }
  },

  clearLibrary(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  },
};
