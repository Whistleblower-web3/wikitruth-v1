import { ethers } from "hardhat";
import { wikiTruth_contracts_address } from "../utils/wikiTruth_contracts_address";
// import { domainList } from "../../test/utils";

/**
 * 
 * @returns Read WikiTruth contract data
 * 
 * npx hardhat run scripts/wikiTruth-testnet/readAddressManager.ts --network sapphire-testnet
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

    console.log("\n3. Setting data for each contract...");
    console.log("   3.1 Reading AddressManager...");
    const addressManager = await ethers.getContractAt("AddressManager", wikiTruth_contracts_address.addressManager);
    // const tx_addressManager = await addressManager.getTokenList();
    // console.log("addressManager_tokenList :", tx_addressManager);
    const tx_addressManager = await addressManager.officialToken();
    console.log("addressManager_officialToken() :", tx_addressManager);
    // await new Promise(resolve => setTimeout(resolve, 5000));

    //   '0x449e2CD61F0328Ae68f4A530170C892B45b4B269',
    //   '0xDf698806B03C54e9CafE81caCaE54Ce1727DD134',
    //   '0x4e30337908E19917f3F74adB45966114A55205c2'
    // const tx_0 = await addressManager.isTokenSupported('0x449e2CD61F0328Ae68f4A530170C892B45b4B269');
    // console.log("addressManager_tx0 :", tx_0);
    // const tx_1 = await addressManager.isTokenSupported('0xDf698806B03C54e9CafE81caCaE54Ce1727DD134');
    // console.log("addressManager_tx1 :", tx_1);
    // const tx_2 = await addressManager.isTokenSupported('0x449e2CD61F0328Ae68f4A530170C892B45b4B269');
    // console.log("addressManager_tx2 :", tx_2);
    // await new Promise(resolve => setTimeout(resolve, 5000));

    console.log("\nAll contract data reading completed");


    // =========================================== View functions=============================================

}

// Run deployment script
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Failed:", error);
        process.exit(1);
    });
    