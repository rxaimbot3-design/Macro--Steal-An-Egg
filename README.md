# Steal An Egg – Fully Automatic Fishing Macro for Macrorify (EMScript)

A fully automatic Android macro for the Roblox game "Steal an Egg" using Macrorify EMScript.

- Works directly over Roblox on Android
- No root, no Delta, no executor, no PC required
- Uses image detection and OCR instead of fixed timing
- Automatically repeats the complete fishing process

## Package contents

| File | Description |
|---|---|
| `StealAnEgg_Fishing.js` | Main macro script (EMScript) |
| `INSTALL_ANDROID.md` | Step-by-step Android installation guide |
| `TEMPLATES.md` | Image template capture instructions |
| `TESTING.md` | Per-stage testing instructions |
| `CANNOT_AUTOMATE.md` | Features that cannot be automated |

## Quick start

1. Install Macrorify on your Android device and grant Accessibility + Display-over-apps permissions.
2. Copy `StealAnEgg_Fishing.js` into Macrorify (Scripts).
3. Capture 5 image templates in Macrorify -> Resources -> Images: `cast_button`, `prompt`, `click_perfect`, `complete`, `collect` (see `TEMPLATES.md`).
4. Edit the configuration variables in `StealAnEgg_Fishing.js` to match your screen regions and preferences (see `INSTALL_ANDROID.md`).
5. Open Roblox -> Steal an Egg -> go to the fishing spot.
6. Run the macro from Macrorify. Use floating controls to Pause / Resume / Stop.

## Modes

- **Diagnostic mode** (`CFG_diagnosticMode = true`): Detects UI elements WITHOUT tapping. Use `CFG_diagnosticTemplate` to test one selected template, or leave empty to test all five. Run this first to verify your templates match.
- **Test mode** (`CFG_testMode = true`): Performs complete fishing cycles until ONE succeeds, then stops. Failed cycles retry safely, capped by `CFG_testMaxAttempts` (default 10).
- **Collect verification**: After tapping Collect, the macro verifies the Collect UI disappeared. If it doesn't, the cycle is marked FAILED and retried.
- **Strict validation** (`CFG_strictValidation = true`): Enables strict informational checks.

## Important

Do not claim the macro is fully working until it has been tested on a real Android device. All API usage below has been verified statically against the official Macrorify EMScript documentation, but runtime behavior (template matching accuracy, tap speed, region tuning) must be validated on your device.

See `INSTALL_ANDROID.md` for full installation instructions and `TESTING.md` for per-stage testing procedures.
