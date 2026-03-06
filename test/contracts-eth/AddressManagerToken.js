const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { deployTruthBoxFixture} = require("./Fixture.js");
const {timestampToDate} = require('../utils/timeToDate.js');

describe("AddressManager-Token- related tests", function () {
  it("remove settlement token--fail", async function () {
    const { 
      truthBox, exchange, fundManager, userManager, addressManager,
      buyer, minter, dao, settlementToken, wBTC, wETH, address_zero,
      userManager_buyer, userManager_minter, userManager_DAO
    } = await loadFixture(deployTruthBoxFixture);

    expect(await addressManager.isSettlementToken(settlementToken.target)).to.equal(true);
    // Try to remove the settlement token, fail
    await expect(addressManager.removeToken(settlementToken.target)).to.be.revertedWithCustomError(addressManager, "IsSettlementToken");

  });  

  it("modify settlement token", async function () {
    const { 
      truthBox, exchange, userManager, addressManager, quoter, swapContract, fundManager, 
      buyer, minter, dao, wETH, wROSE, settlementToken, address_zero, wBTC,
      userManager_buyer, userManager_minter, userManager_DAO
    } = await loadFixture(deployTruthBoxFixture);

    await addressManager.setSettlementToken(wETH.target);

    expect(await addressManager.isSettlementToken(wETH.target)).to.equal(true);
    expect(await addressManager.isSettlementToken(settlementToken.target)).to.equal(false);

    // Restore to original
    await addressManager.setSettlementToken(settlementToken.target);
    expect(await addressManager.isSettlementToken(wETH.target)).to.equal(false);
    expect(await addressManager.isSettlementToken(settlementToken.target)).to.equal(true);

  });

  it("try to add settlement token--fail", async function () {
    const { 
      truthBox, exchange, fundManager, userManager, addressManager,
      buyer, minter, dao, settlementToken, wBTC, wETH, address_zero,
      userManager_buyer, userManager_minter, userManager_DAO
    } = await loadFixture(deployTruthBoxFixture);

    await expect(addressManager.addToken(settlementToken.target)).to.be.revertedWithCustomError(addressManager, "TokenIsActive");

  }); 

  it("try to add 0 address token--fail", async function () {
    const { 
      truthBox, exchange, fundManager, userManager, addressManager,
      buyer, minter, dao, settlementToken, wBTC, wETH, address_zero,
      userManager_buyer, userManager_minter, userManager_DAO
    } = await loadFixture(deployTruthBoxFixture);
    // 设置0地址为官方代币，失败
    await expect(addressManager.setSettlementToken(address_zero)).to.be.revertedWithCustomError(addressManager, "InvalidAddress");

    await expect(addressManager.addToken(address_zero)).to.be.revertedWithCustomError(addressManager, "InvalidAddress");

  }); 

  it("addToken--token management", async function () {
    const { 
      truthBox, exchange, fundManager, userManager, addressManager,
      buyer, minter, dao, settlementToken, wBTC, wETH, address_zero,
      userManager_buyer, userManager_minter, userManager_DAO
    } = await loadFixture(deployTruthBoxFixture);

    expect(await addressManager.isTokenSupported(wETH.target)).to.equal(false);
    // Add token
    await addressManager.addToken(wETH.target);

    const tokenList = await addressManager.getTokenList();
    expect(tokenList[0]).to.equal(wBTC.target);
    expect(tokenList[1]).to.equal(wETH.target);

    // Remove token
    await addressManager.removeToken(wETH.target);
    const tokenList2 = await addressManager.getTokenList();
    // Only wBTC left
    expect(tokenList2.length).to.equal(1);
    expect(tokenList2[0]).to.equal(wBTC.target);
    expect(await addressManager.isTokenSupported(wETH.target)).to.equal(false);
    // Remove token again, fail
    await expect(addressManager.removeToken(wETH.target)).to.be.revertedWithCustomError(addressManager, "TokenIsNotActive");

  });  

});

