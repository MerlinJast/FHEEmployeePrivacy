const { ethers } = require("hardhat");

/**
 * Deployment script for Employee Privacy Survey Contract
 * Deploys the EmployeePrivacyFHE contract to the specified network
 */
async function main() {
  console.log("Starting deployment process...");
  console.log("=".repeat(50));

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);

  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");
  console.log("=".repeat(50));

  // Get contract factory
  const EmployeePrivacyFHE = await ethers.getContractFactory("EmployeePrivacyFHE");

  console.log("Deploying EmployeePrivacyFHE contract...");

  // Deploy contract
  const contract = await EmployeePrivacyFHE.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("✓ EmployeePrivacyFHE deployed to:", contractAddress);
  console.log("=".repeat(50));

  // Verify deployment
  console.log("Verifying deployment...");
  const owner = await contract.owner();
  const surveyCounter = await contract.surveyCounter();

  console.log("Contract owner:", owner);
  console.log("Initial survey counter:", surveyCounter.toString());
  console.log("=".repeat(50));

  // Save deployment info
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    contractAddress: contractAddress,
    deployer: deployer.address,
    deploymentBlock: await ethers.provider.getBlockNumber(),
    timestamp: new Date().toISOString(),
    owner: owner,
  };

  console.log("\nDeployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  console.log("=".repeat(50));

  // Instructions for next steps
  console.log("\nNext Steps:");
  console.log("1. Save the contract address:", contractAddress);
  console.log("2. Verify on Etherscan:");
  console.log(`   npx hardhat verify --network ${process.env.HARDHAT_NETWORK || 'sepolia'} ${contractAddress}`);
  console.log("3. Test interaction:");
  console.log("   npx hardhat run scripts/interact.js --network", process.env.HARDHAT_NETWORK || 'sepolia');
  console.log("4. Update frontend with contract address");
  console.log("=".repeat(50));

  return contractAddress;
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:");
    console.error(error);
    process.exit(1);
  });
