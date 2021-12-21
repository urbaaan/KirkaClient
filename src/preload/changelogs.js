const { ipcRenderer } = require('electron');
let html;

ipcRenderer.on('html', (event, data) => {
    html = data;
    makeLogs();
});

window.addEventListener('DOMContentLoaded', () => {
    console.log('Content Loaded');
    ipcRenderer.send('get-html');
});

function makeLogs() {
    const element = document.getElementById('changeLogs');
    console.log(element);
    element.innerHTML = html;
}
