import { ethers } from "hardhat";
import { Signer, Wallet } from "ethers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
    user_evm_WikiTruth,
    user_oasis_WikiTruth
} from "../../WikiTruth_account";
import {  wikiTruth_testnet_contracts } from "./wikiTruth_contracts_address";
// import { wrapEthereumProvider } from "@oasisprotocol/sapphire-paratime";

// import { domainList } from "../../test/utils";

/**
 * 
 * @returns Initialize WikiTruth contracts to sapphire-testnet testnet
 * 
 * Run command: npx hardhat run scripts/utils/connects.ts --network sapphire-testnet
 */

export interface ConnectWalletsResult {
    adminSigner: Signer|HardhatEthersSigner | Wallet | null;
    minterSigner: Signer | HardhatEthersSigner | Wallet | null;
    buyerSigner: Signer | HardhatEthersSigner | Wallet | null;
    buyer2Signer: Signer | HardhatEthersSigner | Wallet | null;
    sellerSigner: Signer | HardhatEthersSigner | Wallet | null;
    completerSigner: Signer | HardhatEthersSigner | Wallet | null;
}

export const connectWallets = async function () : Promise<ConnectWalletsResult> {
    console.log("Starting to connect wallets...");

    let accounts

    // Check chainId 
    const network = await ethers.provider.getNetwork();
    if (Number(network.chainId) === 23295 ) {
        accounts = user_evm_WikiTruth;
    } else if (Number(network.chainId) === 23294 ) {
        accounts = user_oasis_WikiTruth;
    } 

    let result: ConnectWalletsResult = {
        adminSigner: null,
        minterSigner: null,
        buyerSigner: null,
        buyer2Signer: null,
        sellerSigner: null,
        completerSigner: null
    };

    if (!accounts) {
        console.error("Network ID does not exist");
        return result;
    }

    // Determine if it's a local network or testnet/mainnet
    const isLocalNetwork = [31337, 23293].includes(Number(network.chainId)); // localhost and sapphire_localnet

    let adminSigner, minterSigner, buyerSigner, buyer2Signer, sellerSigner, completerSigner;

    // Wrap provider first
// const provider = wrapEthereumProvider(ethers.provider as any);


    if (isLocalNetwork) {
        // Local network: use ethers.getSigner (Hardhat manages private keys)
        adminSigner = await ethers.getSigner(accounts.admin.address!);
        minterSigner = await ethers.getSigner(accounts.minter.address!);
        buyerSigner = await ethers.getSigner(accounts.buyer.address!);
        buyer2Signer = await ethers.getSigner(accounts.buyer2.address!);
        sellerSigner = await ethers.getSigner(accounts.seller.address!);
        completerSigner = await ethers.getSigner(accounts.completer.address!);
    } else {
        // Testnet/mainnet: create Wallet using private keys
        if (!accounts.admin.privateKey || 
            !accounts.minter.privateKey || 
            !accounts.buyer.privateKey || 
            !accounts.buyer2.privateKey ||
            !accounts.seller.privateKey || 
            !accounts.completer.privateKey
        ) {
            console.error("No private key");
            return result;
        }

        adminSigner = new ethers.Wallet(accounts.admin.privateKey, ethers.provider );
        minterSigner = new ethers.Wallet(accounts.minter.privateKey, ethers.provider);
        buyerSigner = new ethers.Wallet(accounts.buyer.privateKey, ethers.provider);
        buyer2Signer = new ethers.Wallet(accounts.buyer2.privateKey, ethers.provider);
        sellerSigner = new ethers.Wallet(accounts.seller.privateKey, ethers.provider);
        completerSigner = new ethers.Wallet(accounts.completer.privateKey,ethers.provider);
    }

    // Verify if signer addresses are correct
    if (adminSigner.address.toLowerCase() !== accounts.admin.address!.toLowerCase()) {
        console.error("adminSigner address mismatch");
        return result;
    }
    if (minterSigner.address.toLowerCase() !== accounts.minter.address!.toLowerCase()) {
        console.error("minterSigner address mismatch");
        return result;
    }
    if (buyerSigner.address.toLowerCase() !== accounts.buyer.address!.toLowerCase()) {
        console.error("buyerSigner address mismatch");
        return result;
    }
    if (buyer2Signer.address.toLowerCase() !== accounts.buyer2.address!.toLowerCase()) {
        console.error("buyer2Signer address mismatch");
        return result;
    }
    if (sellerSigner.address.toLowerCase() !== accounts.seller.address!.toLowerCase()) {
        console.error("sellerSigner address mismatch");
        return result;
    }
    if (completerSigner.address.toLowerCase() !== accounts.completer.address!.toLowerCase()) {
        console.error("completerSigner address mismatch");
        return result;
    }

    console.log("✅ All signers created successfully");

    return {
        adminSigner,
        minterSigner,
        buyerSigner,
        buyer2Signer,
        sellerSigner,
        completerSigner
    }

    // =========================================== View functions=============================================

}

// Run deployment script
// main()
//     .then(() => process.exit(0))
//     .catch((error) => {
//         console.error("Failed:", error);
//         process.exit(1);
//     });
    