import { ethers } from "hardhat";
import {
    user_evm_WikiTruth
} from "../../WikiTruth_account";
import { wikiTruth_contracts_address } from "../utils/wikiTruth_contracts_address";
import { getSiweMsg, erc191sign  } from "../utils/SiweAuth";
import { getSigners_SapphireTestnet } from "../utils/signers-sapphire-testnet";

/**
 * 
 * @returns Read WikiTruth TruthBox contract data
 * 
 * Run command: npx hardhat run scripts/wikiTruth-testnet/readTruthBox.ts --network sapphire-testnet
 */

async function main() {
    console.log("Starting to read WikiTruth TruthBox contract data...");

    // Check chainId 
    const network = await ethers.provider.getNetwork();
    console.log("🌐 Current network ID:", network.chainId);
    if (Number(network.chainId) !== 23295 ) {
        console.error("Current network ID is not 23295, please check network ID");
        return;
    }

    const { minterSigner } = await getSigners_SapphireTestnet();
    if (!minterSigner) {
        console.error("minterSigner does not exist");
        return;
    }

    const siweStr = await getSiweMsg("wikitruth.eth.limo", minterSigner, 23295);
    if (!siweStr) {
        console.error("siweStr does not exist");
        return;
    }
    const siweSig = await erc191sign(siweStr, minterSigner);
    if (!siweSig) {
        console.error("siweSig does not exist");
        return;
    }
    // console.log(" login SiweAuth...");
    // const siweAuth = await ethers.getContractAt("SiweAuthWikiTruth", wikiTruth_contracts_address.siweAuth);
    // const siweToken = await siweAuth.login(siweStr, siweSig);
    // console.log("login:", siweToken);
    // await new Promise(resolve => setTimeout(resolve, 5000));
    
    // console.log("\nSiweAuth login completed");

    // =========================================== View functions=============================================

    // getPrivateData(uint256 boxId_, bytes memory siweToken_)
    const truthBoxAddress = wikiTruth_contracts_address.truthBox;

    const truthBox = await ethers.getContractAt("TruthBox", truthBoxAddress);
    const truthBox_minter = truthBox.connect(minterSigner) as any;

    // const tx_truthBox = await truthBox_minter.getPrivateData(0, siweToken);
    // console.log("getPrivateData:", tx_truthBox);
    // await new Promise(resolve => setTimeout(resolve, 5000));

    const getBasicData = await truthBox_minter.getBasicData(0);
    console.log("getBasicData_0:", getBasicData);
    await new Promise(resolve => setTimeout(resolve, 5000));



}

// Run deployment script
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Failed:", error);
        process.exit(1);
    });
    