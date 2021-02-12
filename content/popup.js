const file = document.getElementById('file');
const num = document.getElementById('num');
const identity = document.getElementById('identity');
const denyTo = document.getElementById('denyTo');
const ignore = /^#|^\s*$/;

browser.storage.local.get(['tags', 'identity', 'denyTo']).then(async conf => {
    // console.log('Config:', conf);
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

file.onchange = () => {
    const reader = new FileReader();
    reader.onload = (e) => {
        const tags = [];
        for (let s of e.target.result.split(/\r?\n/)) {
            if (ignore.test(s))
                continue;
            tags.push(s);
        }
        browser.storage.local.set({ tags: tags });
        num.innerText = tags.length;
    };
    reader.readAsText(file.files[0]);
};

identity.onchange = () => {
    console.log('New identity:', identity.value);
    browser.storage.local.set({ identity: identity.value });
};

denyTo.onchange = () => {
    try {
        new RegExp(denyTo.value);
        browser.storage.local.set({ denyTo: denyTo.value });
    } catch (e) {
        console.log('Invalid RegExp:', denyTo.value);
    }
};
