import { ethers } from "hardhat";
// import {
//     user_evm_WikiTruth
// } from "../../WikiTruth_account";
import { wikiTruth_contracts_address } from "../utils/wikiTruth_contracts_address";
// import { v3_core_testnet_address, v3_periphery_testnet_address } from "../utils/v3_testnet_address";
import { getSigners_SapphireTestnet } from "../utils/signers-sapphire-testnet";
// import { domainList } from "../../test/utils";

/**
 * 
 * @returns Read WikiTruth contract data
 * 
 * Run command: npx hardhat run scripts/wikiTruth-testnet/writeExchange.ts --network sapphire-testnet
 */

async function main() {
    console.log("Starting transaction...");

    // Check chainId 
    const network = await ethers.provider.getNetwork();
    console.log("🌐 Network ID:", network.chainId);
    if (Number(network.chainId) !== 23295 ) {
        console.error("Current network ID is not 23295, please check network ID");
        return;
    }

    const { buyerSigner } = await getSigners_SapphireTestnet();
        if (!buyerSigner) {
            console.error("signer does not exist");
            return;
        }
    
    const exchange = await ethers.getContractAt("Exchange", wikiTruth_contracts_address.exchange);
    const exchange_buyer = exchange.connect(buyerSigner) as any;

    const tx_1 = await exchange_buyer.bid(0);
    console.log("bid_0:", tx_1);
    await new Promise(resolve => setTimeout(resolve, 5000));

    // const tx_exchange = await exchange.refundRequestPeriod();
    // console.log("refundRequestPeriod:", tx_exchange);
    
    console.log("\nCompleted---------------");

    // =========================================== View functions=============================================

}

// Run deployment script
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Failed:", error);
        process.exit(1);
    });
    