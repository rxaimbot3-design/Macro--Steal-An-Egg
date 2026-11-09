# Android Installation Guide

Requirements: Android device, Roblox installed, Macrorify installed. No root, no Delta, no executor, no PC.

## 1. Install Macrorify

- Download Macrorify from the Play Store or official site.
- Grant all requested permissions when prompted:
  - Accessibility Service (Macrorify) — required for tapping/swiping on screen.
  - Draw over other apps / display over apps — required for the floating control panel.
  - Storage / files — required to read image templates.
- Enable the Macrorify Accessibility service in Android Settings -> Accessibility -> Macrorify.

## 2. Add the macro script

- Copy `StealAnEgg_Fishing.js` into Macrorify's script folder. Common locations:
  - Internal storage / Macrorify / scripts
  - Internal storage / Macrorify / EMScript
  - Wherever Macrorify lists user scripts in its UI
- Open Macrorify -> Scripts and confirm `StealAnEgg_Fishing.js` appears.

## 3. Add image templates

- Copy the four PNG templates (see TEMPLATES.md) into Macrorify's images/assets folder so `images.readAsset()` can load them.
  - Common location: Internal storage / Macrorify / images
  - If `readAsset` does not find them, edit `loadTmpl()` in the script to use `images.loadImage('<full path>')` with the absolute path.
- Confirm filenames match `CFG.tmpl*` exactly (case-sensitive):
  - `cast_button.png`
  - `prompt.png`
  - `click_perfect.png`
  - `reward.png`

## 4. Configure resolution and regions

- Open `StealAnEgg_Fishing.js` and set `CFG.region*` to match where each element appears on your screen (relative 0.0–1.0). Regions are scaled automatically, so one config works across resolutions of the same orientation.
- Set `CFG.tapSpeedTps` to your desired Click Fast / Perfect taps per second (default 10).
- Set `CFG.fishMode` to `'tap'` (rapid tapping) or `'hold'` (long press) depending on the minigame.

## 5. Run

- Open Roblox -> Steal an Egg -> go to the fishing area.
- Return to Macrorify, select `StealAnEgg_Fishing.js`, press Play/Start.
- Use Macrorify's floating controls to Pause / Resume / Stop. The script respects `runtime.pause()` / `runtime.resume()` and the `ST.stop` flag.

## 6. Stop safely

- Press Stop in Macrorify, or disable the Accessibility service, to end the macro immediately.
