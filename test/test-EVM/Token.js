const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { deployTruthBoxFixture} = require("./Fixture.js");
const {timestampToDate} = require('../utils/timeToDate.js');
/**
 * Test contract: AddressManager.sol
 * Main test content:
 * 1. Set official token
 * 2. Check official token
 * 3. Check if token is supported
 * 4. Check if token is official token
 */

describe("Token- Related Tests", function () {
  it("test token management", async function () {
    const { 
      truthBox, exchange, fundManager, userId, addressManager,
      buyer, minter, dao, officialToken, testToken, otherToken, address_zero,
      userId_buyer, userId_minter, userId_DAO
    } = await loadFixture(deployTruthBoxFixture);

    expect(await addressManager.isTokenSupported(otherToken.target)).to.equal(false);
    expect(await addressManager.isOfficialToken(otherToken.target)).to.equal(false);
    // Add token
    await addressManager.addToken(otherToken.target);

    const tokenList = await addressManager.getTokenList();
    expect(tokenList[0]).to.equal(officialToken.target);
    expect(tokenList[1]).to.equal(testToken.target);
    expect(tokenList[2]).to.equal(otherToken.target);

    // Remove token
    await addressManager.removeToken(otherToken.target);
    const tokenList2 = await addressManager.getTokenList();
    // After removing token, token still exists in list, but is no longer supported.
    expect(tokenList2[2]).to.equal(otherToken.target);
    expect(await addressManager.isTokenSupported(otherToken.target)).to.equal(false);
    // Remove again, failed
    await expect(addressManager.removeToken(otherToken.target)).to.be.revertedWithCustomError(addressManager, "TokenIsNotActive");

    // Set official token
    await addressManager.setOfficialToken(otherToken.target);
    const tokenList3 = await addressManager.getTokenList();
    expect(tokenList3[0]).to.equal(otherToken.target);
    // After setting official token, official token is no longer supported.
    expect(await addressManager.isTokenSupported(officialToken.target)).to.equal(false);
    expect(await addressManager.isOfficialToken(otherToken.target)).to.equal(true);

    // Restore official token
    await addressManager.setOfficialToken(officialToken.target);
    const tokenList4 = await addressManager.getTokenList();
    expect(tokenList4[0]).to.equal(officialToken.target);
    expect(await addressManager.isTokenSupported(otherToken.target)).to.equal(false);
    expect(await addressManager.isOfficialToken(officialToken.target)).to.equal(true);

    // Attempt to remove official token, failed
    await expect(addressManager.removeToken(officialToken.target)).to.be.revertedWithCustomError(addressManager, "CannotRemoveOfficialToken");
    // Attempt to add already supported token again, failed
    await expect(addressManager.addToken(officialToken.target)).to.be.revertedWithCustomError(addressManager, "TokenIsActive");
    // Attempt to add unsupported token again, success
    await addressManager.addToken(otherToken.target);
    expect(await addressManager.isTokenSupported(otherToken.target)).to.equal(true);

  });  

  // it("test remove officialToken", async function () {
  //   const { 
  //     truthBox, exchange, fundManager, userId, addressManager,
  //     buyer, minter, dao, officialToken, testToken, otherToken, address_zero,
  //     userId_buyer, userId_minter, userId_DAO
  //   } = await loadFixture(deployTruthBoxFixture);


});

