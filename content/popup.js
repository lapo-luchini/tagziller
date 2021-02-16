import { log, loadCfg } from './common.js';

const file = document.getElementById('file');
const num = document.getElementById('num');
const identity = document.getElementById('identity');
const denyTo = document.getElementById('denyTo');
const ignore = /^#|^\s*$/;

loadCfg(['tags', 'identity', 'denyTo']).then(async conf => {
    // log('Config:', conf);
    num.innerText = conf.tags ? conf.tags.length : '0';
    denyTo.value = conf.denyTo || '';
    for (let account of await browser.accounts.list()) {
        for (let id of account.identities) {
            const option = document.createElement('option');
            option.value = id.id;
            option.innerText = account.name + ' <' + id.email + '>';
            identity.appendChild(option);
            if (id.id == conf.identity)
                option.selected = true;
        }
    }
});

file.oninput = () => {
    const reader = new FileReader();
    reader.onload = (e) => {
        const tags = [];
        for (let s of e.target.result.split(/\r?\n/)) {
            if (ignore.test(s))
                continue;
            tags.push(s);
        }
        log('Database:', tags);
        browser.storage.local.set({ tags: tags });
        num.innerText = tags.length;
    };
    reader.readAsText(file.files[0]);
};

identity.oninput = () => {
    log('New identity:', identity.value);
    browser.storage.local.set({ identity: identity.value });
};

denyTo.oninput = () => {
    log('DenyTo:', denyTo.value);
    try {
        new RegExp(denyTo.value);
        denyTo.setCustomValidity('');
        browser.storage.local.set({ denyTo: denyTo.value });
    } catch (e) {
        denyTo.setCustomValidity('must be a valid regular expression');
        log('Invalid RegExp:', denyTo.value);
    }
};
