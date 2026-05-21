// Character Doctor - Diagnostic System
import { Character } from '@/types/character-card';
import { aiAssistant } from './aiAssistant';

export interface DiagnosticIssue {
  field: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
  fixable?: boolean; // Can be auto-fixed with AI
}

export interface HealthReport {
  score: number; // 0-100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  issues: DiagnosticIssue[];
  tokenCount: number;
}

class CharacterDoctorService {
  private checkMalformedMacros(text: string, field: string): DiagnosticIssue[] {
    const issues: DiagnosticIssue[] = [];

    // Check for unmatched braces
    const openBraces = (text.match(/\{\{/g) || []).length;
    const closeBraces = (text.match(/\}\}/g) || []).length;

    if (openBraces !== closeBraces) {
      issues.push({
        field,
        severity: 'error',
        message: 'Unmatched macro braces detected',
        suggestion: 'Ensure all {{macros}} have matching opening and closing braces',
      });
    }

    // Check for invalid macro names
    const macros = text.match(/\{\{([^}]+)\}\}/g) || [];
    const validMacros = ['char', 'user', 'original'];

    macros.forEach(macro => {
      const name = macro.replace(/\{\{|\}\}/g, '').trim();
      if (!validMacros.includes(name)) {
        issues.push({
          field,
          severity: 'warning',
          message: `Unknown macro: ${macro}`,
          suggestion: `Valid macros are: {{char}}, {{user}}, {{original}}`,
        });
      }
    });

    return issues;
  }

  private checkSmartQuotes(text: string, field: string): DiagnosticIssue[] {
    const issues: DiagnosticIssue[] = [];
    const smartQuotes = /[""'']/g;

    if (smartQuotes.test(text)) {
      issues.push({
        field,
        severity: 'warning',
        message: 'Smart quotes detected (may cause issues)',
        suggestion: 'Replace smart quotes with straight quotes (\' and ")',
        fixable: true,
      });
    }

    return issues;
  }

  private checkRepetitiveWords(text: string, field: string): DiagnosticIssue[] {
    const issues: DiagnosticIssue[] = [];
    const words = text.toLowerCase().split(/\s+/);
    const wordCount: Record<string, number> = {};

    words.forEach(word => {
      if (word.length > 3) {
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    });

    const repetitive = Object.entries(wordCount)
      .filter(([_, count]) => count > 5)
      .sort((a, b) => b[1] - a[1]);

    if (repetitive.length > 0) {
      const topWords = repetitive.slice(0, 3).map(([word, count]) => `"${word}" (${count}x)`).join(', ');
      issues.push({
        field,
        severity: 'info',
        message: `Repetitive words detected: ${topWords}`,
        suggestion: 'Consider using synonyms to add variety',
        fixable: true,
      });
    }

    return issues;
  }

  private checkMissingFields(character: Character): DiagnosticIssue[] {
    const issues: DiagnosticIssue[] = [];

    if (!character.name || character.name.trim() === '') {
      issues.push({
        field: 'name',
        severity: 'error',
        message: 'Character name is required',
      });
    }

    const important = {
      description: 'Description helps AI understand the character',
      personality: 'Personality defines character behavior',
      scenario: 'Scenario provides context for interactions',
      first_mes: 'First message sets the tone',
    };

    Object.entries(important).forEach(([field, reason]) => {
      const value = character[field as keyof Character];
      if (!value || String(value).trim() === '') {
        issues.push({
          field,
          severity: 'warning',
          message: `${field} is empty`,
          suggestion: reason,
          fixable: true,
        });
      }
    });

    return issues;
  }

  private estimateTokens(text: string): number {
    // Simple estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  private calculateTokenBudget(character: Character): number {
    let total = 0;

    total += this.estimateTokens(character.name);
    total += this.estimateTokens(character.description);
    total += this.estimateTokens(character.personality);
    total += this.estimateTokens(character.scenario);
    total += this.estimateTokens(character.first_mes);
    total += this.estimateTokens(character.mes_example);
    total += this.estimateTokens(character.system_prompt);
    total += this.estimateTokens(character.post_history_instructions);

    character.alternate_greetings?.forEach(greeting => {
      total += this.estimateTokens(greeting);
    });

    character.character_book?.entries.forEach(entry => {
      if (entry.enabled) {
        total += this.estimateTokens(entry.content);
      }
    });

    return total;
  }

  diagnose(character: Character): HealthReport {
    const issues: DiagnosticIssue[] = [];

    // Check all text fields for issues
    const textFields: Array<keyof Character> = [
      'description',
      'personality',
      'scenario',
      'first_mes',
      'mes_example',
      'system_prompt',
      'post_history_instructions',
      'creator_notes',
    ];

    textFields.forEach(field => {
      const value = character[field];
      if (typeof value === 'string' && value) {
        issues.push(...this.checkMalformedMacros(value, field));
        issues.push(...this.checkSmartQuotes(value, field));
        issues.push(...this.checkRepetitiveWords(value, field));
      }
    });

    // Check alternate greetings
    character.alternate_greetings?.forEach((greeting, index) => {
      issues.push(...this.checkMalformedMacros(greeting, `alternate_greeting_${index}`));
      issues.push(...this.checkSmartQuotes(greeting, `alternate_greeting_${index}`));
    });

    // Check missing fields
    issues.push(...this.checkMissingFields(character));

    // Check token budget
    const tokenCount = this.calculateTokenBudget(character);
    if (tokenCount > 8000) {
      issues.push({
        field: 'overall',
        severity: 'warning',
        message: `High token count (${tokenCount})`,
        suggestion: 'Consider reducing content or splitting into lorebook entries',
      });
    } else if (tokenCount > 4000) {
      issues.push({
        field: 'overall',
        severity: 'info',
        message: `Moderate token count (${tokenCount})`,
        suggestion: 'May not work well with all AI backends',
      });
    }

    // Calculate health score
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    const infoCount = issues.filter(i => i.severity === 'info').length;

    let score = 100;
    score -= errorCount * 20;
    score -= warningCount * 10;
    score -= infoCount * 5;
    score = Math.max(0, score);

    const grade =
      score >= 95 ? 'A+' :
      score >= 90 ? 'A' :
      score >= 80 ? 'B' :
      score >= 70 ? 'C' :
      score >= 60 ? 'D' : 'F';

    return {
      score,
      grade,
      issues,
      tokenCount,
    };
  }

  identityStressTest(character: Character): DiagnosticIssue[] {
    const issues: DiagnosticIssue[] = [];

    // Check if character name appears in fields
    const name = character.name.toLowerCase();

    if (character.description.toLowerCase().includes(name)) {
      issues.push({
        field: 'description',
        severity: 'info',
        message: 'Character name appears in description',
        suggestion: 'Consider using {{char}} macro instead for flexibility',
      });
    }

    // Check for first-person references (usually bad)
    const firstPerson = /\b(I am|I'm|my name is|I have|I can)\b/i;
    if (firstPerson.test(character.personality) || firstPerson.test(character.description)) {
      issues.push({
        field: 'personality',
        severity: 'warning',
        message: 'First-person references detected in character definition',
        suggestion: 'Use third-person descriptions (e.g., "She is" instead of "I am")',
      });
    }

    return issues;
  }

  // AI-powered auto-fix methods
  async autoFixIssue(
    issue: DiagnosticIssue,
    content: string,
    _character: Character,
    aiSettings: any
  ): Promise<string> {
    if (!issue.fixable) {
      return content;
    }

    // Fix smart quotes (no AI needed)
    if (issue.message.includes('Smart quotes')) {
      return content.replace(/[""]/g, '"').replace(/['']/g, "'");
    }

    // Fix with AI for other issues
    return await aiAssistant.fixCharacterIssue(issue.message, content, aiSettings);
  }

  async autoFixAllIssues(
    character: Character,
    aiSettings: any
  ): Promise<{ fixed: Character; fixCount: number }> {
    const report = this.diagnose(character);
    const fixableIssues = report.issues.filter((i) => i.fixable);
    let fixCount = 0;
    const fixed = { ...character };

    for (const issue of fixableIssues) {
      const field = issue.field as keyof Character;

      // Skip if not a string field
      if (typeof fixed[field] !== 'string') continue;

      try {
        const originalContent = String(fixed[field]);
        const fixedContent = await this.autoFixIssue(issue, originalContent, character, aiSettings);

        if (fixedContent !== originalContent) {
          (fixed as any)[field] = fixedContent;
          fixCount++;
        }
      } catch (error) {
        console.error(`Failed to fix issue in ${field}:`, error);
      }
    }

    return { fixed, fixCount };
  }

  async generateMissingField(
    field: string,
    character: Character,
    aiSettings: any
  ): Promise<string> {

    switch (field) {
      case 'description':
        return await aiAssistant.makeRequest(
          {
            type: 'expand_description',
            context: { brief: `A character named ${character.name}` },
          },
          aiSettings
        ).then((r) => (r.success ? r.data : ''));

      case 'personality':
        return await aiAssistant.makeRequest(
          {
            type: 'extract_traits',
            context: { content: character.description || `Character: ${character.name}` },
          },
          aiSettings
        ).then((r) => {
          if (r.success) {
            try {
              const result = JSON.parse(r.data);
              return result.traits.join(', ');
            } catch {
              return '';
            }
          }
          return '';
        });

      case 'scenario':
        return await aiAssistant.makeRequest(
          {
            type: 'scenario_variations',
            context: {
              name: character.name,
              scenario: `A scene involving ${character.name}`,
              count: 1,
            },
          },
          aiSettings
        ).then((r) => {
          if (r.success) {
            try {
              const scenarios = JSON.parse(r.data);
              return scenarios[0] || '';
            } catch {
              return '';
            }
          }
          return '';
        });

      case 'first_mes':
        return await aiAssistant.generateFirstMessage(
          character.name,
          character.description,
          character.scenario,
          'casual',
          aiSettings
        );

      default:
        return '';
    }
  }
}

export const characterDoctor = new CharacterDoctorService();
