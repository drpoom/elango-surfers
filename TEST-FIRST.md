# 🛑 STOP - Read Before Pushing Test Fixes

## The Problem
We've been pushing to GitHub **before testing locally**, causing:
- Multiple failed CI cycles (v5.2.2 → v5.2.9 = 8 failed runs!)
- Wasted GitHub Actions minutes
- Wasted time waiting for CI to fail
- Frustration for Uncle John

## The Solution: **TEST FIRST, PUSH SECOND**

### ✅ Correct Workflow

```
┌─────────────┐
│ Byte fixes  │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ 🔍 SCOUT TESTS  │ ← MANDATORY, NON-NEGOTIABLE
│ npm run test:ci │
└──────┬──────────┘
       │
       ├─────❌ Fail ─→ Back to Byte, repeat
       │
       ▼
    ✅ Pass
       │
       ▼
┌──────────────────┐
│ Scout approves   │
│ "Tests pass ✅"  │
└──────┬───────────┘
       │
       ▼
┌──────────────┐
│ Mickey pushes│ ← ONLY AFTER SCOUT APPROVAL
│ to GitHub    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ CI runs      │
│ (should pass)│
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Deploy to    │
│ gh-pages     │
└──────────────┘
```

### ❌ Wrong Workflow (What We've Been Doing)

```
Byte fixes → Mickey pushes → CI fails → Repeat ×8
```

## Technical Enforcement

### Pre-commit Hook
A git hook now blocks test-related commits without Scout approval:

```bash
# Scout: After testing locally and confirming pass:
touch .scout-approved
git commit  # Now allowed
```

### What Scout Must Do

1. **Byte commits fix** (commit is local, not pushed)
2. **Scout runs**: `npm run test:ci`
3. **If tests pass**:
   ```bash
   touch .scout-approved
   # Mickey can now push
   ```
4. **If tests fail**: Tell Byte to fix, repeat from step 1

## Today's Violations (Lessons Learned)

| Version | What Happened | Should Have Done |
|---------|---------------|------------------|
| v5.2.7 | Pushed debug logging | Scout test first |
| v5.2.8 | Pushed willSpawn expose | Scout test first |
| v5.2.9 | Pushed test update | Scout test first |

**Result**: 3 pushes, 3 CI failures, 0 deployments, wasted time.

## Remember

> **"Test locally, push once"** - The CI Protocol Motto

**Scout's duty**: Block pushes until tests pass locally.
**Mickey's duty**: Never push without Scout approval.
**Byte's duty**: Fix issues quickly when Scout reports failures.

---

**Questions?** Re-read this file before your next test fix.
