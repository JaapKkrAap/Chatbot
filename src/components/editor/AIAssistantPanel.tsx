import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Sparkles } from 'lucide-react'
import { aiAssistant } from '@/services/aiAssistant'
import { toast } from 'sonner'

interface AIAssistantPanelProps {
  onInsert: (text: string) => void
  context?: {
    name?: string
    description?: string
    personality?: string
    scenario?: string
  }
}

export default function AIAssistantPanel({ onInsert, context = {} }: AIAssistantPanelProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [prompt, setPrompt] = useState('')
  const [helperType, setHelperType] = useState<string>('expand_description')

  const handleGenerate = async () => {
    setLoading(true)
    setResult('')

    try {
      let generated = ''

      switch (helperType) {
        case 'expand_description':
          generated = await aiAssistant.expandDescription(prompt)
          break

        case 'generate_dialogue':
          generated = await aiAssistant.generateDialogue(
            context.name || 'Character',
            context.personality || '',
            prompt
          )
          break

        case 'suggest_traits':
          const traits = await aiAssistant.suggestTraits(
            context.description || '',
            context.personality || ''
          )
          generated = `Personality Traits:\n${traits.personality.join(', ')}\n\nSuggested Tags:\n${traits.tags.join(', ')}`
          break

        case 'generate_first_message':
          const messageStyle = prompt.toLowerCase().includes('dramatic') ? 'dramatic' :
                       prompt.toLowerCase().includes('casual') ? 'casual' :
                       prompt.toLowerCase().includes('mysterious') ? 'mysterious' : 'romantic'
          generated = await aiAssistant.generateFirstMessage(
            context.name || 'Character',
            context.description || '',
            context.scenario || '',
            messageStyle
          )
          break

        case 'batch_first_messages':
          const messages = await aiAssistant.generateBatchFirstMessages(
            context.name || 'Character',
            context.description || '',
            context.scenario || '',
            4
          )
          generated = messages.join('\n\n---\n\n')
          break

        case 'rewrite_content':
          const rewriteStyle = prompt.toLowerCase().includes('formal') ? 'formal' :
                       prompt.toLowerCase().includes('casual') ? 'casual' :
                       prompt.toLowerCase().includes('verbose') ? 'verbose' : 'concise'
          const tone = prompt.toLowerCase().includes('darker') ? 'darker' :
                      prompt.toLowerCase().includes('lighter') ? 'lighter' :
                      prompt.toLowerCase().includes('funnier') ? 'funnier' : 'neutral'
          generated = await aiAssistant.rewriteContent(prompt, rewriteStyle, tone)
          break

        case 'analyze_voice':
          const analysis = await aiAssistant.analyzeVoice(
            context.name || 'Character',
            prompt
          )
          generated = `Voice Consistency Score: ${analysis.score}/100\n\nIssues:\n${analysis.issues.map(i => `• ${i}`).join('\n')}\n\nSuggestions:\n${analysis.suggestions.map(s => `• ${s}`).join('\n')}`
          break

        default:
          generated = 'AI helper not implemented yet'
      }

      setResult(generated)
      toast.success('AI generation complete!')
    } catch (error) {
      toast.error('AI generation failed: ' + String(error))
      setResult('Error: ' + String(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Writing Assistant
        </CardTitle>
        <CardDescription>
          Use AI to help create and improve your character
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>AI Helper</Label>
          <Select value={helperType} onValueChange={setHelperType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expand_description">Expand Description</SelectItem>
              <SelectItem value="generate_dialogue">Generate Dialogue</SelectItem>
              <SelectItem value="suggest_traits">Suggest Traits</SelectItem>
              <SelectItem value="generate_first_message">Generate First Message</SelectItem>
              <SelectItem value="batch_first_messages">Batch First Messages</SelectItem>
              <SelectItem value="rewrite_content">Rewrite Content</SelectItem>
              <SelectItem value="analyze_voice">Analyze Voice Consistency</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Input / Prompt</Label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt or content to process..."
            className="min-h-[100px]"
          />
        </div>

        <Button onClick={handleGenerate} disabled={loading || !prompt} className="w-full">
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

        {result && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Result</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onInsert(result)
                  toast.success('Inserted into editor!')
                }}
              >
                Insert
              </Button>
            </div>
            <Textarea
              value={result}
              onChange={(e) => setResult(e.target.value)}
              className="min-h-[200px]"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
