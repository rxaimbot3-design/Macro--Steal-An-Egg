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

- Capture the five templates (see TEMPLATES.md) and save them in Macrorify -> Resources -> Images with these exact names:
  - `cast_button`
  - `prompt`
  - `click_perfect`
  - `complete`
  - `collect`
- Confirm the names match `CFG_tmpl*` exactly (case-sensitive, no file extension).

## 4. Configure the macro (EDIT THESE IN THE SCRIPT)

Open `StealAnEgg_Fishing.js` and adjust the configuration variables at the top:

| Setting | What it does | Default |
|---|---|---|
| `CFG_tapSpeedTps` | Clicks per second in Click Fast / Perfect minigame. **Measure this on your device — do not assume a value.** | `5` |
| `CFG_fishMode` | `'tap'` (rapid tapping) or `'hold'` (long press) for the minigame | `'tap'` |
| `CFG_holdDurationMs` | Hold duration in ms when `CFG_fishMode === 'hold'` | `600` |
| `CFG_threshold` | Image match sensitivity (0.0–1.0), higher = stricter | `0.85` |
| `CFG_scanRateIdle` | Detection scans per second during idle stages (lower = friendlier on battery) | `1` |
| `CFG_scanRateClick` | Detection scans per second during click-indicator stages (higher = more responsive) | `3` |
| `CFG_castTimeoutMs` | Max ms to wait for Cast button | `15000` |
| `CFG_promptTimeoutMs` | Max ms to wait for fishing prompt | `20000` |
| `CFG_fishTimeoutMs` | Max ms for fishing tap/hold sequence | `30000` |
| `CFG_completeTimeoutMs` | Max ms to wait for completion / collect | `15000` |
| `CFG_maxRetries` | Max consecutive retries before continuing to next cycle | `3` |
| `CFG_tapJitterPx` | Jitter radius in pixels added to each tap. **0 = accurate tapping** | `0` |
| `CFG_regionCast/Prompt/Click/Complete/Collect` | Detection area `[left, top, right, bottom]` (0.0–1.0) | See script |
| `CFG_tmplCast/Prompt/Click/Complete/Collect` | Template names in Macrorify Resources (no extension) | See script |
| `CFG_ocrPrompt/Complete` | OCR keyword fallback per stage | `'FISH'`, `'COMPLETE'` |
| `CFG_diagnosticMode` | `true` = detect UI without tapping (verify templates first) | `false` |
| `CFG_testMode` | `true` = run exactly ONE successful cycle then stop | `false` |
| `CFG_strictValidation` | `true` = stop on startup if any template missing | `false` |

## 5. Startup validation

When you start the macro, it validates:
1. **Config**: All values are within valid ranges
2. **Templates**: Each of the 5 templates is checked independently on screen

Template validation does NOT expect all 5 screens to be visible at once. It checks whether each template resource exists and is currently visible. If a template is not visible, navigate to that screen state and re-run.

With `CFG_strictValidation = true`, the macro stops if any template is missing. With `false` (default), it warns but continues.

## 6. Diagnostic mode (recommended first run)

Set `CFG_diagnosticMode = true` and run the macro. It will detect all 5 UI elements WITHOUT tapping anything and report whether each was found. Navigate to each game screen state before running. Use this to confirm your templates match before enabling automation.

## 7. Test mode

Set `CFG_testMode = true` and run the macro. It performs complete fishing cycles until ONE succeeds, then stops. If a cycle fails, it retries. Use this to verify the full flow end-to-end once before leaving it running.

## 8. Run

- Open Roblox -> Steal an Egg -> go to the fishing area. Make sure the Cast button is visible.
- Return to Macrorify, select `StealAnEgg_Fishing.js`, press Play/Start.
- Use Macrorify's floating controls to Pause / Resume / Stop. These pause and resume the script engine directly.

## 9. Stop safely

- Press Stop in Macrorify's floating controls, or disable the Accessibility service, to end the macro immediately.
