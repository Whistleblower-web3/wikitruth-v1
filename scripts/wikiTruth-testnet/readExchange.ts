import { ethers } from "hardhat";
import {
    user_evm_WikiTruth
} from "../../WikiTruth_account";
import { wikiTruth_contracts_address } from "../utils/wikiTruth_contracts_address";
import { v3_core_testnet_address, v3_periphery_testnet_address } from "../utils/v3_testnet_address";
// import { domainList } from "../../test/utils";

/**
 * 
 * @returns Read WikiTruth contract data
 * 
 * Run command: npx hardhat run scripts/wikiTruth-testnet/readExchange.ts --network sapphire-testnet
 */

async function main() {
    console.log("Starting to read all WikiTruth contract data...");

    // Check chainId 
    const network = await ethers.provider.getNetwork();
    console.log("🌐 Current network ID:", network.chainId);
    if (Number(network.chainId) !== 23295 ) {
        console.error("Current network ID is not 23295, please check network ID");
        return;
    }
    
    console.log("   3.1 Reading Exchange...");
    const exchange = await ethers.getContractAt("Exchange", wikiTruth_contracts_address.exchange);
    // const tx_exchange = await exchange.refundRequestPeriod();
    // console.log("refundRequestPeriod:", tx_exchange);
    // const tx_exchange2 = await exchange.refundReviewPeriod();
    // console.log("refundReviewPeriod:", tx_exchange2);
    // const tx_exchange3 = await exchange.bidIncrementRate();
    // console.log("bidIncrementRate:", tx_exchange3);

    // const tx_5 = await exchange.acceptedToken(5);
    // console.log("acceptedToken_5:", tx_5);
    // const tx_6 = await exchange.acceptedToken(6);
    // console.log("acceptedToken_5:", tx_6);
    // await new Promise(resolve => setTimeout(resolve, 5000));

    // const tx_exchange = await exchange.refundRequestPeriod();
    // console.log("refundRequestPeriod:", tx_exchange);

    const buyerOf_debug = await exchange.buyerOf_debug(0);
    console.log("buyerOf_debug_0:", buyerOf_debug);
    await new Promise(resolve => setTimeout(resolve, 5000));

    const acceptedToken = await exchange.acceptedToken(0);
    console.log("acceptedToken_0:", acceptedToken);
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log("\nCompleted");

    // =========================================== View functions=============================================

}

// Run deployment script
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Failed:", error);
        process.exit(1);
    });
    