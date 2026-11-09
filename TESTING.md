# Testing Instructions (per fishing stage)

Run each test with Roblox in the foreground and Macrorify's floating overlay visible. Confirm the macro logs the expected stage via toast/print.

## Stage 1 — Detect the fishing area / Cast button

1. Stand at the fishing spot with the Cast button visible.
2. Run the script; it should log `DETECT_CAST` then `CAST`.
3. Confirm it taps the Cast button (not an unrelated UI element).
4. If it taps the wrong place, narrow `CFG.regionCast` and re-capture `cast_button.png`.

## Stage 2 — Detect the fishing prompt

1. After casting, the prompt should appear.
3. Confirm the script logs `WAIT_PROMPT` and proceeds.
4. If it retries/recoveries, check `prompt.png` matches the in-game prompt, or set `CFG.ocrPrompt` to the prompt's visible text.

## Stage 3 — Detect Click Fast / Perfect indicator

1. Wait for the minigame indicator.
2. Confirm the script logs `WAIT_CLICK` then `FISHING` and begins tapping/holding the indicator.
3. Watch that taps land on the indicator, not nearby buttons. Adjust `CFG.regionClick` and `CFG.tapSpeedTps` as needed.

## Stage 4 — Detect completion

1. Let the minigame finish.
2. Confirm the script logs `WAIT_COMPLETE` then `COLLECT`.
3. If completion is not detected, check `reward.png` or set `CFG.ocrReward`.

## Stage 5 — Collect reward

1. Confirm the script taps the Collect button/reward and logs `COLLECT`, then `IDLE`.
2. If nothing is tappable at completion, the stage still advances after `postCollectDelayMs`.

## Full loop

1. Let the macro run for 5–10 cycles.
2. Confirm it repeats cast → fish → collect without drifting or tapping the wrong UI.
3. Test Pause → Resume mid-cycle, then Stop; the script should halt cleanly.

## Battery-friendly scan

When paused or between cycles the script sleeps `CFG.idleScanMs` between scans. Raise this value (e.g. 1500–2000 ms) to reduce CPU/battery use at the cost of slower detection response.
