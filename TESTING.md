# Testing Instructions (per fishing stage)

Run each test with Roblox in the foreground and Macrorify's floating overlay visible. Confirm the macro logs the expected stage via toast.

## Prerequisites

- All four templates captured in Macrorify Resources (see TEMPLATES.md).
- `CFG.region*` tuned to your screen (see INSTALL_ANDROID.md).
- You are standing at the fishing spot with the Cast button visible.

## Stage 1 — Detect the fishing area / Cast button

1. Stand at the fishing spot with the Cast button visible.
2. Run the script; it should toast `DETECT_CAST` then `Cast button found`.
3. Confirm it taps the Cast button (not an unrelated UI element).
4. If it taps the wrong place or never finds it, narrow `CFG.regionCast` and re-capture `cast_button`.
5. If not found within `castTimeoutMs`, it logs "Cast button not found within timeout" and moves to recovery — no blind tap occurs.

## Stage 2 — Detect the fishing prompt

1. After casting, the prompt should appear.
2. Confirm the script toasts `WAIT_PROMPT` then `Fishing prompt found`.
3. If it retries/recoveries, check `prompt` matches the in-game prompt, or set `CFG.ocrPrompt` to the prompt's visible text.
4. OCR confirmation is sufficient here (no tap target needed).

## Stage 3 — Detect Click Fast / Perfect indicator

1. Wait for the minigame indicator.
2. Confirm the script toasts `WAIT_CLICK` then `Click/Perfect indicator found`.
3. Confirm it begins tapping/holding the indicator.
4. Watch that taps land on the indicator, not nearby buttons. Adjust `CFG.regionClick` and `CFG.tapSpeedTps` as needed.
5. If the indicator is lost mid-tap, it logs "Click indicator lost during tap sequence" and breaks out of the fishing loop.

## Stage 4 — Detect completion

1. Let the minigame finish.
2. Confirm the script toasts `WAIT_COMPLETE` then `Reward/completion detected`.
3. If completion is not detected, check `reward` or set `CFG.ocrReward`.
4. OCR confirmation is sufficient here (tap may be skipped if no reward button target).

## Stage 5 — Collect reward

1. Confirm the script toasts `COLLECT` and taps the Collect button/reward (if an image match exists), then `IDLE`.
2. If completion was OCR-only with no tap target, it logs "Completion confirmed via OCR, no tap target available" and skips the tap.

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
| Reward never appears | Logs timeout, recovery, recasts |
| Max retries reached | Logs max retries, resets counter, continues to next cycle |
| Pause pressed mid-cycle | Script engine pauses; Resume continues from current point |
| Stop pressed | Script engine stops; `Macro stopped` toast |

## Battery-friendly scan

- Lower `CFG.scanRate` (e.g. 1) to reduce CPU/battery use during detection.
- Raise `CFG.idleScanMs` between cycles.
- Lower screen brightness while running.
