# Testing Instructions (per fishing stage)

Run each test with Roblox in the foreground and Macrorify's floating overlay visible. Confirm the macro logs the expected stage via toast.

## Prerequisites

- All five templates captured in Macrorify Resources (see TEMPLATES.md).
- `CFG_region*` tuned to your screen (see INSTALL_ANDROID.md).
- You are standing at the fishing spot with the Cast button visible.

## Recommended first run: Diagnostic mode

1. Set `CFG_diagnosticMode = true` in the script.
2. Run the macro. It will test one template at a time:
   - For each template, navigate to the game screen where that element appears
   - The macro detects WITHOUT tapping
   - It reports DETECTED or NOT DETECTED per template
3. Confirm each template reports `DETECTED` with a match score.
4. If any reports `NOT DETECTED`, re-capture that template or narrow its region.
5. Set `CFG_diagnosticMode = false` before running automation.

## Test mode (one successful cycle)

1. Set `CFG_testMode = true` and `CFG_diagnosticMode = false` in the script.
2. Run the macro. It performs complete cycles until ONE succeeds, then stops.
3. If a cycle fails (e.g., collect button not found), it retries safely.
4. Confirm it logs every stage: DETECT_CAST → CAST → WAIT_PROMPT → WAIT_CLICK → FISHING → WAIT_COMPLETE → COLLECT → IDLE.
5. Confirm taps land on the correct UI elements, not nearby buttons.
6. **A cycle only counts as successful when reward collection completes.**

## Per-stage testing

### Stage 1 — Detect the fishing area / Cast button

1. Stand at the fishing spot with the Cast button visible.
2. Run the script; it should toast `STATE: DETECT_CAST` then `Cast button found`.
3. Confirm it taps the Cast button (not an unrelated UI element).
4. If it taps the wrong place or never finds it, narrow `CFG_regionCast` and re-capture `cast_button`.
5. If not found within `CFG_castTimeoutMs`, it logs timeout, recovers, retries next cycle — no blind tap occurs.

### Stage 2 — Detect the fishing prompt

1. After casting, the prompt should appear.
2. Confirm the script toasts `STATE: WAIT_PROMPT` then `Fishing prompt found`.
3. The script checks image detection first, then OCR fallback in a short window.
4. If it retries/recoveries, check `prompt` matches the in-game prompt, or set `CFG_ocrPrompt` to the prompt's visible text.

### Stage 3 — Detect Click Fast / Perfect indicator

1. Wait for the minigame indicator.
2. Confirm the script toasts `STATE: WAIT_CLICK` then `Click/Perfect indicator found`.
3. Confirm it begins tapping/holding the indicator.
4. Watch that taps land on the indicator, not nearby buttons. Adjust `CFG_regionClick` and `CFG_tapSpeedTps` as needed.
5. **Measure your tap speed** — the default `CFG_tapSpeedTps = 5` is a configuration value, not a guaranteed rate. Adjust based on actual minigame responsiveness.
6. If the indicator is lost mid-tap, it logs "Click indicator lost during tap sequence" and breaks out of the fishing loop.

### Stage 4 — Detect completion (detection only)

1. Let the minigame finish.
2. Confirm the script toasts `STATE: WAIT_COMPLETE` then `Fishing completion detected`.
3. The script checks image detection first, then OCR fallback in a short window.
4. If completion is not detected, check `complete` template or set `CFG_ocrComplete`.
5. This stage does NOT tap anything — it only detects that fishing finished.

### Stage 5 — Collect reward (separate tap target, required for cycle success)

1. Confirm the script toasts `STATE: COLLECT`.
2. If a `collect` button template exists and is found, the script taps it and logs "Reward collected at Collect button".
3. If completion was detected but no Collect button is found, the cycle is marked FAILED and retried — it never taps a decorative banner.
4. The script then logs `STATE: IDLE`.

## Full loop

1. Let the macro run for 5–10 cycles.
2. Confirm it repeats cast → fish → collect without drifting or tapping the wrong UI.
3. Test Pause → Resume via Macrorify's floating controls mid-cycle, then Stop; the script should halt cleanly.

## Failure and recovery scenarios

| Scenario | Expected behavior |
|---|---|
| Cast button never appears | Logs timeout, recovery, retries next cycle; never taps blindly |
| Prompt never appears after cast | Logs timeout, recovery, recasts |
| Click indicator never appears | Logs timeout, recovery, recasts (image required for tap target) |
| Indicator lost during rapid taps | Breaks tap sequence, logs, moves to completion detection |
| Completion never appears | Logs timeout, recovery, recasts |
| Completion detected but Collect button missing | Cycle marked FAILED, retried safely; never taps decorative banner |
| Max retries reached | Logs max retries, resets counter, continues to next cycle |
| Pause pressed mid-cycle | Script engine pauses; Resume continues from current point |
| Stop pressed | Script engine stops; `Macro stopped` toast |
| Invalid config value | Logs `ERROR` and stops before starting automation |
| Template not on current screen at startup | Informational only; macro continues |

## Battery-friendly scan

- Lower `CFG_scanRateIdle` (e.g. 1) to reduce CPU/battery use during detection.
- Use `CFG_scanRateClick = 3` for more responsive click-indicator detection.
- Raise `CFG_loopDelayMs` between cycles.
- Lower screen brightness while running.
