import { log, loadCfg } from './common.js';

let popup = null;
messenger.composeAction.onClicked.addListener(async () => {
    async function popupClosePromise(popupId) {
        try {
            await messenger.windows.get(popupId);
        } catch (e) {
            console.log('Error:', e);
            //window does not exist, assume closed
            return;
        }
        return new Promise(resolve => {
            function windowRemoveListener(closedId) {
                if (popupId == closedId) {
                    messenger.windows.onRemoved.removeListener(windowRemoveListener);
                    resolve();
                }
            }
            messenger.windows.onRemoved.addListener(windowRemoveListener);
        });
    }

    if (popup) {
        messenger.windows.remove(popup.id);
        return;
    }
    popup = await messenger.windows.create({
        url: 'popup.html',
        type: 'popup',
        titlePreface: 'TagZiller',
        height: 350,
        width: 450
    });
    await popupClosePromise(popup.id);
    popup = null;
});

function getRandomInt(max) {
    max = Math.floor(max);
    return Math.floor(Math.random() * max);
}

browser.compose.onBeforeSend.addListener(async tab => {
    log('onBeforeSend:', tab);
    const details = await browser.compose.getComposeDetails(tab.id);
    log('Details:', details);
    const conf = await loadCfg(['tags', 'identity', 'denyTo']);
    if (conf.identity && conf.identity != '*' && conf.identity != details.identityId) {
        log('Skipping identity ' + details.identityId);
        return;
    }
    if (conf.denyTo) {
        const deny = new RegExp(conf.denyTo);
        const receivers = [].concat(details.to, details.cc, details.bcc, details.newsgroups);
        for (let addr of receivers)
            if (deny.test(addr)) {
                log('Skipping, receiver in deny list: ' + addr);
                return;
            }
    }
    if (!conf.tags || conf.tags.length == 0) {
        console.log('Database is empty.');
        return;
    }
    const tag = conf.tags[getRandomInt(conf.tags.length)];

    if (details.isPlainText) {
        // The message is being composed in plain text mode.
        let body = details.plainTextBody;
        log(body);

        // Make direct modifications to the message text, and send it back to the editor.
        body += '\n\n' + tag;
        log(body);
        browser.compose.setComposeDetails(tab.id, { plainTextBody: body });
    } else {
        // The message is being composed in HTML mode. Parse the message into an HTML document.
        let document = new DOMParser().parseFromString(details.body, 'text/html');
        log(document);

        // Use normal DOM manipulation to modify the message.
        let para = document.createElement('p');
        para.textContent = tag;
        document.body.appendChild(para);

        // Serialize the document back to HTML, and send it back to the editor.
        let html = new XMLSerializer().serializeToString(document);
        log(html);
        browser.compose.setComposeDetails(tab.id, { body: html });
    }
});

log('TagZiller started.');
