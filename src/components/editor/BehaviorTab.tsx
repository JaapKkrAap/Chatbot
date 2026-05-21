import { UseFormReturn } from 'react-hook-form'
import { Character, BehaviorSettings } from '@/types/character-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

interface BehaviorTabProps {
  form: UseFormReturn<Character>
}

export default function BehaviorTab({ form }: BehaviorTabProps) {
  const behavior = (form.watch('extensions.behavior') || {}) as Partial<BehaviorSettings>

  const updateBehavior = (field: keyof BehaviorSettings, value: any) => {
    form.setValue('extensions.behavior', {
      ...behavior,
      [field]: value,
    } as BehaviorSettings)
  }

  const getBehaviorValue = <T,>(field: keyof BehaviorSettings, defaultValue: T): T => {
    const value = behavior[field]
    return value !== undefined ? value as T : defaultValue
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personality Tuning</CardTitle>
          <CardDescription>
            Adjust personality sliders (0-100)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Dominance</Label>
              <span className="text-sm text-muted-foreground">
                {getBehaviorValue('dominance', 50)}
              </span>
            </div>
            <Slider
              value={[getBehaviorValue('dominance', 50)]}
              onValueChange={([value]) => updateBehavior('dominance', value)}
              max={100}
              step={1}
            />
            <p className="text-xs text-muted-foreground">
              How assertive and controlling the character is
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Initiative</Label>
              <span className="text-sm text-muted-foreground">
                {getBehaviorValue('initiative', 50)}
              </span>
            </div>
            <Slider
              value={[getBehaviorValue('initiative', 50)]}
              onValueChange={([value]) => updateBehavior('initiative', value)}
              max={100}
              step={1}
            />
            <p className="text-xs text-muted-foreground">
              How proactive the character is in driving conversation
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Verbosity</Label>
              <span className="text-sm text-muted-foreground">
                {getBehaviorValue('verbosity', 50)}
              </span>
            </div>
            <Slider
              value={[getBehaviorValue('verbosity', 50)]}
              onValueChange={([value]) => updateBehavior('verbosity', value)}
              max={100}
              step={1}
            />
            <p className="text-xs text-muted-foreground">
              How detailed and descriptive responses are
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Response Length</Label>
              <span className="text-sm text-muted-foreground">
                {getBehaviorValue('responseLength', 50)}
              </span>
            </div>
            <Slider
              value={[getBehaviorValue('responseLength', 50)]}
              onValueChange={([value]) => updateBehavior('responseLength', value)}
              max={100}
              step={1}
            />
            <p className="text-xs text-muted-foreground">
              Target length for character responses
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Content Settings</CardTitle>
          <CardDescription>
            Configure content boundaries and modules
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Content Rating</Label>
            <Select
              value={getBehaviorValue('rating', 'sfw')}
              onValueChange={(value) => updateBehavior('rating', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sfw">SFW (Safe for Work)</SelectItem>
                <SelectItem value="suggestive">Suggestive</SelectItem>
                <SelectItem value="nsfw">NSFW</SelectItem>
                <SelectItem value="explicit">Explicit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Escalation Level</Label>
              <span className="text-sm text-muted-foreground">
                {getBehaviorValue('escalationLevel', 0)}
              </span>
            </div>
            <Slider
              value={[getBehaviorValue('escalationLevel', 0)]}
              onValueChange={([value]) => updateBehavior('escalationLevel', value)}
              max={100}
              step={1}
            />
            <p className="text-xs text-muted-foreground">
              How quickly content intensity can increase
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={getBehaviorValue('safeMode', true)}
              onCheckedChange={(checked) => updateBehavior('safeMode', checked)}
            />
            <Label>Safe Mode</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Anti-Drift Settings</CardTitle>
          <CardDescription>
            Maintain character consistency over long conversations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Personality Enforcement</Label>
              <span className="text-sm text-muted-foreground">
                {getBehaviorValue('personalityEnforcement', 50)}
              </span>
            </div>
            <Slider
              value={[getBehaviorValue('personalityEnforcement', 50)]}
              onValueChange={([value]) => updateBehavior('personalityEnforcement', value)}
              max={100}
              step={1}
            />
            <p className="text-xs text-muted-foreground">
              How strongly to maintain original personality
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={getBehaviorValue('toneLock', { enabled: false, strength: 50 }).enabled}
              onCheckedChange={(checked) => updateBehavior('toneLock', {
                ...getBehaviorValue('toneLock', { enabled: false, strength: 50 }),
                enabled: checked
              })}
            />
            <Label>Tone Lock</Label>
          </div>

          {getBehaviorValue('toneLock', { enabled: false, strength: 50 }).enabled && (
            <div className="space-y-3 ml-6">
              <div className="flex justify-between">
                <Label>Tone Lock Strength</Label>
                <span className="text-sm text-muted-foreground">
                  {getBehaviorValue('toneLock', { enabled: false, strength: 50 }).strength}
                </span>
              </div>
              <Slider
                value={[getBehaviorValue('toneLock', { enabled: false, strength: 50 }).strength]}
                onValueChange={([value]) => updateBehavior('toneLock', {
                  ...getBehaviorValue('toneLock', { enabled: false, strength: 50 }),
                  strength: value
                })}
                max={100}
                step={1}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Loop Detection Instructions</Label>
            <Textarea
              value={getBehaviorValue('loopDetectionInstructions', '')}
              onChange={(e) => updateBehavior('loopDetectionInstructions', e.target.value)}
              placeholder="Instructions for handling repetitive patterns..."
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Emergency Reset Phrase</Label>
            <Textarea
              value={getBehaviorValue('emergencyResetPhrase', '')}
              onChange={(e) => updateBehavior('emergencyResetPhrase', e.target.value)}
              placeholder="Phrase to reset character to original state..."
              className="min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
