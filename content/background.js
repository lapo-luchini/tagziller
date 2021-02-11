/*
const promiseMap = new Map();
// browser.composeAction.disable();

browser.compose.onBeforeSend.addListener(tab => {
    browser.composeAction.enable(tab.id);
    browser.composeAction.openPopup();

    // Do NOT lose this Promise. Most of the compose window UI will be locked
    // until it is resolved. That's a very good way to annoy users.
    return new Promise(resolve => {
        promiseMap.set(tab.id, resolve);
    });
});

browser.runtime.onMessage.addListener(message => {
    const resolve = promiseMap.get(message.tabId);
    if (!resolve) {
        // How did we get here?
        return;
    }

    browser.composeAction.disable(message.tabId);
    if (message.didAnswerRight) {
        resolve();
    } else {
        resolve({ cancel: true });
    }
});
*/

// Function to open a popup and await user feedback
// src: https://github.com/thundernest/sample-extensions/blob/master/awaitPopup/background.js
/*
async function blockingPopup() {
    async function popupClosePromise(popupId, defaultPopupCloseMode) {
        try {
            await messenger.windows.get(popupId);
        } catch (e) {
            //window does not exist, assume closed
            return defaultPopupCloseMode;
        }
        return new Promise(resolve => {
            let popupCloseMode = defaultPopupCloseMode;
            function windowRemoveListener(closedId) {
                if (popupId == closedId) {
                    messenger.windows.onRemoved.removeListener(windowRemoveListener);
                    messenger.runtime.onMessage.removeListener(messageListener);
                    resolve(popupCloseMode);
                }
            }
            function messageListener(request, sender, sendResponse) {
                if (sender.tab.windowId == popupId && request && request.popupCloseMode) {
                    popupCloseMode = request.popupCloseMode;
                }
            }
            messenger.runtime.onMessage.addListener(messageListener);
            messenger.windows.onRemoved.addListener(windowRemoveListener);
        });
    }

    let window = await messenger.windows.create({
        url: 'popup.html',
        type: 'TagZiller',
        height: 280,
        width: 390
    });
    // await the created popup to be closed and define a default
    // return value if the window is closed without clicking a button
    let rv = await popupClosePromise(window.id, 'cancel');
    console.log(rv);
}
*/

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
        console.log('Existing.');
        // popup.focus();
        return;
    }
    console.log('Creating.');
    popup = await messenger.windows.create({
        url: 'popup.html',
        type: 'popup',
        titlePreface: 'TagZiller',
        height: 280,
        width: 390
    });
    await popupClosePromise(popup.id);
    console.log('Closed.');
    popup = null;
});

function getRandomInt(max) {
    max = Math.floor(max);
    return Math.floor(Math.random() * max);
}

browser.compose.onBeforeSend.addListener(async tab => {
    console.log('onBeforeSend:', tab);
    let details = await browser.compose.getComposeDetails(tab.id);
    console.log('Details:', details);
    let tag = 'Sent from my Thunderbird';
    const tags = (await browser.storage.local.get('tags')).tags;
    console.log('Tags:', tags);
    if (tags && tags.length > 0)
        tag = tags[getRandomInt(tag.length)];

    if (details.isPlainText) {
        // The message is being composed in plain text mode.
        let body = details.plainTextBody;
        console.log(body);

        // Make direct modifications to the message text, and send it back to the editor.
        body += '\n\n' + tag;
        console.log(body);
        browser.compose.setComposeDetails(tab.id, { plainTextBody: body });
    } else {
        // The message is being composed in HTML mode. Parse the message into an HTML document.
        let document = new DOMParser().parseFromString(details.body, 'text/html');
        console.log(document);

        // Use normal DOM manipulation to modify the message.
        let para = document.createElement('p');
        para.textContent = tag;
        document.body.appendChild(para);

        // Serialize the document back to HTML, and send it back to the editor.
        let html = new XMLSerializer().serializeToString(document);
        console.log(html);
        browser.compose.setComposeDetails(tab.id, { body: html });
    }
});
