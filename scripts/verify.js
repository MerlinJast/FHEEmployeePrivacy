const { run } = require("hardhat");

/**
 * Verification script for Employee Privacy Survey Contract
 * Verifies the contract on Etherscan
 *
 * Usage: npx hardhat run scripts/verify.js --network sepolia
 * Or: node scripts/verify.js <contract-address>
 */
async function main() {
  // Get contract address from command line or use default
  const contractAddress = process.argv[2] || process.env.CONTRACT_ADDRESS;

  if (!contractAddress) {
    console.error("Error: Contract address not provided");
    console.log("\nUsage:");
    console.log("  node scripts/verify.js <contract-address>");
    console.log("  Or set CONTRACT_ADDRESS environment variable");
    console.log("\nExample:");
    console.log("  node scripts/verify.js 0x1234567890123456789012345678901234567890");
    process.exit(1);
  }

  console.log("Starting contract verification...");
  console.log("=".repeat(50));
  console.log("Contract Address:", contractAddress);
  console.log("Network:", network.name);
  console.log("=".repeat(50));

  try {
    console.log("Verifying contract on Etherscan...");

    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: [],
      contract: "contracts/EmployeePrivacyFHE.sol:EmployeePrivacyFHE",
    });

    console.log("=".repeat(50));
    console.log("✓ Contract verified successfully!");
    console.log("=".repeat(50));
    console.log("\nView on Etherscan:");

    if (network.name === "sepolia") {
      console.log(`https://sepolia.etherscan.io/address/${contractAddress}#code`);
    } else if (network.name === "mainnet") {
      console.log(`https://etherscan.io/address/${contractAddress}#code`);
    } else {
      console.log("Check your network explorer for verification status");
    }

  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("=".repeat(50));
      console.log("Contract is already verified!");
      console.log("=".repeat(50));

      if (network.name === "sepolia") {
        console.log(`View on Etherscan: https://sepolia.etherscan.io/address/${contractAddress}#code`);
      }
    } else {
      console.error("Verification failed:");
      console.error(error.message);
      throw error;
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
