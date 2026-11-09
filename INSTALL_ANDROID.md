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

## 4. Configure resolution and regions

- Open `StealAnEgg_Fishing.js` and set `CFG.region*` to match where each element appears on your screen (relative 0.0–1.0). Regions are scaled from your device width/height at runtime, so one config works across portrait resolutions.
- Example for a bottom-right Cast button: `regionCast: [0.55, 0.75, 0.98, 0.98]`.
- Set `CFG.tapSpeedTps` to your desired Click Fast / Perfect taps per second (default 10).
- Set `CFG.fishMode` to `'tap'` (rapid tapping) or `'hold'` (long press) depending on the minigame.
- Set `CFG.scanRate` (scans per second). Lower = friendlier on battery but slower detection (default 2).
- Set `CFG.threshold` (0.0–1.0) for image match sensitivity (default 0.85).

## 5. Run

- Open Roblox -> Steal an Egg -> go to the fishing area. Make sure the Cast button is visible.
- Return to Macrorify, select `StealAnEgg_Fishing.js`, press Play/Start.
- Use Macrorify's floating controls to Pause / Resume / Stop. These pause and resume the script engine directly.

## 6. Stop safely

- Press Stop in Macrorify's floating controls, or disable the Accessibility service, to end the macro immediately.
