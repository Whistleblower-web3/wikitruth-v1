/**
 * Token configuration module
 * Responsible for token minting, authorization, and liquidity configuration
 */

async function configureTokens(signers, contracts, connectors) {
  const { admin, buyer, buyer2, minter, other, other2 } = signers;
  const { testToken, officialToken, swapContract, addressManager, fundManager } = contracts;
  const { tokenConnectors } = connectors;

  // Mint test tokens
  await testToken.mint(admin.address);
  await testToken.mint(buyer.address);
  await testToken.mint(buyer2.address);
  await testToken.mint(minter.address);
  await testToken.mint(other.address);

  // Mint official tokens
  await officialToken.mint(admin.address);
  await tokenConnectors.officialToken.minter.mint(minter.address);
  await tokenConnectors.officialToken.other.mint(other.address);
  await tokenConnectors.officialToken.other2.mint(other2.address);
  await tokenConnectors.officialToken.buyer.mint(buyer.address);
  await tokenConnectors.officialToken.buyer2.mint(buyer2.address);

  // Set token authorization to FundManager
  await tokenConnectors.officialToken.other.approve(fundManager.target, 100000000);
  await tokenConnectors.officialToken.minter.approve(fundManager.target, 100000000);
  await tokenConnectors.officialToken.buyer.approve(fundManager.target, 100000000);
  await tokenConnectors.officialToken.buyer2.approve(fundManager.target, 100000000);

  await tokenConnectors.testToken.buyer.approve(fundManager.target, 100000000);
  await tokenConnectors.testToken.buyer2.approve(fundManager.target, 100000000);

  // Set token authorization to SwapContract
  await officialToken.approve(swapContract.target, 1000000000000000);
  await tokenConnectors.officialToken.minter.approve(swapContract.target, 100000000);
  await tokenConnectors.officialToken.buyer.approve(swapContract.target, 100000000);
  await tokenConnectors.officialToken.other.approve(swapContract.target, 100000000);

  await testToken.approve(swapContract.target, 1000000000000000);
  await tokenConnectors.testToken.buyer.approve(swapContract.target, 100000000);
  await tokenConnectors.testToken.minter.approve(swapContract.target, 100000000);
  await tokenConnectors.testToken.other.approve(swapContract.target, 100000000);

  // Add tokens to address manager
  await addressManager.addToken(officialToken.target);
  await addressManager.addToken(testToken.target);

  // Configure exchange contract
  await swapContract.setToken(officialToken.target, testToken.target);
  await swapContract.addLiquidity(100000000000000, 10000000000000); // 10:1 ratio
}

module.exports = {
  configureTokens
};
