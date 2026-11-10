// ============================================================================
// Steal An Egg – Fully Automatic Fishing Macro for Macrorify (EMScript)
// ============================================================================
//
// No root, no Delta, no executor, no PC required. Works directly over Roblox
// on Android. Uses image detection and OCR instead of fixed timing.
//
// REQUIRED: Capture 5 image templates in Macrorify -> Resources -> Images:
//   cast_button   (idle fishing rod / Cast button – tap target)
//   prompt        (fishing prompt after casting – detection only)
//   click_perfect (Click Fast / Perfect indicator – tap target)
//   complete      (fishing completion banner/screen – detection only)
//   collect       (Collect reward button – tap target)
//
// Template names are referenced by name (NO file extension) in config below.
//
// ============================================================================

// ============================================================================
// CONFIGURATION – Edit these values to match your device and game UI
// ============================================================================
var CFG_tapSpeedTps = 5
var CFG_fishMode = "tap"
var CFG_holdDurationMs = 600
var CFG_threshold = 0.85
var CFG_scanRateIdle = 1
var CFG_scanRateClick = 3
var CFG_castTimeoutMs = 15000
var CFG_promptTimeoutMs = 15000
var CFG_fishTimeoutMs = 30000
var CFG_completeTimeoutMs = 15000
var CFG_ocrShortTimeoutMs = 3000
var CFG_maxRetries = 3
var CFG_tapJitterPx = 0
var CFG_postCastDelayMs = 1500
var CFG_postCollectDelayMs = 1500
var CFG_loopDelayMs = 1000

var CFG_regionCast = [0.25, 0.55, 0.95, 0.98]
var CFG_regionPrompt = [0.10, 0.25, 0.90, 0.85]
var CFG_regionClick = [0.20, 0.30, 0.80, 0.75]
var CFG_regionComplete = [0.10, 0.10, 0.90, 0.90]
var CFG_regionCollect = [0.10, 0.10, 0.90, 0.90]

var CFG_tmplCast = "cast_button"
var CFG_tmplPrompt = "prompt"
var CFG_tmplClick = "click_perfect"
var CFG_tmplComplete = "complete"
var CFG_tmplCollect = "collect"

var CFG_ocrPrompt = "FISH"
var CFG_ocrComplete = "COMPLETE"

var CFG_diagnosticMode = false
var CFG_diagnosticTemplate = ""
var CFG_testMode = false
var CFG_testMaxAttempts = 10
var CFG_strictValidation = false

// ============================================================================
// STATE
// ============================================================================
var ST_running = false
var ST_stop = false
var ST_stage = "IDLE"
var ST_retries = 0
var ST_cycleCount = 0
var ST_cycleSuccess = false
var ST_testAttempts = 0

// Required templates: [name, regionArray, label, requiresTap]
// Each template is validated independently. Not all screens are visible at once.
var REQUIRED_TEMPLATES = [
    [CFG_tmplCast, CFG_regionCast, "Cast button", true],
    [CFG_tmplPrompt, CFG_regionPrompt, "Fishing prompt", false],
    [CFG_tmplClick, CFG_regionClick, "Click/Perfect indicator", true],
    [CFG_tmplComplete, CFG_regionComplete, "Fishing completion", false],
    [CFG_tmplCollect, CFG_regionCollect, "Collect button", true]
]

// ============================================================================
// LOGGING – Every state transition is logged with a clear prefix
// ============================================================================
fun log(msg) {
    Sys.toast("[StealAnEgg] " + msg)
    Sys.log("[StealAnEgg] " + msg)
}

fun stage(name) {
    ST_stage = name
    log("STATE: " + name)
}

// ============================================================================
// CONFIG VALIDATION – Validates ONLY configuration values.
// Does NOT check visual template visibility. An invisible UI element is NOT
// treated as a missing image resource here; that is handled by diagnostic mode.
// Resource existence cannot be distinguished from visibility through screen
// matching alone: a template not found on the current screen may simply mean
// the user is on a different fishing stage, not that the image is missing.
// ============================================================================
fun validateConfig() {
    log("=== CONFIG VALIDATION ===")

    var ok = true

    if (CFG_tapSpeedTps <= 0) {
        log("ERROR: tapSpeedTps must be greater than 0")
        ok = false
    }

    if (CFG_fishMode != "tap" && CFG_fishMode != "hold") {
        log("ERROR: fishMode must be 'tap' or 'hold'")
        ok = false
    }

    if (CFG_threshold < 0 || CFG_threshold > 1) {
        log("ERROR: threshold must be between 0 and 1")
        ok = false
    }

    if (CFG_scanRateIdle <= 0) {
        log("ERROR: scanRateIdle must be greater than 0")
        ok = false
    }

    if (CFG_scanRateClick <= 0) {
        log("ERROR: scanRateClick must be greater than 0")
        ok = false
    }

    if (CFG_castTimeoutMs <= 0 || CFG_promptTimeoutMs <= 0 || CFG_fishTimeoutMs <= 0 || CFG_completeTimeoutMs <= 0) {
        log("ERROR: All timeouts must be greater than 0")
        ok = false
    }

    if (CFG_ocrShortTimeoutMs <= 0) {
        log("ERROR: ocrShortTimeoutMs must be greater than 0")
        ok = false
    }

    if (CFG_maxRetries < 0) {
        log("ERROR: maxRetries must be 0 or greater")
        ok = false
    }

    if (CFG_testMaxAttempts < 0) {
        log("ERROR: testMaxAttempts must be 0 or greater")
        ok = false
    }

    if (CFG_tapJitterPx < 0) {
        log("ERROR: tapJitterPx must be 0 or greater")
        ok = false
    }

    // Validate regions: each must be an array of 4 numbers between 0 and 1
    var regions = [CFG_regionCast, CFG_regionPrompt, CFG_regionClick, CFG_regionComplete, CFG_regionCollect]
    var regionNames = ["CFG_regionCast", "CFG_regionPrompt", "CFG_regionClick", "CFG_regionComplete", "CFG_regionCollect"]

    for (var i = 0; i < regions.size; i = i + 1) {
        var r = regions[i]
        var rn = regionNames[i]
        if (r == null || r.size != 4) {
            log("ERROR: " + rn + " must be an array of 4 numbers [left, top, right, bottom]")
            ok = false
        } else {
            for (var j = 0; j < 4; j = j + 1) {
                if (r[j] < 0 || r[j] > 1) {
                    log("ERROR: " + rn + " values must be between 0 and 1")
                    ok = false
                }
            }
        }
    }

    // Validate template names are non-empty strings
    var tmpls = [CFG_tmplCast, CFG_tmplPrompt, CFG_tmplClick, CFG_tmplComplete, CFG_tmplCollect]
    var tmplNames = ["CFG_tmplCast", "CFG_tmplPrompt", "CFG_tmplClick", "CFG_tmplComplete", "CFG_tmplCollect"]

    for (var i = 0; i < tmpls.size; i = i + 1) {
        if (tmpls[i] == null || String(tmpls[i]).length == 0) {
            log("ERROR: " + tmplNames[i] + " must be a non-empty string")
            ok = false
        }
    }

    log("=== CONFIG " + (ok ? "VALID" : "INVALID") + " ===")
    return ok
}

// ============================================================================
// REGION & DETECTION HELPERS
// rel is [left, top, right, bottom] in 0.0–1.0 relative coordinates
// Device-pixel coordinates are passed with .noScale() to prevent auto-scaling.
// ============================================================================
fun regionFor(rel) {
    var w = Env.deviceW()
    var h = Env.deviceH()
    var left = Math.round(rel[0] * w)
    var top = Math.round(rel[1] * h)
    var right = Math.round(rel[2] * w)
    var bottom = Math.round(rel[3] * h)
    var width = right - left
    var height = bottom - top
    if (width < 1) { width = 1 }
    if (height < 1) { height = 1 }

    var reg = Region(left, top, width, height)
    reg.noScale()
    return reg
}

fun fparamForFind(timeoutMs, scanRate) {
    return FParam(timeoutMs, scanRate, CFG_threshold)
}

fun findImage(templateName, rel, timeoutMs, scanRate) {
    var reg = regionFor(rel)
    return reg.find(templateName, fparamForFind(timeoutMs, scanRate))
}

// OCR text detection for APPEARING text.
// Uses Region.findText() (text appearing), NOT Region.waitText() (text disappearing).
// TParam signature: TParam(timeout, sRate, mScore, scale, mode, whitelist, blacklist, case)
fun findTextOCR(keyword, rel, timeoutMs, scanRate) {
    var reg = regionFor(rel)
    var tparam = TParam(timeoutMs, scanRate, CFG_threshold)
    var results = reg.findText(keyword, tparam)
    if (results != null && results.size > 0) {
        return true
    }
    return false
}

// Read all OCR text from a region.
// readAsString() takes no parameters per official API.
fun readText(rel) {
    var t = regionFor(rel).readAsString()
    if (t == null) { return "" }
    return String(t)
}

fun textContains(text, keyword) {
    if (text == null || text == "") { return false }
    return String(text).indexOf(String(keyword)) >= 0
}

// ============================================================================
// STARTUP TEMPLATE VALIDATION – INFORMATIONAL ONLY.
// Does NOT stop the macro. A template not visible on the current screen is
// NOT treated as missing; the user may be on a different fishing stage.
// Strict validation is informational and never fails startup based on
// the currently visible game screen.
// ============================================================================
fun validateTemplates() {
    log("=== STARTUP TEMPLATE CHECK (informational) ===")
    log("Device: " + Env.deviceW() + "x" + Env.deviceH())
    log("Note: Templates are checked against the CURRENT screen only.")
    log("Not all fishing-stage templates are visible simultaneously.")
    log("A template not found on screen does NOT mean the image resource is missing.")
    log("It may simply mean the user is on a different game stage.")

    var foundCount = 0

    for (var i = 0; i < REQUIRED_TEMPLATES.size; i = i + 1) {
        var tpl = REQUIRED_TEMPLATES[i]
        var name = tpl[0]
        var rel = tpl[1]
        var label = tpl[2]

        // Short find to check if template is visible on the current screen
        var reg = regionFor(rel)
        var match = reg.find(name, FParam(1500, 2, CFG_threshold))

        if (match != null) {
            log("VISIBLE: " + label + " (" + name + ") on current screen (score=" + match.getScore() + ")")
            foundCount = foundCount + 1
        } else {
            log("NOT ON SCREEN: " + label + " (" + name + ")")
            log("  -> Navigate to the stage where this appears, or use Diagnostic Mode")
        }
    }

    log("=== TEMPLATE CHECK: " + foundCount + "/" + REQUIRED_TEMPLATES.size + " visible on current screen ===")
    return true // Always returns true; template visibility is informational, not a gate
}

// ============================================================================
// DIAGNOSTIC MODE – Detect one selected template at a time, WITHOUT tapping.
// If CFG_diagnosticTemplate is set to a template name, only that template is
// tested. Otherwise all templates are tested one at a time.
// User navigates between fishing stages manually. Never assumes all templates
// are visible simultaneously. Never taps anything.
// ============================================================================
fun runDiagnostic() {
    log("=== DIAGNOSTIC MODE (detection only, no taps) ===")
    log("Do NOT tap anything; this mode only detects.")
    log("Navigate to the game screen where the target element appears.")

    var foundCount = 0
    var testedCount = 0

    for (var i = 0; i < REQUIRED_TEMPLATES.size; i = i + 1) {
        var tpl = REQUIRED_TEMPLATES[i]
        var name = tpl[0]
        var rel = tpl[1]
        var label = tpl[2]

        // If a specific diagnostic template is configured, skip all others
        if (CFG_diagnosticTemplate != "" && String(CFG_diagnosticTemplate) != String(name)) {
            continue
        }

        testedCount = testedCount + 1

        log("=== LOOKING FOR: " + label + " (" + name + ") ===")
        log("Navigate to the game screen where this element appears now.")

        var reg = regionFor(rel)
        var match = reg.find(name, FParam(5000, CFG_scanRateIdle, CFG_threshold))

        if (match != null) {
            var p = match.getPoint()
            log("DETECTED: " + label + " at (" + p.getX() + "," + p.getY() + ") score=" + match.getScore())
            foundCount = foundCount + 1
        } else {
            log("NOT DETECTED: " + label + " within 5000ms timeout.")
        }

        // Small pause between template checks so user can navigate
        wait(1000)
    }

    log("=== DIAGNOSTIC COMPLETE ===")
    log("Found: " + foundCount + "/" + testedCount + " tested")
}

// ============================================================================
// ACTION HELPERS
// ============================================================================
fun tapMatch(match) {
    click(match.getPoint(), CParam.random(CFG_tapJitterPx))
}

fun holdPoint(point) {
    click(point, CParam.hold(CFG_holdDurationMs))
}

fun intervalMs() {
    // Returns the target interval between taps. This is a configuration value;
    // the actual achievable TPS must be measured on the target device.
    return Math.round(1000 / CFG_tapSpeedTps)
}

fun recovery() {
    ST_retries = ST_retries + 1
    if (ST_retries > CFG_maxRetries) {
        log("Max retries reached (" + CFG_maxRetries + "), continuing to next cycle")
        ST_retries = 0
        return
    }
    log("Recovery attempt " + ST_retries + "/" + CFG_maxRetries)
    wait(2000)
}

fun resetRetries() {
    ST_retries = 0
}

// ============================================================================
// FISHING STATE MACHINE STAGES
// ============================================================================
fun waitForCast() {
    stage("DETECT_CAST")
    var match = findImage(CFG_tmplCast, CFG_regionCast, CFG_castTimeoutMs, CFG_scanRateIdle)
    if (match == null) {
        log("Cast button not found within timeout (" + CFG_castTimeoutMs + "ms)")
        return null
    }
    log("Cast button found (score=" + match.getScore() + ")")
    return match
}

fun waitForPrompt() {
    stage("WAIT_PROMPT")

    // Primary: image detection (checks repeatedly during timeout)
    var match = findImage(CFG_tmplPrompt, CFG_regionPrompt, CFG_promptTimeoutMs, CFG_scanRateIdle)
    if (match != null) {
        log("Fishing prompt found (image, score=" + match.getScore() + ")")
        return true
    }

    // Fallback: OCR text detection with a SHORT timeout (not stacked sequentially)
    log("Prompt image not found; trying OCR for short window (" + CFG_ocrShortTimeoutMs + "ms)")
    var textFound = findTextOCR(CFG_ocrPrompt, CFG_regionPrompt, CFG_ocrShortTimeoutMs, CFG_scanRateIdle)
    if (textFound) {
        log("Fishing prompt confirmed via OCR")
        return true
    }

    log("Fishing prompt not detected")
    return null
}

fun waitForClickIndicator() {
    stage("WAIT_CLICK")
    var match = findImage(CFG_tmplClick, CFG_regionClick, CFG_fishTimeoutMs, CFG_scanRateClick)
    if (match != null) {
        log("Click/Perfect indicator found (image, score=" + match.getScore() + ")")
        return match
    }
    log("Click indicator not detected within timeout (image required for tap target)")
    return null
}

fun performFishing(clickMatch) {
    stage("FISHING")
    var point = clickMatch.getPoint()

    if (CFG_fishMode == "hold") {
        log("Fishing: hold mode for " + CFG_holdDurationMs + "ms")
        holdPoint(point)
    } else {
        log("Fishing: tap mode at configured " + CFG_tapSpeedTps + " tps (measure actual TPS on your device)")
        var endTime = Sys.currentTime() + CFG_fishTimeoutMs
        var interval = intervalMs()

        while (Sys.currentTime() < endTime && ST_running && !ST_stop) {
            // Keep tapping dependent on successful image detection each iteration
            var m = findImage(CFG_tmplClick, CFG_regionClick, 500, CFG_scanRateClick)
            if (m == null) {
                log("Click indicator lost during tap sequence")
                break
            }
            tapMatch(m)
            wait(interval)
        }
        log("Fishing tap sequence finished")
    }
}

fun waitForComplete() {
    stage("WAIT_COMPLETE")
    wait(1000)

    // Primary: image detection of completion banner/screen (detection only, no tap)
    var match = findImage(CFG_tmplComplete, CFG_regionComplete, CFG_completeTimeoutMs, CFG_scanRateIdle)
    if (match != null) {
        log("Fishing completion detected (image, score=" + match.getScore() + ")")
        return match
    }

    // Fallback: OCR text detection with a SHORT timeout (not stacked sequentially)
    log("Completion image not found; trying OCR for short window (" + CFG_ocrShortTimeoutMs + "ms)")
    var textFound = findTextOCR(CFG_ocrComplete, CFG_regionComplete, CFG_ocrShortTimeoutMs, CFG_scanRateIdle)
    if (textFound) {
        log("Fishing completion confirmed via OCR")
        return true
    }

    log("Completion not detected")
    return null
}

fun waitForCollect() {
    stage("COLLECT")
    var match = findImage(CFG_tmplCollect, CFG_regionCollect, CFG_completeTimeoutMs, CFG_scanRateIdle)
    if (match != null) {
        log("Collect button found (image, score=" + match.getScore() + ")")
        return match
    }
    log("Collect button not found (image required for tap target)")
    return null
}

// Verify that the Collect UI has disappeared after tapping Collect.
// Returns true if Collect button is no longer visible (collection likely succeeded),
// false if Collect button is still visible (collection may have failed).
fun verifyCollectCollected() {
    stage("VERIFY_COLLECT")
    wait(1000)

    var reg = regionFor(CFG_regionCollect)
    var stillVisible = reg.find(CFG_tmplCollect, FParam(2000, 2, CFG_threshold))

    if (stillVisible == null) {
        log("Collect verification: Collect button no longer visible. Collection confirmed.")
        return true
    } else {
        log("Collect verification: Collect button still visible. Collection may have failed.")
        return false
    }
}

// ============================================================================
// SINGLE FISHING CYCLE
// A cycle is successful ONLY when ALL required stages succeed, including
// reward collection AND collect verification. Unsuccessful cycles are retried safely.
// runCycle() MUST return false if the Collect button is missing.
// ST_cycleSuccess MUST NOT be true unless all required stages AND collect verification succeeded.
// ============================================================================
fun runCycle() {
    ST_cycleCount = ST_cycleCount + 1
    ST_cycleSuccess = false
    log("=== CYCLE #" + ST_cycleCount + " ===")

    if (!ST_running || ST_stop) { return false }

    // Stage 1: Detect cast button
    var cast = waitForCast()
    if (cast == null) { recovery(); return false }
    if (CFG_diagnosticMode) { log("Diagnostic: would tap cast button"); return true }
    tapMatch(cast)
    wait(CFG_postCastDelayMs)

    if (!ST_running || ST_stop) { return false }

    // Stage 2: Wait for fishing prompt
    var prompt = waitForPrompt()
    if (prompt == null) { recovery(); return false }

    if (!ST_running || ST_stop) { return false }

    // Stage 3: Wait for Click/Perfect indicator
    var clickInd = waitForClickIndicator()
    if (clickInd == null) { recovery(); return false }

    if (!ST_running || ST_stop) { return false }

    // Stage 4: Fishing action (tap or hold)
    performFishing(clickInd)

    if (!ST_running || ST_stop) { return false }

    // Stage 5: Wait for completion (detection only, separate from Collect)
    var complete = waitForComplete()
    if (complete == null) { recovery(); return false }

    if (!ST_running || ST_stop) { return false }

    // Stage 6: Collect reward (separate tap target from completion detection)
    // Cycle is NOT successful if reward collection fails
    var collect = waitForCollect()
    if (collect == null) {
        log("CYCLE FAILED: Completion detected but Collect button not found")
        recovery()
        return false
    }
    tapMatch(collect)
    log("Reward collected at Collect button")

    // Stage 7: Verify collection actually happened (Collect UI disappeared)
    if (!verifyCollectCollected()) {
        log("CYCLE FAILED: Collect verification failed")
        recovery()
        return false
    }

    resetRetries()
    ST_cycleSuccess = true
    stage("IDLE")
    log("Cycle #" + ST_cycleCount + " complete. Next cast in " + CFG_loopDelayMs + "ms")
    wait(CFG_loopDelayMs)
    return true
}

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================
fun main() {
    ST_running = true
    ST_stop = false
    ST_retries = 0
    ST_cycleCount = 0
    ST_cycleSuccess = false
    ST_testAttempts = 0

    log("Steal An Egg Fishing Macro started")

    // Config validation only (no visual template check at startup)
    if (!validateConfig()) {
        ST_running = false
        log("Macro stopped due to config validation failure")
        return
    }

    // Informational template check (never stops the macro)
    validateTemplates()

    // Diagnostic mode: detect without tapping, then stop
    if (CFG_diagnosticMode) {
        runDiagnostic()
        ST_running = false
        log("Diagnostic mode complete. Macro stopped.")
        return
    }

    // Main automation loop
    while (ST_running && !ST_stop) {
        runCycle()

        // Test mode: stop only after one successfully completed cycle,
        // or stop safely after CFG_testMaxAttempts unsuccessful attempts.
        // Retry counter is only reset after a genuinely successful cycle.
        if (CFG_testMode) {
            if (ST_cycleSuccess) {
                log("Test mode: completed 1 successful cycle. Stopping.")
                ST_stop = true
                ST_testAttempts = 0
            } else {
                ST_testAttempts = ST_testAttempts + 1
                if (CFG_testMaxAttempts > 0 && ST_testAttempts >= CFG_testMaxAttempts) {
                    log("Test mode: max attempts reached (" + CFG_testMaxAttempts + "). Stopping safely.")
                    ST_stop = true
                } else {
                    log("Test mode: cycle did not complete successfully. Retrying safely.")
                }
            }
        }
    }

    ST_running = false
    log("Steal An Egg Fishing Macro stopped. Total cycles: " + ST_cycleCount)
}

main()
