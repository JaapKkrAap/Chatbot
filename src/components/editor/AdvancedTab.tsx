import { UseFormReturn } from 'react-hook-form'
import { Character } from '@/types/character-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

interface AdvancedTabProps {
  form: UseFormReturn<Character>
}

export default function AdvancedTab({ form }: AdvancedTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Creator Notes</CardTitle>
          <CardDescription>
            Notes for users (not sent to the LLM)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            {...form.register('creator_notes')}
            placeholder="Elena works best with detailed, descriptive prompts. She responds well to discussions about books, history, and quiet moments..."
            className="min-h-[120px]"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Prompt Override</CardTitle>
          <CardDescription>
            Custom system prompt (overrides user's default)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            {...form.register('system_prompt')}
            placeholder="You are roleplaying as {{char}}. Stay in character at all times..."
            className="min-h-[150px]"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Use {'{{original}}'} to include the user&apos;s system prompt
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Post History Instructions</CardTitle>
          <CardDescription>
            Instructions inserted after conversation history (UJB/Jailbreak)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            {...form.register('post_history_instructions')}
            placeholder="Continue the roleplay naturally, maintaining character consistency..."
            className="min-h-[150px]"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Also known as "Universal Jailbreak" or UJB
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
