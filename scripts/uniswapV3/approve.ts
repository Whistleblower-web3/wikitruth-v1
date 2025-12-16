import { ethers } from "hardhat";
import {
    v3_core_testnet_address,
    v3_periphery_testnet_address,
} from "../utils/v3_testnet_address";
import { wikiTruth_contracts_address, wikiTruth_testnet_contracts } from "../utils/wikiTruth_contracts_address";
const fs = require('fs');
const path = require('path');
import { getSigners_SapphireTestnet } from "../utils/signers-sapphire-testnet";


/**
 * 
 * @returns Approve ERC20 tokens to Uniswap V3 contracts on sapphire-testnet testnet
 * 
 * Run command: npx hardhat run scripts/uniswapV3/approve.ts --network sapphire-testnet
 */

async function main() {
    console.log("Starting to add Uniswap V3 pool...");
    
    // Check chainId 
    const network = await ethers.provider.getNetwork();
    console.log("🌐 Network ID:", network.chainId);
    if (Number(network.chainId) !== 23295 ) {
        console.error("networkId is not 23295");
        return;
    }
    const { adminSigner } = await getSigners_SapphireTestnet();
    if (!adminSigner) {
        console.error("signer does not exist");
        return;
    }
    const contractSecret_officialToken = wikiTruth_testnet_contracts.find(c => c.name === "OfficialToken_ERC20Secret");
    const contractSecret_wroseSecret = wikiTruth_testnet_contracts.find(c => c.name === "WROSESecret");
    if (!contractSecret_officialToken || !contractSecret_wroseSecret) {
        console.error(`Contract does not exist`);
        return;
    }

    // 2. Wrap ERC20 tokens
    // await mockToken.approve(privateTokenAddress, ethers.parseUnits("1000000000", 18));
    const secretToken_officialToken = await ethers.getContractAt("ERC20Secret", contractSecret_officialToken.address);
    const secretToken_wroseSecret = await ethers.getContractAt("ERC20Secret", contractSecret_wroseSecret.address);

    // TODO 20251213
    await secretToken_officialToken.approve(v3_periphery_testnet_address.nftPositionManager, ethers.MaxUint256);
    await secretToken_wroseSecret.approve(v3_periphery_testnet_address.nftPositionManager, ethers.MaxUint256);
    console.log("Token approval to Uniswap V3 completed");
    await new Promise(resolve => setTimeout(resolve, 5000));

}

// Run deployment script
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Deployment failed:", error);
        process.exit(1);
    });
