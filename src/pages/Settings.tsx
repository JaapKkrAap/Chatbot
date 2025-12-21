import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '@/contexts/SettingsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, Save, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);

  const handleSave = () => {
    toast.success('Settings saved successfully');
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <div className="mb-6 flex items-start gap-3 p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          API keys are stored locally in your browser. They are never sent to our servers.
          However, be cautious when using public computers.
        </p>
      </div>

      <div className="space-y-6">
        {/* API Keys Section */}
        <Card>
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
            <CardDescription>
              Configure your AI provider API keys to enable real AI generation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Provider Selection */}
            <div className="space-y-2">
              <Label>Preferred Provider</Label>
              <Select
                value={settings.preferredProvider}
                onValueChange={(value: 'openai' | 'anthropic') =>
                  updateSettings({ preferredProvider: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI (GPT-4, GPT-3.5)</SelectItem>
                  <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* OpenAI API Key */}
            <div className="space-y-2">
              <Label>OpenAI API Key</Label>
              <div className="flex gap-2">
                <Input
                  type={showOpenAIKey ? 'text' : 'password'}
                  value={settings.openaiApiKey}
                  onChange={(e) => updateSettings({ openaiApiKey: e.target.value })}
                  placeholder="sk-..."
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                >
                  {showOpenAIKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Get your API key from{' '}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  platform.openai.com/api-keys
                </a>
              </p>
            </div>

            {/* Anthropic API Key */}
            <div className="space-y-2">
              <Label>Anthropic API Key</Label>
              <div className="flex gap-2">
                <Input
                  type={showAnthropicKey ? 'text' : 'password'}
                  value={settings.anthropicApiKey}
                  onChange={(e) => updateSettings({ anthropicApiKey: e.target.value })}
                  placeholder="sk-ant-..."
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                >
                  {showAnthropicKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Get your API key from{' '}
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  console.anthropic.com/settings/keys
                </a>
              </p>
            </div>

            {/* Model Selection */}
            <div className="space-y-2">
              <Label>Preferred Model</Label>
              <Select
                value={settings.preferredModel}
                onValueChange={(value) => updateSettings({ preferredModel: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {settings.preferredProvider === 'openai' ? (
                    <>
                      <SelectItem value="gpt-4o">GPT-4o (Best quality)</SelectItem>
                      <SelectItem value="gpt-4o-mini">GPT-4o Mini (Faster, cheaper)</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Cheapest)</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Best)</SelectItem>
                      <SelectItem value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (Fast)</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Generation Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Generation Settings</CardTitle>
            <CardDescription>
              Fine-tune AI generation behavior
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Temperature */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Temperature: {settings.temperature}</Label>
                <span className="text-xs text-muted-foreground">
                  {settings.temperature < 0.3 ? 'Focused' : settings.temperature > 0.8 ? 'Creative' : 'Balanced'}
                </span>
              </div>
              <Slider
                value={[settings.temperature]}
                onValueChange={([value]) => updateSettings({ temperature: value })}
                min={0}
                max={1}
                step={0.1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Lower values are more focused and deterministic, higher values are more creative
              </p>
            </div>

            {/* Max Tokens */}
            <div className="space-y-2">
              <Label>Max Tokens: {settings.maxTokens}</Label>
              <Slider
                value={[settings.maxTokens]}
                onValueChange={([value]) => updateSettings({ maxTokens: value })}
                min={500}
                max={4000}
                step={100}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Maximum length of AI responses (higher = longer but more expensive)
              </p>
            </div>

            {/* Show Costs */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Cost Estimates</Label>
                <p className="text-xs text-muted-foreground">
                  Display estimated API costs for each generation
                </p>
              </div>
              <Switch
                checked={settings.showCosts}
                onCheckedChange={(checked) => updateSettings({ showCosts: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate('/')}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
