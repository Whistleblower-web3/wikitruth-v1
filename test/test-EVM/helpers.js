// test/helpers/TimeHelpers.js
const { expect } = require("chai");
const { network, ethers } = require("hardhat");

// Directly define Status enum, consistent with Solidity contract
const Status = {
    Storing: 0,
    Selling: 1,
    Auctioning: 2,
    Paid: 3,
    Refunding: 4,
    InSecrecy: 5,
    Published: 6,
    Blacklisted: 7
};

const TimeHelpers = {
    // Verify if time difference is within expected range
    verifyTimeDifference(actualDiff, expectedDiff, allowedDelta = 10, message = "") {
        expect(actualDiff).to.be.closeTo(
            expectedDiff,
            allowedDelta,
            message || `Time difference should be approximately ${expectedDiff} seconds`
        );
    },

    // Verify deadline
    verifyDeadline(deadline, baseTime, expectedDiff, allowedDelta = 10) {
        const actualDiff = Number(deadline) - Number(baseTime);
        this.verifyTimeDifference(
            actualDiff,
            expectedDiff,
            allowedDelta,
            "Deadline is not within expected range"
        );
    },

    // Advance blockchain time
    // async advanceTime(seconds) {
    //     await network.provider.send("evm_increaseTime", [seconds]);
    //     await network.provider.send("evm_mine");
    // },

    // // Advance to specific deadline
    // async advanceToDeadline(deadline) {
    //     const now = (await ethers.provider.getBlock("latest")).timestamp;
    //     const timeToAdvance = Number(deadline) - now;
    //     if (timeToAdvance > 0) {
    //         await this.advanceTime(timeToAdvance);
    //     }
    // },

    // // Quickly advance common time periods
    // async advanceDays(days) {
    //     await this.advanceTime(days * 24 * 60 * 60);
    // },


};

// 2. Status handling helper functions
// const StatusHelpers = {
//     // Verify token status
//     async verifyTokenStatus(truthBox, tokenId, expectedStatus) {
//         const status = await truthBox.getStatus(tokenId);
//         expect(status).to.equal(expectedStatus);
//     },

//     // Verify timestamp exists
//     async verifyTimestampExists(exchange, tokenId, timestampGetter) {
//         const timestamp = await timestampGetter(tokenId);
//         expect(timestamp).to.not.equal(0);
//     },

// };

module.exports = {
    Status,
    ...TimeHelpers
};