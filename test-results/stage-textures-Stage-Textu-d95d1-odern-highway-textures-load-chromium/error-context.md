# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: stage-textures.spec.ts >> Stage Texture Verification >> Stage 1: Modern highway textures load
- Location: tests/stage-textures.spec.ts:6:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: page.waitForFunction: TypeError: window.__getRoadMesh is not a function
    at eval (eval at predicate (eval at evaluate (:302:30)), <anonymous>:2:27)
    at predicate (eval at evaluate (:302:30), <anonymous>:7:23)
    at next (eval at evaluate (:302:30), <anonymous>:29:29)
    at eval (eval at evaluate (:302:30), <anonymous>:42:9)
    at UtilityScript.evaluate (<anonymous>:304:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
```

```
Tearing down "context" exceeded the test timeout of 60000ms.
```