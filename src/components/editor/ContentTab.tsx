import { UseFormReturn } from 'react-hook-form'
import { Character } from '@/types/character-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'

interface ContentTabProps {
  form: UseFormReturn<Character>
}

export default function ContentTab({ form }: ContentTabProps) {
  const alternateGreetings = form.watch('alternate_greetings') || []

  const addAlternateGreeting = () => {
    form.setValue('alternate_greetings', [...alternateGreetings, ''])
  }

  const removeAlternateGreeting = (index: number) => {
    form.setValue('alternate_greetings', alternateGreetings.filter((_, i) => i !== index))
  }

  const updateAlternateGreeting = (index: number, value: string) => {
    const updated = [...alternateGreetings]
    updated[index] = value
    form.setValue('alternate_greetings', updated)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Scenario</CardTitle>
          <CardDescription>
            Context and circumstances of the interaction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            {...form.register('scenario')}
            placeholder="{{user}} has just entered the library's rare books section where {{char}} is cataloging a new acquisition."
            className="min-h-[120px]"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Supports macros: {'{{char}}'}, {'{{user}}'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>First Message</CardTitle>
          <CardDescription>
            Opening message from the character
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            {...form.register('first_mes')}
            placeholder="*Elena looks up from an old leather-bound tome, adjusting her glasses as she notices someone approaching the restricted section.*

Oh, hello there..."
            className="min-h-[200px]"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Supports Markdown and HTML formatting
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Alternate Greetings</CardTitle>
              <CardDescription>
                Alternative opening messages
              </CardDescription>
            </div>
            <Button onClick={addAlternateGreeting} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Greeting
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {alternateGreetings.map((greeting, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Greeting {index + 1}</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAlternateGreeting(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                value={greeting}
                onChange={(e) => updateAlternateGreeting(index, e.target.value)}
                placeholder="Enter alternate greeting..."
                className="min-h-[100px]"
              />
            </div>
          ))}
          {alternateGreetings.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No alternate greetings yet. Add one to get started!
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Example Dialogue</CardTitle>
          <CardDescription>
            Sample conversations to guide the AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            {...form.register('mes_example')}
            placeholder={'<START>\n{{user}}: What\'s the oldest book you have here?\n{{char}}: *Elena\'s eyes light up as she carefully sets aside her current work.*\nOh, that would be our 1523 printing of Pliny\'s Natural History...'}
            className="min-h-[200px] font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Use &lt;START&gt; to separate example exchanges
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
