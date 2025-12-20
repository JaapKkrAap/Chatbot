import { UseFormReturn } from 'react-hook-form'
import { Character } from '@/types/character-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { useState } from 'react'

interface BasicInfoTabProps {
  form: UseFormReturn<Character>
}

export default function BasicInfoTab({ form }: BasicInfoTabProps) {
  const [tagInput, setTagInput] = useState('')
  const tags = form.watch('tags') || []

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      form.setValue('tags', [...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    form.setValue('tags', tags.filter(t => t !== tag))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Core character details and metadata
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Character Name *</Label>
              <Input
                id="name"
                {...form.register('name')}
                placeholder="Elena"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="creator">Creator</Label>
              <Input
                id="creator"
                {...form.register('creator')}
                placeholder="your_username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="character_version">Version</Label>
              <Input
                id="character_version"
                {...form.register('character_version')}
                placeholder="1.0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Elena is a 28-year-old librarian at the Moonvale Public Library..."
              className="min-h-[150px]"
            />
            <p className="text-xs text-muted-foreground">
              Character background, appearance, and world info
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="personality">Personality</Label>
            <Textarea
              id="personality"
              {...form.register('personality')}
              placeholder="Introverted, intellectual, warm, curious, occasionally sarcastic"
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              Brief personality summary
            </p>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                }}
                placeholder="Add a tag and press Enter"
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag, i) => (
                <Badge key={i} variant="secondary" className="gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
