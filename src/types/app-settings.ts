export const DAISY_UI_THEMES = [
  "light",
  "dark",
  "cupcake",
  "bumblebee",
  "emerald",
  "corporate",
  "synthwave",
  "retro",
  "cyberpunk",
  "valentine",
  "halloween",
  "garden",
  "forest",
  "aqua",
  "lofi",
  "pastel",
  "fantasy",
  "wireframe",
  "black",
  "luxury",
  "dracula",
  "cmyk",
  "autumn",
  "business",
  "acid",
  "lemonade",
  "night",
  "coffee",
  "winter",
  "dim",
  "nord",
  "sunset",
  "caramellatte",
  "abyss",
  "silk",
] as const;

export type DaisyUITheme = (typeof DAISY_UI_THEMES)[number];

export interface TypographySettings {
  enableProse: boolean; // Enable Tailwind Typography prose classes
  proseSize: "prose-sm" | "prose-base" | "prose-lg" | "prose-xl" | "prose-2xl";
  headingStyle: "normal" | "bold" | "extrabold";
  bodyTextSize: "text-sm" | "text-base" | "text-lg";
  lineHeight: "normal" | "relaxed" | "loose";
  letterSpacing: "normal" | "wide" | "wider";
}

export interface AppSettings {
  theme: DaisyUITheme;
  typography: TypographySettings;
  version: string;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: "sunset",
  typography: {
    enableProse: true,
    proseSize: "prose-base",
    headingStyle: "bold",
    bodyTextSize: "text-base",
    lineHeight: "normal",
    letterSpacing: "normal",
  },
  version: "1.0.0",
};
