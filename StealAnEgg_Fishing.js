// ============================================================================
// Steal An Egg – Fully Automatic Fishing Macro for Macrorify (EMScript)
// ============================================================================
//
// No root, no Delta, no executor, no PC required. Works directly over Roblox
// on Android. Uses image detection and OCR instead of fixed timing.
//
// REQUIRED: Capture 4 image templates in Macrorify -> Resources -> Images:
//   cast_button   (idle fishing rod / Cast button)
//   prompt        (fishing prompt after casting)
//   click_perfect (Click Fast / Perfect indicator during minigame)
//   reward        (completion / Collect reward screen or button)
//
// Template names are referenced by name (NO file extension) in CFG.tmpl* below.
//
// ============================================================================

// ============================================================================
// CONFIGURATION – Edit these values to match your device and game UI
// ============================================================================
var CFG = {
  // Tap speed for Click Fast / Perfect minigame (taps per second)
  tapSpeedTps: 10,

  // Fishing mode: 'tap' (rapid tapping) or 'hold' (long press)
  fishMode: 'tap',

  // Hold duration in ms when fishMode === 'hold'
  holdDurationMs: 600,

  // Image match threshold (0.0–1.0). Higher = stricter match.
  threshold: 0.85,

  // Detection scans per second. Lower = friendlier on battery.
  scanRate: 2,

  // Stage timeouts in milliseconds
  castTimeoutMs: 15000,
  promptTimeoutMs: 20000,
  fishTimeoutMs: 30000,
  rewardTimeoutMs: 15000,

  // Maximum consecutive retries before giving up on a cycle
  maxRetries: 3,

  // Jitter radius in pixels added to each tap (avoids robotic patterns)
  tapJitterPx: 6,

  // Delays in milliseconds after key actions
  postCastDelayMs: 1500,
  postCollectDelayMs: 1500,
  loopDelayMs: 1000,

  // Detection regions as relative [left, top, right, bottom] (0.0–1.0).
  // Scaled to device width/height at runtime (resolution-independent).
  regionCast: [0.25, 0.55, 0.95, 0.98],
  regionPrompt: [0.10, 0.25, 0.90, 0.85],
  regionClick: [0.20, 0.30, 0.80, 0.75],
  regionReward: [0.10, 0.10, 0.90, 0.90],

  // Template names in Macrorify Resources (NO file extension, case-sensitive)
  tmplCast: 'cast_button',
  tmplPrompt: 'prompt',
  tmplClick: 'click_perfect',
  tmplReward: 'reward',

  // OCR fallback keywords (match exact wording in your game language)
  ocrPrompt: 'FISH',
  ocrClick: 'PERFECT',
  ocrReward: 'COLLECT',

  // Operational modes
  diagnosticMode: false,   // true = detect UI elements WITHOUT tapping
  testMode: false,         // true = run exactly ONE fishing cycle then stop
  strictValidation: false, // true = stop if any template is missing on startup
};

// ============================================================================
// STATE
// ============================================================================
var ST = {
  running: false,
  stop: false,
  stage: 'IDLE',
  retries: 0,
  cycleCount: 0,
  templatesValid: false,
};

// Required templates: [name, regionKey, displayLabel]
var REQUIRED_TEMPLATES = [
  [CFG.tmplCast, 'regionCast', 'Cast button'],
  [CFG.tmplPrompt, 'regionPrompt', 'Fishing prompt'],
  [CFG.tmplClick, 'regionClick', 'Click/Perfect indicator'],
  [CFG.tmplReward, 'regionReward', 'Reward/Completion'],
];

// ============================================================================
// LOGGING – Every state transition is logged with a clear prefix
// ============================================================================
function log(msg) {
  Sys.toast('[StealAnEgg] ' + msg);
  Sys.log('[StealAnEgg] ' + msg);
}

function stage(name) {
  ST.stage = name;
  log('STATE: ' + name);
}

// ============================================================================
// REGION & DETECTION HELPERS
// ============================================================================
function regionFor(key) {
  var rel = CFG[key];
  var w = Env.deviceW();
  var h = Env.deviceH();
  var left = Math.round(rel[0] * w);
  var top = Math.round(rel[1] * h);
  var right = Math.round(rel[2] * w);
  var bottom = Math.round(rel[3] * h);
  var width = right - left;
  var height = bottom - top;
  if (width < 1) { width = 1; }
  if (height < 1) { height = 1; }
  return Region(left, top, width, height);
}

function fparam(timeoutMs) {
  return FParam.timeout(timeoutMs).sRate(CFG.scanRate).mScore(CFG.threshold);
}

function findImage(templateName, regionKey, timeoutMs) {
  var reg = regionFor(regionKey);
  return reg.find(templateName, fparam(timeoutMs));
}

function readText(regionKey) {
  try {
    var t = regionFor(regionKey).readAsString();
    if (t == null) { return ''; }
    return String(t);
  } catch (e) {
    return '';
  }
}

function textContains(text, keyword) {
  if (!text) { return false; }
  return String(text).indexOf(String(keyword)) >= 0;
}

// ============================================================================
// STARTUP VALIDATION – Checks all 4 required templates exist
// ============================================================================
function validateTemplates() {
  log('=== STARTUP TEMPLATE VALIDATION ===');
  log('Device: ' + Env.deviceW() + 'x' + Env.deviceH());
  log('Mode: ' + (CFG.diagnosticMode ? 'DIAGNOSTIC (no taps)' : 'AUTOMATION') +
      ' | TestMode: ' + CFG.testMode +
      ' | FishMode: ' + CFG.fishMode +
      ' | TapSpeed: ' + CFG.tapSpeedTps + ' tps');

  var allFound = true;
  for (var i = 0; i < REQUIRED_TEMPLATES.length; i++) {
    var tpl = REQUIRED_TEMPLATES[i];
    var name = tpl[0];
    var regionKey = tpl[1];
    var label = tpl[2];

    // Attempt a short find to check whether the template resource exists and
    // is currently visible on screen. A null result means either the template
    // is missing from Macrorify Resources OR it is not currently visible.
    var reg = regionFor(regionKey);
    var match = reg.find(name, FParam.timeout(1500).sRate(2).mScore(CFG.threshold));

    if (match) {
      log('VALIDATED: ' + label + ' (' + name + ') found on screen (score=' + match.getScore() + ')');
    } else {
      log('MISSING: ' + label + ' (' + name + ') not found on screen');
      log('  -> Ensure "' + name + '" is captured in Macrorify Resources -> Images');
      log('  -> Ensure the UI element is currently visible on screen');
      allFound = false;
    }
  }

  ST.templatesValid = allFound;
  log('=== VALIDATION ' + (allFound ? 'PASSED' : 'FAILED') + ' ===');

  if (!allFound && CFG.strictValidation) {
    log('Strict validation enabled: stopping macro. Fix missing templates first.');
    Sys.stop();
    return false;
  }
  return true;
}

// ============================================================================
// DIAGNOSTIC MODE – Detect UI elements WITHOUT tapping
// ============================================================================
function runDiagnostic() {
  log('=== DIAGNOSTIC MODE (detection only, no taps) ===');
  var results = {};

  for (var i = 0; i < REQUIRED_TEMPLATES.length; i++) {
    var tpl = REQUIRED_TEMPLATES[i];
    var name = tpl[0];
    var regionKey = tpl[1];
    var label = tpl[2];

    var match = findImage(name, regionKey, 3000);
    if (match) {
      var p = match.getPoint();
      log('DETECTED: ' + label + ' at (' + p.getX() + ',' + p.getY() + ') score=' + match.getScore());
      results[name] = 'found';
    } else {
      var text = readText(regionKey);
      log('NOT DETECTED: ' + label + ' | OCR text="' + text + '"');
      results[name] = 'not_found';
    }
  }

  log('=== DIAGNOSTIC COMPLETE ===');
  var foundCount = 0;
  for (var k in results) {
    if (results[k] === 'found') { foundCount++; }
  }
  log('Found: ' + foundCount + '/' + REQUIRED_TEMPLATES.length);
  return results;
}

// ============================================================================
// ACTION HELPERS
// ============================================================================
function tapMatch(match) {
  click(match.getPoint(), CParam.random(CFG.tapJitterPx));
}

function holdPoint(point) {
  click(point, CParam.hold(CFG.holdDurationMs));
}

function intervalMs() {
  return Math.round(1000 / CFG.tapSpeedTps);
}

function recovery() {
  ST.retries += 1;
  if (ST.retries > CFG.maxRetries) {
    log('Max retries reached (' + CFG.maxRetries + '), continuing to next cycle');
    ST.retries = 0;
    return;
  }
  log('Recovery attempt ' + ST.retries + '/' + CFG.maxRetries);
  sleep(2000);
}

function resetRetries() {
  ST.retries = 0;
}

// ============================================================================
// FISHING STATE MACHINE STAGES
// ============================================================================
function waitForCast() {
  stage('DETECT_CAST');
  var match = findImage(CFG.tmplCast, 'regionCast', CFG.castTimeoutMs);
  if (!match) {
    log('Cast button not found within timeout (' + CFG.castTimeoutMs + 'ms)');
    return null;
  }
  log('Cast button found (score=' + match.getScore() + ')');
  return match;
}

function waitForPrompt() {
  stage('WAIT_PROMPT');
  var match = findImage(CFG.tmplPrompt, 'regionPrompt', CFG.promptTimeoutMs);
  if (match) {
    log('Fishing prompt found (image, score=' + match.getScore() + ')');
    return true;
  }
  var text = readText('regionPrompt');
  log('Prompt image not found; OCR text="' + text + '"');
  if (textContains(text, CFG.ocrPrompt)) {
    log('Fishing prompt confirmed via OCR');
    return true;
  }
  log('Fishing prompt not detected');
  return null;
}

function waitForClickIndicator() {
  stage('WAIT_CLICK');
  var match = findImage(CFG.tmplClick, 'regionClick', CFG.fishTimeoutMs);
  if (match) {
    log('Click/Perfect indicator found (image, score=' + match.getScore() + ')');
    return match;
  }
  var text = readText('regionClick');
  log('Click indicator image not found; OCR text="' + text + '"');
  log('Click indicator not detected (image required for tap target)');
  return null;
}

function performFishing(clickMatch) {
  stage('FISHING');
  var point = clickMatch.getPoint();
  if (CFG.fishMode === 'hold') {
    log('Fishing: hold mode for ' + CFG.holdDurationMs + 'ms');
    holdPoint(point);
  } else {
    log('Fishing: tap mode at ' + CFG.tapSpeedTps + ' tps');
    var end = Date.now() + CFG.fishTimeoutMs;
    var interval = intervalMs();
    while (Date.now() < end && ST.running && !ST.stop) {
      var m = findImage(CFG.tmplClick, 'regionClick', 250);
      if (!m) {
        log('Click indicator lost during tap sequence');
        break;
      }
      tapMatch(m);
      sleep(interval);
    }
    log('Fishing tap sequence finished');
  }
}

function waitForComplete() {
  stage('WAIT_COMPLETE');
  sleep(1000);
  var match = findImage(CFG.tmplReward, 'regionReward', CFG.rewardTimeoutMs);
  if (match) {
    log('Reward/completion detected (image, score=' + match.getScore() + ')');
    return match;
  }
  var text = readText('regionReward');
  log('Reward image not found; OCR text="' + text + '"');
  if (textContains(text, CFG.ocrReward)) {
    log('Reward/completion confirmed via OCR');
    return true;
  }
  log('Completion/reward not detected');
  return null;
}

function collectReward(result) {
  stage('COLLECT');
  if (result != null && result != true && typeof result.getPoint === 'function') {
    tapMatch(result);
    log('Reward collected at match point');
  } else if (result === true) {
    log('Completion confirmed via OCR, no tap target available');
  } else {
    log('No reward point to click; skipping tap');
  }
  sleep(CFG.postCollectDelayMs);
}

// ============================================================================
// SINGLE FISHING CYCLE
// ============================================================================
function runCycle() {
  ST.cycleCount++;
  log('=== CYCLE #' + ST.cycleCount + ' ===');

  if (!ST.running || ST.stop) { return false; }

  // Stage 1: Detect cast button
  var cast = waitForCast();
  if (!cast) { recovery(); return false; }
  if (CFG.diagnosticMode) { log('Diagnostic: would tap cast button'); return true; }
  tapMatch(cast);
  sleep(CFG.postCastDelayMs);

  if (!ST.running || ST.stop) { return false; }

  // Stage 2: Wait for fishing prompt
  var prompt = waitForPrompt();
  if (!prompt) { recovery(); return false; }

  if (!ST.running || ST.stop) { return false; }

  // Stage 3: Wait for Click/Perfect indicator
  var clickInd = waitForClickIndicator();
  if (!clickInd) { recovery(); return false; }

  if (!ST.running || ST.stop) { return false; }

  // Stage 4: Fishing action (tap or hold)
  performFishing(clickInd);

  if (!ST.running || ST.stop) { return false; }

  // Stage 5: Wait for completion / reward
  var reward = waitForComplete();
  if (!reward) { recovery(); return false; }

  // Stage 6: Collect reward
  collectReward(reward);

  resetRetries();
  stage('IDLE');
  log('Cycle #' + ST.cycleCount + ' complete. Next cast in ' + CFG.loopDelayMs + 'ms');
  sleep(CFG.loopDelayMs);
  return true;
}

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================
function main() {
  ST.running = true;
  ST.stop = false;
  ST.retries = 0;
  ST.cycleCount = 0;

  log('Steal An Egg Fishing Macro started');

  // Startup template validation
  if (!validateTemplates()) {
    ST.running = false;
    log('Macro stopped due to validation failure');
    return;
  }

  // Diagnostic mode: detect without tapping, then stop
  if (CFG.diagnosticMode) {
    runDiagnostic();
    ST.running = false;
    log('Diagnostic mode complete. Macro stopped.');
    return;
  }

  // Main automation loop
  while (ST.running && !ST.stop) {
    runCycle();

    // Test mode: run exactly one cycle then stop
    if (CFG.testMode) {
      log('Test mode: completed 1 cycle. Stopping.');
      ST.stop = true;
    }
  }

  ST.running = false;
  log('Steal An Egg Fishing Macro stopped. Total cycles: ' + ST.cycleCount);
}

main();
