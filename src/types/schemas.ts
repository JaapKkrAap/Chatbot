import { z } from 'zod';

// Lorebook Entry Schema
export const lorebookEntrySchema = z.object({
  keys: z.array(z.string()).min(1, 'At least one trigger key is required'),
  content: z.string().min(1, 'Content is required'),
  extensions: z.record(z.any()).default({}),
  enabled: z.boolean().default(true),
  insertion_order: z.number().int().min(0).default(100),
  case_sensitive: z.boolean().optional(),
  name: z.string().optional(),
  priority: z.number().int().optional(),
  id: z.number().int().optional(),
  comment: z.string().optional(),
  selective: z.boolean().optional(),
  secondary_keys: z.array(z.string()).optional(),
  constant: z.boolean().optional(),
  position: z.enum(['before_char', 'after_char']).optional(),
});

// Character Book Schema
export const characterBookSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  scan_depth: z.number().int().min(0).optional(),
  token_budget: z.number().int().min(0).optional(),
  recursive_scanning: z.boolean().optional(),
  extensions: z.record(z.any()).default({}),
  entries: z.array(lorebookEntrySchema).default([]),
});

// Prompt Block Schema
export const promptBlockSchema = z.object({
  type: z.enum(['system', 'user', 'assistant']),
  name: z.string().min(1, 'Block name is required'),
  content: z.string().min(1, 'Block content is required'),
  priority: z.number().int().min(0).default(100),
  enabled: z.boolean().default(true),
  position: z.enum(['before', 'after', 'replace']),
});

// Behavior Settings Schema
export const behaviorSettingsSchema = z.object({
  dominance: z.number().min(0).max(100).default(50),
  initiative: z.number().min(0).max(100).default(50),
  verbosity: z.number().min(0).max(100).default(50),
  responseLength: z.number().min(0).max(100).default(50),

  rating: z.enum(['sfw', 'suggestive', 'nsfw', 'explicit']).default('sfw'),
  escalationLevel: z.number().min(0).max(100).default(0),
  contentModules: z.array(z.string()).default([]),
  safeMode: z.boolean().default(true),

  promptBlocks: z.array(promptBlockSchema).default([]),

  personalityEnforcement: z.number().min(0).max(100).default(50),
  toneLock: z.object({
    enabled: z.boolean(),
    strength: z.number().min(0).max(100),
  }).optional(),
  loopDetectionInstructions: z.string().optional(),
  emergencyResetPhrase: z.string().optional(),
});

// Character Card V2 Data Schema
export const characterCardV2DataSchema = z.object({
  name: z.string().min(1, 'Character name is required'),
  description: z.string().default(''),
  personality: z.string().default(''),
  scenario: z.string().default(''),
  first_mes: z.string().default(''),
  mes_example: z.string().default(''),

  creator_notes: z.string().default(''),
  system_prompt: z.string().default(''),
  post_history_instructions: z.string().default(''),
  alternate_greetings: z.array(z.string()).default([]),
  character_book: characterBookSchema.optional(),
  tags: z.array(z.string()).default([]),
  creator: z.string().default(''),
  character_version: z.string().default('1.0'),
  extensions: z.object({
    behavior: behaviorSettingsSchema.optional(),
  }).catchall(z.any()).default({}),
});

// Full Character Card V2 Schema
export const characterCardV2Schema = z.object({
  spec: z.literal('chara_card_v2'),
  spec_version: z.literal('2.0'),
  data: characterCardV2DataSchema,
});

// Extended Character Schema (for internal use)
export const characterSchema = characterCardV2DataSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  avatar: z.string().optional(),
});

// World Template Schema
export const worldTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Template name is required'),
  description: z.string(),
  category: z.enum(['location', 'era', 'scenario']),
  entries: z.array(lorebookEntrySchema.partial()),
});

// Character Template Schema
export const characterTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Template name is required'),
  description: z.string(),
  type: z.enum(['archetype', 'scenario', 'mood']),
  partial_data: characterCardV2DataSchema.partial(),
  behavior_preset: behaviorSettingsSchema.partial().optional(),
});

// Form validation schemas (more lenient for WIP editing)
export const characterFormSchema = characterCardV2DataSchema.extend({
  name: z.string().min(1, 'Character name is required'),
  // Other fields are optional or have defaults
});

// Export types
export type LorebookEntryInput = z.infer<typeof lorebookEntrySchema>;
export type CharacterBookInput = z.infer<typeof characterBookSchema>;
export type BehaviorSettingsInput = z.infer<typeof behaviorSettingsSchema>;
export type CharacterCardV2DataInput = z.infer<typeof characterCardV2DataSchema>;
export type CharacterCardV2Input = z.infer<typeof characterCardV2Schema>;
export type CharacterInput = z.infer<typeof characterSchema>;
export type WorldTemplateInput = z.infer<typeof worldTemplateSchema>;
export type CharacterTemplateInput = z.infer<typeof characterTemplateSchema>;
