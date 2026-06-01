/**
 * useLeaderboard.ts — Global leaderboard with Supabase sync + localStorage fallback
 */

import { ref, computed, watch, nextTick, type Ref, type ComputedRef } from 'vue'

const SUPABASE_URL: string = 'https://cvlkionugmfcclrabpef.supabase.co'
const SUPABASE_ANON_KEY: string = 'sb_publishable_UnOZpxUy6Nc_b36o2xvL1w_xu4fMsi7'
const HASH_SALT: string = 'elango-waves-2024'
const MAX_LEADERBOARD: number = 100
const SYNC_COOLDOWN_MS: number = 15000

async function sha256(str: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
}

export interface UseLeaderboardParams {
  VERSION: string;
  score: Ref<number>;
  highScore: Ref<number>;
}

export interface UseLeaderboardReturn {
  leaderboard: Ref<LeaderboardEntry[]>;
  playerName: Ref<string>;
  showNameEntry: Ref<boolean>;
  isHighScore: ComputedRef<boolean>;
  submitScore: () => Promise<void>;
  loadLeaderboard: () => Promise<void>;
  syncStatus: Ref<string>;
}

export function useLeaderboard({ VERSION, score, highScore }: UseLeaderboardParams): UseLeaderboardReturn {
  const LEADERBOARD_KEY: string = 'elangoSurfersLeaderboard';
  const LEADERBOARD_VERSION_KEY: string = 'elangoSurfersLBVersion';
  const PENDING_KEY: string = 'elangoSurfersPendingScores';
  const leaderboard: Ref<LeaderboardEntry[]> = ref([]);
  const playerName: Ref<string> = ref('');
  const showNameEntry: Ref<boolean> = ref(false);
  const syncStatus: Ref<string> = ref('idle');
  let lastSyncAttempt: number = 0;

  const loadLocal = (): LeaderboardEntry[] => {
    const storedVersion = localStorage.getItem(LEADERBOARD_VERSION_KEY);
    if (storedVersion !== VERSION) {
      localStorage.removeItem(LEADERBOARD_KEY);
      localStorage.setItem(LEADERBOARD_VERSION_KEY, VERSION);
      return [];
    }
    const saved = localStorage.getItem(LEADERBOARD_KEY);
    return saved ? JSON.parse(saved) : [];
  };

  const saveLocal = (entries: LeaderboardEntry[]): void => {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries.slice(0, MAX_LEADERBOARD)));
  };

  const loadPending = (): LeaderboardEntry[] => {
    try { return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]'); } catch { return []; }
  };

  const savePending = (pending: LeaderboardEntry[]): void => {
    localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  };

  const supabaseHeaders = (): Record<string, string> => ({
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Prefer': 'return=representation',
  });

  const fetchGlobal = async (): Promise<LeaderboardEntry[] | null> => {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/scores?select=name,score,created_at&game_version=eq.${encodeURIComponent(VERSION)}&order=score.desc,created_at.asc&limit=${MAX_LEADERBOARD}`,
        { headers: supabaseHeaders() }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rows = await res.json();
      return rows.map((r: any) => ({ name: r.name, score: r.score, date: new Date(r.created_at).toLocaleDateString() }));
    } catch (err: any) {
      console.warn('[Leaderboard] Fetch failed, using local:', err?.message);
      return null;
    }
  };

  const submitGlobal = async (name: string, scoreVal: number, hash: string): Promise<boolean> => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/scores`, {
        method: 'POST',
        headers: supabaseHeaders(),
        body: JSON.stringify({ name, score: scoreVal, hash, game_version: VERSION }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return true;
    } catch (err: any) {
      console.warn('[Leaderboard] Submit failed:', err?.message);
      return false;
    }
  };

  const mergeLeaderboards = (globalEntries: LeaderboardEntry[] | null, localEntries: LeaderboardEntry[]): LeaderboardEntry[] => {
    if (!globalEntries) return localEntries;
    const seen = new Set<string>();
    const merged: LeaderboardEntry[] = [];
    const addEntry = (e: LeaderboardEntry): void => {
      const key = `${e.name}:${e.score}:${e.date}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(e);
      }
    };
    globalEntries.forEach(addEntry);
    localEntries.forEach(addEntry);
    merged.sort((a, b) => b.score - a.score);
    return merged.slice(0, MAX_LEADERBOARD);
  };

  const loadLeaderboard = async (): Promise<void> => {
    const local = loadLocal();
    const global = await fetchGlobal();
    leaderboard.value = mergeLeaderboards(global, local);
    saveLocal(leaderboard.value);
    await flushPending();
  };

  const flushPending = async (): Promise<void> => {
    const pending = loadPending();
    if (pending.length === 0) return;
    const stillPending: LeaderboardEntry[] = [];
    for (const entry of pending) {
      const hash = await sha256(`${entry.score}:${HASH_SALT}`);
      const ok = await submitGlobal(entry.name, entry.score, hash);
      if (!ok) stillPending.push(entry);
    }
    savePending(stillPending);
    if (stillPending.length < pending.length) {
      const global = await fetchGlobal();
      const local = loadLocal();
      leaderboard.value = mergeLeaderboards(global, local);
      saveLocal(leaderboard.value);
    }
  };

  const submitScore = async (): Promise<void> => {
    const name = playerName.value.trim().toUpperCase();
    if (name.length < 1) return;
    const truncatedName = name.substring(0, 3);
    const scoreVal = score.value;

    const hash = await sha256(`${scoreVal}:${HASH_SALT}`);

    const entry: LeaderboardEntry = { name: truncatedName, score: scoreVal, date: new Date().toLocaleDateString() };
    const local = loadLocal();
    local.push(entry);
    local.sort((a, b) => b.score - a.score);
    saveLocal(local.slice(0, MAX_LEADERBOARD));

    const now = Date.now();
    if (now - lastSyncAttempt >= SYNC_COOLDOWN_MS) {
      lastSyncAttempt = now;
      syncStatus.value = 'syncing';
      const ok = await submitGlobal(truncatedName, scoreVal, hash);
      syncStatus.value = ok ? 'idle' : 'error';

      if (ok) {
        const global = await fetchGlobal();
        leaderboard.value = mergeLeaderboards(global, loadLocal());
        saveLocal(leaderboard.value);
      } else {
        const pending = loadPending();
        pending.push(entry);
        savePending(pending);
        leaderboard.value = mergeLeaderboards(null, loadLocal());
      }
    } else {
      const pending = loadPending();
      pending.push(entry);
      savePending(pending);
      leaderboard.value = mergeLeaderboards(null, local);
    }

    showNameEntry.value = false;
    playerName.value = '';
  };

  const isHighScore: ComputedRef<boolean> = computed(() => {
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