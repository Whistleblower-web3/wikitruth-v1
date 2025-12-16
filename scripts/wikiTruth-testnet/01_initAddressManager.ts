import { ethers } from "hardhat";
import {
    user_evm_WikiTruth
} from "../../WikiTruth_account";
import { wikiTruth_contracts_address } from "../utils/wikiTruth_contracts_address";
import { v3_core_testnet_address, v3_periphery_testnet_address } from "../utils/v3_testnet_address";
import { getSigners_SapphireTestnet } from "../utils/signers-sapphire-testnet";
// import { domainList } from "../../test/utils";

/**
 * 
 * @returns Initialize WikiTruth contracts to sapphire-testnet testnet
 * 
 * 1. Set AddressManager address list
 * 2. Set all contract addresses
 * 3. Set OfficialToken
 * 4. Add WROSESecret as supported token
 * 
 * Run command: npx hardhat run scripts/wikiTruth-testnet/01_initAddressManager.ts --network sapphire-testnet
 */


async function main() {
    console.log("Starting initialization of WikiTruth AddressManager...");

    // Check chainId 
    const network = await ethers.provider.getNetwork();
    console.log("🌐 Current network ID:", network.chainId);
    if (Number(network.chainId) !== 23295 ) {
        console.error("Current network ID is not 23295, please check network ID");
        return;
    }

    const adminAddress = user_evm_WikiTruth.admin.address;
    const daoFundManagerAddress = user_evm_WikiTruth.daoFundManager.address;

    if (!adminAddress || !daoFundManagerAddress) {
        console.error("adminAddress or daoFundManagerAddress does not exist");
        return;
    }

    const { adminSigner } = await getSigners_SapphireTestnet();
    if (!adminSigner) {
        console.error("adminSigner does not exist");
        return;
    }

    console.log("\n1. Getting AddressManager contract...");
    const addressManager = await ethers.getContractAt("AddressManager", wikiTruth_contracts_address.addressManager);
    // const addressManager_admin = addressManager.connect(adminSigner) as any;

    /**
     * @dev Set AddressManager address list
     * @param contractList Contract list
     * @returns Setup completed
     * [
        dao, 
        governance, 
        daoFundManager, 
        userId, 
        siweAuth, 
        truthBox, 
        truthNFT, 
        exchange, 
        fundManager, 
        swapContract,
        quoter
        ]

     */
    const contractList: string[] = [
        adminAddress, // dao, temporarily using admin address
        ethers.ZeroAddress, // governance, not set for now
        daoFundManagerAddress, // daoFundManager, temporarily using admin address
        wikiTruth_contracts_address.userId, // userId, 
        wikiTruth_contracts_address.siweAuth, // siweAuth, 
        wikiTruth_contracts_address.truthBox, // truthBox, 
        wikiTruth_contracts_address.truthNFT, // truthNFT, 
        wikiTruth_contracts_address.exchange, // exchange, 
        wikiTruth_contracts_address.fundManager, // fundManager, 
        v3_periphery_testnet_address.swapRouter, // swapContract, using Uniswap V3 SwapRouter
        v3_periphery_testnet_address.quoter, // quoter, using Uniswap V3 Quoter
    ]

    if (contractList.length !== 11) {
        console.error("contractList length is incorrect");
        return;
    }

    // =========================== Write functions ==================================
    console.log("\n2. Setting AddressManager address list...");
    const tx1 = await addressManager.setAddressList(contractList);
    await tx1.wait();
    console.log("AddressManager address list setup completed");
    await new Promise(resolve => setTimeout(resolve, 8000));

    // console.log("\n3. Setting OfficialToken...");
    // await addressManager.setOfficialToken(wikiTruth_contracts_address.officialToken_Secret);
    // await new Promise(resolve => setTimeout(resolve, 5000));

    // console.log("\n4. Adding token...");
    // await addressManager.addToken(wikiTruth_contracts_address.officialToken_Secret);
    // await new Promise(resolve => setTimeout(resolve, 8000));

    // await addressManager.addToken(wikiTruth_contracts_address.wroseSecret);
    // await new Promise(resolve => setTimeout(resolve, 8000));

    // await addressManager.removeToken(wikiTruth_contracts_address.wroseSecret);
    // await new Promise(resolve => setTimeout(resolve, 8000));

    // console.log("\n5. Interacting setAllAddress...");
    // const tx2 = await addressManager.setAllAddress();
    // await tx2.wait();
    // await new Promise(resolve => setTimeout(resolve, 8000));

    // =========================================== View functions=============================================

    // console.log("dao:", await addressManager.dao());
    // console.log("governance:", await addressManager.governance());
    // console.log("daoFundManager:", await addressManager.daoFundManager());
    // await new Promise(resolve => setTimeout(resolve, 5000));
    // console.log("userId:", await addressManager.userId());
    // console.log("siweAuth:", await addressManager.siweAuth());
    // console.log("truthBox:", await addressManager.truthBox());
    // await new Promise(resolve => setTimeout(resolve, 5000));
    // console.log("truthNFT:", await addressManager.truthNFT());
    // console.log("exchange:", await addressManager.exchange());
    // console.log("fundManager:", await addressManager.fundManager());
    // await new Promise(resolve => setTimeout(resolve, 5000));
    // console.log("swapContract:", await addressManager.swapContract());
    // console.log("quoter:", await addressManager.quoter());

    // await new Promise(resolve => setTimeout(resolve, 5000));

    // console.log("officialToken:", await addressManager.officialToken());
    // console.log("isOfficialToken:", await addressManager.isTokenSupported(wikiTruth_contracts_address.wroseSecret));

}

// Run deployment script
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Failed:", error);
        process.exit(1);
    });
    