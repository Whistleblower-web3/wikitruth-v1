import { ethers } from "hardhat";
import {
    user_evm_WikiTruth
} from "../../WikiTruth_account";
import { wikiTruth_contracts_address , wikiTruth_testnet_contracts } from "../utils/wikiTruth_contracts_address";
import { v3_core_testnet_address, v3_periphery_testnet_address } from "../utils/v3_testnet_address";
import { getSigners_SapphireTestnet } from "../utils/signers-sapphire-testnet";
// import { domainList } from "../../test/utils";

/**
 * 
 * @returns Initialize WikiTruth contracts to sapphire-testnet testnet
 * 
 * run：npx hardhat run scripts/wikiTruth-testnet/00_initAllContracts.ts --network sapphire-testnet
 * 
 * Step 1: Set AddressManager address in all contracts
 */

// List of contracts to update
const contracts = [
    // 'AddressManager',
    'Exchange',
    'FundManager',
    'TruthBox',
    'TruthNFT',
    'UserId',
    // 'SiweAuth',
    // 'Dao',
    // 'governance',
    // 'daoFundManager',
    // 'none', // TODO Activate 'none' to prevent accidental script execution
]


async function main() {
    console.log("Starting initialization of all WikiTruth contracts, excluding AddressManager...");

    // Check chainId 
    const network = await ethers.provider.getNetwork();
    console.log("🌐 Current network ID:", network.chainId);
    if (Number(network.chainId) !== 23295 ) {
        console.error("Current network ID is not 23295, please check network ID");
        return;
    }

    const { adminSigner } = await getSigners_SapphireTestnet();
    if (!adminSigner) {
        console.error("adminSigner does not exist");
        return;
    }

    if (contracts.includes('none')) {
        console.error("No contracts need to be upgraded");
        return;
    }

    const addressManager = wikiTruth_testnet_contracts.find(c => c.name === 'AddressManager')?.address;
    if (!addressManager) {
        console.error("AddressManager proxy contract address does not exist");
        return;
    }

    // =====================================================================
    console.log("\n1. Setting AddressManager address for each contract...");
    for (const contract of contracts) {
        const contractAddress = wikiTruth_testnet_contracts.find(c => c.name === contract)?.address;
        if (!contractAddress) {
            console.error(`${contract} proxy contract address does not exist`);
            continue;
        }
        const contractInstance = await ethers.getContractAt(contract, contractAddress);
        // const contract_admin = contractInstance.connect(adminSigner) as any;
        const tx = await contractInstance.setAddressManager(addressManager);
        await tx.wait();
        console.log(`${contract} AddressManager address setup completed`);

        await new Promise(resolve => setTimeout(resolve, 5000));
    }
    console.log("\nAll contracts' AddressManager addresses setup completed");

    // =====================================================================
    // console.log("\n2. Setting addresses for each contract...");
    // for (const contract of contracts) {
    //     const contractAddress = wikiTruth_testnet_contracts.find(c => c.name === contract)?.address;
    //     if (!contractAddress) {
    //         console.error(`${contract} proxy contract address does not exist`);
    //         continue;
    //     }
    //     const contractInstance = await ethers.getContractAt(contract, contractAddress);
    //     // Connect signer and call (using type assertion)
    //     const contract_admin = contractInstance.connect(adminSigner) as any;
    //     const tx = await contract_admin.setAddress();
    //     await tx.wait();
    //     console.log(`${contract} address setup completed`);

    //     await new Promise(resolve => setTimeout(resolve, 5000));
    // }
    // console.log("\nAll contract addresses setup completed");


    // =========================================== View functions=============================================

}

// Run deployment script
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Failed:", error);
        process.exit(1);
    });
    