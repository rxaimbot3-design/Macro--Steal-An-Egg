# Features That Cannot Be Automated (or need manual setup)

These are inherent limits of an accessibility-based macro on non-rooted Android:

## Cannot be automated without manual input

1. **Initial launch and login** — Opening Roblox, signing in, and joining "Steal an Egg" must be done manually before starting the macro.
2. **Navigating to the fishing spot** — The macro assumes you are already standing at the fishing area with the Cast button visible. Walking to the spot is not automated.
3. **Equipping/selecting the fishing rod** — If the game requires manually equipping a rod before casting, that step is not automated.
4. **Template capture** — You must capture your own image templates (`cast_button.png`, `prompt.png`, `click_perfect.png`, `reward.png`) because UI varies by device resolution, language, and game version.
5. **Region and threshold tuning** — `CFG.region*`, `CFG.threshold`, and `CFG.tapSpeedTps` must be adjusted per device/version; there is no universal value.

## Features that are partially automated

- **Start/Pause/Resume/Stop** — Provided through Macrorify's floating controls and the script's running/paused/stop flags. Not a single global hotkey unless you configure one in Macrorify.
- **Timeout and retry system** — Implemented per stage (`*TimeoutMs`) with `maxRetries`, after which the macro pauses instead of tapping blindly forever.
- **Avoid accidental taps** — Addressed by narrow detection regions + image/OCR confirmation before each tap. Not perfect; always verify regions.
- **Battery-friendly scanning** — Implemented via idle sleep between scans, but continuous screen-on fishing still drains battery; lower screen brightness and raise `idleScanMs` to help.
- **Recovery on failure** — Implemented: on timeout the script retries up to `maxRetries`, then pauses. It does not automatically re-walk to the fishing spot or re-equip the rod.

## What the script does not assume

- No hardcoded pixel coordinates (all regions are relative 0.0–1.0 and scaled at runtime).
- No fixed timing (detection is image/OCR driven; sleeps are only small post-action delays).
- No specific screen resolution (works on any portrait resolution once regions/templates are set).
