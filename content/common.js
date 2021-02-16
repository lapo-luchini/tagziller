export function log(...args) {
    console.log('[TagZiller]', ...args);
}

const defaults = {
    placeholder: '$tagZiller$'
};

export async function loadCfg() {
    return Object.assign({}, defaults, await browser.storage.local.get());
}
