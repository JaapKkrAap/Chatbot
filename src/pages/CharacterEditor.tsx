import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Character } from '@/types/character-card'
import { characterFormSchema } from '@/types/schemas'
import { localStorageService } from '@/services/localStorage'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { ArrowLeft, Save, Download } from 'lucide-react'
import BasicInfoTab from '@/components/editor/BasicInfoTab'
import ContentTab from '@/components/editor/ContentTab'
import AdvancedTab from '@/components/editor/AdvancedTab'
import LorebookTab from '@/components/editor/LorebookTab'
import BehaviorTab from '@/components/editor/BehaviorTab'
import TestingTab from '@/components/editor/TestingTab'

export default function CharacterEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('basic')
  const [character, setCharacter] = useState<Character | null>(null)

  const form = useForm<Character>({
    resolver: zodResolver(characterFormSchema),
    defaultValues: {
      name: '',
      description: '',
      personality: '',
      scenario: '',
      first_mes: '',
      mes_example: '',
      creator_notes: '',
      system_prompt: '',
      post_history_instructions: '',
      alternate_greetings: [],
      tags: [],
      creator: '',
      character_version: '1.0',
      extensions: {},
    },
  })

  useEffect(() => {
    if (id) {
      const char = localStorageService.getCharacter(id)
      if (char) {
        setCharacter(char)
        form.reset(char)
      } else {
        toast.error('Character not found')
        navigate('/')
      }
    }
  }, [id, navigate, form])

  const onSave = (data: Character) => {
    if (!id) return

    const updated: Character = {
      ...data,
      id,
      created_at: character?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    localStorageService.saveCharacter(updated)
    setCharacter(updated)
    toast.success('Character saved!')
  }

  const handleExport = () => {
    const data = form.getValues()
    const exportData = {
      spec: 'chara_card_v2' as const,
      spec_version: '2.0' as const,
      data: {
        name: data.name,
        description: data.description,
        personality: data.personality,
        scenario: data.scenario,
        first_mes: data.first_mes,
        mes_example: data.mes_example,
        creator_notes: data.creator_notes,
        system_prompt: data.system_prompt,
        post_history_instructions: data.post_history_instructions,
        alternate_greetings: data.alternate_greetings,
        character_book: data.character_book,
        tags: data.tags,
        creator: data.creator,
        character_version: data.character_version,
        extensions: data.extensions,
      },
    }

    const json = JSON.stringify(exportData, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${data.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Character exported!')
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        form.handleSubmit(onSave)()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault()
        handleExport()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [form])

  if (!character) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold line-clamp-1">
                {form.watch('name') || 'Untitled Character'}
              </h1>
              <p className="text-xs text-muted-foreground">
                Last saved: {new Date(character.updated_at).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={form.handleSubmit(onSave)}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </header>

      {/* Editor Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
            <TabsTrigger value="lorebook">Lorebook</TabsTrigger>
            <TabsTrigger value="behavior">Behavior</TabsTrigger>
            <TabsTrigger value="testing">Testing</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="mt-0">
            <BasicInfoTab form={form} />
          </TabsContent>

          <TabsContent value="content" className="mt-0">
            <ContentTab form={form} />
          </TabsContent>

          <TabsContent value="advanced" className="mt-0">
            <AdvancedTab form={form} />
          </TabsContent>

          <TabsContent value="lorebook" className="mt-0">
            <LorebookTab form={form} />
          </TabsContent>

          <TabsContent value="behavior" className="mt-0">
            <BehaviorTab form={form} />
          </TabsContent>

          <TabsContent value="testing" className="mt-0">
            <TestingTab character={character} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
