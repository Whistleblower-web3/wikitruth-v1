import { ethers } from "hardhat";
import {
    user_evm_WikiTruth
} from "../../WikiTruth_account";
import { getSigners_SapphireTestnet } from "../utils/signers-sapphire-testnet";
import { wikiTruth_contracts_address, wikiTruth_testnet_contracts } from "../utils/wikiTruth_contracts_address";
const fs = require('fs');
const path = require('path');

/**
 * 
 * @returns Mint and wrap ERC20 tokens
 * 
 * Run command: npx hardhat run scripts/token-testnet/wrap.ts --network sapphire-testnet
 */

async function main() {
    console.log("Starting to wrap ERC20 tokens as Secret ERC20 tokens...");

    // Check chainId 
    const network = await ethers.provider.getNetwork();
    console.log("🌐 Network ID:", network.chainId);
    if (Number(network.chainId) !== 23295 ) {
        console.error("networkId is not 23295");
        return;
    }

    
    const { adminSigner } = await getSigners_SapphireTestnet();
    if (!adminSigner) {
        console.error("adminSigner does not exist");
        return;
    }

    const user = adminSigner

    const amount_wrap = ethers.parseUnits("1000", 18);

    const contractERC20 = wikiTruth_testnet_contracts.find(c => c.name === "OfficialToken");
    if (!contractERC20) {
        console.error(`Contract does not exist`);
        return;
    }
    const mockTokenAddress = contractERC20.address;
    const mockTokenName = contractERC20.name;

    const contractSercet = wikiTruth_testnet_contracts.find(c => c.name === "OfficialToken_ERC20Secret");
    if (!contractSercet) {
        console.error(`Contract does not exist`);
        return;
    }
    const secretTokenAddress = contractSercet.address;
    const secretTokenName = contractSercet.name;

    const erc20 = await ethers.getContractAt(contractERC20.contract, mockTokenAddress);
    // 1. Check allowance, if insufficient, approve
    const allowance = await erc20.allowance(user.address, secretTokenAddress);
    if (allowance < amount_wrap) {
        await erc20.approve(secretTokenAddress, ethers.MaxUint256);
    }

    await new Promise(resolve => setTimeout(resolve, 10000));

    console.log(`\n3. ${secretTokenName} contract wrapping ERC20 tokens...`);
    const secretToken = await ethers.getContractAt(contractSercet.contract, secretTokenAddress);
    await secretToken.wrap(amount_wrap);
    console.log(`${secretTokenName} contract token wrapping completed`);

}

// Run deployment script
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Failed:", error);
        process.exit(1);
    });
