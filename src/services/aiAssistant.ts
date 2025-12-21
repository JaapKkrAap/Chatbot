// AI Writing Assistant Service
// Real integration with OpenAI and Anthropic APIs

export type AIHelperType =
  | 'expand_description'
  | 'generate_dialogue'
  | 'suggest_traits'
  | 'generate_first_message'
  | 'batch_first_messages'
  | 'generate_lorebook'
  | 'rewrite_content'
  | 'analyze_voice'
  | 'spicychat_profile'
  | 'extract_traits'
  | 'generate_examples'
  | 'scenario_variations'
  | 'cross_reference'
  | 'fix_character_issue';

export interface AIRequest {
  type: AIHelperType;
  context: Record<string, any>;
}

export interface AIResponse {
  success: boolean;
  data?: any;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCost: number;
  };
}

export interface GenerationHistory {
  id: string;
  timestamp: number;
  type: AIHelperType;
  input: Record<string, any>;
  output: any;
  usage?: AIResponse['usage'];
}

// Pricing per 1M tokens (as of Dec 2024)
const PRICING = {
  'gpt-4o': { input: 2.50, output: 10.00 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
  'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
  'claude-3-5-haiku-20241022': { input: 0.80, output: 4.00 },
};

class AIAssistantService {
  private history: GenerationHistory[] = [];

  private estimateCost(model: string, promptTokens: number, completionTokens: number): number {
    const pricing = PRICING[model as keyof typeof PRICING];
    if (!pricing) return 0;

    return (
      (promptTokens / 1_000_000) * pricing.input +
      (completionTokens / 1_000_000) * pricing.output
    );
  }

  private async makeOpenAIRequest(
    apiKey: string,
    model: string,
    messages: Array<{ role: string; content: string }>,
    temperature: number,
    maxTokens: number
  ): Promise<AIResponse> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.error?.message || 'OpenAI API request failed',
        };
      }

      const data = await response.json();
      const usage = {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
        estimatedCost: this.estimateCost(
          model,
          data.usage.prompt_tokens,
          data.usage.completion_tokens
        ),
      };

      return {
        success: true,
        data: data.choices[0].message.content,
        usage,
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
      };
    }
  }

  private async makeAnthropicRequest(
    apiKey: string,
    model: string,
    messages: Array<{ role: string; content: string }>,
    temperature: number,
    maxTokens: number
  ): Promise<AIResponse> {
    try {
      // Convert messages format for Anthropic
      const systemMessage = messages.find(m => m.role === 'system')?.content || '';
      const userMessages = messages.filter(m => m.role !== 'system');

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          system: systemMessage,
          messages: userMessages,
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.error?.message || 'Anthropic API request failed',
        };
      }

      const data = await response.json();
      const usage = {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
        estimatedCost: this.estimateCost(
          model,
          data.usage.input_tokens,
          data.usage.output_tokens
        ),
      };

      return {
        success: true,
        data: data.content[0].text,
        usage,
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
      };
    }
  }

  private async makeOpenRouterRequest(
    apiKey: string,
    model: string,
    messages: Array<{ role: string; content: string }>,
    temperature: number,
    maxTokens: number
  ): Promise<AIResponse> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.href,
          'X-Title': 'Character Card Editor',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.error?.message || 'OpenRouter API request failed',
        };
      }

      const data = await response.json();
      const usage = {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
        estimatedCost: 0, // OpenRouter provides credits in response, could be added here
      };

      return {
        success: true,
        data: data.choices[0].message.content,
        usage,
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
      };
    }
  }

  async makeRequest(
    request: AIRequest,
    settings: {
      provider: 'openai' | 'anthropic' | 'openrouter';
      apiKey: string;
      model: string;
      temperature: number;
      maxTokens: number;
    }
  ): Promise<AIResponse> {
    const messages = this.buildMessages(request);

    let response: AIResponse;

    if (settings.provider === 'openai') {
      response = await this.makeOpenAIRequest(
        settings.apiKey,
        settings.model,
        messages,
        settings.temperature,
        settings.maxTokens
      );
    } else if (settings.provider === 'anthropic') {
      response = await this.makeAnthropicRequest(
        settings.apiKey,
        settings.model,
        messages,
        settings.temperature,
        settings.maxTokens
      );
    } else {
      response = await this.makeOpenRouterRequest(
        settings.apiKey,
        settings.model,
        messages,
        settings.temperature,
        settings.maxTokens
      );
    }

    // Add to history
    if (response.success) {
      this.history.push({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: request.type,
        input: request.context,
        output: response.data,
        usage: response.usage,
      });
    }

    return response;
  }

  private buildMessages(request: AIRequest): Array<{ role: string; content: string }> {
    const { type, context } = request;

    switch (type) {
      case 'expand_description':
        return [
          {
            role: 'system',
            content: 'You are an expert character creator. Expand brief descriptions into rich, detailed content.',
          },
          {
            role: 'user',
            content: `Expand this character description with vivid details, background, and depth:\n\n${context.brief}`,
          },
        ];

      case 'suggest_traits':
        return [
          {
            role: 'system',
            content: 'You are an expert at analyzing character profiles and suggesting personality traits and tags.',
          },
          {
            role: 'user',
            content: `Based on this character:\n\nDescription: ${context.description}\nPersonality: ${context.personality}\n\nSuggest 4-6 personality traits and 4-6 relevant tags. Return as JSON: {"personality": ["trait1", "trait2", ...], "tags": ["tag1", "tag2", ...]}`,
          },
        ];

      case 'generate_first_message':
        return [
          {
            role: 'system',
            content: 'You are an expert at writing engaging character greetings for roleplay.',
          },
          {
            role: 'user',
            content: `Write a ${context.style} first message for this character:\n\nName: ${context.name}\nDescription: ${context.description}\nScenario: ${context.scenario}\n\nWrite in first person or third person as appropriate. Include actions in asterisks and dialogue in quotes.`,
          },
        ];

      case 'batch_first_messages':
        return [
          {
            role: 'system',
            content: 'You are an expert at writing diverse, engaging character greetings.',
          },
          {
            role: 'user',
            content: `Write ${context.count || 4} different first messages with varying tones (dramatic, casual, mysterious, romantic) for:\n\nName: ${context.name}\nDescription: ${context.description}\nScenario: ${context.scenario}\n\nReturn as JSON array: ["message1", "message2", ...]`,
          },
        ];

      case 'generate_dialogue':
        return [
          {
            role: 'system',
            content: 'You are an expert at writing authentic character dialogue.',
          },
          {
            role: 'user',
            content: `Generate example dialogue for this character:\n\nName: ${context.name}\nPersonality: ${context.personality}\nSituation: ${context.situation}\n\nFormat as:\n{{User}}: [message]\n{{Char}}: [response]`,
          },
        ];

      case 'analyze_voice':
        return [
          {
            role: 'system',
            content: 'You are an expert at analyzing character voice consistency.',
          },
          {
            role: 'user',
            content: `Analyze the voice consistency of this character:\n\nName: ${context.name}\nExample Dialogue: ${context.examples}\n\nReturn JSON: {"score": 0-100, "issues": ["issue1", ...], "suggestions": ["suggestion1", ...]}`,
          },
        ];

      case 'rewrite_content':
        return [
          {
            role: 'system',
            content: 'You are an expert editor specializing in character content.',
          },
          {
            role: 'user',
            content: `Rewrite this content in a ${context.style} style with a ${context.tone} tone:\n\n${context.content}`,
          },
        ];

      case 'spicychat_profile':
        return [
          {
            role: 'system',
            content: `You are an expert character creator specializing in SpicyChat profiles with deep understanding of engaging storytelling, personality development, and immersive scenarios.

**CRITICAL EFFICIENCY PRINCIPLE**: The fewer characters used, the more accurately the bot will behave. Every word must earn its place.

Generate complete, publish-ready SpicyChat character profiles adhering to character limits while maximizing bot accuracy through efficient token usage.`,
          },
          {
            role: 'user',
            content: `Create a complete SpicyChat character from: ${context.concept}

Return ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "name": "string (≤20 chars)",
  "title": "string (≤100 chars)",
  "greeting": "string (≤2000 chars, target 800-1200)",
  "personality": "string (≤5000 chars, target 2000-3500)",
  "scenario": "string (≤4000 chars, target 1500-2500)",
  "example_dialogue": "string (≤4000 chars, target 1200-2000)",
  "counts": {
    "name": number,
    "title": number,
    "greeting": number,
    "personality": number,
    "scenario": number,
    "example_dialogue": number
  }
}

Focus on:
- Concise, impactful language
- Specific, vivid details (not generic)
- Natural conversation flow
- Consistent voice across sections
- Maximum efficiency - eliminate all filler`,
          },
        ];

      case 'generate_lorebook':
        return [
          {
            role: 'system',
            content: 'You are an expert at creating lorebook entries for character backgrounds.',
          },
          {
            role: 'user',
            content: `Create ${context.count || 3} lorebook entries based on this character description:\n\n${context.description}\n\nReturn JSON array: [{"name": "entry name", "content": "entry content", "keywords": ["keyword1", "keyword2"]}, ...]`,
          },
        ];

      case 'extract_traits':
        return [
          {
            role: 'system',
            content: 'You are an expert at extracting personality traits from character dialogue and descriptions.',
          },
          {
            role: 'user',
            content: `Extract specific personality traits from this content:\n\n${context.content}\n\nReturn JSON: {"traits": ["trait1", "trait2", ...], "reasoning": "brief explanation"}`,
          },
        ];

      case 'generate_examples':
        return [
          {
            role: 'system',
            content: 'You are an expert at writing example messages that showcase character personality.',
          },
          {
            role: 'user',
            content: `Generate ${context.count || 3} example messages for:\n\nName: ${context.name}\nPersonality: ${context.personality}\n\nFormat as {{User}}/{{Char}} exchanges.`,
          },
        ];

      case 'scenario_variations':
        return [
          {
            role: 'system',
            content: 'You are an expert at creating scenario variations for characters.',
          },
          {
            role: 'user',
            content: `Create ${context.count || 3} scenario variations for:\n\nCharacter: ${context.name}\nBase Scenario: ${context.scenario}\n\nReturn JSON array: ["scenario1", "scenario2", ...]`,
          },
        ];

      case 'cross_reference':
        return [
          {
            role: 'system',
            content: 'You are an expert at ensuring character consistency across all fields.',
          },
          {
            role: 'user',
            content: `Check consistency between:\n\nPersonality: ${context.personality}\nDialogue: ${context.dialogue}\nScenario: ${context.scenario}\n\nReturn JSON: {"consistent": true/false, "issues": ["issue1", ...], "suggestions": ["suggestion1", ...]}`,
          },
        ];

      case 'fix_character_issue':
        return [
          {
            role: 'system',
            content: 'You are an expert at fixing character card issues and improving quality.',
          },
          {
            role: 'user',
            content: `Fix this issue:\n\nIssue: ${context.issue}\nAffected Content: ${context.content}\n\nReturn the fixed version.`,
          },
        ];

      default:
        return [
          {
            role: 'system',
            content: 'You are a helpful AI assistant.',
          },
          {
            role: 'user',
            content: JSON.stringify(context),
          },
        ];
    }
  }

  // Helper methods with real AI integration
  async expandDescription(brief: string, settings: any): Promise<string> {
    const response = await this.makeRequest(
      { type: 'expand_description', context: { brief } },
      settings
    );
    return response.success ? response.data : brief;
  }

  async suggestTraits(
    description: string,
    personality: string,
    settings: any
  ): Promise<{ personality: string[]; tags: string[] }> {
    const response = await this.makeRequest(
      { type: 'suggest_traits', context: { description, personality } },
      settings
    );

    if (response.success) {
      try {
        return JSON.parse(response.data);
      } catch {
        return { personality: [], tags: [] };
      }
    }
    return { personality: [], tags: [] };
  }

  async generateFirstMessage(
    name: string,
    description: string,
    scenario: string,
    style: 'dramatic' | 'casual' | 'mysterious' | 'romantic',
    settings: any
  ): Promise<string> {
    const response = await this.makeRequest(
      { type: 'generate_first_message', context: { name, description, scenario, style } },
      settings
    );
    return response.success ? response.data : '';
  }

  async generateBatchFirstMessages(
    name: string,
    description: string,
    scenario: string,
    count: number = 4,
    settings: any
  ): Promise<string[]> {
    const response = await this.makeRequest(
      { type: 'batch_first_messages', context: { name, description, scenario, count } },
      settings
    );

    if (response.success) {
      try {
        return JSON.parse(response.data);
      } catch {
        return [];
      }
    }
    return [];
  }

  async generateSpicyChatProfile(concept: string, settings: any): Promise<any> {
    const response = await this.makeRequest(
      { type: 'spicychat_profile', context: { concept } },
      settings
    );

    if (response.success) {
      try {
        return JSON.parse(response.data);
      } catch (e) {
        console.error('Failed to parse SpicyChat profile:', e);
        return null;
      }
    }
    return null;
  }

  async generateLorebookEntries(description: string, count: number, settings: any): Promise<any[]> {
    const response = await this.makeRequest(
      { type: 'generate_lorebook', context: { description, count } },
      settings
    );

    if (response.success) {
      try {
        return JSON.parse(response.data);
      } catch {
        return [];
      }
    }
    return [];
  }

  async extractTraits(content: string, settings: any): Promise<{ traits: string[]; reasoning: string }> {
    const response = await this.makeRequest(
      { type: 'extract_traits', context: { content } },
      settings
    );

    if (response.success) {
      try {
        return JSON.parse(response.data);
      } catch {
        return { traits: [], reasoning: '' };
      }
    }
    return { traits: [], reasoning: '' };
  }

  async generateExampleMessages(name: string, personality: string, count: number, settings: any): Promise<string> {
    const response = await this.makeRequest(
      { type: 'generate_examples', context: { name, personality, count } },
      settings
    );
    return response.success ? response.data : '';
  }

  async generateScenarioVariations(name: string, scenario: string, count: number, settings: any): Promise<string[]> {
    const response = await this.makeRequest(
      { type: 'scenario_variations', context: { name, scenario, count } },
      settings
    );

    if (response.success) {
      try {
        return JSON.parse(response.data);
      } catch {
        return [];
      }
    }
    return [];
  }

  async crossReferenceCheck(
    personality: string,
    dialogue: string,
    scenario: string,
    settings: any
  ): Promise<{ consistent: boolean; issues: string[]; suggestions: string[] }> {
    const response = await this.makeRequest(
      { type: 'cross_reference', context: { personality, dialogue, scenario } },
      settings
    );

    if (response.success) {
      try {
        return JSON.parse(response.data);
      } catch {
        return { consistent: true, issues: [], suggestions: [] };
      }
    }
    return { consistent: true, issues: [], suggestions: [] };
  }

  async fixCharacterIssue(issue: string, content: string, settings: any): Promise<string> {
    const response = await this.makeRequest(
      { type: 'fix_character_issue', context: { issue, content } },
      settings
    );
    return response.success ? response.data : content;
  }

  getHistory(): GenerationHistory[] {
    return this.history;
  }

  clearHistory(): void {
    this.history = [];
  }

  getTotalCost(): number {
    return this.history.reduce((sum, item) => sum + (item.usage?.estimatedCost || 0), 0);
  }
}

export const aiAssistant = new AIAssistantService();
