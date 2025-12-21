import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { localStorageService } from '@/services/localStorage'
import { Character } from '@/types/character-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Search, Download, Upload, Copy, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function Dashboard() {
  const navigate = useNavigate()
  const [characters, setCharacters] = useState<Character[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [importDialogOpen, setImportDialogOpen] = useState(false)

  useEffect(() => {
    loadCharacters()
  }, [])

  const loadCharacters = () => {
    const chars = localStorageService.getAllCharacters()
    setCharacters(chars)
  }

  const filteredCharacters = characters.filter(char =>
    char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    char.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleNewCharacter = () => {
    const newChar: Character = {
      id: crypto.randomUUID(),
      name: 'New Character',
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    localStorageService.saveCharacter(newChar)
    navigate(`/character/${newChar.id}`)
  }

  const handleDuplicate = (id: string) => {
    const duplicate = localStorageService.duplicateCharacter(id)
    if (duplicate) {
      loadCharacters()
      toast.success('Character duplicated')
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this character?')) {
      localStorageService.deleteCharacter(id)
      loadCharacters()
      toast.success('Character deleted')
    }
  }

  const handleExportLibrary = () => {
    const json = localStorageService.exportLibrary()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `character-library-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Library exported')
  }

  const handleImportLibrary = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const json = event.target?.result as string
      const result = localStorageService.importLibrary(json)
      if (result.success) {
        loadCharacters()
        toast.success(`Imported ${result.count} characters`)
        setImportDialogOpen(false)
      } else {
        toast.error(result.error || 'Import failed')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Character Library</h1>
            <p className="text-sm text-muted-foreground">{characters.length} characters</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleExportLibrary}>
              <Download className="h-4 w-4" />
            </Button>
            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Upload className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Library</DialogTitle>
                  <DialogDescription>
                    Import characters from a JSON file
                  </DialogDescription>
                </DialogHeader>
                <Input
                  type="file"
                  accept=".json"
                  onChange={handleImportLibrary}
                />
              </DialogContent>
            </Dialog>
            <Button onClick={handleNewCharacter}>
              <Plus className="h-4 w-4 mr-2" />
              New Character
            </Button>
          </div>
        </div>
      </header>

      {/* Search */}
      <div className="container mx-auto px-4 py-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search characters by name or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Character Grid */}
      <div className="container mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCharacters.map((char) => (
            <Card key={char.id} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1" onClick={() => navigate(`/character/${char.id}`)}>
                    <CardTitle className="line-clamp-1">{char.name}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {char.description || 'No description'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1 mb-3">
                  {char.tags.slice(0, 3).map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {char.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{char.tags.length - 3}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>v{char.character_version}</span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDuplicate(char.id)
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(char.id)
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCharacters.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery ? 'No characters found' : 'No characters yet. Create one to get started!'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
