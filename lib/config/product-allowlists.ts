// Product-level provider allowlists (display filter only; resolution logic untouched).
// These lists decide which built-in providers the settings dialog and the
// generation toolbar offer in their pickers. The provider registries and the
// settings store's resolution/fallback logic are unaffected.

export const ALLOWED_LLM_PROVIDERS = ['minimax', 'deepseek', 'glm']; // + custom providers always allowed
export const ALLOWED_IMAGE_PROVIDERS = ['openai-image', 'minimax-image'];
export const ALLOWED_VIDEO_PROVIDERS = ['minimax-video'];
export const ALLOWED_TTS_PROVIDERS = ['minimax-tts']; // + custom tts providers allowed
export const ALLOWED_ASR_PROVIDERS = ['browser-native']; // + custom asr providers allowed
export const ALLOWED_PDF_PROVIDERS = ['unpdf'];
export const ALLOWED_SEARCH_PROVIDERS = ['anysearch']; // AnySearch is the sole built-in search engine

/** Custom providers get `custom-`-prefixed ids (`custom-*`, `custom-tts-*`, `custom-asr-*`). */
export function isCustomProviderId(id: string): boolean {
  return id.startsWith('custom-');
}

/** A provider passes the allowlist when listed or when it is a custom provider. */
export function isProviderAllowed(id: string, allowlist: string[]): boolean {
  return allowlist.includes(id) || isCustomProviderId(id);
}
