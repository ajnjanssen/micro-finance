"use client";

import { useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { DAISY_UI_THEMES } from "@/types/app-settings";
import type { TypographySettings } from "@/types/app-settings";

export default function AppearanceSection() {
  const { theme, settings, setTheme, updateSettings } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const handleThemeChange = async (newTheme: string) => {
    try {
      setIsSaving(true);
      await setTheme(newTheme as any);
      setSaveMessage("Theme updated successfully!");
      setTimeout(() => setSaveMessage(""), 2000);
    } catch (error) {
      setSaveMessage("Failed to update theme");
      setTimeout(() => setSaveMessage(""), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTypographyChange = async (
    key: keyof TypographySettings,
    value: any
  ) => {
    try {
      setIsSaving(true);
      const newSettings = {
        ...settings,
        typography: {
          ...settings.typography,
          [key]: value,
        },
      };
      await updateSettings(newSettings);
      setSaveMessage("Typography settings updated!");
      setTimeout(() => setSaveMessage(""), 2000);
    } catch (error) {
      setSaveMessage("Failed to update typography settings");
      setTimeout(() => setSaveMessage(""), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Appearance Settings</h2>
        <p className="text-base-content/70 mt-2">
          Customize the look and feel of your application
        </p>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className="alert alert-success">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Theme Selection */}
      <div className="card bg-base-200 shadow">
        <div className="card-body">
          <h3 className="card-title">Theme</h3>
          <p className="text-sm text-base-content/70 mb-4">
            Choose from {DAISY_UI_THEMES.length} beautiful DaisyUI themes
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {DAISY_UI_THEMES.map((themeName) => (
              <button
                key={themeName}
                type="button"
                onClick={() => handleThemeChange(themeName)}
                disabled={isSaving}
                className={`btn btn-sm ${
                  theme === themeName ? "btn-primary" : "btn-outline btn-ghost"
                } capitalize`}
                data-theme={themeName}
              >
                <div className="flex items-center gap-2 w-full">
                  <div className="flex gap-1">
                    <div className="w-2 h-4 rounded bg-primary" />
                    <div className="w-2 h-4 rounded bg-secondary" />
                    <div className="w-2 h-4 rounded bg-accent" />
                  </div>
                  <span className="flex-1 text-left">{themeName}</span>
                  {theme === themeName && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Typography Settings */}
      <div className="card bg-base-200 shadow">
        <div className="card-body">
          <h3 className="card-title">Typography</h3>
          <p className="text-sm text-base-content/70 mb-4">
            Customize text formatting and readability
          </p>

          <div className="space-y-4">
            {/* Enable Prose */}
            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text">
                  <div>
                    <div className="font-semibold">
                      Enable Typography Plugin
                    </div>
                    <div className="text-xs text-base-content/70">
                      Apply Tailwind Typography prose classes for better text
                      formatting
                    </div>
                  </div>
                </span>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={settings.typography.enableProse}
                  onChange={(e) =>
                    handleTypographyChange("enableProse", e.target.checked)
                  }
                  disabled={isSaving}
                />
              </label>
            </div>

            {/* Prose Size */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Prose Size</span>
              </label>
              <select
                className="select w-fit min-w-60 px-4 rounded-lg select-bordered"
                value={settings.typography.proseSize}
                onChange={(e) =>
                  handleTypographyChange("proseSize", e.target.value)
                }
                disabled={isSaving || !settings.typography.enableProse}
              >
                <option value="prose-sm">Small</option>
                <option value="prose-base">Base</option>
                <option value="prose-lg">Large</option>
                <option value="prose-xl">Extra Large</option>
                <option value="prose-2xl">2X Large</option>
              </select>
            </div>

            {/* Heading Style */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Heading Style</span>
              </label>
              <select
                className="select w-fit min-w-60 px-4 rounded-lg select-bordered"
                value={settings.typography.headingStyle}
                onChange={(e) =>
                  handleTypographyChange("headingStyle", e.target.value)
                }
                disabled={isSaving}
              >
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
                <option value="extrabold">Extra Bold</option>
              </select>
            </div>

            {/* Body Text Size */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Body Text Size</span>
              </label>
              <select
                className="select w-fit min-w-60 px-4 rounded-lg select-bordered"
                value={settings.typography.bodyTextSize}
                onChange={(e) =>
                  handleTypographyChange("bodyTextSize", e.target.value)
                }
                disabled={isSaving}
              >
                <option value="text-sm">Small</option>
                <option value="text-base">Base</option>
                <option value="text-lg">Large</option>
              </select>
            </div>

            {/* Line Height */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Line Height</span>
              </label>
              <select
                className="select w-fit min-w-60 px-4 rounded-lg select-bordered"
                value={settings.typography.lineHeight}
                onChange={(e) =>
                  handleTypographyChange("lineHeight", e.target.value)
                }
                disabled={isSaving}
              >
                <option value="normal">Normal</option>
                <option value="relaxed">Relaxed</option>
                <option value="loose">Loose</option>
              </select>
            </div>

            {/* Letter Spacing */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Letter Spacing</span>
              </label>
              <select
                className="select w-fit min-w-60 px-4 rounded-lg select-bordered"
                value={settings.typography.letterSpacing}
                onChange={(e) =>
                  handleTypographyChange("letterSpacing", e.target.value)
                }
                disabled={isSaving}
              >
                <option value="normal">Normal</option>
                <option value="wide">Wide</option>
                <option value="wider">Wider</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Typography Preview */}
      <div className="card bg-base-200 shadow">
        <div className="card-body">
          <h3 className="card-title mb-4">Typography Preview</h3>

          <div
            className={`
              ${
                settings.typography.enableProse
                  ? settings.typography.proseSize
                  : ""
              }
              ${settings.typography.enableProse ? "prose" : ""}
              ${settings.typography.bodyTextSize}
              leading-${settings.typography.lineHeight}
              tracking-${settings.typography.letterSpacing}
              max-w-none
            `}
          >
            <h1 className={`font-${settings.typography.headingStyle}`}>
              Heading 1: The Quick Brown Fox
            </h1>
            <h2 className={`font-${settings.typography.headingStyle}`}>
              Heading 2: Jumps Over the Lazy Dog
            </h2>
            <h3 className={`font-${settings.typography.headingStyle}`}>
              Heading 3: Typography Preview
            </h3>

            <p>
              <strong>Bold text</strong> is perfect for highlighting key points.{" "}
              <em>Italic text</em> is great for emphasizing specific words.{" "}
              <strong>
                <em>Bold and Italic</em>
              </strong>{" "}
              text can be used for extra emphasis.
            </p>

            <blockquote>
              This is a blockquote. It stands out and draws attention to
              important information. Blockquotes are styled beautifully with the
              Typography plugin.
            </blockquote>

            <h4 className={`font-${settings.typography.headingStyle}`}>
              Unordered List
            </h4>
            <ul>
              <li>First item</li>
              <li>Second item</li>
              <li>
                Third item
                <ul>
                  <li>Subitem one</li>
                  <li>Subitem two</li>
                </ul>
              </li>
            </ul>

            <h4 className={`font-${settings.typography.headingStyle}`}>
              Ordered List
            </h4>
            <ol>
              <li>Step one</li>
              <li>Step two</li>
              <li>Step three</li>
            </ol>

            <p>
              Here is an example of <code>inline code</code> within a sentence.
            </p>

            <pre>
              <code>{`function greet() {\n  console.log('Hello, world!');\n}`}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
