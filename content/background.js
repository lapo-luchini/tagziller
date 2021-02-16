import { log, loadCfg } from './common.js';

function getRandomInt(max) {
    max = Math.floor(max);
    return Math.floor(Math.random() * max);
}

function escapeHTML(text) {
    const el = document.createElement('div');
    el.innerText = text;
    return el.innerHTML;
}

async function addSignature(tab) {
    const details = await browser.compose.getComposeDetails(tab.id);
    log('Details:', details);
    const conf = await loadCfg();
    let isActive = true;
    if (conf.denyTo) {
        const deny = new RegExp(conf.denyTo);
        const receivers = [].concat(details.to, details.cc, details.bcc, details.newsgroups);
        for (let addr of receivers)
            if (deny.test(addr)) {
                log('Skipping, receiver in deny list: ' + addr);
                isActive = false;
            }
    }
    if (!conf.tags || conf.tags.length == 0) {
        console.log('Skipping, database is empty.');
        isActive = false;
    }
    let body = details.isPlainText ? details.plainTextBody : details.body;
    if (body.indexOf(conf.placeholder) < 0) {
        console.log('Skipping, placeholder not found.');
        return;
    }
    let tag = isActive ? conf.tags[getRandomInt(conf.tags.length)] : '';
    if (!details.isPlainText)
        tag = escapeHTML(tag);
    body = body.replace(conf.placeholder, tag);
    log(body);
    if (details.isPlainText)
        browser.compose.setComposeDetails(tab.id, { plainTextBody: body });
    else
        browser.compose.setComposeDetails(tab.id, { body: body });
}

browser.windows.onCreated.addListener(async window => {
    if (window.type != "messageCompose") return;
    const tab = await browser.tabs.query({ windowId: window.id });
    log('onCreated:', tab[0]);
    addSignature(tab[0]);
});

browser.compose.onIdentityChanged.addListener(tab => {
    log('onIdentityChanged:', tab);
    addSignature(tab);
});

/*
browser.compose.onBeforeSend.addListener(tab => {
    log('onBeforeSend:', tab);
    addSignature(tab);
});
*/

log('TagZiller started.');
