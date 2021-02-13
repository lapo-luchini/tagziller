export function log(...args) {
    console.log('[TagZiller]', ...args);
}

export async function loadCfg(keys) {
    return await browser.storage.local.get(keys);
}
