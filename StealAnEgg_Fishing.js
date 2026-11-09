const CFG = {
  tapSpeedTps: 10,
  fishMode: 'tap',
  holdDurationMs: 600,
  threshold: 0.85,
  castTimeoutMs: 15000,
  promptTimeoutMs: 20000,
  fishTimeoutMs: 30000,
  rewardTimeoutMs: 15000,
  maxRetries: 3,
  idleScanMs: 1000,
  tapJitterPx: 6,
  tapJitterMs: 40,
  postCastDelayMs: 1500,
  postCollectDelayMs: 1500,
  loopDelayMs: 1000,
  regionCast: [0.25, 0.55, 0.95, 0.98],
  regionPrompt: [0.1, 0.25, 0.9, 0.85],
  regionClick: [0.2, 0.3, 0.8, 0.75],
  regionReward: [0.1, 0.1, 0.9, 0.9],
  tmplCast: 'cast_button.png',
  tmplPrompt: 'prompt.png',
  tmplClick: 'click_perfect.png',
  tmplReward: 'reward.png',
  ocrPrompt: 'FISH',
  ocrClick: 'PERFECT',
  ocrReward: 'COLLECT',
};

const ST = {
  running: false,
  paused: false,
  stop: false,
  stage: 'IDLE',
  retries: 0,
};

function dimW() {
  return device.getWidth();
}

function dimH() {
  return device.getHeight();
}

function relPx(n, dim) {
  return Math.round(n * dim);
}

function regionPx(rel) {
  return [relPx(rel[0], dimW()), relPx(rel[1], dimH()), relPx(rel[2], dimW()), relPx(rel[3], dimH())];
}

function loadTmpl(name) {
  try {
    return images.readAsset(name);
  } catch (e) {
    try {
      return images.loadImage(name);
    } catch (e2) {
      return null;
    }
  }
}

function find(templateName, regionKey) {
  const tmpl = loadTmpl(templateName);
  if (!tmpl) {
    return null;
  }
  const reg = regionPx(CFG[regionKey]);
  return images.findImage(tmpl, { region: reg, threshold: CFG.threshold });
}

function waitFor(templateName, regionKey, timeoutMs) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end && ST.running && !ST.stop) {
    if (!ST.paused) {
      const m = find(templateName, regionKey);
      if (m) {
        return m;
      }
    }
    sleep(CFG.idleScanMs);
  }
  return null;
}

function ocrText(regionKey) {
  const reg = regionPx(CFG[regionKey]);
  const crop = images.crop(reg[0], reg[1], reg[2], reg[3]);
  try {
    return images.ocr(crop) || '';
  } catch (e) {
    return '';
  }
}

function tapJitter(x, y) {
  click(x + (Math.random() * CFG.tapJitterPx * 2 - CFG.tapJitterPx), y + (Math.random() * CFG.tapJitterPx * 2 - CFG.tapJitterPx));
  sleep(CFG.tapJitterMs);
}

function tapMs() {
  return 1000 / CFG.tapSpeedTps;
}

function rapidTap(durationMs) {
  const end = Date.now() + durationMs;
  while (Date.now() < end && ST.running && !ST.stop) {
    if (ST.paused) {
      sleep(CFG.idleScanMs);
      continue;
    }
    const m = find(CFG.tmplClick, 'regionClick');
    if (!m) {
      break;
    }
    click(m.x, m.y);
    sleep(tapMs());
  }
}

function holdClick(durationMs) {
  const m = find(CFG.tmplClick, 'regionClick');
  if (m) {
    longClick(m.x, m.y, durationMs);
  }
  sleep(durationMs);
}

function fishAction() {
  if (CFG.fishMode === 'hold') {
    holdClick(CFG.holdDurationMs);
  } else {
    rapidTap(CFG.fishTimeoutMs);
  }
}

function log(msg) {
  toast(msg);
  print('[StealAnEgg] ' + msg);
}

function stage(name) {
  ST.stage = name;
  log(name);
}

function recovery() {
  ST.retries += 1;
  if (ST.retries > CFG.maxRetries) {
    log('Max retries reached, pausing');
    ST.paused = true;
    ST.retries = 0;
    return;
  }
  log('Recovery attempt ' + ST.retries);
  sleep(2000);
}

function resetRetries() {
  ST.retries = 0;
}

function runCycle() {
  stage('DETECT_CAST');
  const cast = waitFor(CFG.tmplCast, 'regionCast', CFG.castTimeoutMs);
  if (!cast) {
    recovery();
    return;
  }

  stage('CAST');
  tapJitter(cast.x, cast.y);
  sleep(CFG.postCastDelayMs);

  stage('WAIT_PROMPT');
  const prompt = waitFor(CFG.tmplPrompt, 'regionPrompt', CFG.promptTimeoutMs);
  if (!prompt) {
    const pt = ocrText('regionPrompt');
    if (pt.indexOf(CFG.ocrPrompt) < 0) {
      recovery();
      return;
    }
  }

  stage('WAIT_CLICK');
  const clickOk = waitFor(CFG.tmplClick, 'regionClick', CFG.fishTimeoutMs);
  if (!clickOk) {
    const ct = ocrText('regionClick');
    if (ct.indexOf(CFG.ocrClick) < 0) {
      recovery();
      return;
    }
  }

  stage('FISHING');
  fishAction();

  stage('WAIT_COMPLETE');
  sleep(2000);
  const done = waitFor(CFG.tmplReward, 'regionReward', CFG.rewardTimeoutMs);
  if (!done) {
    const rt = ocrText('regionReward');
    if (rt.indexOf(CFG.ocrReward) < 0) {
      recovery();
      return;
    }
  }

  stage('COLLECT');
  if (done) {
    tapJitter(done.x, done.y);
  }
  sleep(CFG.postCollectDelayMs);

  resetRetries();
  stage('IDLE');
  sleep(CFG.loopDelayMs);
}

function main() {
  ST.running = true;
  ST.stop = false;
  log('Macro started');
  while (ST.running && !ST.stop) {
    if (ST.paused) {
      sleep(CFG.idleScanMs);
      continue;
    }
    runCycle();
  }
  ST.running = false;
  log('Macro stopped');
}

main();
