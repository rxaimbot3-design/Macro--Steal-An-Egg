# Image Template Capture Instructions

The macro does NOT contain hardcoded coordinates. It uses image templates you capture from your own device and store in Macrorify's Resources. Templates are referenced by name (no file extension) in the `CFG_tmpl*` config variables.

## Required templates (5 total)

| Template name (config var) | What to capture | Detection region | Tap target? |
|---|---|---|---|
| `cast_button` (CFG_tmplCast) | The idle fishing rod / Cast button (tap to start fishing) | CFG_regionCast | Yes |
| `prompt` (CFG_tmplPrompt) | The fishing prompt that appears right after casting | CFG_regionPrompt | No (OCR OK) |
| `click_perfect` (CFG_tmplClick) | The Click Fast / Perfect indicator during the minigame | CFG_regionClick | Yes |
| `complete` (CFG_tmplComplete) | The fishing completion banner/screen (detection only) | CFG_regionComplete | No |
| `collect` (CFG_tmplCollect) | The Collect reward button (tap target, separate from completion banner) | CFG_regionCollect | Yes |

**Important:** Use the exact names above (case-sensitive). Do NOT include `.png` — Macrorify Resources store templates by name.

## Why `complete` and `collect` are separate

The completion banner/screen (`complete`) tells the macro that fishing finished. The Collect button (`collect`) is the actual tap target. These are intentionally separate because:
- A decorative reward banner may appear without a tappable Collect button
- The macro must never tap a decorative banner — only the actual Collect button
- If completion is detected but no Collect button is found, the macro logs and skips the tap

## How to capture a template (Macrorify)

1. Open Macrorify -> Resources -> Images.
2. Tap the capture/screenshot icon to enter screenshot mode.
3. Start Roblox "Steal an Egg" and reach the exact UI state for that template.
4. Capture the smallest useful area around the button/indicator.
5. Crop tightly around just the UI element (exclude surrounding background).
6. Save with the exact name from the table above.
7. Repeat for all five templates.
8. (Optional) Send common templates to Global Resources so they are available across macros.

## Capture tips

- Capture each template at the same Roblox zoom/camera distance you will play at. UI element sizes change with camera distance.
- Capture in the same display orientation you will run the macro (portrait, e.g. 1080x2400).
- Avoid capturing the "glow"/animation frames; pick a static, representative frame.
- If an element changes appearance (e.g. perfect vs. great), capture each variant as a separate template and add extra `find()` calls in the script.

## Adjusting detection regions

Regions are relative (0.0 to 1.0) `[left, top, right, bottom]` and scaled to your device at runtime using `Env.deviceW()`/`Env.deviceH()`, so they work across resolutions. Edit the `CFG_region*` variables in the script to narrow each region to the area where that element appears. This avoids accidental taps on unrelated buttons.

Example: if the Cast button is always bottom-right, set:
`CFG_regionCast = [0.55, 0.75, 0.98, 0.98]`

## OCR fallback keywords

If an image template is not found, the script falls back to OCR keyword matching for non-click stages (prompt appeared, completion). Edit these to match the exact wording shown in your language/version of the game:
- `CFG_ocrPrompt`: text expected on the fishing prompt
- `CFG_ocrComplete`: text expected on the completion screen

Note: Click stages (cast, click/perfect taps, collect) REQUIRE an image match to get a tap target. OCR alone cannot provide coordinates, so OCR-only confirmation will not trigger a tap on those stages. OCR checks repeatedly during the waiting period (not just once after timeout).
