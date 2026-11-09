# Image Template Capture Instructions

The macro does NOT contain hardcoded coordinates. It uses image templates you capture from your own device. Place every captured PNG in the Macrorify images folder (see INSTALL_ANDROID.md) so `images.readAsset()` can load them.

## Required templates

| Template name | What to capture | Detection region |
|---|---|---|
| `cast_button.png` | The idle fishing rod / Cast button (the button you tap to start fishing) | `regionCast` |
| `prompt.png` | The fishing prompt that appears right after casting | `regionPrompt` |
| `click_perfect.png` | The Click Fast / Perfect indicator during the minigame | `regionClick` |
| `reward.png` | The completion / Collect reward screen or button | `regionReward` |

## How to capture a template (Macrorify)

1. Open Macrorify -> Images -> Create new image / capture.
2. Start Roblox "Steal an Egg" and reach the exact UI state for that template.
3. Take a screenshot of the smallest useful area around the button/indicator.
4. Crop tightly around just the UI element (exclude surrounding background where possible).
5. Save as PNG with the exact filename above.
6. Repeat for all four templates.

## Capture tips

- Capture each template at the same Roblox zoom/camera distance you will play at. UI element sizes change with camera distance.
- Capture in the same display orientation you will run the macro (portrait, e.g. 1080x2400).
- Avoid capturing the "glow"/animation frames; pick a static, representative frame.
- If an element changes appearance (e.g. perfect vs. great), capture each variant and add more template names to `CFG` plus extra `find()` calls.

## Adjusting detection regions

Regions are relative (0.0 to 1.0) `[left, top, right, bottom]` and scaled to your screen at runtime, so they work across resolutions. Edit `CFG.region*` in the script to narrow each region to the area where that element appears. This avoids accidental taps on unrelated buttons.

Example: if the Cast button is always bottom-right, set:
`regionCast: [0.55, 0.75, 0.98, 0.98]`

## OCR fallback keywords

If an image template is not found, the script falls back to OCR keyword matching:
- `ocrPrompt`: text expected on the fishing prompt
- `ocrClick`: text expected on the Click Fast / Perfect indicator
- `ocrReward`: text expected on the reward screen

Edit these to match the exact wording shown in your language/version of the game.
