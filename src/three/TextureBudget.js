export const MOBILE_TEXTURE_BUDGET = Object.freeze({
  maxDimension: 1024,
  preferredDimension: 512,
  maxCachedAssets: 48,
  maxEstimatedTextureMB: 96
});

export function clampTextureSize(width, height, maxDimension = MOBILE_TEXTURE_BUDGET.maxDimension) {
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  return {
    width: Math.max(1, Math.floor(width * scale)),
    height: Math.max(1, Math.floor(height * scale))
  };
}

export function getTextureBudgetMB(bytes) {
  return Number((bytes / (1024 * 1024)).toFixed(1));
}
