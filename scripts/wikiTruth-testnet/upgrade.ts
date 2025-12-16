import { ethers } from "hardhat";
import {
    user_evm_WikiTruth
} from "../../WikiTruth_account";
import { wikiTruth_contracts_address, wikiTruth_testnet_contracts } from "../utils/wikiTruth_contracts_address";
import { v3_core_testnet_address, v3_periphery_testnet_address } from "../utils/v3_testnet_address";
// import { domainList } from "../../test/utils";
import { getSigners_SapphireTestnet } from "../utils/signers-sapphire-testnet";

/**
 * 
 * @returns Initialize WikiTruth contracts to sapphire-testnet testnet
 * 
 * Run command: npx hardhat run scripts/wikiTruth-testnet/upgrade.ts --network sapphire-testnet
 */

// List of contracts to upgrade
const nowList = [
    // 'AddressManager',
    'Exchange',
    // 'FundManager',
    // 'TruthBox',
    // 'TruthNFT',
    // 'UserId',
    // 'SiweAuth',
    // 'Dao',
    // 'governance',
    // 'daoFundManager',
    // 'none' // Do not upgrade any contracts, after each successful upgrade, change this value to 'none' to prevent accidental script execution
]



async function main() {
    console.log("Starting to upgrade WikiTruth contracts...");

    // Check chainId 
    const network = await ethers.provider.getNetwork();
    console.log("🌐 Current network ID:", network.chainId);
    if (Number(network.chainId) !== 23295 ) {
        console.error("Current network ID is not 23295, please check network ID");
        return;
    }

    if (nowList.includes('none')) {
        console.error("No contracts need to be upgraded");
        return;
    } else {
        console.log("List of contracts to upgrade:", nowList);
    }

    const { adminSigner } = await getSigners_SapphireTestnet();
    if (!adminSigner) {
        console.error("adminSigner does not exist");
        return;
    }

    console.log("\n3. Setting addresses for each contract (using admin identity to call directly)...");
    
    for (const contract of nowList) {
        const proxy = wikiTruth_testnet_contracts.find(c => c.name === contract)?.address;
        if (!proxy) {
            console.error(`${contract} proxy contract address does not exist`);
            continue;
        }
        const implementation = wikiTruth_testnet_contracts.find(c => c.name === contract)?.implementation;
        if (!implementation) {
            console.error(`${contract} implementation contract address does not exist`);
            continue;
        }

        console.log(`${contract} proxy contract address: ${proxy}`);
        console.log(`${contract} implementation contract address: ${implementation}`);

        const contractInstance = await ethers.getContractAt(contract, proxy);
        // Connect signer
        const contract_admin = contractInstance.connect(adminSigner) as any;
        const tx = await contract_admin.upgrade(implementation);
        await tx.wait();
        console.log(`${contract} upgrade completed`);

        await new Promise(resolve => setTimeout(resolve, 5000));
    }
    console.log("\nAll contracts upgrade completed");


    // =========================================== View functions=============================================

}

// Run deployment script
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Failed:", error);
        process.exit(1);
    });
    