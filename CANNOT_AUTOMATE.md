# Features That Cannot Be Automated (or need manual setup)

These are inherent limits of an accessibility-based macro on non-rooted Android using Macrorify EMScript.

## Cannot be automated without manual input

1. **Initial launch and login** — Opening Roblox, signing in, and joining "Steal an Egg" must be done manually before starting the macro.
2. **Navigating to the fishing spot** — The macro assumes you are already standing at the fishing area with the Cast button visible. Walking to the spot is not automated.
3. **Equipping/selecting the fishing rod** — If the game requires manually equipping a rod before casting, that step is not automated.
4. **Template capture** — You must capture your own image templates (`cast_button`, `prompt`, `click_perfect`, `reward`) in Macrorify Resources because UI varies by device resolution, language, and game version.
5. **Region and threshold tuning** — `CFG.region*`, `CFG.threshold`, `CFG.tapSpeedTps`, and `CFG.scanRate` must be adjusted per device/version; there is no universal value.
6. **Exact fishing mechanics** — The script does not assume how the Click Fast / Perfect minigame works internally. You must set `fishMode` (`tap` or `hold`) and `holdDurationMs` to match the actual game behavior.

## Features that are automated (with limits)

- **Start/Pause/Resume/Stop** — Provided through Macrorify's floating controls, which pause/resume/stop the script engine directly. The script respects these via its `ST.running`/`ST.stop` loop guards.
- **Timeout and retry system** — Implemented per stage (`*TimeoutMs`) with `maxRetries`. On timeout, the script logs and recovers; it never taps blindly. After `maxRetries` consecutive failures it logs and continues to the next cycle.
- **Avoid accidental taps** — Addressed by narrow detection regions + required image match before every tap. Tap stages require an image match to obtain a tap target; OCR-only confirmation never triggers a tap.
- **Battery-friendly scanning** — Implemented via `CFG.scanRate` (scans per second) in `FParam` and idle sleeps between cycles. Continuous screen-on fishing still drains battery; lower brightness and reduce scan rate to help.
- **Recovery if the fishing sequence fails** — Implemented: each stage has a timeout; on failure the script recovers and starts the next cycle from cast. It does not re-walk to the fishing spot or re-equip the rod.

## What the script does not assume

- No hardcoded pixel coordinates (all regions are relative 0.0–1.0 and scaled to device width/height at runtime).
- No fixed timing for detection (detection is image/OCR driven; sleeps are only small post-action delays).
- No specific screen resolution (works on any portrait resolution once regions/templates are set).
- No file extensions on template names (Macrorify Resources reference templates by name).

## APIs used (verified against Macrorify EMScript reference)

- `Env.deviceW()`, `Env.deviceH()` — device dimensions for resolution-independent scaling
- `Region(left, top, width, height)` — detection regions
- `region.find(name, FParam)` — image detection with timeout/scanRate/matchScore
- `FParam.timeout/sRate/mScore` — find parameters
- `Match.getPoint()`, `Match.getScore()` — match result
- `click(Point, CParam)` — tap at a point
- `CParam.random(px)`, `CParam.hold(ms)` — click parameters
- `region.readAsString()` — OCR text reading
- `Sys.toast()`, `Sys.log()` — user-visible and console logging
- `Sys.stop()` — emergency stop available
- `sleep(ms)` — delay
- `Point(x, y)`, `Point.offset(dx, dy)` — coordinates
