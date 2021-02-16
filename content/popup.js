import { log, loadCfg } from './common.js';

const file = document.getElementById('file');
const num = document.getElementById('num');
const placeholder = document.getElementById('placeholder');
const denyTo = document.getElementById('denyTo');
const ignore = /^#|^\s*$/;

loadCfg().then(async conf => {
    // log('Config:', conf);
    num.innerText = conf.tags ? conf.tags.length : '0';
    denyTo.value = conf.denyTo || '';
    placeholder.value = conf.placeholder || '';
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

placeholder.oninput = () => {
    log('New placeholder:', placeholder.value);
    browser.storage.local.set({ placeholder: placeholder.value });
};
