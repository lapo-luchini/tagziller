const file = document.getElementById('file');
const num = document.getElementById('num');
const ignore = /^#|^\s*$/;

browser.storage.local.get('tags').then(res => {
    if (res.tags)
        num.innerText = res.tags.length;
    else
        num.innerText = '0';
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
