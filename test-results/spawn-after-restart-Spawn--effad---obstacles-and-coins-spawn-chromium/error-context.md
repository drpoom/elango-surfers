# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: spawn-after-restart.spec.ts >> Spawn After Restart >> Stage 3 - obstacles and coins spawn
- Location: tests/spawn-after-restart.spec.ts:54:3

# Error details

```
Error: page.waitForFunction: TypeError: window.__getSpawnCounts is not a function
    at eval (eval at predicate (eval at evaluate (:302:30)), <anonymous>:2:29)
    at predicate (eval at evaluate (:302:30), <anonymous>:7:23)
    at next (eval at evaluate (:302:30), <anonymous>:29:29)
    at eval (eval at evaluate (:302:30), <anonymous>:42:9)
    at UtilityScript.evaluate (<anonymous>:304:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
```