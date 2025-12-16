/**
 * Contract deployment module
 * Responsible for deploying all smart contracts
 */

async function deployContracts() {
  // Get multiple signers, usually the first one is the account that deploys contracts
  const [
    admin, admin2, dao, governance, minter, 
    seller, buyer, buyer2, completer, other, 
    other2, dao_fund_manager, siweAuth, quoter
  ] = await ethers.getSigners();

  // Deploy core management contracts
  const AddressManager = await ethers.getContractFactory("AddressManager");
  const addressManager = await AddressManager.deploy();

  // Deploy token contracts
  const OfficialToken = await ethers.getContractFactory("TestToken");
  const officialToken = await OfficialToken.deploy("Truth Coin Test", "TCT");
  
  const TestToken = await ethers.getContractFactory("TestToken");
  const testToken = await TestToken.deploy("Test WETH for WikiTruth", "WTETH");
  const otherToken = await TestToken.deploy("Other WETH for WikiTruth", "OWETH");
  const otherToken2 = await TestToken.deploy("Other WETH for WikiTruth", "OWETH");

  // Deploy NFT related contracts
  const TruthNFT = await ethers.getContractFactory("TruthNFT");
  const truthNFT = await TruthNFT.deploy(addressManager.target);

  const TruthBox = await ethers.getContractFactory("TruthBox");
  const truthBox = await TruthBox.deploy(addressManager.target);

  // Deploy exchange and fund management contracts
  const SwapContract = await ethers.getContractFactory("SwapContract");
  const swapContract = await SwapContract.deploy();

  const FundManager = await ethers.getContractFactory("FundManager");
  const fundManager = await FundManager.deploy(addressManager.target);
  
  const Exchange = await ethers.getContractFactory("Exchange");
  const exchange = await Exchange.deploy(addressManager.target);

  const UserId = await ethers.getContractFactory("UserId");
  const userId = await UserId.deploy(addressManager.target);

  return {
    signers: {
      admin, admin2, dao, governance, minter, 
      seller, buyer, buyer2, completer, other, 
      other2, dao_fund_manager, 
      siweAuth, // NOTE: For local testing, use address to replace siweAuth token contract address.
      quoter
    },
    contracts: {
      addressManager,
      officialToken,
      testToken,
      otherToken,
      otherToken2,
      truthNFT,
      truthBox,
      swapContract,
      fundManager,
      exchange,
      userId
    }
  };
}

module.exports = {
  deployContracts
};
