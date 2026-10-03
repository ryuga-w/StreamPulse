with open(r"C:\development\StreamPulse\extension\popup\orb-visualizer.js", "r", encoding="utf-8") as f:
    c = f.read()

# 1. Skip GPU work if hidden / clientWidth == 0
target_frame = "const height = Math.max(1, Math.floor(canvas.clientHeight * dpr));"
replacement_frame = """const height = Math.max(1, Math.floor(canvas.clientHeight * dpr));

          if (width <= 2 || height <= 2 || canvas.offsetParent === null) {
            // Tab is hidden / inactive: 0% GPU overhead, do not render hidden canvas
            if (!stopped) {
              animationFrame = requestAnimationFrame(frame);
            }
            return;
          }"""

c = c.replace(target_frame, replacement_frame)

# 2. Expose start / stop on liquidOrb
old_obj = 'Object.defineProperty(window, "liquidOrb", {\n\n      value: Object.freeze({\n\n        getState: () => state,\n\n        setState,\n\n      }),\n\n    });'
new_obj = """    function stopLoop() {
      if (stopped) return;
      stopped = true;
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }
    }

    function startLoop() {
      if (!stopped && animationFrame) return;
      stopped = false;
      lastFrameAt = performance.now();
      if (!animationFrame) {
        animationFrame = requestAnimationFrame(frame);
      }
    }

    Object.defineProperty(window, "liquidOrb", {
      value: Object.freeze({
        getState: () => state,
        setState,
        start: startLoop,
        stop: stopLoop,
        pause: stopLoop,
        resume: startLoop
      }),
    });"""

if old_obj in c:
    c = c.replace(old_obj, new_obj)
else:
    # Try normalizing newlines
    import re
    c = re.sub(r'Object\.defineProperty\(window,\s*"liquidOrb",\s*\{\s*value:\s*Object\.freeze\(\{\s*getState:\s*\(\)\s*=>\s*state,\s*setState,\s*\}\),\s*\}\);', new_obj, c)

with open(r"C:\development\StreamPulse\extension\popup\orb-visualizer.js", "w", encoding="utf-8") as f:
    f.write(c)

print("Successfully injected zero-cost idle and start/stop controls into orb-visualizer.js!")