import { ethers } from "hardhat";
import { user_evm_WikiTruth } from "../../WikiTruth_account";
import { wikiTruth_testnet_contracts } from "../utils/wikiTruth_contracts_address";
import { signEIP712, buildEIP712Permit, PermitType } from "../utils/eip712-simple";
import { getSigners_SapphireTestnet } from "../utils/signers-sapphire-testnet";
/**
 * EIP712 transfer script
 * 1. User from signs EIP712 (transfer type)
 * 2. User write uses this signature to interact and send funds to toAddress
 * 
 * Run command: npx hardhat run scripts/token-testnet/transfer-eip712.ts --network sapphire-testnet
 */

async function main() {
    console.log("🔐 Starting EIP712 transfer process...");

    const network = await ethers.provider.getNetwork();
    console.log("🌐 Network ID:", network.chainId);
    if (Number(network.chainId) !== 23294 && Number(network.chainId) !== 23295) {
        console.error("❌ networkId is not 23294 or 23295");
        return;
    }

    const signers = await getSigners_SapphireTestnet();
    const signer_from = signers.adminSigner;  // Signer (fund sender)
    const signer_write = signers.minterSigner; // Executor (user calling the contract)
    const signer_to = signers.buyerSigner; // Recipient address

    // 3. Verify accounts
    if (!signer_from || !signer_from.address) {
        console.error("❌ User from account does not exist");
        return;
    }
    if (!signer_write || !signer_write.address) {
        console.error("❌ User write account does not exist");
        return;
    }
    if (!signer_to || !signer_to.address) {
        console.error("❌ Recipient address does not exist");
        return;
    }

    const amount_transfer = ethers.parseUnits("100", 18);

    // 2. Get contract information
    const contract2 = wikiTruth_testnet_contracts.find(c => c.name === "OfficialToken_ERC20Secret");
    if (!contract2) {
        console.error(`❌ Contract does not exist`);
        return;
    }
    const secretTokenAddress = contract2.address;


    // 6. Check sender balance
    const secretToken = await ethers.getContractAt(contract2.contract, secretTokenAddress);

    // 7. Generate EIP712 signature (user from signs)
    console.log("\n🔐 Step 1: User from generates EIP712 signature...");
    const permit = await buildEIP712Permit(
        signer_from,
        signer_to.address, // In transfer, spender is the recipient address
        amount_transfer,
        PermitType.Transfer,
        secretTokenAddress,
    );

    console.log("\n📤 Step 2: User write uses signature to execute transfer...");

    // Use write account to connect contract and call transferWithPermit
    const secretTokenWithWrite = secretToken.connect(signer_write) as any;
    const tx = await secretTokenWithWrite.transferWithPermit(permit);
    // const tx = await secretToken.transferWithPermit(permit);
    console.log(`   Transaction hash: ${tx.hash}`);

    console.log("⏳ Waiting for transaction confirmation...");
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed successfully! Block number: ${receipt.blockNumber}`);

    console.log("\n✅ EIP712 transfer process completed!");
}

// Run deployment script
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Failed:", error);
        process.exit(1);
    });
