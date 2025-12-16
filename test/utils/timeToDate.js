const {
    // time,
    loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");


function secondsToDhms(seconds) {
    // const y = Math.floor(seconds / (3600 * 24 * 365));
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [d, h, m, s].map(num => (`0${num}`).slice(-2)).join(':');
}


function timestampToDate(timestamp) {
    // Convert timestamp to milliseconds
    const date = new Date(timestamp * 1000);

    // Format date to string (can be customized according to needs)
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
    };

    return date.toLocaleString('en-US', options); // Output English format
}

module.exports = {
    timestampToDate,
    secondsToDhms
};