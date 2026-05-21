import { useState, useEffect, useRef } from 'react'
import { Character } from '@/types/character-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSettings } from '@/contexts/SettingsContext'
import { aiAssistant } from '@/services/aiAssistant'
import { toast } from 'sonner'
import { 
  Send, 
  Trash2, 
  RefreshCw, 
  Plus, 
  MessageSquare, 
  ChevronLeft, 
  ChevronRight, 
  Edit2, 
  Copy, 
  Sparkles, 
  Settings as SettingsIcon,
  Bot
} from 'lucide-react'

interface TestingTabProps {
  character: Character
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
    estimatedCost: number
  }
}

interface ChatSession {
  id: string
  title: string
  createdAt: number
  messages: Message[]
  selectedGreeting: string
  userName: string
}

export default function TestingTab({ character }: TestingTabProps) {
  const { settings, hasApiKey } = useSettings()
  
  // Sessions State
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  
  // UI Control State
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  
  // Editing States
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editingSessionTitle, setEditingSessionTitle] = useState('')
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingMessageContent, setEditingMessageContent] = useState('')
  const [editingUserName, setEditingUserName] = useState(false)
  
  // Refs
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const activeSession = sessions.find(s => s.id === activeSessionId)
  
  // Load sessions from localStorage on mount or character change
  useEffect(() => {
    const key = `chatbot-sessions-${character.id}`
    const stored = localStorage.getItem(key)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ChatSession[]
        if (parsed.length > 0) {
          setSessions(parsed)
          setActiveSessionId(parsed[0].id)
          return
        }
      } catch (e) {
        console.error('Failed to parse sessions', e)
      }
    }
    
    // Fallback: Create initial session
    const defaultGreeting = character.first_mes || 'Hello!'
    const initialSession: ChatSession = {
      id: crypto.randomUUID(),
      title: 'Default Chat',
      createdAt: Date.now(),
      selectedGreeting: defaultGreeting,
      userName: 'User',
      messages: [
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: defaultGreeting,
          timestamp: Date.now()
        }
      ]
    }
    setSessions([initialSession])
    setActiveSessionId(initialSession.id)
    localStorage.setItem(key, JSON.stringify([initialSession]))
  }, [character.id])

  // Save sessions to localStorage whenever they change
  const saveSessions = (updatedSessions: ChatSession[]) => {
    setSessions(updatedSessions)
    localStorage.setItem(`chatbot-sessions-${character.id}`, JSON.stringify(updatedSessions))
  }

  // Scroll to bottom of chat
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [activeSession?.messages, loading])

  // Macro replacer utility
  const replaceMacros = (text: string, currentUserName = 'User') => {
    if (!text) return ''
    return text
      .replace(/\{\{char\}\}/g, character.name || 'Character')
      .replace(/\{\{user\}\}/g, currentUserName)
  }

  // Scanning Lorebook entries for keywords
  const scanLorebook = (latestInput: string, historyText: string) => {
    if (!character.character_book || !character.character_book.entries) return []
    
    const activeEntries: string[] = []
    const combinedText = `${latestInput} ${historyText}`.toLowerCase()
    
    character.character_book.entries.forEach(entry => {
      if (!entry.enabled) return
      
      // Constant entries are always active
      if (entry.constant) {
        activeEntries.push(entry.content)
        return
      }
      
      // Otherwise, scan triggers
      const triggers = entry.keys || []
      const isTriggered = triggers.some(key => {
        if (!key.trim()) return false
        return combinedText.includes(key.toLowerCase())
      })
      
      if (isTriggered) {
        activeEntries.push(entry.content)
      }
    })
    
    return activeEntries
  }

  // Compile full roleplay context for LLM
  const compilePrompt = (latestInput: string, historyMessages: Message[], currentUserName = 'User') => {
    const historyText = historyMessages.map(m => m.content).join(' ')
    const activeLore = scanLorebook(latestInput, historyText)
    
    // Build primary description context
    let contextBlock = `You are roleplaying as ${character.name || 'Character'}.\n\n`
    
    if (character.description) {
      contextBlock += `[Character Description]\n${character.description}\n\n`
    }
    if (character.personality) {
      contextBlock += `[Character Personality]\n${character.personality}\n\n`
    }
    if (character.scenario) {
      contextBlock += `[Scenario]\n${character.scenario}\n\n`
    }
    if (activeLore.length > 0) {
      contextBlock += `[Relevant World Lore]\n${activeLore.join('\n\n')}\n\n`
    }
    
    // Get customized system instruction or fallback
    let systemInstruction = character.system_prompt 
      ? character.system_prompt
      : `You are roleplaying as {{char}}. Describe your actions in asterisks and dialogue in quotes. Stay in character at all times.`
    
    // Add replacements
    systemInstruction = replaceMacros(systemInstruction, currentUserName)
    contextBlock = replaceMacros(contextBlock, currentUserName)
    
    const fullSystemContent = `${systemInstruction}\n\n${contextBlock}`
    
    // Form turns array
    const turns = historyMessages.map(msg => ({
      role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
      content: replaceMacros(msg.content, currentUserName)
    }))
    
    // Append jailbreak/UJB rules at the end of turns if specified
    if (character.post_history_instructions) {
      turns.push({
        role: 'user' as const,
        content: `[System Instruction: ${replaceMacros(character.post_history_instructions, currentUserName)}]`
      })
    }
    
    return [
      { role: 'system', content: fullSystemContent },
      ...turns
    ]
  }

  // Handle generating mock AI reply (if no API keys are present)
  const generateMockReply = (history: Message[]): string => {
    const lastUserMsg = [...history].reverse().find(m => m.role === 'user')?.content || ''
    
    return `*${character.name} tilts their head, looking at you thoughtfully.*\n\n"Hello! I received your message: '${lastUserMsg}'. \n\nI noticed you haven't configured an API key in the **Settings** yet, so I am currently running in a simulated offline sandbox mode. Set up OpenAI, Anthropic, or OpenRouter under the Settings tab to experience my real character responses, personality modifiers, and lorebook triggers!"`
  }

  // Handle sending message
  const handleSend = async (customInput?: string) => {
    const textToSend = customInput !== undefined ? customInput : input
    if (!textToSend.trim() || !activeSession) return
    
    if (customInput === undefined) setInput('')
    setLoading(true)
    
    // Create new user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: textToSend,
      timestamp: Date.now()
    }
    
    const updatedMessages = [...activeSession.messages, userMessage]
    const updatedSession = { ...activeSession, messages: updatedMessages }
    
    const updatedSessions = sessions.map(s => s.id === activeSession.id ? updatedSession : s)
    saveSessions(updatedSessions)
    
    if (!hasApiKey) {
      // Simulate offline mock response
      setTimeout(() => {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: generateMockReply(updatedMessages),
          timestamp: Date.now()
        }
        
        const finalSession = { ...updatedSession, messages: [...updatedMessages, assistantMessage] }
        saveSessions(sessions.map(s => s.id === activeSession.id ? finalSession : s))
        setLoading(false)
      }, 1000)
    } else {
      // API integration
      try {
        const getApiKey = () => {
          if (settings.preferredProvider === 'openai') return settings.openaiApiKey;
          if (settings.preferredProvider === 'anthropic') return settings.anthropicApiKey;
          return settings.openrouterApiKey;
        };

        const aiSettings = {
          provider: settings.preferredProvider,
          apiKey: getApiKey(),
          model: settings.preferredModel,
          temperature: settings.temperature,
          maxTokens: settings.maxTokens,
        }

        const compiledMessages = compilePrompt(textToSend, updatedMessages, activeSession.userName)
        
        const response = await aiAssistant.makeRequest(
          {
            type: 'testing_sandbox_chat',
            context: { messages: compiledMessages }
          },
          aiSettings
        )
        
        if (response.success && response.data) {
          const assistantMessage: Message = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: response.data,
            timestamp: Date.now(),
            usage: response.usage
          }
          
          const finalSession = { ...updatedSession, messages: [...updatedMessages, assistantMessage] }
          saveSessions(sessions.map(s => s.id === activeSession.id ? finalSession : s))
        } else {
          throw new Error(response.error || 'AI request failed')
        }
      } catch (error) {
        console.error(error)
        toast.error(`API Error: ${String(error)}`)
        
        // Push an error notification card
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `⚠️ **Failed to get response from AI Provider.**\n\nError details: ${String(error)}\n\nPlease verify your API key configurations in the Settings page and check your network connection.`,
          timestamp: Date.now()
        }
        const finalSession = { ...updatedSession, messages: [...updatedMessages, assistantMessage] }
        saveSessions(sessions.map(s => s.id === activeSession.id ? finalSession : s))
      } finally {
        setLoading(false)
      }
    }
  }

  // Sidebar: Start new chat
  const handleNewChat = () => {
    const defaultGreeting = character.first_mes || 'Hello!'
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: `Chat ${sessions.length + 1}`,
      createdAt: Date.now(),
      selectedGreeting: defaultGreeting,
      userName: 'User',
      messages: [
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: defaultGreeting,
          timestamp: Date.now()
        }
      ]
    }
    
    const updated = [newSession, ...sessions]
    saveSessions(updated)
    setActiveSessionId(newSession.id)
    toast.success('New chat session started!')
  }

  // Sidebar: Delete chat
  const handleDeleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = sessions.filter(s => s.id !== id)
    saveSessions(updated)
    
    if (activeSessionId === id) {
      if (updated.length > 0) {
        setActiveSessionId(updated[0].id)
      } else {
        // Create a new blank one
        const defaultGreeting = character.first_mes || 'Hello!'
        const newSession: ChatSession = {
          id: crypto.randomUUID(),
          title: 'Default Chat',
          createdAt: Date.now(),
          selectedGreeting: defaultGreeting,
          userName: 'User',
          messages: [
            {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: defaultGreeting,
              timestamp: Date.now()
            }
          ]
        }
        saveSessions([newSession])
        setActiveSessionId(newSession.id)
      }
    }
    toast.success('Chat session deleted.')
  }

  // Sidebar: Rename session title
  const handleSaveRename = (id: string) => {
    if (!editingSessionTitle.trim()) return
    const updated = sessions.map(s => 
      s.id === id ? { ...s, title: editingSessionTitle } : s
    )
    saveSessions(updated)
    setEditingSessionId(null)
  }

  // Chat Actions: Reset conversation starting with selected greeting
  const handleReset = (greetingText?: string) => {
    if (!activeSession) return
    const chosenGreeting = greetingText !== undefined ? greetingText : activeSession.selectedGreeting
    
    const resetSession = {
      ...activeSession,
      selectedGreeting: chosenGreeting,
      messages: [
        {
          id: crypto.randomUUID(),
          role: 'assistant' as const,
          content: chosenGreeting,
          timestamp: Date.now()
        }
      ]
    }
    
    saveSessions(sessions.map(s => s.id === activeSession.id ? resetSession : s))
    toast.success('Chat restarted with greeting!')
  }

  // Chat Actions: Clear all messages
  const handleClear = () => {
    if (!activeSession) return
    const clearedSession = { ...activeSession, messages: [] }
    saveSessions(sessions.map(s => s.id === activeSession.id ? clearedSession : s))
    toast.success('Chat conversation cleared.')
  }

  // Message Actions: Delete individual message
  const handleDeleteMessage = (msgId: string) => {
    if (!activeSession) return
    const filtered = activeSession.messages.filter(m => m.id !== msgId)
    const updatedSession = { ...activeSession, messages: filtered }
    saveSessions(sessions.map(s => s.id === activeSession.id ? updatedSession : s))
  }

  // Message Actions: Edit individual message
  const handleSaveEditMessage = (msgId: string) => {
    if (!activeSession) return
    const updated = activeSession.messages.map(m => 
      m.id === msgId ? { ...m, content: editingMessageContent } : m
    )
    const updatedSession = { ...activeSession, messages: updated }
    saveSessions(sessions.map(s => s.id === activeSession.id ? updatedSession : s))
    setEditingMessageId(null)
  }

  // Message Actions: Regenerate last AI response
  const handleRegenerate = async () => {
    if (!activeSession || activeSession.messages.length < 2) return
    
    const messagesCopy = [...activeSession.messages]
    const lastMsg = messagesCopy[messagesCopy.length - 1]
    
    // Regenerate is only for assistant messages
    if (lastMsg.role !== 'assistant') return
    
    // Remove the last assistant message
    messagesCopy.pop()
    
    // Get the user prompt that triggered it
    const lastUserMsg = messagesCopy[messagesCopy.length - 1]
    if (!lastUserMsg || lastUserMsg.role !== 'user') return
    
    // Remove the user message too (since handleSend will re-add it)
    messagesCopy.pop()
    
    // Update state to remove last turn visually
    const updatedSession = { ...activeSession, messages: messagesCopy }
    saveSessions(sessions.map(s => s.id === activeSession.id ? updatedSession : s))
    
    // Re-send user message content
    await handleSend(lastUserMsg.content)
  }

  // Message Actions: Copy to clipboard
  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
    toast.success('Copied to clipboard!')
  }

  // Update userName in session
  const handleSaveUserName = (name: string) => {
    if (!activeSession) return
    const updated = sessions.map(s => 
      s.id === activeSession.id ? { ...s, userName: name || 'User' } : s
    )
    saveSessions(updated)
    setEditingUserName(false)
  }

  // Combine alternate greetings
  const allGreetings = [
    { label: 'Default Greeting', value: character.first_mes || 'Hello!' },
    ...(character.alternate_greetings || []).map((greeting, i) => ({
      label: `Alternate Greeting #${i + 1}`,
      value: greeting
    }))
  ].filter(g => g.value.trim() !== '')

  return (
    <div className="space-y-6">
      {/* Alert if no API keys are present */}
      {!hasApiKey && (
        <Card className="border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <SettingsIcon className="h-5 w-5 text-yellow-600 animate-spin-slow" />
                <div>
                  <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                    Offline Simulation Active
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300/80">
                    Set up OpenAI, Anthropic, or OpenRouter in Settings to connect real AI engines!
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Sandbox Split Interface */}
      <div className="flex border rounded-xl overflow-hidden h-[680px] bg-card shadow-lg relative">
        
        {/* Left Side: Collapsible ChatGPT-style Sidebar */}
        <div 
          className={`flex flex-col border-r bg-muted/15 transition-all duration-300 ${
            isSidebarOpen ? 'w-64' : 'w-0 border-r-0 overflow-hidden'
          }`}
        >
          {/* Sidebar Header */}
          <div className="p-3 border-b flex gap-2">
            <Button onClick={handleNewChat} className="flex-1 text-sm font-medium" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>
          
          {/* Scrollable list of chat sessions */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1.5">
              {sessions.map(s => {
                const isActive = s.id === activeSessionId
                const isEditing = s.id === editingSessionId
                
                return (
                  <div
                    key={s.id}
                    onClick={() => !isEditing && setActiveSessionId(s.id)}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors ${
                      isActive 
                        ? 'bg-primary/10 text-primary font-medium' 
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden flex-1 mr-1">
                      <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground/80 group-hover:text-foreground/80" />
                      {isEditing ? (
                        <Input
                          value={editingSessionTitle}
                          onChange={(e) => setEditingSessionTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(s.id)
                            if (e.key === 'Escape') setEditingSessionId(null)
                          }}
                          onBlur={() => handleSaveRename(s.id)}
                          className="h-6 py-0 px-1 text-xs"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="truncate">{s.title}</span>
                      )}
                    </div>
                    
                    {!isEditing && isActive && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5 hover:bg-primary/20 text-muted-foreground hover:text-foreground"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingSessionId(s.id)
                            setEditingSessionTitle(s.title)
                          }}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5 hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                          onClick={(e) => handleDeleteChat(s.id, e)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Right Side: Main Chat Sandbox Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-background/50">
          
          {/* Chat Header Panel */}
          {activeSession && (
            <div className="p-4 border-b bg-card flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
              
              {/* Left Side: Sidebar Toggle & Chat Metadata */}
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="shrink-0"
                >
                  {isSidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </Button>
                <div>
                  <h3 className="font-semibold text-sm line-clamp-1">{activeSession.title}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                    <span>User: </span>
                    {editingUserName ? (
                      <Input
                        defaultValue={activeSession.userName}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveUserName(e.currentTarget.value)
                          if (e.key === 'Escape') setEditingUserName(false)
                        }}
                        onBlur={(e) => handleSaveUserName(e.currentTarget.value)}
                        className="h-5 py-0 px-1 text-xs w-24 inline-block font-sans"
                        autoFocus
                      />
                    ) : (
                      <span 
                        className="underline cursor-pointer hover:text-foreground font-medium"
                        onClick={() => setEditingUserName(true)}
                        title="Click to change your testing user name"
                      >
                        {activeSession.userName}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Side: Greeting Selector & Actions */}
              <div className="flex flex-wrap items-center gap-2">
                {allGreetings.length > 1 && (
                  <div className="w-[180px]">
                    <Select
                      value={activeSession.selectedGreeting}
                      onValueChange={(val) => {
                        handleReset(val)
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select greeting..." />
                      </SelectTrigger>
                      <SelectContent>
                        {allGreetings.map((g, idx) => (
                          <SelectItem key={idx} value={g.value} className="text-xs max-w-[280px]">
                            {g.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" onClick={() => handleReset()} className="h-8 text-xs">
                    <RefreshCw className="h-3.5 w-3.5 mr-1" />
                    Reset
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleClear} className="h-8 text-xs hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-hidden relative">
            <ScrollArea ref={scrollAreaRef} className="h-full px-4 py-6">
              <div className="space-y-6 max-w-3xl mx-auto">
                {activeSession?.messages.length === 0 ? (
                  <div className="text-center py-20 text-muted-foreground space-y-2">
                    <Bot className="h-10 w-10 mx-auto text-muted-foreground/50" />
                    <h4 className="font-semibold text-sm">Empty Conversation</h4>
                    <p className="text-xs max-w-[280px] mx-auto">
                      All messages cleared. Click "Reset" to fetch the initial greeting or type a message to start!
                    </p>
                  </div>
                ) : (
                  activeSession?.messages.map((message, index) => {
                    const isAssistant = message.role === 'assistant'
                    const isLast = index === activeSession.messages.length - 1
                    const isEditingMsg = message.id === editingMessageId
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex gap-3 items-start ${isAssistant ? 'justify-start' : 'justify-end'}`}
                      >
                        {/* Avatar Column */}
                        {isAssistant && (
                          <div className="shrink-0 mt-0.5">
                            {character.avatar ? (
                              <img 
                                src={character.avatar} 
                                alt={character.name} 
                                className="w-8 h-8 rounded-full object-cover border shadow-sm"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/20 shadow-sm">
                                {character.name ? character.name.slice(0, 2).toUpperCase() : 'AI'}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Content & Action Menu Bubble */}
                        <div className={`group relative max-w-[75%] ${isAssistant ? '' : 'flex flex-col items-end'}`}>
                          
                          {/* Sender Label */}
                          <span className="text-[10px] text-muted-foreground mb-1 select-none font-medium px-1">
                            {isAssistant ? character.name || 'Character' : activeSession.userName}
                          </span>
                          
                          {/* Text Bubble */}
                          <div
                            className={`rounded-2xl px-4 py-2.5 shadow-sm text-sm relative transition-all duration-200 ${
                              isAssistant 
                                ? 'bg-muted/70 text-foreground border border-muted-foreground/10 rounded-tl-sm' 
                                : 'bg-primary text-primary-foreground rounded-tr-sm'
                            }`}
                          >
                            {isEditingMsg ? (
                              <div className="space-y-2 py-1 min-w-[260px]">
                                <Textarea
                                  value={editingMessageContent}
                                  onChange={(e) => setEditingMessageContent(e.target.value)}
                                  className="min-h-[80px] text-xs resize-none"
                                />
                                <div className="flex justify-end gap-1.5">
                                  <Button size="sm" variant="outline" onClick={() => setEditingMessageId(null)} className="h-7 text-xs px-2">Cancel</Button>
                                  <Button size="sm" onClick={() => handleSaveEditMessage(message.id)} className="h-7 text-xs px-2">Save</Button>
                                </div>
                              </div>
                            ) : (
                              <p className="whitespace-pre-wrap leading-relaxed select-text font-normal">{message.content}</p>
                            )}
                          </div>

                          {/* Tokens/Cost display (if metadata present) */}
                          {isAssistant && message.usage && settings.showCosts && (
                            <span className="text-[9px] text-muted-foreground font-mono mt-1 px-1">
                              {message.usage.totalTokens} tokens • ${message.usage.estimatedCost.toFixed(5)}
                            </span>
                          )}

                          {/* Hover Action Menu */}
                          {!isEditingMsg && (
                            <div className={`absolute -bottom-6 flex items-center gap-1 bg-card border rounded-md px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10 shadow-md ${
                              isAssistant ? 'left-2' : 'right-2'
                            }`}>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-5 w-5 hover:bg-muted text-muted-foreground hover:text-foreground"
                                title="Copy content"
                                onClick={() => handleCopyMessage(message.content)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-5 w-5 hover:bg-muted text-muted-foreground hover:text-foreground"
                                title="Edit message"
                                onClick={() => {
                                  setEditingMessageId(message.id)
                                  setEditingMessageContent(message.content)
                                }}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              
                              {isAssistant && isLast && hasApiKey && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-5 w-5 hover:bg-muted text-muted-foreground hover:text-foreground"
                                  title="Regenerate reply"
                                  onClick={handleRegenerate}
                                >
                                  <RefreshCw className="h-3 w-3" />
                                </Button>
                              )}

                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-5 w-5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                                title="Delete message"
                                onClick={() => handleDeleteMessage(message.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* User Avatar Column */}
                        {!isAssistant && (
                          <div className="shrink-0 mt-0.5">
                            <div className="w-8 h-8 rounded-full bg-muted-foreground/10 text-muted-foreground flex items-center justify-center font-bold text-xs border shadow-sm">
                              {activeSession.userName ? activeSession.userName.slice(0, 2).toUpperCase() : 'US'}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}

                {/* Bouncing Dots typing animation */}
                {loading && (
                  <div className="flex justify-start items-start gap-3">
                    <div className="shrink-0">
                      {character.avatar ? (
                        <img 
                          src={character.avatar} 
                          alt={character.name} 
                          className="w-8 h-8 rounded-full object-cover border shadow-sm"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/20 shadow-sm">
                          {character.name ? character.name.slice(0, 2).toUpperCase() : 'AI'}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground mb-1 select-none font-medium px-1">
                        {character.name || 'Character'}
                      </span>
                      <div className="bg-muted/70 px-4 py-3 rounded-2xl rounded-tl-sm border border-muted-foreground/10 flex items-center gap-1.5 shadow-sm max-w-[80px]">
                        <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Footer Input Bar */}
          <div className="border-t p-4 bg-muted/10 shrink-0">
            <div className="max-w-3xl mx-auto flex gap-2 items-end">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder={`Type a message as ${activeSession?.userName || 'User'}... (Shift+Enter for line break)`}
                className="min-h-[50px] max-h-[140px] resize-none pr-10 rounded-xl"
                rows={1}
                disabled={loading}
              />
              <Button 
                onClick={() => handleSend()} 
                size="icon" 
                className="shrink-0 h-10 w-10 rounded-xl"
                disabled={loading || !input.trim()}
              >
                <Send className="h-4.5 w-4.5" />
              </Button>
            </div>
          </div>

        </div>
      </div>

      {/* Embedded Prompt Preview Component (Maintained at bottom) */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-md flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Character Prompt Construction Preview
          </CardTitle>
          <CardDescription className="text-xs">
            Review how character attributes and lore are dynamically structured for LLM processing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold mb-1 block">Full V2 System Instructions</Label>
              <pre className="bg-muted/50 border p-3 rounded-lg text-[10px] overflow-x-auto h-[160px] whitespace-pre-wrap select-all font-mono">
                {activeSession 
                  ? replaceMacros(character.system_prompt || 'You are roleplaying as {{char}}.', activeSession.userName)
                  : 'Select or start a chat session to preview compiled prompt instructions...'
                }
              </pre>
            </div>

            <div>
              <Label className="text-xs font-semibold mb-1 block">Static & Active Lorebook Context</Label>
              <pre className="bg-muted/50 border p-3 rounded-lg text-[10px] overflow-x-auto h-[160px] whitespace-pre-wrap select-all font-mono">
                {activeSession && character.character_book && character.character_book.entries.length > 0 ? (
                  (() => {
                    const latestMsg = activeSession.messages[activeSession.messages.length - 1]?.content || ''
                    const history = activeSession.messages.slice(0, -1).map(m => m.content).join(' ')
                    const matched = scanLorebook(latestMsg, history)
                    return matched.length > 0 
                      ? matched.map((content, idx) => `[Entry #${idx + 1}]\n${replaceMacros(content, activeSession.userName)}`).join('\n\n')
                      : 'No active or constant lorebook entries triggered currently. Type messages matching trigger keywords to dynamically activate world-building lore entries.'
                  })()
                ) : (
                  'No lorebook entries configured in this character card.'
                )}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

