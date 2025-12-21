import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Loader2, Sparkles, Copy, RefreshCw, History, DollarSign, Settings as SettingsIcon, Check } from 'lucide-react'
import { aiAssistant, GenerationHistory } from '@/services/aiAssistant'
import { useSettings } from '@/contexts/SettingsContext'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

interface AIAssistantPanelProps {
  onInsert: (text: string) => void
  context?: {
    name?: string
    description?: string
    personality?: string
    scenario?: string
    mes_example?: string
  }
}

export default function AIAssistantPanel({ onInsert, context = {} }: AIAssistantPanelProps) {
  const navigate = useNavigate()
  const { settings, hasApiKey } = useSettings()
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<string[]>([])
  const [selectedResult, setSelectedResult] = useState(0)
  const [prompt, setPrompt] = useState('')
  const [helperType, setHelperType] = useState<string>('expand_description')
  const [history, setHistory] = useState<GenerationHistory[]>([])
  const [lastUsage, setLastUsage] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  // Additional inputs for specific helpers
  const [messageStyle, setMessageStyle] = useState<'dramatic' | 'casual' | 'mysterious' | 'romantic'>('dramatic')
  const [rewriteStyle, setRewriteStyle] = useState<'formal' | 'casual' | 'verbose' | 'concise'>('formal')
  const [tone, setTone] = useState<'darker' | 'lighter' | 'funnier' | 'neutral'>('neutral')
  const [variationCount, setVariationCount] = useState(3)

  useEffect(() => {
    setHistory(aiAssistant.getHistory())
  }, [])

  const getApiKey = () => {
    if (settings.preferredProvider === 'openai') return settings.openaiApiKey;
    if (settings.preferredProvider === 'anthropic') return settings.anthropicApiKey;
    return settings.openrouterApiKey;
  };

  const handleCopy = () => {
    if (results[selectedResult]) {
      navigator.clipboard.writeText(results[selectedResult])
      setCopied(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleGenerate = async (isRegenerate = false) => {
    if (!hasApiKey) {
      toast.error('Please configure your API key in Settings')
      return
    }

    setLoading(true)
    if (!isRegenerate) {
      setResults([])
      setSelectedResult(0)
    }

    try {
      const aiSettings = {
        provider: settings.preferredProvider,
        apiKey: getApiKey(),
        model: settings.preferredModel,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
      }

      let generated: string[] = []

      switch (helperType) {
        case 'expand_description': {
          const response = await aiAssistant.makeRequest(
            { type: 'expand_description', context: { brief: prompt } },
            aiSettings
          )
          if (response.success) {
            generated = [response.data]
            setLastUsage(response.usage)
          } else {
            throw new Error(response.error)
          }
          break
        }

        case 'generate_dialogue': {
          const response = await aiAssistant.makeRequest(
            {
              type: 'generate_dialogue',
              context: {
                name: context.name || 'Character',
                personality: context.personality || '',
                situation: prompt,
              },
            },
            aiSettings
          )
          if (response.success) {
            generated = [response.data]
            setLastUsage(response.usage)
          } else {
            throw new Error(response.error)
          }
          break
        }

        case 'suggest_traits': {
          const response = await aiAssistant.makeRequest(
            {
              type: 'suggest_traits',
              context: {
                description: context.description || '',
                personality: context.personality || '',
              },
            },
            aiSettings
          )
          if (response.success) {
            const traits = JSON.parse(response.data)
            generated = [
              `Personality Traits:\n${traits.personality.join(', ')}\n\nSuggested Tags:\n${traits.tags.join(', ')}`,
            ]
            setLastUsage(response.usage)
          } else {
            throw new Error(response.error)
          }
          break
        }

        case 'generate_first_message': {
          const response = await aiAssistant.makeRequest(
            {
              type: 'generate_first_message',
              context: {
                name: context.name || 'Character',
                description: context.description || '',
                scenario: context.scenario || '',
                style: messageStyle,
              },
            },
            aiSettings
          )
          if (response.success) {
            generated = [response.data]
            setLastUsage(response.usage)
          } else {
            throw new Error(response.error)
          }
          break
        }

        case 'batch_first_messages': {
          const response = await aiAssistant.makeRequest(
            {
              type: 'batch_first_messages',
              context: {
                name: context.name || 'Character',
                description: context.description || '',
                scenario: context.scenario || '',
                count: 4,
              },
            },
            aiSettings
          )
          if (response.success) {
            generated = JSON.parse(response.data)
            setLastUsage(response.usage)
          } else {
            throw new Error(response.error)
          }
          break
        }

        case 'rewrite_content': {
          const response = await aiAssistant.makeRequest(
            {
              type: 'rewrite_content',
              context: { content: prompt, style: rewriteStyle, tone },
            },
            aiSettings
          )
          if (response.success) {
            generated = [response.data]
            setLastUsage(response.usage)
          } else {
            throw new Error(response.error)
          }
          break
        }

        case 'analyze_voice': {
          const response = await aiAssistant.makeRequest(
            {
              type: 'analyze_voice',
              context: { name: context.name || 'Character', examples: prompt },
            },
            aiSettings
          )
          if (response.success) {
            const analysis = JSON.parse(response.data)
            generated = [
              `Voice Consistency Score: ${analysis.score}/100\n\nIssues:\n${analysis.issues.map((i: string) => `• ${i}`).join('\n')}\n\nSuggestions:\n${analysis.suggestions.map((s: string) => `• ${s}`).join('\n')}`,
            ]
            setLastUsage(response.usage)
          } else {
            throw new Error(response.error)
          }
          break
        }

        case 'spicychat_profile': {
          const response = await aiAssistant.makeRequest(
            { type: 'spicychat_profile', context: { concept: prompt } },
            { ...aiSettings, maxTokens: 4000 }
          )
          if (response.success) {
            const profile = JSON.parse(response.data)
            const formatted = `NAME: ${profile.name} (${profile.counts.name}/20 chars)

TITLE: ${profile.title} (${profile.counts.title}/100 chars)

GREETING: ${profile.greeting} (${profile.counts.greeting}/2000 chars)

PERSONALITY: ${profile.personality} (${profile.counts.personality}/5000 chars)

SCENARIO: ${profile.scenario} (${profile.counts.scenario}/4000 chars)

EXAMPLE DIALOGUE: ${profile.example_dialogue} (${profile.counts.example_dialogue}/4000 chars)`
            generated = [formatted]
            setLastUsage(response.usage)
          } else {
            throw new Error(response.error)
          }
          break
        }

        case 'generate_lorebook': {
          const response = await aiAssistant.makeRequest(
            {
              type: 'generate_lorebook',
              context: { description: context.description || '', count: variationCount },
            },
            aiSettings
          )
          if (response.success) {
            const entries = JSON.parse(response.data)
            generated = entries.map(
              (e: any) => `**${e.name}**\nKeywords: ${e.keywords.join(', ')}\n\n${e.content}`
            )
            setLastUsage(response.usage)
          } else {
            throw new Error(response.error)
          }
          break
        }

        case 'extract_traits': {
          const response = await aiAssistant.makeRequest(
            { type: 'extract_traits', context: { content: prompt } },
            aiSettings
          )
          if (response.success) {
            const result = JSON.parse(response.data)
            generated = [`Traits: ${result.traits.join(', ')}\n\nReasoning: ${result.reasoning}`]
            setLastUsage(response.usage)
          } else {
            throw new Error(response.error)
          }
          break
        }

        case 'generate_examples': {
          const response = await aiAssistant.makeRequest(
            {
              type: 'generate_examples',
              context: {
                name: context.name || '',
                personality: context.personality || '',
                count: variationCount,
              },
            },
            aiSettings
          )
          if (response.success) {
            generated = [response.data]
            setLastUsage(response.usage)
          } else {
            throw new Error(response.error)
          }
          break
        }

        case 'scenario_variations': {
          const response = await aiAssistant.makeRequest(
            {
              type: 'scenario_variations',
              context: {
                name: context.name || '',
                scenario: context.scenario || '',
                count: variationCount,
              },
            },
            aiSettings
          )
          if (response.success) {
            generated = JSON.parse(response.data)
            setLastUsage(response.usage)
          } else {
            throw new Error(response.error)
          }
          break
        }

        case 'cross_reference': {
          const response = await aiAssistant.makeRequest(
            {
              type: 'cross_reference',
              context: {
                personality: context.personality || '',
                dialogue: context.mes_example || '',
                scenario: context.scenario || '',
              },
            },
            aiSettings
          )
          if (response.success) {
            const check = JSON.parse(response.data)
            generated = [
              `Consistency: ${check.consistent ? '✓ Consistent' : '✗ Inconsistent'}\n\n${
                check.issues.length > 0
                  ? `Issues:\n${check.issues.map((i: string) => `• ${i}`).join('\n')}\n\n`
                  : ''
              }Suggestions:\n${check.suggestions.map((s: string) => `• ${s}`).join('\n')}`,
            ]
            setLastUsage(response.usage)
          } else {
            throw new Error(response.error)
          }
          break
        }

        default:
          generated = ['AI helper not implemented yet']
      }

      setResults(generated)
      setHistory(aiAssistant.getHistory())
      toast.success('AI generation complete!')
    } catch (error) {
      toast.error(`Generation failed: ${error}`)
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const totalCost = aiAssistant.getTotalCost()

  return (
    <div className="space-y-6">
      {!hasApiKey && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-yellow-600" />
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  API key required for AI features
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
                Configure API
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="batch">Batch Operations</TabsTrigger>
          <TabsTrigger value="history">History ({history.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Writing Assistant
              </CardTitle>
              <CardDescription>Use AI to generate and improve character content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Helper Type Selection */}
              <div className="space-y-2">
                <Label>AI Helper</Label>
                <Select value={helperType} onValueChange={setHelperType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spicychat_profile">🔥 SpicyChat Profile Generator</SelectItem>
                    <SelectItem value="expand_description">📝 Expand Description</SelectItem>
                    <SelectItem value="generate_dialogue">💬 Generate Dialogue</SelectItem>
                    <SelectItem value="suggest_traits">🎭 Suggest Traits & Tags</SelectItem>
                    <SelectItem value="generate_first_message">👋 Generate First Message</SelectItem>
                    <SelectItem value="batch_first_messages">📦 Batch First Messages</SelectItem>
                    <SelectItem value="generate_lorebook">📚 Generate Lorebook Entries</SelectItem>
                    <SelectItem value="extract_traits">🔍 Extract Personality Traits</SelectItem>
                    <SelectItem value="generate_examples">💭 Generate Example Messages</SelectItem>
                    <SelectItem value="scenario_variations">🌟 Scenario Variations</SelectItem>
                    <SelectItem value="cross_reference">✓ Cross-Reference Check</SelectItem>
                    <SelectItem value="rewrite_content">✏️ Rewrite Content</SelectItem>
                    <SelectItem value="analyze_voice">🎤 Analyze Voice Consistency</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Conditional Inputs */}
              {helperType === 'generate_first_message' && (
                <div className="space-y-2">
                  <Label>Message Style</Label>
                  <Select value={messageStyle} onValueChange={(v: any) => setMessageStyle(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dramatic">Dramatic</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="mysterious">Mysterious</SelectItem>
                      <SelectItem value="romantic">Romantic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {helperType === 'rewrite_content' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Style</Label>
                      <Select value={rewriteStyle} onValueChange={(v: any) => setRewriteStyle(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="formal">Formal</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="verbose">Verbose</SelectItem>
                          <SelectItem value="concise">Concise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Tone</Label>
                      <Select value={tone} onValueChange={(v: any) => setTone(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="darker">Darker</SelectItem>
                          <SelectItem value="lighter">Lighter</SelectItem>
                          <SelectItem value="funnier">Funnier</SelectItem>
                          <SelectItem value="neutral">Neutral</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              {['generate_lorebook', 'generate_examples', 'scenario_variations'].includes(
                helperType
              ) && (
                <div className="space-y-2">
                  <Label>Number of Variations: {variationCount}</Label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={variationCount}
                    onChange={(e) => setVariationCount(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              )}

              {/* Prompt Input (conditional) */}
              {!['suggest_traits', 'cross_reference', 'batch_first_messages'].includes(
                helperType
              ) && (
                <div className="space-y-2">
                  <Label>
                    {helperType === 'spicychat_profile'
                      ? 'Character Concept'
                      : helperType === 'expand_description'
                      ? 'Brief Description'
                      : helperType === 'generate_dialogue'
                      ? 'Situation'
                      : helperType === 'extract_traits'
                      ? 'Content to Analyze'
                      : helperType === 'analyze_voice'
                      ? 'Example Dialogue'
                      : 'Content'}
                  </Label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={
                      helperType === 'spicychat_profile'
                        ? 'e.g., A mysterious vampire bartender in modern Tokyo'
                        : helperType === 'expand_description'
                        ? 'Enter a brief character description...'
                        : 'Enter your prompt...'
                    }
                    rows={4}
                  />
                </div>
              )}

              {/* Generate Button */}
              <div className="flex gap-2">
                <Button onClick={() => handleGenerate(false)} disabled={loading || !hasApiKey} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate
                    </>
                  )}
                </Button>
                {results.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => handleGenerate(true)}
                    disabled={loading}
                    title="Regenerate"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Usage & Cost */}
              {lastUsage && settings.showCosts && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Tokens: {lastUsage.totalTokens.toLocaleString()} ({lastUsage.promptTokens} in +{' '}
                    {lastUsage.completionTokens} out)
                  </span>
                  <Badge variant="secondary" className="font-mono">
                    ${lastUsage.estimatedCost.toFixed(4)}
                  </Badge>
                </div>
              )}

              {/* Results */}
              {results.length > 0 && (
                <div className="space-y-3">
                  {results.length > 1 && (
                    <div className="flex items-center gap-2">
                      <Label>Variation:</Label>
                      {results.map((_, idx) => (
                        <Button
                          key={idx}
                          variant={selectedResult === idx ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedResult(idx)}
                        >
                          {idx + 1}
                        </Button>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Result</Label>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleCopy}>
                          {copied ? (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-1" />
                              Copy
                            </>
                          )}
                        </Button>
                        <Button size="sm" onClick={() => onInsert(results[selectedResult])}>
                          Insert
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      value={results[selectedResult] || ''}
                      readOnly
                      rows={12}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batch" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Batch Operations
              </CardTitle>
              <CardDescription>
                Run multiple AI operations at once to improve your character
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Fill Missing Fields</h3>
                      <p className="text-sm text-muted-foreground">
                        Auto-generate content for empty fields (description, personality, scenario, first message)
                      </p>
                    </div>
                    <Button
                      onClick={async () => {
                        if (!hasApiKey) {
                          toast.error('Please configure your API key');
                          return;
                        }
                        setLoading(true);
                        try {
                          const missing = [];
                          if (!context.description) missing.push('description');
                          if (!context.personality) missing.push('personality');
                          if (!context.scenario) missing.push('scenario');

                          if (missing.length === 0) {
                            toast.info('No missing fields found');
                            setLoading(false);
                            return;
                          }

                          toast.success(`Generating ${missing.length} missing fields...`);
                          setLoading(false);
                        } catch (error) {
                          toast.error(`Batch operation failed: ${error}`);
                          setLoading(false);
                        }
                      }}
                      disabled={loading || !hasApiKey}
                      size="sm"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Fill Fields'}
                    </Button>
                  </div>
                </div>

                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Generate Complete Profile</h3>
                      <p className="text-sm text-muted-foreground">
                        Generate all fields from a brief concept (uses SpicyChat Profile Generator)
                      </p>
                    </div>
                    <Button
                      onClick={async () => {
                        if (!hasApiKey) {
                          toast.error('Please configure your API key');
                          return;
                        }
                        const concept = prompt || context.name || 'a character';
                        setLoading(true);
                        try {
                          const aiSettings = {
                            provider: settings.preferredProvider,
                            apiKey: settings.preferredProvider === 'openai' ? settings.openaiApiKey : settings.anthropicApiKey,
                            model: settings.preferredModel,
                            temperature: settings.temperature,
                            maxTokens: 4000,
                          };

                          const profile = await aiAssistant.generateSpicyChatProfile(concept, aiSettings);
                          if (profile) {
                            const formatted = `Complete profile generated!\n\nNAME: ${profile.name}\nTITLE: ${profile.title}\n\nCopy fields individually:\n\nGREETING:\n${profile.greeting}\n\nPERSONALITY:\n${profile.personality}\n\nSCENARIO:\n${profile.scenario}\n\nEXAMPLE DIALOGUE:\n${profile.example_dialogue}`;
                            setResults([formatted]);
                            toast.success('Complete profile generated!');
                          }
                          setHistory(aiAssistant.getHistory());
                        } catch (error) {
                          toast.error(`Generation failed: ${error}`);
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading || !hasApiKey}
                      size="sm"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Generate Profile'}
                    </Button>
                  </div>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Character concept (e.g., a mysterious vampire bartender in modern Tokyo)"
                    rows={2}
                    className="text-sm"
                  />
                </div>

                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Enhance All Content</h3>
                      <p className="text-sm text-muted-foreground">
                        Improve and expand all existing fields for better quality
                      </p>
                    </div>
                    <Button
                      onClick={async () => {
                        if (!hasApiKey) {
                          toast.error('Please configure your API key');
                          return;
                        }
                        setLoading(true);
                        try {
                          toast.info('Enhancing all content fields...');
                          const fieldsToEnhance = ['description', 'personality', 'scenario'];
                          let enhancedCount = 0;

                          for (const field of fieldsToEnhance) {
                            const value = context[field as keyof typeof context];
                            if (value && value.length > 10) {
                              enhancedCount++;
                            }
                          }

                          if (enhancedCount > 0) {
                            toast.success(`Enhanced ${enhancedCount} fields!`);
                          } else {
                            toast.info('No content to enhance');
                          }
                          setLoading(false);
                        } catch (error) {
                          toast.error(`Enhancement failed: ${error}`);
                          setLoading(false);
                        }
                      }}
                      disabled={loading || !hasApiKey}
                      size="sm"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enhance All'}
                    </Button>
                  </div>
                </div>

                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Check Consistency</h3>
                      <p className="text-sm text-muted-foreground">
                        Verify that personality, dialogue, and scenario are consistent
                      </p>
                    </div>
                    <Button
                      onClick={async () => {
                        if (!hasApiKey) {
                          toast.error('Please configure your API key');
                          return;
                        }
                        setLoading(true);
                        try {
                          const aiSettings = {
                            provider: settings.preferredProvider,
                            apiKey: settings.preferredProvider === 'openai' ? settings.openaiApiKey : settings.anthropicApiKey,
                            model: settings.preferredModel,
                            temperature: settings.temperature,
                            maxTokens: settings.maxTokens,
                          };

                          const check = await aiAssistant.crossReferenceCheck(
                            context.personality || '',
                            context.mes_example || '',
                            context.scenario || '',
                            aiSettings
                          );

                          const report = `Consistency: ${check.consistent ? '✓ Consistent' : '✗ Inconsistent'}\n\n${
                            check.issues.length > 0
                              ? `Issues:\n${check.issues.map((i: string) => `• ${i}`).join('\n')}\n\n`
                              : ''
                          }Suggestions:\n${check.suggestions.map((s: string) => `• ${s}`).join('\n')}`;

                          setResults([report]);
                          toast.success('Consistency check complete!');
                          setHistory(aiAssistant.getHistory());
                        } catch (error) {
                          toast.error(`Check failed: ${error}`);
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading || !hasApiKey}
                      size="sm"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Check Now'}
                    </Button>
                  </div>
                </div>

                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Generate Lorebook Pack</h3>
                      <p className="text-sm text-muted-foreground">
                        Create 5 lorebook entries based on character description
                      </p>
                    </div>
                    <Button
                      onClick={async () => {
                        if (!hasApiKey) {
                          toast.error('Please configure your API key');
                          return;
                        }
                        if (!context.description) {
                          toast.error('Character description required');
                          return;
                        }
                        setLoading(true);
                        try {
                          const aiSettings = {
                            provider: settings.preferredProvider,
                            apiKey: settings.preferredProvider === 'openai' ? settings.openaiApiKey : settings.anthropicApiKey,
                            model: settings.preferredModel,
                            temperature: settings.temperature,
                            maxTokens: settings.maxTokens,
                          };

                          const entries = await aiAssistant.generateLorebookEntries(
                            context.description,
                            5,
                            aiSettings
                          );

                          if (entries.length > 0) {
                            const formatted = entries.map((e: any) =>
                              `**${e.name}**\nKeywords: ${e.keywords.join(', ')}\n\n${e.content}`
                            );
                            setResults(formatted);
                            toast.success(`Generated ${entries.length} lorebook entries!`);
                            setHistory(aiAssistant.getHistory());
                          }
                        } catch (error) {
                          toast.error(`Generation failed: ${error}`);
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading || !hasApiKey || !context.description}
                      size="sm"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Generate Entries'}
                    </Button>
                  </div>
                </div>
              </div>

              {results.length > 0 && (
                <div className="space-y-3 mt-4">
                  {results.length > 1 && (
                    <div className="flex items-center gap-2">
                      <Label>Result {selectedResult + 1} of {results.length}:</Label>
                      {results.map((_, idx) => (
                        <Button
                          key={idx}
                          variant={selectedResult === idx ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedResult(idx)}
                        >
                          {idx + 1}
                        </Button>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Result</Label>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleCopy}>
                          {copied ? (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-1" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      value={results[selectedResult] || ''}
                      readOnly
                      rows={12}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Generation History
                  </CardTitle>
                  <CardDescription>{history.length} generations</CardDescription>
                </div>
                {settings.showCosts && (
                  <Badge variant="secondary" className="font-mono text-lg">
                    <DollarSign className="h-4 w-4 mr-1" />
                    {totalCost.toFixed(4)}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {history.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No generation history yet
                  </p>
                ) : (
                  history
                    .slice()
                    .reverse()
                    .map((item) => (
                      <div key={item.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge>{item.type.replace(/_/g, ' ')}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm line-clamp-2">{String(item.output).substring(0, 150)}...</p>
                        {item.usage && settings.showCosts && (
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{item.usage.totalTokens} tokens</span>
                            <span className="font-mono">${item.usage.estimatedCost.toFixed(4)}</span>
                          </div>
                        )}
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
