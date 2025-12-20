import { UseFormReturn } from 'react-hook-form'
import { useState } from 'react'
import { Character, LorebookEntry } from '@/types/character-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react'

interface LorebookTabProps {
  form: UseFormReturn<Character>
}

export default function LorebookTab({ form }: LorebookTabProps) {
  const [expandedEntry, setExpandedEntry] = useState<number | null>(null)
  const [keyInput, setKeyInput] = useState('')
  const [secondaryKeyInput, setSecondaryKeyInput] = useState('')

  const characterBook = form.watch('character_book')
  const entries = characterBook?.entries || []

  const initializeCharacterBook = () => {
    if (!characterBook) {
      form.setValue('character_book', {
        entries: [],
        extensions: {},
      })
    }
  }

  const addEntry = () => {
    initializeCharacterBook()
    const newEntry: LorebookEntry = {
      keys: [],
      content: '',
      extensions: {},
      enabled: true,
      insertion_order: 100,
      name: `Entry ${entries.length + 1}`,
    }

    form.setValue('character_book.entries', [...entries, newEntry])
    setExpandedEntry(entries.length)
  }

  const removeEntry = (index: number) => {
    const updated = entries.filter((_, i) => i !== index)
    form.setValue('character_book.entries', updated)
    if (expandedEntry === index) {
      setExpandedEntry(null)
    }
  }

  const updateEntry = (index: number, field: keyof LorebookEntry, value: any) => {
    const updated = [...entries]
    updated[index] = { ...updated[index], [field]: value }
    form.setValue('character_book.entries', updated)
  }

  const addKey = (index: number) => {
    if (keyInput.trim()) {
      const entry = entries[index]
      const updated = { ...entry, keys: [...entry.keys, keyInput.trim()] }
      const allEntries = [...entries]
      allEntries[index] = updated
      form.setValue('character_book.entries', allEntries)
      setKeyInput('')
    }
  }

  const removeKey = (entryIndex: number, keyIndex: number) => {
    const entry = entries[entryIndex]
    const updated = { ...entry, keys: entry.keys.filter((_, i) => i !== keyIndex) }
    const allEntries = [...entries]
    allEntries[entryIndex] = updated
    form.setValue('character_book.entries', allEntries)
  }

  const addSecondaryKey = (index: number) => {
    if (secondaryKeyInput.trim()) {
      const entry = entries[index]
      const secondaryKeys = entry.secondary_keys || []
      const updated = { ...entry, secondary_keys: [...secondaryKeys, secondaryKeyInput.trim()] }
      const allEntries = [...entries]
      allEntries[index] = updated
      form.setValue('character_book.entries', allEntries)
      setSecondaryKeyInput('')
    }
  }

  const removeSecondaryKey = (entryIndex: number, keyIndex: number) => {
    const entry = entries[entryIndex]
    const updated = {
      ...entry,
      secondary_keys: entry.secondary_keys?.filter((_, i) => i !== keyIndex)
    }
    const allEntries = [...entries]
    allEntries[entryIndex] = updated
    form.setValue('character_book.entries', allEntries)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lorebook Entries</CardTitle>
              <CardDescription>
                World-building and context injection
              </CardDescription>
            </div>
            <Button onClick={addEntry}>
              <Plus className="h-4 w-4 mr-2" />
              Add Entry
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {entries.map((entry, index) => (
            <Card key={index} className="border-2">
              <CardHeader className="cursor-pointer" onClick={() => setExpandedEntry(expandedEntry === index ? null : index)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={entry.enabled}
                      onCheckedChange={(checked) => updateEntry(index, 'enabled', checked)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div>
                      <h4 className="font-semibold">{entry.name || `Entry ${index + 1}`}</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {entry.keys.slice(0, 3).map((key, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{key}</Badge>
                        ))}
                        {entry.keys.length > 3 && (
                          <Badge variant="outline" className="text-xs">+{entry.keys.length - 3}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeEntry(index)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    {expandedEntry === index ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {expandedEntry === index && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Entry Name</Label>
                      <Input
                        value={entry.name || ''}
                        onChange={(e) => updateEntry(index, 'name', e.target.value)}
                        placeholder="Entry name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Insertion Order</Label>
                      <Input
                        type="number"
                        value={entry.insertion_order}
                        onChange={(e) => updateEntry(index, 'insertion_order', parseInt(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Input
                        type="number"
                        value={entry.priority || 0}
                        onChange={(e) => updateEntry(index, 'priority', parseInt(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Position</Label>
                      <Select
                        value={entry.position || 'before_char'}
                        onValueChange={(value) => updateEntry(index, 'position', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="before_char">Before Character</SelectItem>
                          <SelectItem value="after_char">After Character</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Trigger Keys (Primary)</Label>
                    <div className="flex gap-2">
                      <Input
                        value={keyInput}
                        onChange={(e) => setKeyInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addKey(index)
                          }
                        }}
                        placeholder="Add trigger key and press Enter"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {entry.keys.map((key, ki) => (
                        <Badge key={ki} variant="secondary" className="gap-1">
                          {key}
                          <button
                            type="button"
                            onClick={() => removeKey(index, ki)}
                            className="hover:bg-destructive/20 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={entry.selective || false}
                      onCheckedChange={(checked) => updateEntry(index, 'selective', checked)}
                    />
                    <Label>Use Secondary Keys (AND condition)</Label>
                  </div>

                  {entry.selective && (
                    <div className="space-y-2">
                      <Label>Trigger Keys (Secondary)</Label>
                      <div className="flex gap-2">
                        <Input
                          value={secondaryKeyInput}
                          onChange={(e) => setSecondaryKeyInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              addSecondaryKey(index)
                            }
                          }}
                          placeholder="Add secondary key and press Enter"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(entry.secondary_keys || []).map((key, ki) => (
                          <Badge key={ki} variant="outline" className="gap-1">
                            {key}
                            <button
                              type="button"
                              onClick={() => removeSecondaryKey(index, ki)}
                              className="hover:bg-destructive/20 rounded-full p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Content</Label>
                    <Textarea
                      value={entry.content}
                      onChange={(e) => updateEntry(index, 'content', e.target.value)}
                      placeholder="Information to inject when triggered..."
                      className="min-h-[150px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={entry.case_sensitive || false}
                        onCheckedChange={(checked) => updateEntry(index, 'case_sensitive', checked)}
                      />
                      <Label>Case Sensitive</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={entry.constant || false}
                        onCheckedChange={(checked) => updateEntry(index, 'constant', checked)}
                      />
                      <Label>Always Active</Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Comment</Label>
                    <Input
                      value={entry.comment || ''}
                      onChange={(e) => updateEntry(index, 'comment', e.target.value)}
                      placeholder="Internal notes..."
                    />
                  </div>
                </CardContent>
              )}
            </Card>
          ))}

          {entries.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No lorebook entries yet. Add one to get started!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
