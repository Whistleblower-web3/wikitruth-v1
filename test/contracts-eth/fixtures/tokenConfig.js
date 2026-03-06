/**
 * Token Configuration Module
 * responsible for token minting, authorization, and liquidity configuration
 */

async function configureTokens(signers, contracts, connectors) {
  const { admin, buyer, buyer2, minter, other, other2 } = signers;
  const { wBTC, settlementToken, swapContract, addressManager, fundManager } = contracts;
  const { tokenConnectors } = connectors;

  // Mint test tokens
  await wBTC.mint(admin.address);
  await wBTC.mint(buyer.address);
  await wBTC.mint(buyer2.address);
  await wBTC.mint(minter.address);
  await wBTC.mint(other.address);

  // Mint official tokens
  await settlementToken.mint(admin.address);
  await tokenConnectors.settlementToken.minter.mint(minter.address);
  await tokenConnectors.settlementToken.other.mint(other.address);
  await tokenConnectors.settlementToken.other2.mint(other2.address);
  await tokenConnectors.settlementToken.buyer.mint(buyer.address);
  await tokenConnectors.settlementToken.buyer2.mint(buyer2.address);

  // Approve FundManager
  await tokenConnectors.settlementToken.other.approve(fundManager.target, 100000000);
  await tokenConnectors.settlementToken.minter.approve(fundManager.target, 100000000);
  await tokenConnectors.settlementToken.buyer.approve(fundManager.target, 100000000);
  await tokenConnectors.settlementToken.buyer2.approve(fundManager.target, 100000000);

  await tokenConnectors.wBTC.buyer.approve(fundManager.target, 100000000);
  await tokenConnectors.wBTC.buyer2.approve(fundManager.target, 100000000);

  // Approve SwapContract
  await settlementToken.approve(swapContract.target, 1000000000000000);
  await tokenConnectors.settlementToken.minter.approve(swapContract.target, 100000000);
  await tokenConnectors.settlementToken.buyer.approve(swapContract.target, 100000000);
  await tokenConnectors.settlementToken.other.approve(swapContract.target, 100000000);

  await wBTC.approve(swapContract.target, 1000000000000000);
  await tokenConnectors.wBTC.buyer.approve(swapContract.target, 100000000);
  await tokenConnectors.wBTC.minter.approve(swapContract.target, 100000000);
  await tokenConnectors.wBTC.other.approve(swapContract.target, 100000000);

  // Add tokens to address manager
  await addressManager.setSettlementToken(settlementToken.target);
  await addressManager.addToken(wBTC.target);

  // Configure swap contract
  await swapContract.setToken(settlementToken.target, wBTC.target);
  await swapContract.addLiquidity(100000000000000, 10000000000000); // 10:1 ratio
}

module.exports = {
  configureTokens
};
