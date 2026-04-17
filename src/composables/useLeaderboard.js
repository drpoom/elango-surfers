/**
 * useLeaderboard — Global leaderboard with Supabase sync + localStorage fallback
 * 
 * Flow:
 * - On load: fetch top 100 from Supabase → merge with localStorage
 * - On game over (high score): show name entry → submit to Supabase + localStorage
 * - Offline fallback: localStorage-only, auto-retry sync on next game
 * 
 * Anti-cheat: client-side score hash (sha256 of score + salt)
 * This stops casual DevTools editing but isn't bulletproof — add Edge Function for server validation later.
 */

import { ref, computed, watch, nextTick } from 'vue'

const SUPABASE_URL = 'https://cvlkionugmfcclrabpef.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_UnOZpxUy6Nc_b36o2xvL1w_xu4fMsi7'
const HASH_SALT = 'elango-waves-2024' // client-side salt (obfuscated, not truly secret)
const MAX_LEADERBOARD = 100
const SYNC_COOLDOWN_MS = 15000 // 15s between sync attempts

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export function useLeaderboard({ VERSION, score, highScore }) {
  const LEADERBOARD_KEY = 'elangoSurfersLeaderboard';
  const LEADERBOARD_VERSION_KEY = 'elangoSurfersLBVersion';
  const PENDING_KEY = 'elangoSurfersPendingScores';
  const leaderboard = ref([]);
  const playerName = ref('');
  const showNameEntry = ref(false);
  const syncStatus = ref('idle'); // 'idle' | 'syncing' | 'error'
  let lastSyncAttempt = 0;

  // --- Local Storage ---

  const loadLocal = () => {
    const storedVersion = localStorage.getItem(LEADERBOARD_VERSION_KEY);
    if (storedVersion !== VERSION) {
      localStorage.removeItem(LEADERBOARD_KEY);
      localStorage.setItem(LEADERBOARD_VERSION_KEY, VERSION);
      return [];
    }
    const saved = localStorage.getItem(LEADERBOARD_KEY);
    return saved ? JSON.parse(saved) : [];
  };

  const saveLocal = (entries) => {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries.slice(0, MAX_LEADERBOARD)));
  };

  // --- Pending scores (offline queue) ---

  const loadPending = () => {
    try { return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]'); } catch { return []; }
  };

  const savePending = (pending) => {
    localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  };

  // --- Supabase API ---

  const supabaseHeaders = () => ({
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Prefer': 'return=representation',
  });

  const fetchGlobal = async () => {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/scores?select=name,score,created_at&order=score.desc,created_at.asc&limit=${MAX_LEADERBOARD}`,
        { headers: supabaseHeaders() }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rows = await res.json();
      return rows.map(r => ({ name: r.name, score: r.score, date: new Date(r.created_at).toLocaleDateString() }));
    } catch (err) {
      console.warn('[Leaderboard] Fetch failed, using local:', err.message);
      return null;
    }
  };

  const submitGlobal = async (name, scoreVal, hash) => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/scores`, {
        method: 'POST',
        headers: supabaseHeaders(),
        body: JSON.stringify({ name, score: scoreVal, hash }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return true;
    } catch (err) {
      console.warn('[Leaderboard] Submit failed:', err.message);
      return false;
    }
  };

  // --- Merge global + local, dedup by (name, score, approximate date) ---

  const mergeLeaderboards = (globalEntries, localEntries) => {
    if (!globalEntries) return localEntries;
    const seen = new Set();
    const merged = [];
    const addEntry = (e) => {
      const key = `${e.name}:${e.score}:${e.date}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(e);
      }
    };
    // Add all global entries first (they're authoritative)
    globalEntries.forEach(addEntry);
    // Then add any local-only entries
    localEntries.forEach(addEntry);
    merged.sort((a, b) => b.score - a.score);
    return merged.slice(0, MAX_LEADERBOARD);
  };

  // --- Public API ---

  const loadLeaderboard = async () => {
    const local = loadLocal();
    const global = await fetchGlobal();
    leaderboard.value = mergeLeaderboards(global, local);
    saveLocal(leaderboard.value);

    // Flush pending scores from offline queue
    await flushPending();
  };

  const flushPending = async () => {
    const pending = loadPending();
    if (pending.length === 0) return;
    const stillPending = [];
    for (const entry of pending) {
      const hash = await sha256(`${entry.score}:${HASH_SALT}`);
      const ok = await submitGlobal(entry.name, entry.score, hash);
      if (!ok) stillPending.push(entry);
    }
    savePending(stillPending);
    if (stillPending.length < pending.length) {
      // Some synced — refresh leaderboard
      const global = await fetchGlobal();
      const local = loadLocal();
      leaderboard.value = mergeLeaderboards(global, local);
      saveLocal(leaderboard.value);
    }
  };

  const submitScore = async () => {
    const name = playerName.value.trim().toUpperCase();
    if (name.length < 1) return;
    const truncatedName = name.substring(0, 3);
    const scoreVal = score.value;

    // Compute anti-cheat hash
    const hash = await sha256(`${scoreVal}:${HASH_SALT}`);

    // Save locally immediately
    const entry = { name: truncatedName, score: scoreVal, date: new Date().toLocaleDateString() };
    const local = loadLocal();
    local.push(entry);
    local.sort((a, b) => b.score - a.score);
    saveLocal(local.slice(0, MAX_LEADERBOARD));

    // Submit to Supabase
    const now = Date.now();
    if (now - lastSyncAttempt >= SYNC_COOLDOWN_MS) {
      lastSyncAttempt = now;
      syncStatus.value = 'syncing';
      const ok = await submitGlobal(truncatedName, scoreVal, hash);
      syncStatus.value = ok ? 'idle' : 'error';
      
      if (ok) {
        // Refresh from global
        const global = await fetchGlobal();
        leaderboard.value = mergeLeaderboards(global, loadLocal());
        saveLocal(leaderboard.value);
      } else {
        // Queue for later sync
        const pending = loadPending();
        pending.push(entry);
        savePending(pending);
        leaderboard.value = mergeLeaderboards(null, loadLocal());
      }
    } else {
      // Rate limited — queue it
      const pending = loadPending();
      pending.push(entry);
      savePending(pending);
      leaderboard.value = mergeLeaderboards(null, local);
    }

    showNameEntry.value = false;
    playerName.value = '';
  };

  const isHighScore = computed(() => {
    return score.value > 0 && score.value >= highScore.value;
  });

  watch(showNameEntry, (val) => {
    if (val) {
      nextTick(() => {
        const input = document.getElementById('name-input');
        if (input) input.focus();
      });
    }
  });

  return {
    leaderboard,
    playerName,
    showNameEntry,
    isHighScore,
    submitScore,
    loadLeaderboard,
    syncStatus,
  };
}