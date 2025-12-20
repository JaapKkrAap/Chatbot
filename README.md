# Character Card V2 Editor

A comprehensive web application for creating and editing AI roleplay character cards compatible with the Character Card V2 specification.

## Features

### Core Functionality
- **Authentication**: Secure email/password auth with Supabase
- **Character Editor**: Complete V2 spec support with all fields
- **Character Library**: CRUD operations with localStorage persistence
- **Lorebook Editor**: Full-featured world-building with triggers and presets
- **Behavior/Tune Settings**: Personality sliders, content settings, and anti-drift controls
- **AI Writing Assistant**: Helper functions for content generation
- **Character Doctor**: Real-time diagnostics and health scoring
- **Testing Sandbox**: Chat interface to test characters
- **Export/Import**: V2 JSON and PNG formats with platform-specific exports

### Platform Support
- SillyTavern (native V2)
- Chub.ai (native V2)
- SpicyChat (import compatible)
- Crushon.ai (import compatible)

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **Forms**: React Hook Form, Zod validation
- **State**: TanStack Query
- **Auth**: Supabase
- **Routing**: React Router v6

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd Chatbot
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Create a `.env` file based on `.env.example`:
\`\`\`bash
cp .env.example .env
\`\`\`

4. Add your Supabase credentials to `.env`:
\`\`\`
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

### Development

Start the development server:
\`\`\`bash
npm run dev
\`\`\`

The app will be available at `http://localhost:5173`

### Build

Build for production:
\`\`\`bash
npm run build
\`\`\`

Preview production build:
\`\`\`bash
npm run preview
\`\`\`

## Usage

### Creating a Character

1. Sign in or create an account
2. Click "New Character" on the dashboard
3. Fill in the character details across the tabs:
   - **Basic Info**: Name, description, personality, tags
   - **Content**: Scenario, greetings, dialogue examples
   - **Advanced**: Creator notes, system prompt, UJB
   - **Lorebook**: World-building entries
   - **Behavior**: Personality tuning and content settings
   - **Testing**: Chat sandbox

4. Use keyboard shortcuts:
   - `Cmd/Ctrl + S`: Save character
   - `Cmd/Ctrl + E`: Export character

### Exporting Characters

- **V2 JSON**: Standard format for SillyTavern/Chub
- **V2 PNG**: JSON embedded in PNG image
- **Platform-Specific**: Optimized formats for SpicyChat, Crushon

### Lorebook

Create rich world-building with:
- Primary and secondary trigger keywords
- Insertion order and priority
- Position control (before/after character)
- Case sensitivity and selective triggers
- Constant entries (always active)

### Character Doctor

Get real-time diagnostics:
- Health score (0-100) with letter grade
- Malformed macro detection
- Smart quote warnings
- Repetitive word analysis
- Token budget estimation
- Missing field alerts

## Character Card V2 Specification

This editor implements the full [Character Card V2 specification](https://github.com/malfoyslastname/character-card-spec-v2).

### Supported Fields

- `name`: Character name
- `description`: Background, appearance, world info
- `personality`: Personality summary
- `scenario`: Interaction context
- `first_mes`: Opening message
- `mes_example`: Example dialogue
- `creator_notes`: Notes for users
- `system_prompt`: Custom system prompt
- `post_history_instructions`: UJB/jailbreak
- `alternate_greetings[]`: Alternative openings
- `character_book`: Embedded lorebook
- `tags[]`: Categorization tags
- `creator`: Creator attribution
- `character_version`: Version tracking
- `extensions`: Custom data (including behavior settings)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Acknowledgments

- [Character Card V2 Spec](https://github.com/malfoyslastname/character-card-spec-v2)
- [SillyTavern Documentation](https://docs.sillytavern.app/)
- [shadcn/ui](https://ui.shadcn.com/)
