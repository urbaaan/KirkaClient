/* eslint-disable no-unused-vars */
const Store = require('electron-store');
const config = new Store();

function checkbox(customID) {
    const val = document.getElementById(customID).checked;
    config.set(customID, val);
}

function inputbox(customID) {
    const val = document.getElementById(customID).value;
    config.set(customID, val);
}

function sliderVal(customID) {
    const slider = document.getElementById(customID);
    document.getElementById(`${customID}-label`).innerText = slider.value;
    config.set(customID, slider.value);
}
