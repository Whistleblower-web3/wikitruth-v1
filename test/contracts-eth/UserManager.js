const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { deployTruthBoxFixture} = require("./Fixture.js");
const {timestampToDate} = require('../utils/timeToDate.js');

describe("UserManager test --- basic functions", function () {
  it("get user id", async function () {
    const { 
      truthBox, exchange, fundManager, userManager,
      buyer, minter, dao,
      userManager_buyer, userManager_minter, userManager_DAO
    } = await loadFixture(deployTruthBoxFixture);

    // check the value returned by myUserId()
    const id_minter = await userManager_minter.myUserId();

    expect(id_minter).to.equal(10000);

    await userManager.addBlacklist(buyer.address);
    expect(await userManager.isBlacklisted(buyer.address)).to.equal(true);

    await expect(userManager_buyer.myUserId()).to.be.revertedWithCustomError(userManager, "InBlacklist");

    await userManager.removeBlacklist(buyer.address);
    expect(await userManager.isBlacklisted(buyer.address)).to.equal(false);

  });  


});

