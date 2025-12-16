import { ethers } from "hardhat";
import {
    user_evm_WikiTruth
} from "../../WikiTruth_account";
import { wikiTruth_contracts_address } from "../utils/wikiTruth_contracts_address";
const crypto = require('crypto');
import { getSigners_SapphireTestnet } from "../utils/signers-sapphire-testnet";
import { boxList } from "../../mint-data/boxList";
/**
 * 
 * @returns Create WikiTruth TruthBox contract data
 * 
 * Run command: npx hardhat run scripts/wikiTruth-testnet/createTruthBox.ts --network sapphire-testnet
 */

/**
 * @notice Do not use this script lightly, as it is a script used for testing.
 */

async function main() {
    console.log("Starting to create WikiTruth TruthBox contract data...");

    // Check chainId 
    const network = await ethers.provider.getNetwork();
    console.log("🌐 Current network ID:", network.chainId);
    if (Number(network.chainId) !== 23295) {
        console.error("Current network ID is not 23295, please check network ID");
        return;
    }

    const { minterSigner } = await getSigners_SapphireTestnet();
    if (!minterSigner) {
        console.error("minterSigner does not exist");
        return;
    }

    // =========================================== Write functions=============================================

    const truthBoxAddress = wikiTruth_contracts_address.truthBox;

    console.log("   1. Creating TruthBox private data...");
    const truthBox = await ethers.getContractAt("TruthBox", truthBoxAddress);
    const truthBox_minter = truthBox.connect(minterSigner) as any;

    for (const box of boxList) {
        if (box.mintMethod === "create") {
            const randomBytes = crypto.randomBytes(32);
            const priceUint256 = ethers.parseUnits(box.price.toString(), 18);
            // console.log("priceUint256:", priceUint256);

            const tx_truthBox = await truthBox_minter.create(
                box.to, 
                box.metadataNFTCID, 
                box.metadataBoxCID, 
                randomBytes, 
                priceUint256
            );
            await tx_truthBox.wait();
            console.log("create:", tx_truthBox.hash);
        } else if (box.mintMethod === "createAndPublish") {
            const tx_truthBox = await truthBox_minter.createAndPublish(
                box.to, 
                box.metadataNFTCID, 
                box.metadataBoxCID
            );
            await tx_truthBox.wait();
            console.log("createAndPublish:", tx_truthBox.hash);
        }
        await new Promise(resolve => setTimeout(resolve, 8000));
    }




}

// Run deployment script
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Failed:", error);
        process.exit(1);
    });
