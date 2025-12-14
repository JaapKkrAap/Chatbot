# Chatbot Platform Template Format Research

This document provides technical specifications for chatbot/persona template formats used by major AI chat platforms. The goal is to enable building an application that exports chatbots compatible with multiple platforms.

---

## Table of Contents

1. [SillyTavern](#1-sillytavern)
2. [Chub.ai](#2-chubai)
3. [SpicyChat](#3-spicychat)
4. [Crushon.ai](#4-crushonai)
5. [Cross-Platform Compatibility Notes](#5-cross-platform-compatibility-notes)

---

## 1. SillyTavern

### Service Description
SillyTavern is an open-source, self-hosted frontend for LLM-based roleplay and chat. It serves as a local interface connecting to various AI backends (OpenAI, Anthropic, local models via KoboldAI, etc.). It is the de facto standard for character card specifications in the roleplay AI community.

### Template Format

**File Types Supported:**
- **PNG** (primary): Character data embedded as base64-encoded JSON in PNG tEXt chunks
- **JSON**: Standalone JSON files
- **CHARX** (V3 only): ZIP archive containing `card.json` and embedded assets

**Specifications Supported:**
- Character Card V1 (legacy)
- Character Card V2 (current standard, `chara_card_v2`)
- Character Card V3 (emerging, `chara_card_v3`)

### V2 Specification Structure (Most Widely Used)

```typescript
type TavernCardV2 = {
  spec: 'chara_card_v2'           // Required identifier
  spec_version: '2.0'             // Required version string
  data: {
    // Core V1 fields (all required, default to empty string)
    name: string                  // Character name
    description: string           // Character background, appearance, world info
    personality: string           // Brief personality summary
    scenario: string              // Context/circumstances of interaction
    first_mes: string             // Opening message (supports Markdown/HTML)
    mes_example: string           // Example dialogue using <START> markers

    // V2 additions
    creator_notes: string         // Notes for users (never sent to LLM)
    system_prompt: string         // Overrides user's system prompt
    post_history_instructions: string  // "Jailbreak" or UJB instructions
    alternate_greetings: string[] // Alternative opening messages
    character_book?: CharacterBook // Embedded lorebook (optional)
    tags: string[]                // Categorization tags (not sent to LLM)
    creator: string               // Creator attribution
    character_version: string     // Version tracking
    extensions: Record<string, any> // Application-specific data (default: {})
  }
}
```

### CharacterBook (Lorebook) Structure

```typescript
type CharacterBook = {
  name?: string
  description?: string
  scan_depth?: number             // How far back to scan for triggers
  token_budget?: number           // Max tokens for lorebook entries
  recursive_scanning?: boolean    // Enable recursive trigger scanning
  extensions: Record<string, any>
  entries: Array<{
    keys: string[]                // Trigger keywords
    content: string               // Content to inject
    extensions: Record<string, any>
    enabled: boolean              // Is entry active
    insertion_order: number       // Processing priority
    case_sensitive?: boolean      // Case-sensitive trigger matching
    name?: string                 // Entry display name
    priority?: number             // Injection priority
    id?: number                   // Unique identifier
    comment?: string              // Internal notes
    selective?: boolean           // Use secondary keys
    secondary_keys?: string[]     // AND conditions for triggers
    constant?: boolean            // Always inject regardless of triggers
    position?: 'before_char' | 'after_char'  // Injection position
  }>
}
```

### V3 Specification Additions

V3 extends V2 with:
- `assets`: Array of media resources (icons, backgrounds, emotion sprites)
- `nickname`: Alternate character reference name
- `creator_notes_multilingual`: Localized creator notes
- `source`: Array of origin references/URLs
- `group_only_greetings`: Greetings for group chat contexts
- `creation_date`: Unix timestamp
- `modification_date`: Unix timestamp

**V3 Embedding:** Uses `ccv3` tEXt chunk in PNG (vs `chara` for V2)

### Template Variables

SillyTavern supports these macros in all text fields:
- `{{char}}` - Character name
- `{{user}}` - User's persona name
- `{{original}}` - Original system prompt (for override fields)

### Example: V2 Character Card (JSON)

```json
{
  "spec": "chara_card_v2",
  "spec_version": "2.0",
  "data": {
    "name": "Elena",
    "description": "Elena is a 28-year-old librarian at the Moonvale Public Library. She has shoulder-length auburn hair, green eyes, and wears vintage-style clothing. She is passionate about rare books and local history. Elena is introverted but warms up quickly when discussing literature. She has a habit of adjusting her glasses when thinking.",
    "personality": "Introverted, intellectual, warm, curious, occasionally sarcastic",
    "scenario": "{{user}} has just entered the library's rare books section where {{char}} is cataloging a new acquisition.",
    "first_mes": "*Elena looks up from an old leather-bound tome, adjusting her glasses as she notices someone approaching the restricted section.*\n\nOh, hello there. *She sets down her white cotton gloves and offers a small smile.* The rare books section isn't usually open to the public, but... are you looking for something specific? I just received a fascinating 18th-century botanical manuscript if you're interested in that sort of thing.",
    "mes_example": "<START>\n{{user}}: What's the oldest book you have here?\n{{char}}: *Elena's eyes light up as she carefully sets aside her current work.*\nOh, that would be our 1523 printing of Pliny's Natural History. It's not in the best condition, but... *she pauses, a hint of pride in her voice* ...it's survived five centuries. Would you like to see it? I'll need you to wear gloves, of course.",
    "creator_notes": "Elena works best with detailed, descriptive prompts. She responds well to discussions about books, history, and quiet moments. Avoid overly aggressive or confrontational scenarios.",
    "system_prompt": "",
    "post_history_instructions": "",
    "alternate_greetings": [
      "*The library is quiet this evening, with only the soft rustle of pages breaking the silence. Elena sits at her desk, surrounded by stacks of books awaiting cataloging. She doesn't notice your approach at first, absorbed in her work.*"
    ],
    "tags": ["female", "librarian", "slice-of-life", "intellectual", "SFW"],
    "creator": "example_creator",
    "character_version": "1.0",
    "extensions": {}
  }
}
```

### Official Documentation

- **Character Card V2 Spec**: https://github.com/malfoyslastname/character-card-spec-v2
- **Character Card V3 Spec**: https://github.com/kwaroran/character-card-spec-v3
- **SillyTavern Docs**: https://docs.sillytavern.app/
- **Character Design Guide**: https://docs.sillytavern.app/usage/core-concepts/characterdesign/

---

## 2. Chub.ai

### Service Description
Chub.ai (also known as CharacterHub) is a character card repository and hosting platform. It hosts both SFW and NSFW characters and includes Venus, an integrated chat interface. Chub is one of the largest repositories for TavernAI/SillyTavern-compatible character cards.

### Template Format

**File Types Supported:**
- **PNG**: Character card with embedded JSON (standard TavernCard format)
- **JSON**: Raw character data export

**Specification:** Chub.ai uses the **Character Card V2 specification** (`chara_card_v2`), the same as SillyTavern. Cards downloaded from Chub are directly compatible with SillyTavern and other V2-compliant platforms.

### Structure

Identical to SillyTavern V2 specification (see above). Chub enforces the V2 schema for uploads and exports.

### Chub-Specific Considerations

1. **Venus Integration**: Chub's Venus chat interface reads V2 cards natively
2. **Lorebook Support**: Full `character_book` support for embedded lorebooks
3. **Export Options**:
   - "Download PNG" - Full character card with image
   - "Raw JSON" - Text data only
4. **API Access**: Chub provides API endpoints for programmatic card retrieval

### API Endpoint (Unofficial/Community-Documented)

```
GET https://api.chub.ai/api/characters/{fullPath}
```

Returns character data in V2 JSON format. The `fullPath` is the character's URL path (e.g., `username/character-name`).

### Example: Chub Character Card

The format is identical to SillyTavern V2. Here's a minimal example:

```json
{
  "spec": "chara_card_v2",
  "spec_version": "2.0",
  "data": {
    "name": "Captain Vex",
    "description": "Captain Vex is the commander of the merchant vessel 'Starling's Fortune'. A weathered spacer in their mid-40s with cybernetic left eye and prosthetic right arm. They've been running cargo between the outer colonies for 20 years.",
    "personality": "Pragmatic, experienced, gruff but fair, secretly sentimental",
    "scenario": "{{user}} has just boarded the Starling's Fortune as a new crew member.",
    "first_mes": "*The airlock hisses open, revealing the utilitarian interior of a well-maintained cargo ship. A figure in a worn flight jacket turns from the navigation console, cybernetic eye glowing faintly blue.*\n\nYou must be the new hand. *Captain Vex looks you over with their one organic eye.* I don't care where you came from or what you're running from. On my ship, you pull your weight and follow orders. We clear?",
    "mes_example": "",
    "creator_notes": "Captain Vex works well in sci-fi scenarios involving space travel, smuggling, or crew dynamics.",
    "system_prompt": "",
    "post_history_instructions": "",
    "alternate_greetings": [],
    "tags": ["sci-fi", "captain", "space", "adventure"],
    "creator": "example_user",
    "character_version": "1.2",
    "extensions": {}
  }
}
```

### Official Documentation

**No official public API documentation exists.** Chub.ai does not publish formal API docs or schema specifications. The platform relies on the community-standard Character Card V2 spec.

- **Character Card V2 Spec** (used by Chub): https://github.com/malfoyslastname/character-card-spec-v2
- **Chub Website**: https://chub.ai/
- **Community Tool - Chub Downloader**: https://github.com/Samueras/chub_downloader
- **Community Tool - Card Extractor**: https://github.com/korenko-git/chub-card-extractor

---

## 3. SpicyChat

### Service Description
SpicyChat.ai is a hosted AI chat platform that supports both SFW and NSFW content. Unlike SillyTavern (self-hosted), SpicyChat is a web service with its own character creation interface and uses Pygmalion-based models.

### Template Format

**File Types Supported for Import:**
- **PNG**: TavernAI/SillyTavern character cards (V2 compatible)
- **JSON**: Character data export

**Native Format:** SpicyChat uses a proprietary web form for character creation but accepts standard Character Card imports. Export functionality is limited without third-party tools.

### Field Structure (Web Interface)

Based on SpicyChat's character creation form:

| Field | Type | Required | Character Limit | Description |
|-------|------|----------|-----------------|-------------|
| `name` | string | Yes | - | Character name |
| `title` | string | Yes | 84 chars (display cutoff) | Short hook/tagline |
| `greeting` | string | Yes | - | Opening message |
| `personality` | string | Yes | ~900-1100 tokens recommended | Character traits, background, appearance |
| `scenario` | string | No | - | Context/setting (Advanced) |
| `example_dialogue` | string | No | - | Sample conversations (Advanced) |
| `avatar` | image | Yes | ~5MB max | Character image |
| `tags` | string[] | No | - | Categorization |
| `visibility` | enum | Yes | - | public/private/unlisted |

### Template Variables

SpicyChat supports:
- `{{user}}` - The player/user
- `{{char}}` - The character

### Import Compatibility

SpicyChat imports standard TavernAI V2 character cards. When importing:
- `first_mes` → `greeting`
- `description` + `personality` → `personality`
- `scenario` → `scenario`
- `mes_example` → `example_dialogue`

### Example: SpicyChat Character (Conceptual JSON)

While SpicyChat doesn't officially publish its JSON schema, imported cards follow this mapping:

```json
{
  "name": "Zara",
  "title": "Your mysterious new roommate with secrets",
  "greeting": "*Zara is unpacking boxes when you enter the apartment. She looks up, brushing dark hair from her face, revealing striking violet eyes that seem to study you intensely.*\n\nOh. You must be my new roommate. *She extends a hand, her grip surprisingly firm.* I should warn you - I keep odd hours. And I'd appreciate it if you didn't go through my things. Some of them are... fragile.",
  "personality": "Name: Zara\nAge: 24\nAppearance: Tall, lean build. Long black hair, unusual violet eyes. Often wears dark, practical clothing.\nPersonality: Mysterious, guarded, intelligent, occasionally warm when trust is earned. Has a dry sense of humor.\nBackground: Recently moved to the city under unclear circumstances. Works night shifts at an undisclosed job.\nQuirks: Collects antique keys. Never answers personal questions directly. Sometimes stares into space as if listening to something.",
  "scenario": "{{user}} has just moved into a shared apartment. {{char}} is their new roommate who moved in last week.",
  "example_dialogue": "{{user}}: What do you do for work?\n{{char}}: *Zara pauses, a slight smile playing at her lips.* Let's just say I solve problems. The kind most people prefer not to know about.\n{{user}}: That's not really an answer.\n{{char}}: *She shrugs, returning to her unpacking.* It's the only one you're getting. For now.",
  "tags": ["female", "mystery", "roommate", "modern", "supernatural"],
  "visibility": "public"
}
```

### Official Documentation

**Limited official documentation exists.** SpicyChat does not publish a formal API or schema specification.

- **SpicyChat Website**: https://spicychat.ai/
- **Community Guide**: https://rentry.org/spicychat-ai-guide
- **Third-Party Export Tool**: https://sc-export.com/

---

## 4. Crushon.ai

### Service Description
Crushon.ai is a hosted AI chat platform supporting unfiltered NSFW content. It offers character creation and import capabilities similar to SpicyChat but with its own interface and model offerings.

### Template Format

**File Types Supported for Import:**
- **PNG**: Character cards (V2 compatible)
- **JSON**: Character data
- **JPG**: Avatar images only (must be JPG format)

**Native Format:** Web-based form with proprietary field structure. No official schema published.

### Field Structure (Web Interface)

Based on character creation interface:

| Field | Type | Required | Recommended Length | Description |
|-------|------|----------|-------------------|-------------|
| `name` | string | Yes | - | Character name |
| `age` | string | No | - | Character age |
| `gender` | string | No | - | Character gender |
| `introduction` | string | Yes | 100+ chars (min for AI summary) | Character overview |
| `greeting` | string | Yes | - | Opening message |
| `personality` | string | Yes | 200-400 chars optimal | Traits and behaviors |
| `appearance` | string | No | - | Physical description |
| `scenario` | string | No | 200-500 words recommended | Backstory and context |
| `example_dialogue` | string | No | - | Sample conversations |
| `avatar` | image | Yes | JPG only | Character image |
| `visibility` | enum | Yes | - | public/private |
| `content_rating` | enum | Yes | - | filtered/unfiltered |

### Best Practices (Per Platform Guidelines)

1. Write personality in **third person**
2. Use **short, declarative sentences** (conserves tokens)
3. Avoid vague terms ("maybe", "sometimes")
4. Don't reference user behavior or feelings in personality
5. Create personality first, then write example dialogue to match

### Personality Writing Methods

**Method 1 - Prose Description:**
```
Aria is confident and outgoing. She loves adventure and hates being confined. She speaks directly and values honesty above all else.
```

**Method 2 - Attribute Notation:**
```
Confidence=High
Sociability=Extroverted
Values=Honesty, Freedom, Adventure
Dislikes=Confinement, Deception
Speech=Direct, Casual
```

### Example: Crushon.ai Character (Conceptual)

```json
{
  "name": "Marcus",
  "age": "32",
  "gender": "Male",
  "introduction": "Marcus is a former detective turned private investigator. He left the force after a case went wrong, and now he works alone, taking cases the police won't touch. Despite his cynical exterior, he has a strong moral compass.",
  "greeting": "*Marcus sits in his dimly lit office, feet propped on the desk. A half-empty bottle of whiskey and scattered case files surround him. He looks up as you enter, not bothering to move.*\n\nOffice hours are over. *He takes a slow sip from his glass.* But since you're already here... what kind of trouble are you in?",
  "personality": "Marcus is cynical and world-weary. He uses sarcasm as a defense mechanism. He is highly observant and analytical. He has a strict personal code of ethics. He drinks too much but never on a case. He is loyal to those who earn his trust.",
  "appearance": "Tall with a weathered face. Perpetual stubble. Dark hair with streaks of gray. Usually wears a rumpled coat and loosened tie. Has a scar above his left eyebrow.",
  "scenario": "{{user}} has come to Marcus's office seeking help with a problem the police refused to investigate.",
  "example_dialogue": "{{user}}: Can you help me find someone?\n{{char}}: *Marcus sets down his glass, studying you with sharp eyes.* Finding people is what I do. The question is whether you can afford it, and whether you're ready for what I might find. *He leans forward.* People disappear for reasons. Not all of them pretty.",
  "visibility": "public",
  "content_rating": "unfiltered"
}
```

### Import Compatibility

Crushon.ai imports V2 character cards. The field mapping appears to be:
- `description` → `introduction` + `appearance`
- `personality` → `personality`
- `scenario` → `scenario`
- `first_mes` → `greeting`
- `mes_example` → `example_dialogue`

### Official Documentation

**No official API documentation or schema specification exists.** Crushon.ai does not publish technical documentation for their character format.

- **Crushon.ai Website**: https://crushon.ai/
- **Help Article**: https://www.yeschat.ai/blog-How-to-make-good-bots-on-crushonai-16167

---

## 5. Cross-Platform Compatibility Notes

### Universal Format Recommendation

For maximum compatibility across all four platforms, use the **Character Card V2 specification** with PNG embedding. This is:
- Native to SillyTavern
- Native to Chub.ai
- Import-compatible with SpicyChat
- Import-compatible with Crushon.ai

### Field Mapping Matrix

| V2 Field | SillyTavern | Chub.ai | SpicyChat | Crushon.ai |
|----------|-------------|---------|-----------|------------|
| `name` | name | name | name | name |
| `description` | description | description | personality* | introduction + appearance |
| `personality` | personality | personality | personality* | personality |
| `scenario` | scenario | scenario | scenario | scenario |
| `first_mes` | first_mes | first_mes | greeting | greeting |
| `mes_example` | mes_example | mes_example | example_dialogue | example_dialogue |
| `creator_notes` | creator_notes | creator_notes | - | - |
| `system_prompt` | system_prompt | system_prompt | - | - |
| `post_history_instructions` | post_history_instructions | post_history_instructions | - | - |
| `alternate_greetings` | alternate_greetings | alternate_greetings | - | - |
| `character_book` | character_book | character_book | - | - |
| `tags` | tags | tags | tags | - |

*SpicyChat combines `description` and `personality` into a single `personality` field on import.

### Export Strategy

For an application generating cross-platform characters:

1. **Primary Format**: Generate Character Card V2 JSON
2. **PNG Generation**: Embed JSON in PNG tEXt chunk using `chara` key (base64 encoded)
3. **Platform-Specific Exports**:
   - SillyTavern/Chub: Use V2 PNG directly
   - SpicyChat: V2 PNG works, or generate platform-specific JSON
   - Crushon.ai: V2 PNG works, ensure avatar is JPG-compatible

### Token Considerations

| Platform | Recommended Token Limit |
|----------|------------------------|
| SillyTavern | Varies by backend (2000-8000+) |
| Chub.ai/Venus | ~4000 tokens |
| SpicyChat | 900-1100 tokens total |
| Crushon.ai | 200-500 words for scenario |

### Character Card V2 PNG Embedding

To create a V2-compatible PNG:

```python
# Pseudocode for PNG embedding
import base64
import json
from PIL import Image
from PIL.PngImagePlugin import PngInfo

def create_character_card(image_path, character_data, output_path):
    # Load image
    img = Image.open(image_path)

    # Prepare V2 JSON
    card_v2 = {
        "spec": "chara_card_v2",
        "spec_version": "2.0",
        "data": character_data
    }

    # Encode to base64
    json_str = json.dumps(card_v2)
    encoded = base64.b64encode(json_str.encode('utf-8')).decode('utf-8')

    # Add to PNG metadata
    metadata = PngInfo()
    metadata.add_text("chara", encoded)

    # Save
    img.save(output_path, pnginfo=metadata)
```

---

## Summary

| Platform | Primary Format | File Type | Official Docs |
|----------|---------------|-----------|---------------|
| SillyTavern | Character Card V2/V3 | PNG, JSON, CHARX | Yes (GitHub) |
| Chub.ai | Character Card V2 | PNG, JSON | No (uses V2 spec) |
| SpicyChat | Proprietary (V2 import) | PNG, JSON | No |
| Crushon.ai | Proprietary (V2 import) | PNG, JSON | No |

**Recommendation**: Build your application around the Character Card V2 specification for maximum compatibility. This format is officially documented, widely supported, and serves as the de facto standard across the roleplay AI ecosystem.

---

*Document generated: 2025-12-14*
*Research sources: Official documentation, GitHub repositories, community guides*
