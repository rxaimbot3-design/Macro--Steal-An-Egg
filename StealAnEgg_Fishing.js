var CFG = {
  tapSpeedTps: 10,
  fishMode: 'tap',
  holdDurationMs: 600,
  threshold: 0.85,
  scanRate: 2,
  castTimeoutMs: 15000,
  promptTimeoutMs: 20000,
  fishTimeoutMs: 30000,
  rewardTimeoutMs: 15000,
  maxRetries: 3,
  idleScanMs: 1000,
  tapJitterPx: 6,
  postCastDelayMs: 1500,
  postCollectDelayMs: 1500,
  loopDelayMs: 1000,
  regionCast: [0.25, 0.55, 0.95, 0.98],
  regionPrompt: [0.10, 0.25, 0.90, 0.85],
  regionClick: [0.20, 0.30, 0.80, 0.75],
  regionReward: [0.10, 0.10, 0.90, 0.90],
  tmplCast: 'cast_button',
  tmplPrompt: 'prompt',
  tmplClick: 'click_perfect',
  tmplReward: 'reward',
  ocrPrompt: 'FISH',
  ocrClick: 'PERFECT',
  ocrReward: 'COLLECT',
};

var ST = {
  running: false,
  stop: false,
  stage: 'IDLE',
  retries: 0,
};

function log(msg) {
  Sys.toast('[StealAnEgg] ' + msg);
  Sys.log('[StealAnEgg] ' + msg);
}

function stage(name) {
  ST.stage = name;
  log(name);
}

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

function waitForCast() {
  stage('DETECT_CAST');
  var match = findImage(CFG.tmplCast, 'regionCast', CFG.castTimeoutMs);
  if (!match) {
    log('Cast button not found within timeout');
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
  log('Prompt image not found; OCR text=' + text);
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
  log('Click indicator image not found; OCR text=' + text);
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
  log('Reward image not found; OCR text=' + text);
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

function runCycle() {
  if (!ST.running || ST.stop) { return; }

  var cast = waitForCast();
  if (!cast) { recovery(); return; }
  tapMatch(cast);
  sleep(CFG.postCastDelayMs);

  if (!ST.running || ST.stop) { return; }
  var prompt = waitForPrompt();
  if (!prompt) { recovery(); return; }

  if (!ST.running || ST.stop) { return; }
  var clickInd = waitForClickIndicator();
  if (!clickInd) { recovery(); return; }

  if (!ST.running || ST.stop) { return; }
  performFishing(clickInd);

  if (!ST.running || ST.stop) { return; }
  var reward = waitForComplete();
  if (!reward) { recovery(); return; }

  collectReward(reward);
  resetRetries();
  stage('IDLE');
  log('Cycle complete, next cast in ' + CFG.loopDelayMs + 'ms');
  sleep(CFG.loopDelayMs);
}

function main() {
  ST.running = true;
  ST.stop = false;
  ST.retries = 0;
  log('Macro started');
  while (ST.running && !ST.stop) {
    runCycle();
  }
  ST.running = false;
  log('Macro stopped');
}

main();
