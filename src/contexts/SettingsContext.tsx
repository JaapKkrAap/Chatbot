import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AISettings {
  openaiApiKey: string;
  anthropicApiKey: string;
  openrouterApiKey: string;
  preferredProvider: 'openai' | 'anthropic' | 'openrouter';
  preferredModel: string;
  temperature: number;
  maxTokens: number;
  showCosts: boolean;
}

interface SettingsContextType {
  settings: AISettings;
  updateSettings: (updates: Partial<AISettings>) => void;
  hasApiKey: boolean;
}

const defaultSettings: AISettings = {
  openaiApiKey: '',
  anthropicApiKey: '',
  openrouterApiKey: '',
  preferredProvider: 'openai',
  preferredModel: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 2000,
  showCosts: true,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AISettings>(() => {
    const stored = localStorage.getItem('ai-settings');
    return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('ai-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (updates: Partial<AISettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const hasApiKey = Boolean(
    settings.preferredProvider === 'openai'
      ? settings.openaiApiKey
      : settings.preferredProvider === 'anthropic'
      ? settings.anthropicApiKey
      : settings.openrouterApiKey
  );

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, hasApiKey }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}
