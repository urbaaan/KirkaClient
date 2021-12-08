/* eslint-disable no-unused-vars */
const allSettings = require('../features/customSettings');
const autoJoin = require('../features/autoJoin');
const { ipcRenderer } = require('electron');

ipcRenderer.on('make-settings', () => {
    makeSettings();
});

let table;

window.addEventListener('DOMContentLoaded', () => {
    const check = document.getElementsByClassName('about-wrapper');
    if (check.length > 0) return;
    table = document.getElementsByTagName('table')[0];
    makeSettings();
});

function makeSettings() {
    allSettings.push(...autoJoin.settings);
    const doneCategories = [];

    for (let i = 0; i < allSettings.length; i++) {
        const option = allSettings[i];
        if (doneCategories.includes(option.category)) continue;

        const mainDiv = document.createElement('div');
        const category = document.createElement('label');

        category.innerHTML = `<b>${option.category}</b>`;
        category.className = 'cat';

        mainDiv.id = option.category;
        mainDiv.className = 'catDIV';

        mainDiv.appendChild(category);
        table.appendChild(mainDiv);
        table.appendChild(document.createElement('br'));
        doneCategories.push(option.category);
    }

    for (let i = 0; i < allSettings.length; i++) {
        const option = allSettings[i];
        const tableRow = document.createElement('tr');
        let tempHTML = '';
        switch (option.type) {
        case 'checkbox':
            tempHTML = `
                <td width="350vw">
                    <label id="name">${option.name}${option.needsRestart ? ' <span style="color: #eb5656">*</span>' : ''}</label>
                </td>
                <td width="250vw">\u200b</td>
                <td>
                    <label class = "toggle">
                        <span class="check"></span>
                        <input type="checkbox" id=${option.id} ${option.val ? 'checked' : ''} onclick='${option.type}("${option.id}")'>
                        <span class="slider round"></span>
                    </label>                  
                </td>
                `;
            break;
        case 'input':
            tempHTML = `
                <td width="350vw">
                    <label id="name">${option.name}${option.needsRestart ? ' <span style="color: #eb5656">*</span>' : ''}</label>
                </td>
                <td width="250vw">\u200b</td>
                <td>
                    <label class = "textbox">
                        <span class="textbox"></span>
                        <input ${option.password ? 'type="password"' : 'type="input"'} '' id=${option.id} ${option.placeholder ? `placeholder='${option.placeholder}'` : ''} value='${option.val}' oninput='inputbox("${option.id}")'>
                        <span class="textbox"></span>
                    </label>                  
                </td>
                `;
            break;
        case 'list':
            // eslint-disable-next-line no-case-declarations
            let optionValues;
            if (option.isDynamic) {
                const dynamicElement = document.getElementById(option.dynamicElement);
                optionValues = option.values[dynamicElement.value];
            } else
                optionValues = option.values;
            // eslint-disable-next-line no-case-declarations
            let allOptions = '';
            for (let j = 0; j < optionValues.length; j++)
                allOptions += `<option value="${optionValues[j]}" ${optionValues[j] == option.val ? 'selected' : ''}>${optionValues[j]}</option>`;

            tempHTML = `
                <td width="350vw">
                    <label id="name">${option.name}${option.needsRestart ? ' <span style="color: #eb5656">*</span>' : ''}</label>
                </td>
                <td width="250vw">\u200b</td>
                <td>
                    <label class = "textbox">
                        <select id="${option.id}" onchange='inputbox("${option.id}")'>
                            ${allOptions}
                        </select>
                    </label>             
                </td>
                `;
            break;
        case 'slider':
            tempHTML = `
                <td width="350vw">
                    <label id="name">${option.name}${option.needsRestart ? ' <span style="color: #eb5656">*</span>' : ''}</label>
                </td>
                <td width="250vw">\u200b</td>
                <td>
                    <div class="slidecontainer">
                    <label class="textbox" id="${option.id}-label">
                        ${option.val}
                    </label>
                        <input type="range" min="${option.min}" max="${option.max}" value="${option.val}" class="rangeSlider" id="${option.id}"
                        oninput="sliderVal('${option.id}')">
                    </div>               
                </td>
                `;
        }
        const category = document.getElementById(option.category);
        category.appendChild(tableRow);
        tableRow.innerHTML = tempHTML;
    }
    const endNote = document.createElement('tr');
    endNote.innerHTML = `<td>
                        <label id="name">\n\n<span style="color: #eb5656">*</span> Requires Restart</label>
                        </td>`;
    table.appendChild(endNote);
}
