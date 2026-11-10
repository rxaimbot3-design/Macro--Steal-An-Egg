# Features That Cannot Be Automated (or need manual setup)

These are inherent limits of an accessibility-based macro on non-rooted Android using Macrorify EMScript.

## Cannot be automated without manual input

1. **Initial launch and login** — Opening Roblox, signing in, and joining "Steal an Egg" must be done manually before starting the macro.
2. **Navigating to the fishing spot** — The macro assumes you are already standing at the fishing area with the Cast button visible. Walking to the spot is not automated.
3. **Equipping/selecting the fishing rod** — If the game requires manually equipping a rod before casting, that step is not automated.
4. **Template capture** — You must capture your own image templates (`cast_button`, `prompt`, `click_perfect`, `complete`, `collect`) in Macrorify Resources because UI varies by device resolution, language, and game version.
5. **Region and threshold tuning** — `CFG_region*`, `CFG_threshold`, `CFG_tapSpeedTps`, `CFG_holdDurationMs`, `CFG_scanRateIdle`, and `CFG_scanRateClick` must be adjusted per device/version; there is no universal value.
6. **Exact fishing mechanics** — The script does not assume how the Click Fast / Perfect minigame works internally. You must set `CFG_fishMode` (`tap` or `hold`) and `CFG_holdDurationMs` to match the actual game behavior.
7. **Tap speed measurement** — `CFG_tapSpeedTps` must be measured on your device. The default value of 5 is conservative and may need adjustment.
8. **Template resource existence** — Macrorify EMScript has no API to directly check whether a template name exists in Resources. Startup validation attempts a screen find; a "not found" result means either the template is missing from Resources OR it is not currently visible on screen.
9. **Navigation between game screens** — Diagnostic mode and template validation require you to manually navigate to each game screen state so the corresponding template is visible.

## Features that are automated (with limits)

- **Start/Pause/Resume/Stop** — Provided through Macrorify's floating controls, which pause/resume/stop the script engine directly. The script respects these via `ST_running`/`ST_stop` loop guards checked between every stage.
- **Timeout and retry system** — Implemented per stage (`*TimeoutMs`) with `CFG_maxRetries`. On timeout, the script logs and recovers; it never taps blindly. After `CFG_maxRetries` consecutive failures it logs and continues to the next cycle.
- **Avoid accidental taps** — Addressed by narrow detection regions + required image match before every tap. Tap stages require an image match to obtain a tap target; OCR-only confirmation never triggers a tap. `CFG_tapJitterPx = 0` ensures precise tapping by default.
- **Startup config validation** — `validateConfig()` checks all configuration values (tap speed, fish mode, threshold, scan rates, timeouts, regions, template names) before starting automation.
- **Startup template validation** — `validateTemplates()` checks all 5 templates independently on startup. With `CFG_strictValidation = true`, the macro stops if any template is not found.
- **Diagnostic mode** — `CFG_diagnosticMode = true` detects all UI elements WITHOUT tapping, so you can verify templates before running automation.
- **Test mode** — `CFG_testMode = true` runs complete cycles until ONE succeeds, then stops. Failed cycles are retried.
- **Battery-friendly scanning** — Implemented via `CFG_scanRateIdle` (scans per second) in `FParam` and `wait()` delays between cycles. Continuous screen-on fishing still drains battery; lower brightness and reduce scan rate to help.
- **Recovery if the fishing sequence fails** — Implemented: each stage has a timeout; on failure the script recovers and starts the next cycle from cast. It does not re-walk to the fishing spot or re-equip the rod.
- **Separate completion vs. collect** — Completion detection (`complete` template/OCR) is separate from Collect button tap (`collect` template). The macro never taps a decorative reward banner.

## What the script does not assume

- No hardcoded pixel coordinates (all regions are relative 0.0–1.0 and scaled to device width/height at runtime with `.noScale()`).
- No fixed timing for detection (detection is image/OCR driven; `wait()` calls are only small post-action delays).
- No specific screen resolution (works on any portrait resolution once regions/templates are set).
- No file extensions on template names (Macrorify Resources reference templates by name).
- No object literals or Map data structures (EMScript supports `var`, arrays, and classes only).
- No `Date.now()` or `sleep()` — uses `Sys.currentTime()` and `wait()` per Macrorify EMScript API.

## APIs used (verified against Macrorify EMScript reference)

- `Env.deviceW()`, `Env.deviceH()` — device dimensions for resolution-independent scaling
- `Region(left, top, width, height)` — detection regions
- `Region.noScale()` — disables scaling for device-pixel coordinates
- `region.find(name, FParam)` — image detection with timeout/scanRate/matchScore
- `region.waitText(text, timeout)` — OCR text detection that checks repeatedly during timeout
- `region.readAsString()` — OCR text reading (fallback)
- `FParam.timeout/sRate/mScore` — find parameters
- `Match.getPoint()`, `Match.getScore()` — match result
- `click(Point, CParam)` — tap at a point
- `CParam.random(px)`, `CParam.hold(ms)` — click parameters
- `Sys.toast()`, `Sys.log()` — user-visible and console logging
- `Sys.stop()` — emergency stop
- `Sys.currentTime()` — current time in milliseconds
- `wait(ms)` — delay
- `Point(x, y)` — coordinates
- `fun name(params) { }` — EMScript function declaration
- `var` — variable declaration
- Arrays `[...]` — data structures (no objects, no Map)
