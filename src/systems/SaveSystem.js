const KEY = 'aura_realms_save_v1';
const DEFAULT = { level:1, xp:0, aura:12, crystals:25, wins:0, creature:'lumiko' };

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : { ...DEFAULT };
  } catch { return { ...DEFAULT }; }
}

export function saveGame(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}
