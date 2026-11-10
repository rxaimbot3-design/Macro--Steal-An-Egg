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
// --- Fishing configuration ---
var CFG_tapSpeedTps = 5
var CFG_fishMode = "tap"
var CFG_holdDurationMs = 600
var CFG_threshold = 0.85
var CFG_scanRateIdle = 1
var CFG_scanRateClick = 3
var CFG_castTimeoutMs = 15000
var CFG_promptTimeoutMs = 20000
var CFG_fishTimeoutMs = 30000
var CFG_completeTimeoutMs = 15000
var CFG_maxRetries = 3
var CFG_idleScanMs = 1000
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
var CFG_testMode = false
var CFG_strictValidation = false

// --- Auto-clicker configuration ---
var CFG_autoClickerEnabled = false
var CFG_autoClickerRepeatCount = 20
var CFG_autoClickerIntervalMs = 50
var CFG_autoClickerThreshold = 0.85
// Template names to auto-click (must match CFG_tmpl* values)
// Leave empty to disable all auto-clicking even if CFG_autoClickerEnabled is true
var CFG_autoClickerTemplates = ["cast_button", "click_perfect", "collect"]

// ============================================================================
// STATE
// ============================================================================
var ST_running = false
var ST_stop = false
var ST_stage = "IDLE"
var ST_retries = 0
var ST_cycleCount = 0
var ST_templatesValid = false
var ST_cycleSuccess = false

// Auto-clicker state (duplicate trigger prevention)
var ST_autoClickerProcessing = false
var ST_autoClickerLastTarget = ""

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
// CONFIG VALIDATION – Validates all configuration values before starting
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

    if (CFG_maxRetries < 0) {
        log("ERROR: maxRetries must be 0 or greater")
        ok = false
    }

    if (CFG_tapJitterPx < 0) {
        log("ERROR: tapJitterPx must be 0 or greater")
        ok = false
    }

    // Auto-clicker validation
    if (CFG_autoClickerRepeatCount <= 0) {
        log("ERROR: autoClickerRepeatCount must be greater than 0")
        ok = false
    }

    if (CFG_autoClickerIntervalMs <= 0) {
        log("ERROR: autoClickerIntervalMs must be greater than 0")
        ok = false
    }

    if (CFG_autoClickerThreshold < 0 || CFG_autoClickerThreshold > 1) {
        log("ERROR: autoClickerThreshold must be between 0 and 1")
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

fun fparamForFind(timeoutMs, scanRate, threshold) {
    return FParam.timeout(timeoutMs).sRate(scanRate).mScore(threshold)
}

fun findImage(templateName, rel, timeoutMs, scanRate, threshold) {
    var reg = regionFor(rel)
    return reg.find(templateName, fparamForFind(timeoutMs, scanRate, threshold))
}

fun waitForText(keyword, rel, timeoutMs) {
    var reg = regionFor(rel)
    return reg.waitText(keyword, timeoutMs)
}

fun readText(rel) {
    var t = regionFor(rel).readAsString()
    if (t == null) { return "" }
    return String(t)
}

fun textContains(text, keyword) {
    if (text == null || text == "") { return false }
    return String(text).indexOf(String(keyword)) >= 0
}

// Look up the detection region array for a given template name
fun templateRegion(name) {
    if (name == CFG_tmplCast) return CFG_regionCast
    if (name == CFG_tmplPrompt) return CFG_regionPrompt
    if (name == CFG_tmplClick) return CFG_regionClick
    if (name == CFG_tmplComplete) return CFG_regionComplete
    if (name == CFG_tmplCollect) return CFG_regionCollect
    return null
}

// ============================================================================
// STARTUP TEMPLATE VALIDATION
// Checks each template independently. Does NOT expect all gameplay-state
// images to be visible simultaneously. User should have the relevant screen
// visible when running validation for each template.
// ============================================================================
fun validateTemplates() {
    log("=== STARTUP TEMPLATE VALIDATION ===")
    log("Device: " + Env.deviceW() + "x" + Env.deviceH())
    log("Mode: " + (CFG_diagnosticMode ? "DIAGNOSTIC (no taps)" : "AUTOMATION") +
        " | TestMode: " + CFG_testMode +
        " | AutoClicker: " + CFG_autoClickerEnabled +
        " | FishMode: " + CFG_fishMode +
        " | TapSpeed: " + CFG_tapSpeedTps + " tps (measure and adjust for your device)")

    var allFound = true

    for (var i = 0; i < REQUIRED_TEMPLATES.size; i = i + 1) {
        var tpl = REQUIRED_TEMPLATES[i]
        var name = tpl[0]
        var rel = tpl[1]
        var label = tpl[2]
        var requiresTap = tpl[3]

        // Short find to check if template resource exists and is currently visible
        var reg = regionFor(rel)
        var match = reg.find(name, FParam.timeout(1500).sRate(2).mScore(CFG_threshold))

        if (match != null) {
            log("VALIDATED: " + label + " (" + name + ") found on screen (score=" + match.getScore() + ")")
        } else {
            log("NOT VISIBLE: " + label + " (" + name + ") not found on screen")
            log("  -> Capture \"" + name + "\" in Macrorify Resources -> Images")
            log("  -> Navigate to the game screen where this element appears, then re-run validation")
            allFound = false
        }
    }

    ST_templatesValid = allFound
    log("=== VALIDATION " + (allFound ? "PASSED" : "FAILED") + " ===")

    if (!allFound && CFG_strictValidation) {
        log("Strict validation enabled: stopping macro. Fix missing templates first.")
        Sys.stop()
        return false
    }
    return true
}

// ============================================================================
// DIAGNOSTIC MODE – Detect each template independently WITHOUT tapping
// User should navigate to each game screen state before running diagnostic
// ============================================================================
fun runDiagnostic() {
    log("=== DIAGNOSTIC MODE (detection only, no taps) ===")
    log("Navigate to each game screen state, then run diagnostic")

    var foundCount = 0

    for (var i = 0; i < REQUIRED_TEMPLATES.size; i = i + 1) {
        var tpl = REQUIRED_TEMPLATES[i]
        var name = tpl[0]
        var rel = tpl[1]
        var label = tpl[2]
        var requiresTap = tpl[3]

        var match = findImage(name, rel, 3000, CFG_scanRateIdle, CFG_threshold)
        if (match != null) {
            var p = match.getPoint()
            log("DETECTED: " + label + " at (" + p.getX() + "," + p.getY() + ") score=" + match.getScore())
            foundCount = foundCount + 1
        } else {
            var text = readText(rel)
            log("NOT DETECTED: " + label + " | OCR text=\"" + text + "\"")
        }
    }

    log("=== DIAGNOSTIC COMPLETE ===")
    log("Found: " + foundCount + "/" + REQUIRED_TEMPLATES.size)
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
    var match = findImage(CFG_tmplCast, CFG_regionCast, CFG_castTimeoutMs, CFG_scanRateIdle, CFG_threshold)
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
    var match = findImage(CFG_tmplPrompt, CFG_regionPrompt, CFG_promptTimeoutMs, CFG_scanRateIdle, CFG_threshold)
    if (match != null) {
        log("Fishing prompt found (image, score=" + match.getScore() + ")")
        return true
    }

    // Fallback: OCR text detection (checks repeatedly during timeout)
    var textFound = waitForText(CFG_ocrPrompt, CFG_regionPrompt, CFG_promptTimeoutMs)
    if (textFound) {
        log("Fishing prompt confirmed via OCR")
        return true
    }

    log("Fishing prompt not detected")
    return null
}

fun waitForClickIndicator() {
    stage("WAIT_CLICK")
    var match = findImage(CFG_tmplClick, CFG_regionClick, CFG_fishTimeoutMs, CFG_scanRateClick, CFG_threshold)
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
        log("Fishing: tap mode at " + CFG_tapSpeedTps + " tps (measure and adjust for your device)")
        var endTime = Sys.currentTime() + CFG_fishTimeoutMs
        var interval = intervalMs()

        while (Sys.currentTime() < endTime && ST_running && !ST_stop) {
            var m = findImage(CFG_tmplClick, CFG_regionClick, 500, CFG_scanRateClick, CFG_threshold)
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
    var match = findImage(CFG_tmplComplete, CFG_regionComplete, CFG_completeTimeoutMs, CFG_scanRateIdle, CFG_threshold)
    if (match != null) {
        log("Fishing completion detected (image, score=" + match.getScore() + ")")
        return match
    }

    // Fallback: OCR text detection (checks repeatedly during timeout)
    var textFound = waitForText(CFG_ocrComplete, CFG_regionComplete, CFG_completeTimeoutMs)
    if (textFound) {
        log("Fishing completion confirmed via OCR")
        return true
    }

    log("Completion not detected")
    return null
}

fun waitForCollect() {
    stage("COLLECT")
    var match = findImage(CFG_tmplCollect, CFG_regionCollect, CFG_completeTimeoutMs, CFG_scanRateIdle, CFG_threshold)
    if (match != null) {
        log("Collect button found (image, score=" + match.getScore() + ")")
        return match
    }
    log("Collect button not found (image required for tap target)")
    return null
}

// ============================================================================
// SINGLE FISHING CYCLE
// Returns true only if all stages completed successfully
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
    var collect = waitForCollect()
    if (collect == null) {
        log("Completion detected but Collect button not found; skipping tap")
    } else {
        tapMatch(collect)
        log("Reward collected at Collect button")
    }

    resetRetries()
    ST_cycleSuccess = true
    stage("IDLE")
    log("Cycle #" + ST_cycleCount + " complete. Next cast in " + CFG_loopDelayMs + "ms")
    wait(CFG_loopDelayMs)
    return true
}

// ============================================================================
// AUTO-CLICKER MODE
// Detects target images and clicks their center exactly N times with a fixed
// interval between clicks. Prevents duplicate triggers while processing.
// ============================================================================
fun autoClickerScan() {
    if (!CFG_autoClickerEnabled || ST_autoClickerProcessing) { return }

    // If currently processing, check if the target is still visible.
    // If not, reset processing flag to allow future triggers.
    if (ST_autoClickerProcessing) {
        var rel = templateRegion(ST_autoClickerLastTarget)
        if (rel != null) {
            var reg = regionFor(rel)
            var stillVisible = reg.find(ST_autoClickerLastTarget,
                FParam.timeout(500).sRate(2).mScore(CFG_autoClickerThreshold))
            if (stillVisible == null) {
                ST_autoClickerProcessing = false
                ST_autoClickerLastTarget = ""
                log("Auto-clicker: target no longer visible, ready for next trigger")
            }
        }
        return
    }

    // Scan each configured template for a match
    for (var i = 0; i < CFG_autoClickerTemplates.size; i = i + 1) {
        var name = CFG_autoClickerTemplates[i]
        var rel = templateRegion(name)
        if (rel == null) { continue }

        var reg = regionFor(rel)
        var match = reg.find(name,
            FParam.timeout(1000).sRate(CFG_scanRateIdle).mScore(CFG_autoClickerThreshold))

        if (match != null) {
            ST_autoClickerProcessing = true
            ST_autoClickerLastTarget = name
            log("Auto-clicker: detected " + name + ", clicking " + CFG_autoClickerRepeatCount +
                " times at " + CFG_autoClickerIntervalMs + "ms interval")

            var point = match.getPoint()
            for (var c = 0; c < CFG_autoClickerRepeatCount; c = c + 1) {
                if (!ST_running || ST_stop) { break }
                click(point, CParam.random(CFG_tapJitterPx))
                wait(CFG_autoClickerIntervalMs)
            }

            log("Auto-clicker: completed " + CFG_autoClickerRepeatCount + " clicks on " + name)
            ST_autoClickerProcessing = false
            ST_autoClickerLastTarget = ""
            return
        }
    }
}

fun runAutoClicker() {
    ST_running = true
    ST_stop = false
    ST_autoClickerProcessing = false
    ST_autoClickerLastTarget = ""

    log("Auto-clicker mode started")
    log("Repeat count: " + CFG_autoClickerRepeatCount + ", Interval: " +
        CFG_autoClickerIntervalMs + "ms, Threshold: " + CFG_autoClickerThreshold)

    while (ST_running && !ST_stop) {
        autoClickerScan()
        wait(CFG_idleScanMs)
    }

    ST_running = false
    log("Auto-clicker mode stopped")
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

    log("Steal An Egg Fishing Macro started")

    // Config validation
    if (!validateConfig()) {
        ST_running = false
        log("Macro stopped due to config validation failure")
        return
    }

    // Startup template validation
    if (!validateTemplates()) {
        ST_running = false
        log("Macro stopped due to template validation failure")
        return
    }

    // Diagnostic mode: detect without tapping, then stop
    if (CFG_diagnosticMode) {
        runDiagnostic()
        ST_running = false
        log("Diagnostic mode complete. Macro stopped.")
        return
    }

    // Auto-clicker mode: detect target images and click them repeatedly
    if (CFG_autoClickerEnabled) {
        runAutoClicker()
        return
    }

    // Test mode: stop only after one successfully completed cycle
    if (CFG_testMode) {
        log("Test mode enabled: will stop after one successful cycle")
    }

    // Main automation loop (fishing)
    while (ST_running && !ST_stop) {
        runCycle()

        if (CFG_testMode) {
            if (ST_cycleSuccess) {
                log("Test mode: completed 1 successful cycle. Stopping.")
                ST_stop = true
            } else {
                log("Test mode: cycle did not complete successfully. Retrying.")
            }
        }
    }

    ST_running = false
    log("Steal An Egg Fishing Macro stopped. Total cycles: " + ST_cycleCount)
}

main()
