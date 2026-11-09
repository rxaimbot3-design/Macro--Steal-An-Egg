# Android Installation Guide

Requirements: Android device, Roblox installed, Macrorify installed. No root, no Delta, no executor, no PC.

## 1. Install Macrorify

- Download Macrorify from the Play Store or official site.
- Grant all requested permissions when prompted:
  - Accessibility Service (Macrorify) — required for tapping/swiping on screen.
  - Display over other apps / draw over apps — required for the floating control panel.
  - Storage / files — required for Resources and logs.
- Enable the Macrorify Accessibility service in Android Settings -> Accessibility -> Macrorify.
- In Macrorify settings, confirm the touch method is set to Accessibility (or Native Service if installed).

## 2. Add the macro script

- Copy `StealAnEgg_Fishing.js` into Macrorify. Use the "Import script" or create a new script and paste the code.
- Open Macrorify -> Scripts and confirm `StealAnEgg_Fishing.js` appears.

## 3. Add image templates

- Capture the four templates (see TEMPLATES.md) and save them in Macrorify -> Resources -> Images with these exact names:
  - `cast_button`
  - `prompt`
  - `click_perfect`
  - `reward`
- Confirm the names match `CFG.tmpl*` exactly (case-sensitive, no file extension).

## 4. Configure the macro (EDIT THESE IN THE SCRIPT)

Open `StealAnEgg_Fishing.js` and adjust the `CFG` block at the top:

| Setting | What it does | Example |
|---|---|---|
| `tapSpeedTps` | Clicks per second in Click Fast / Perfect minigame | `10` |
| `fishMode` | `'tap'` (rapid tapping) or `'hold'` (long press) | `'tap'` |
| `holdDurationMs` | Hold duration when `fishMode === 'hold'` | `600` |
| `threshold` | Image match sensitivity (0.0–1.0), higher = stricter | `0.85` |
| `scanRate` | Detection scans per second (lower = friendlier on battery) | `2` |
| `regionCast/Prompt/Click/Reward` | Detection area `[left, top, right, bottom]` (0.0–1.0) | `[0.25, 0.55, 0.95, 0.98]` |
| `tmplCast/Prompt/Click/Reward` | Template names in Macrorify Resources (no extension) | `'cast_button'` |
| `ocrPrompt/Click/Reward` | OCR keyword fallback per stage | `'FISH'`, `'PERFECT'`, `'COLLECT'` |
| `diagnosticMode` | `true` = detect UI without tapping (verify templates first) | `false` |
| `testMode` | `true` = run exactly ONE cycle then stop | `false` |
| `strictValidation` | `true` = stop on startup if any template missing | `false` |

## 5. Startup validation

When you start the macro, it validates all 4 templates:
- If a template is found on screen: `VALIDATED: ... found on screen`
- If not found: `MISSING: ... not found on screen` + hint to check Resources
- With `strictValidation: true`, the macro stops if any template is missing
- With `strictValidation: false` (default), it warns but continues

## 6. Diagnostic mode (recommended first run)

Set `diagnosticMode: true` and run the macro. It will detect all 4 UI elements
WITHOUT tapping anything and report whether each was found. Use this to confirm
your templates match before enabling automation.

## 7. Test mode

Set `testMode: true` and run the macro. It performs exactly ONE complete fishing
cycle (cast → prompt → click → fish → complete → collect) then stops. Use this
to verify the full flow end-to-end once before leaving it running.

## 8. Run

- Open Roblox -> Steal an Egg -> go to the fishing area. Make sure the Cast button is visible.
- Return to Macrorify, select `StealAnEgg_Fishing.js`, press Play/Start.
- Use Macrorify's floating controls to Pause / Resume / Stop. These pause and resume the script engine directly.

## 9. Stop safely

- Press Stop in Macrorify's floating controls, or disable the Accessibility service, to end the macro immediately.
