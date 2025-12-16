import { ethers } from "hardhat";
import {
    user_evm_WikiTruth
} from "../../WikiTruth_account";
const fs = require('fs');
const path = require('path');
/**
 * 
 * @returns Deploy Truth Market Coin and ERC20Private6 contracts to sapphire-testnet testnet
 * 
 * Run command: npx hardhat run scripts/token-testnet/transfer.ts --network sapphire-testnet
 */

async function main() {
    console.log("Starting to transfer ERC20 tokens...");
    
    const user_from = user_evm_WikiTruth.admin;
    console.log("Deployment account:", user_from.address);
    const user_to = user_evm_WikiTruth.buyer;
    console.log("Recipient account:", user_to.address);

    if (!user_from.address) {
        console.error("Deployment account does not exist");
        return;
    }

    // Check chainId 
    const network = await ethers.provider.getNetwork();
    console.log("🌐 Current network ID:", network.chainId);
    if (Number(network.chainId) !== 23295 ) {
        console.error("Current network ID is not 23295, please check network ID");
        return;
    }

    // 1. Transfer ERC20 tokens
    console.log("\n1. Transferring ERC20 tokens...");
    const mockToken = await ethers.getContractAt("MockERC20", contract.address);
    await mockToken.transfer(user_to.address, amount_transfer);

}

// Run deployment script
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Deployment failed:", error);
        process.exit(1);
    });
