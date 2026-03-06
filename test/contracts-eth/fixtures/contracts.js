/**
 * Contract Deployment Module
 * responsible for deploying all smart contracts
 */

async function deployContracts() {
  // get multiple signers, usually the first one is the account that deploys the contract
  const [
    admin, admin2, dao, governance, minter, 
    seller, buyer, buyer2, completer, other, 
    other2, dao_fund_manager, siweAuth, quoter
  ] = await ethers.getSigners();

  // deploy core management contract
  const AddressManager = await ethers.getContractFactory("AddressManager");
  const addressManager = await AddressManager.deploy();

  // deploy token contract
  const SettlementToken = await ethers.getContractFactory("MockERC20");
  const settlementToken = await SettlementToken.deploy("Truth Coin Test", "TCT");
  
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const wBTC = await MockERC20.deploy("wBTC", "wBTC");
  const wETH = await MockERC20.deploy("WETH for WikiTruth", "WETH");
  const wROSE = await MockERC20.deploy("WROSE for WikiTruth", "WROSE");

  const TruthBox = await ethers.getContractFactory("TruthBox");
  const truthBox = await TruthBox.deploy(addressManager.target);

  // deploy swap and fund management contract
  const SwapContract = await ethers.getContractFactory("SwapContract");
  const swapContract = await SwapContract.deploy();

  const FundManager = await ethers.getContractFactory("FundManager");
  const fundManager = await FundManager.deploy(addressManager.target);
  
  const Exchange = await ethers.getContractFactory("Exchange");
  const exchange = await Exchange.deploy(addressManager.target);

  const UserManager = await ethers.getContractFactory("UserManager");
  const userManager = await UserManager.deploy(addressManager.target);

  return {
    signers: {
      admin, admin2, dao, governance, minter, 
      seller, buyer, buyer2, completer, other, 
      other2, dao_fund_manager, forwarder,
      siweAuth, // NOTE: local test, use address to replace siweAuth token contract address.
      quoter
    },
    contracts: {
      addressManager,
      settlementToken,
      wBTC,
      wETH,
      wROSE,
      truthBox,
      swapContract,
      fundManager,
      exchange,
      userManager
    }
  };
}

module.exports = {
  deployContracts
};
