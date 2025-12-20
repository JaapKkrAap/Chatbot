// AI Writing Assistant Service
// Integrates with Lovable AI gateway for character generation helpers

export type AIHelperType =
  | 'expand_description'
  | 'generate_dialogue'
  | 'suggest_traits'
  | 'generate_first_message'
  | 'batch_first_messages'
  | 'generate_lorebook'
  | 'rewrite_content'
  | 'analyze_voice'
  | 'improve_dialogue'
  | 'transform_character';

export interface AIRequest {
  type: AIHelperType;
  context: Record<string, any>;
}

export interface AIResponse {
  success: boolean;
  data?: any;
  error?: string;
}

class AIAssistantService {
  private async makeRequest(request: AIRequest): Promise<AIResponse> {
    try {
      // In a real implementation, this would call the Lovable AI gateway
      // For now, we'll simulate with mock responses
      return this.mockResponse(request);
    } catch (error) {
      return {
        success: false,
        error: String(error),
      };
    }
  }

  private mockResponse(request: AIRequest): AIResponse {
    // Mock responses for demonstration
    switch (request.type) {
      case 'expand_description':
        return {
          success: true,
          data: {
            expanded: `${request.context.brief}\n\nExpanded details would appear here with richer descriptions, background information, and vivid details that bring the character to life.`,
          },
        };

      case 'suggest_traits':
        return {
          success: true,
          data: {
            personality: ['intelligent', 'curious', 'introverted', 'creative'],
            tags: ['female', 'modern', 'slice-of-life', 'SFW'],
          },
        };

      case 'generate_first_message':
        return {
          success: true,
          data: {
            message: `*The character greets you warmly, their eyes sparkling with interest.*\n\nHello there! I've been waiting for you.`,
          },
        };

      case 'batch_first_messages':
        return {
          success: true,
          data: {
            messages: [
              '*A dramatic entrance, full of energy.*\n\nWell, well, well... look who finally showed up!',
              '*A casual, laid-back greeting.*\n\nOh hey, didn\'t see you there. What\'s up?',
              '*A mysterious, intriguing opening.*\n\n*You sense a presence behind you...*',
              '*A romantic, soft greeting.*\n\n*Looks up with a gentle smile* I was hoping you\'d come by today.',
            ],
          },
        };

      case 'analyze_voice':
        return {
          success: true,
          data: {
            score: 72,
            issues: [
              'Some dialogue uses modern slang inconsistent with character background',
              'Vocabulary complexity varies between examples',
            ],
            suggestions: [
              'Maintain consistent formality level',
              'Use period-appropriate language',
              'Keep sentence structure patterns similar',
            ],
          },
        };

      default:
        return {
          success: false,
          error: 'Unknown AI helper type',
        };
    }
  }

  async expandDescription(brief: string): Promise<string> {
    const response = await this.makeRequest({
      type: 'expand_description',
      context: { brief },
    });
    return response.success ? response.data.expanded : brief;
  }

  async suggestTraits(description: string, personality: string): Promise<{ personality: string[]; tags: string[] }> {
    const response = await this.makeRequest({
      type: 'suggest_traits',
      context: { description, personality },
    });
    return response.success ? response.data : { personality: [], tags: [] };
  }

  async generateFirstMessage(
    name: string,
    description: string,
    scenario: string,
    style: 'dramatic' | 'casual' | 'mysterious' | 'romantic'
  ): Promise<string> {
    const response = await this.makeRequest({
      type: 'generate_first_message',
      context: { name, description, scenario, style },
    });
    return response.success ? response.data.message : '';
  }

  async generateBatchFirstMessages(
    name: string,
    description: string,
    scenario: string,
    count: number = 4
  ): Promise<string[]> {
    const response = await this.makeRequest({
      type: 'batch_first_messages',
      context: { name, description, scenario, count },
    });
    return response.success ? response.data.messages : [];
  }

  async generateDialogue(
    name: string,
    personality: string,
    situation: string
  ): Promise<string> {
    const response = await this.makeRequest({
      type: 'generate_dialogue',
      context: { name, personality, situation },
    });
    return response.success ? response.data.dialogue : '';
  }

  async analyzeVoice(
    name: string,
    examples: string
  ): Promise<{ score: number; issues: string[]; suggestions: string[] }> {
    const response = await this.makeRequest({
      type: 'analyze_voice',
      context: { name, examples },
    });
    return response.success ? response.data : { score: 0, issues: [], suggestions: [] };
  }

  async improveDialogue(
    name: string,
    dialogue: string,
    personality: string
  ): Promise<string> {
    const response = await this.makeRequest({
      type: 'improve_dialogue',
      context: { name, dialogue, personality },
    });
    return response.success ? response.data.improved : dialogue;
  }

  async rewriteContent(
    content: string,
    style: 'formal' | 'casual' | 'verbose' | 'concise',
    tone: 'darker' | 'lighter' | 'funnier' | 'neutral'
  ): Promise<string> {
    const response = await this.makeRequest({
      type: 'rewrite_content',
      context: { content, style, tone },
    });
    return response.success ? response.data.rewritten : content;
  }

  async transformCharacter(
    currentData: any,
    transformPrompt: string
  ): Promise<any> {
    const response = await this.makeRequest({
      type: 'transform_character',
      context: { currentData, transformPrompt },
    });
    return response.success ? response.data.transformed : currentData;
  }
}

export const aiAssistant = new AIAssistantService();
