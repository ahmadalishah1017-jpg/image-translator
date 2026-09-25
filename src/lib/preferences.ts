import { createLocalStore } from "./local-store";

/** Default "Translate to" language, set from the header language selector. */
const targetStore = createLocalStore<string>("snaptranslate:target-lang", "en");

export const usePreferredTarget = targetStore.useValue;
export const setPreferredTarget = (code: string) => targetStore.set(code);
