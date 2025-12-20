// Character Card V2 Specification Types
// Based on https://github.com/malfoyslastname/character-card-spec-v2

export interface CharacterBook {
  name?: string;
  description?: string;
  scan_depth?: number;
  token_budget?: number;
  recursive_scanning?: boolean;
  extensions: Record<string, any>;
  entries: LorebookEntry[];
}

export interface LorebookEntry {
  keys: string[];
  content: string;
  extensions: Record<string, any>;
  enabled: boolean;
  insertion_order: number;
  case_sensitive?: boolean;
  name?: string;
  priority?: number;
  id?: number;
  comment?: string;
  selective?: boolean;
  secondary_keys?: string[];
  constant?: boolean;
  position?: 'before_char' | 'after_char';
}

export interface BehaviorSettings {
  // Personality sliders (0-100)
  dominance: number;
  initiative: number;
  verbosity: number;
  responseLength: number;

  // Content settings
  rating: 'sfw' | 'suggestive' | 'nsfw' | 'explicit';
  escalationLevel: number;
  contentModules: string[];
  safeMode: boolean;

  // Prompt blocks
  promptBlocks: PromptBlock[];

  // Anti-drift settings
  personalityEnforcement: number;
  toneLock?: {
    enabled: boolean;
    strength: number;
  };
  loopDetectionInstructions?: string;
  emergencyResetPhrase?: string;
}

export interface PromptBlock {
  type: 'system' | 'user' | 'assistant';
  name: string;
  content: string;
  priority: number;
  enabled: boolean;
  position: 'before' | 'after' | 'replace';
}

export interface CharacterCardV2Data {
  // Core V1 fields (required)
  name: string;
  description: string;
  personality: string;
  scenario: string;
  first_mes: string;
  mes_example: string;

  // V2 additions
  creator_notes: string;
  system_prompt: string;
  post_history_instructions: string;
  alternate_greetings: string[];
  character_book?: CharacterBook;
  tags: string[];
  creator: string;
  character_version: string;
  extensions: {
    behavior?: BehaviorSettings;
    [key: string]: any;
  };
}

export interface CharacterCardV2 {
  spec: 'chara_card_v2';
  spec_version: '2.0';
  data: CharacterCardV2Data;
}

// Extended character type for internal app use
export interface Character extends CharacterCardV2Data {
  id: string;
  created_at: string;
  updated_at: string;
  avatar?: string; // Base64 or URL
}

// World template types
export interface WorldTemplate {
  id: string;
  name: string;
  description: string;
  category: 'location' | 'era' | 'scenario';
  entries: Partial<LorebookEntry>[];
}

// Character template types
export interface CharacterTemplate {
  id: string;
  name: string;
  description: string;
  type: 'archetype' | 'scenario' | 'mood';
  partial_data: Partial<CharacterCardV2Data>;
  behavior_preset?: Partial<BehaviorSettings>;
}

// Platform-specific export types
export type PlatformType = 'sillytavern' | 'chub' | 'spicychat' | 'crushon';

export interface PlatformValidationIssue {
  field: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

export interface PlatformExportResult {
  platform: PlatformType;
  data: any;
  warnings: PlatformValidationIssue[];
}
