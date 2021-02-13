export function log(s) {
    console.log.apply(console, ['[TagZiller]'].concat(s));
}

export async function loadCfg(keys) {
    return await browser.storage.local.get(keys);
}
