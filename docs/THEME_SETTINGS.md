# Theme and Typography Settings

## Overview

The application now supports dynamic theme switching and typography customization. Users can choose from 36 DaisyUI themes and customize text formatting options.

## Features

### Theme Selection

- **36 DaisyUI Themes**: Choose from themes like `light`, `dark`, `sunset`, `dracula`, `cyberpunk`, and many more
- **Instant Preview**: Theme changes are applied immediately across the entire application
- **Persistent Storage**: Theme preference is saved to `data/app-settings.json`

### Typography Settings

- **Prose Mode**: Enable/disable Tailwind Typography plugin for enhanced text formatting
- **Prose Size**: Choose from 5 size options (sm, base, lg, xl, 2xl)
- **Heading Style**: Normal, Bold, or Extra Bold headings
- **Body Text Size**: Small, Base, or Large
- **Line Height**: Normal, Relaxed, or Loose
- **Letter Spacing**: Normal, Wide, or Wider

### Live Preview

The settings page includes a live typography preview showing:

- Headings (H1-H4)
- Bold, italic, and combined text styles
- Blockquotes
- Ordered and unordered lists
- Inline code and code blocks

## Usage

### Accessing Settings

1. Navigate to **Settings** → **Weergave** → **Thema & Typografie**
2. Or directly visit `/settings?tab=appearance`

### Changing Theme

1. Click on any theme button in the Theme section
2. The theme is applied instantly
3. Settings are automatically saved

### Customizing Typography

1. Toggle the "Enable Typography Plugin" switch
2. Adjust size, style, and spacing options
3. View changes in the preview section below
4. Settings are automatically saved

## Technical Details

### File Structure

```
src/
├── types/
│   └── app-settings.ts          # Type definitions
├── services/
│   └── app-settings-service.ts  # File I/O operations
├── components/
│   └── ThemeProvider.tsx        # Theme context & management
├── hooks/
│   └── useAppSettings.ts        # Settings hook
├── app/
│   ├── api/
│   │   └── app-settings/
│   │       └── route.ts         # API endpoints
│   └── settings/
│       └── components/
│           └── AppearanceSection.tsx  # Settings UI

data/
├── app-settings.json            # User settings (gitignored)
└── app-settings.json.example    # Default template
```

### API Endpoints

#### GET /api/app-settings

Returns the current application settings.

**Response:**

```json
{
  "theme": "sunset",
  "typography": {
    "enableProse": true,
    "proseSize": "prose-base",
    "headingStyle": "bold",
    "bodyTextSize": "text-base",
    "lineHeight": "normal",
    "letterSpacing": "normal"
  },
  "version": "1.0.0"
}
```

#### PUT /api/app-settings

Updates application settings.

**Request Body:**

```json
{
  "theme": "dracula",
  "typography": {
    "enableProse": true,
    "proseSize": "prose-lg",
    "headingStyle": "extrabold",
    "bodyTextSize": "text-lg",
    "lineHeight": "relaxed",
    "letterSpacing": "wide"
  },
  "version": "1.0.0"
}
```

### Using in Components

#### Using the Theme Context

```tsx
import { useTheme } from "@/components/ThemeProvider";

function MyComponent() {
  const { theme, setTheme, settings, updateSettings } = useTheme();

  return (
    <div>
      Current theme: {theme}
      <button onClick={() => setTheme("dracula")}>Switch to Dracula</button>
    </div>
  );
}
```

#### Using the Settings Hook

```tsx
import { useAppSettings } from "@/hooks/useAppSettings";

function MyComponent() {
  const { settings, updateSettings, isLoading } = useAppSettings();

  if (isLoading) return <div>Loading...</div>;

  return <div>Theme: {settings.theme}</div>;
}
```

## Available Themes

The following 36 themes are available:

| Light Themes | Dark Themes | Colorful Themes | Unique Themes |
| ------------ | ----------- | --------------- | ------------- |
| light        | dark        | synthwave       | cyberpunk     |
| cupcake      | coffee      | retro           | halloween     |
| bumblebee    | business    | valentine       | wireframe     |
| emerald      | night       | aqua            | black         |
| corporate    | dim         | pastel          | luxury        |
| garden       | nord        | fantasy         | cmyk          |
| lofi         | dracula     | acid            | abyss         |
| winter       | forest      | lemonade        | silk          |
|              | sunset      |                 | caramellatte  |
|              | autumn      |                 |               |

## Typography Classes Applied

When typography settings are changed, the following Tailwind classes are dynamically applied:

- **Prose Size**: `prose-sm`, `prose-base`, `prose-lg`, `prose-xl`, `prose-2xl`
- **Heading Style**: `font-normal`, `font-bold`, `font-extrabold`
- **Body Text**: `text-sm`, `text-base`, `text-lg`
- **Line Height**: `leading-normal`, `leading-relaxed`, `leading-loose`
- **Letter Spacing**: `tracking-normal`, `tracking-wide`, `tracking-wider`

## Data Persistence

Settings are persisted to `data/app-settings.json`:

```json
{
  "theme": "sunset",
  "typography": {
    "enableProse": true,
    "proseSize": "prose-base",
    "headingStyle": "bold",
    "bodyTextSize": "text-base",
    "lineHeight": "normal",
    "letterSpacing": "normal"
  },
  "version": "1.0.0"
}
```

**Note**: This file should be gitignored. A template is provided in `data/app-settings.json.example`.

## Future Enhancements

Potential improvements for future versions:

- Custom theme creation
- Font family selection
- Color scheme customization
- Export/import theme configurations
- User-specific theme profiles
- Dark mode auto-switch based on time
- System theme preference detection
