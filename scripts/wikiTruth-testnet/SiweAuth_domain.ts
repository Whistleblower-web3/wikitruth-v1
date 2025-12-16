import { ethers } from "hardhat";
import {
    user_evm_WikiTruth
} from "../../WikiTruth_account";
import { wikiTruth_contracts_address } from "../utils/wikiTruth_contracts_address";
// import { v3_core_testnet_address, v3_periphery_testnet_address } from "../utils/v3_testnet_address";
// import { domainList } from "../../test/utils";

/**
 * 
 * @returns Initialize WikiTruth contracts to sapphire-testnet testnet
 * 
 * 1. Set SiweAuthWikiTruth PrimaryDomain
 * 2. Set SiweAuthWikiTruth Domains
 * 
 * Run command: npx hardhat run scripts/wikiTruth-testnet/SiweAuth_domain.ts --network sapphire-testnet
 */

// NOTE PrimaryDomain and Domains have already been set during contract deployment
// So there is no need to initialize this contract.

const primaryDomain = "wikitruth.eth.limo";
const domains = [
    // "none", // Do not add any domain, after each successful addition, activate 'none' to prevent accidental script execution
    // "truthwiki.eth.limo", // Already added
    "localhost",
    "localhost:3000",
];

const domains_remove = [
    "none", // NOTE Do not remove any domain, after each successful removal, activate 'none' to prevent accidental script execution
    // "localhost:3000",
];


async function main() {
    console.log("Starting initialization of WikiTruth SiweAuthWikiTruth...");

    // Check chainId 
    const network = await ethers.provider.getNetwork();
    console.log("🌐 Current network ID:", network.chainId);
    if (Number(network.chainId) !== 23295) {
        console.error("Current network ID is not 23295, please check network ID");
        return;
    }

    // let adminAddress = '';

    // if (!adminAddress) {
    //     console.error("adminAddress does not exist");
    //     return;
    // }

    console.log("\n1. Getting SiweAuthWikiTruth contract...");
    const siweAuth = await ethers.getContractAt("SiweAuthWikiTruth", wikiTruth_contracts_address.siweAuth);

    // =========================== Write functions ==================================
    // console.log("\n2. Setting SiweAuthWikiTruth PrimaryDomain...");
    // await siweAuth.setPrimaryDomain(primaryDomain);
    // console.log("\nSiweAuthWikiTruth PrimaryDomain setup completed");

    await new Promise(resolve => setTimeout(resolve, 5000));

    if (domains.includes('none')) {
        console.error("No domains need to be added");
        return;
    } else {
        console.log("\n3. Setting SiweAuthWikiTruth Domains...");
        for (const domain of domains) {
            await siweAuth.addDomain(domain);
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        console.log("\nSiweAuthWikiTruth Domains setup completed");
    }

    await new Promise(resolve => setTimeout(resolve, 5000));

    if (domains_remove.includes('none')) {
        console.error("No domains need to be removed");
        return;
    } else {
        console.log("\n4. Removing SiweAuthWikiTruth Domains...");
        for (const domain of domains_remove) {
            await siweAuth.removeDomain(domain);
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        console.log("\nSiweAuthWikiTruth Domains removal completed");
    }

    await new Promise(resolve => setTimeout(resolve, 5000));

}

// Run deployment script
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Failed:", error);
        process.exit(1);
    });
