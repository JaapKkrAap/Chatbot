// Platform-Specific Export Service
import { CharacterCardV2Data, PlatformType, PlatformValidationIssue } from '@/types/character-card';

export class PlatformExportService {
  /**
   * Validate character data for a specific platform
   */
  validateForPlatform(data: CharacterCardV2Data, platform: PlatformType): PlatformValidationIssue[] {
    const issues: PlatformValidationIssue[] = [];

    switch (platform) {
      case 'sillytavern':
      case 'chub':
        // V2 spec is native, no special validation needed
        break;

      case 'spicychat':
        issues.push(...this.validateForSpicyChat(data));
        break;

      case 'crushon':
        issues.push(...this.validateForCrushon(data));
        break;
    }

    return issues;
  }

  private validateForSpicyChat(data: CharacterCardV2Data): PlatformValidationIssue[] {
    const issues: PlatformValidationIssue[] = [];

    // SpicyChat has token limits
    const personalityLength = (data.description + data.personality).length;
    if (personalityLength > 4400) { // ~1100 tokens
      issues.push({
        field: 'personality',
        severity: 'warning',
        message: 'Combined description and personality may exceed SpicyChat token limit',
      });
    }

    // Advanced fields not supported
    if (data.system_prompt) {
      issues.push({
        field: 'system_prompt',
        severity: 'info',
        message: 'System prompt is not supported by SpicyChat',
      });
    }

    if (data.post_history_instructions) {
      issues.push({
        field: 'post_history_instructions',
        severity: 'info',
        message: 'Post-history instructions not supported by SpicyChat',
      });
    }

    if (data.character_book) {
      issues.push({
        field: 'character_book',
        severity: 'info',
        message: 'Lorebook is not supported by SpicyChat',
      });
    }

    return issues;
  }

  private validateForCrushon(data: CharacterCardV2Data): PlatformValidationIssue[] {
    const issues: PlatformValidationIssue[] = [];

    // Crushon prefers specific field lengths
    if (data.description.length < 100) {
      issues.push({
        field: 'description',
        severity: 'warning',
        message: 'Crushon AI works best with descriptions of 100+ characters',
      });
    }

    if (data.personality.length < 200 || data.personality.length > 400) {
      issues.push({
        field: 'personality',
        severity: 'info',
        message: 'Crushon AI recommends personality field be 200-400 characters',
      });
    }

    if (data.scenario && data.scenario.split(' ').length > 500) {
      issues.push({
        field: 'scenario',
        severity: 'info',
        message: 'Crushon AI recommends scenario be 200-500 words',
      });
    }

    // Advanced fields not supported
    if (data.system_prompt || data.post_history_instructions || data.character_book) {
      issues.push({
        field: 'advanced',
        severity: 'info',
        message: 'Advanced V2 fields (system prompt, UJB, lorebook) are not supported by Crushon AI',
      });
    }

    return issues;
  }

  /**
   * Export character data for a specific platform
   */
  exportForPlatform(data: CharacterCardV2Data, platform: PlatformType): any {
    switch (platform) {
      case 'sillytavern':
      case 'chub':
        return this.exportV2Standard(data);

      case 'spicychat':
        return this.exportForSpicyChatFormat(data);

      case 'crushon':
        return this.exportForCrushonFormat(data);

      default:
        return this.exportV2Standard(data);
    }
  }

  private exportV2Standard(data: CharacterCardV2Data) {
    return {
      spec: 'chara_card_v2',
      spec_version: '2.0',
      data,
    };
  }

  private exportForSpicyChatFormat(data: CharacterCardV2Data) {
    return {
      name: data.name,
      title: data.description.substring(0, 84) || data.personality.substring(0, 84),
      greeting: data.first_mes,
      personality: `${data.description}\n\n${data.personality}`.trim(),
      scenario: data.scenario,
      example_dialogue: data.mes_example,
      tags: data.tags,
      visibility: 'public',
    };
  }

  private exportForCrushonFormat(data: CharacterCardV2Data) {
    // Extract age and gender if mentioned in description
    const ageMatch = data.description.match(/(\d+)[-\s]year[-\s]old/i);
    const age = ageMatch ? ageMatch[1] : '';

    const genderMatch = data.description.match(/\b(male|female|non-binary|other)\b/i);
    const gender = genderMatch ? genderMatch[1].toLowerCase() : '';

    return {
      name: data.name,
      age,
      gender,
      introduction: data.description,
      greeting: data.first_mes,
      personality: data.personality,
      appearance: '', // Could extract from description
      scenario: data.scenario,
      example_dialogue: data.mes_example,
      visibility: 'public',
      content_rating: 'filtered', // User should adjust based on content
    };
  }
}

export const platformExportService = new PlatformExportService();
