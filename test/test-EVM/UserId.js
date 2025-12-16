const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { deployTruthBoxFixture} = require("./Fixture.js");
const {timestampToDate} = require('../utils/timeToDate.js');
/**
 * Test contract: UserId.sol
 * Main test content:
 * 1. Get user ID
 * 2. Add to blacklist
 * 3. Get blacklist status
 */

describe("UserId- Related Tests", function () {
  it("get user ID", async function () {
    const { 
      truthBox, exchange, fundManager, userId,
      buyer, minter, dao,
      userId_buyer, userId_minter, userId_DAO
    } = await loadFixture(deployTruthBoxFixture);

    // First assign IDs to users through truthBox.getUserIdByAddress()
    await truthBox.getUserId(buyer.address);
    await truthBox.getUserId(minter.address);
    await truthBox.getUserId(dao.address);

    // Now check the values returned by myUserId()
    const id_buyer = await userId_buyer.myUserId();
    const id_minter = await userId_minter.myUserId();
    const id_DAO = await userId_DAO.myUserId();

    // Verify IDs are not 0 (indicating assigned)
    expect(id_buyer).to.be.greaterThan(0);
    expect(id_minter).to.be.greaterThan(0);
    expect(id_DAO).to.be.greaterThan(0);


    // Verify different users have different IDs
    expect(id_buyer).to.not.equal(id_minter);
    expect(id_buyer).to.not.equal(id_DAO);
    expect(id_minter).to.not.equal(id_DAO);

    // Add to blacklist
    await userId.addBlacklist(buyer.address);
    expect(await userId.isBlacklisted(buyer.address)).to.equal(true);

    await expect(userId_buyer.myUserId()).to.be.revertedWithCustomError(userId, "Blacklisted");

    await userId.removeBlacklist(buyer.address);
    expect(await userId.isBlacklisted(buyer.address)).to.equal(false);
    expect(await userId_buyer.myUserId()).to.equal(id_buyer);

  });  


});

