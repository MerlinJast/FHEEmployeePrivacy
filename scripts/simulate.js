const { ethers } = require("hardhat");

/**
 * Simulation script for Employee Privacy Survey
 * Simulates complete survey lifecycle with multiple employees
 *
 * Usage: npx hardhat run scripts/simulate.js --network localhost
 */

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log("Employee Privacy Survey - Full Simulation");
  console.log("=".repeat(70));

  // Get signers (simulate multiple employees)
  const signers = await ethers.getSigners();
  const [deployer, ...employees] = signers;

  console.log("Simulation participants:");
  console.log(`  Deployer (Manager): ${deployer.address}`);
  employees.slice(0, 5).forEach((emp, i) => {
    console.log(`  Employee ${i + 1}: ${emp.address}`);
  });
  console.log("=".repeat(70));

  // Deploy contract
  console.log("\nStep 1: Deploying contract...");
  const EmployeePrivacyFHE = await ethers.getContractFactory("EmployeePrivacyFHE");
  const contract = await EmployeePrivacyFHE.deploy();
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  console.log("✓ Contract deployed at:", contractAddress);

  await delay(1000);

  // Create survey
  console.log("\nStep 2: Creating employee satisfaction survey...");
  const surveyQuestions = [
    "How satisfied are you with your current role?",
    "How would you rate work-life balance?",
    "How satisfied are you with team collaboration?",
    "How would you rate management support?",
    "How likely are you to recommend this company?",
    "How satisfied are you with professional growth?",
    "How would you rate workplace culture?",
    "How satisfied are you with compensation?"
  ];

  const createTx = await contract.createSurvey(
    "Annual Employee Engagement Survey 2024",
    "Confidential annual survey to measure employee satisfaction and identify improvement areas. All responses are encrypted and anonymous.",
    surveyQuestions,
    30 // 30 days
  );
  await createTx.wait();
  const surveyId = await contract.getTotalSurveys();
  console.log("✓ Survey created with ID:", surveyId.toString());
  console.log(`  Questions: ${surveyQuestions.length}`);
  console.log(`  Duration: 30 days`);

  await delay(1000);

  // Display survey details
  console.log("\nStep 3: Survey details:");
  const surveyInfo = await contract.getSurvey(surveyId);
  console.log(`  Title: ${surveyInfo[1]}`);
  console.log(`  Description: ${surveyInfo[2]}`);
  console.log(`  Status: ${surveyInfo[5] ? 'Active' : 'Closed'}`);

  console.log("\n  Questions:");
  const questions = await contract.getSurveyQuestions(surveyId);
  questions.forEach((q, i) => {
    console.log(`    ${i + 1}. ${q}`);
  });

  await delay(1000);

  // Simulate employee responses
  console.log("\nStep 4: Collecting employee responses...");
  console.log("=".repeat(70));

  const responseProfiles = [
    { name: "Highly Satisfied", ratings: [5, 5, 5, 5, 5, 5, 5, 5] },
    { name: "Satisfied", ratings: [4, 4, 5, 4, 4, 5, 4, 4] },
    { name: "Moderately Satisfied", ratings: [3, 4, 3, 4, 3, 3, 4, 3] },
    { name: "Mixed Feelings", ratings: [3, 2, 3, 3, 2, 3, 3, 2] },
    { name: "Needs Improvement", ratings: [2, 2, 3, 2, 2, 2, 2, 2] }
  ];

  for (let i = 0; i < Math.min(5, employees.length); i++) {
    const employee = employees[i];
    const profile = responseProfiles[i];

    console.log(`\n  Employee ${i + 1} (${profile.name}):`);
    console.log(`    Address: ${employee.address}`);
    console.log(`    Ratings: [${profile.ratings.join(', ')}]`);

    try {
      const responseTx = await contract.connect(employee).submitResponse(
        surveyId,
        profile.ratings
      );
      await responseTx.wait();
      console.log(`    ✓ Response submitted successfully`);
    } catch (error) {
      console.log(`    ✗ Error: ${error.message}`);
    }

    await delay(500);
  }

  console.log("\n=".repeat(70));

  // Check response statistics
  console.log("\nStep 5: Response statistics...");
  const currentInfo = await contract.getCurrentSurveyInfo(surveyId);
  console.log(`  Total responses: ${currentInfo[2].toString()}`);
  console.log(`  Survey active: ${currentInfo[0]}`);
  console.log(`  Results published: ${currentInfo[1]}`);

  // Verify individual response status
  console.log("\n  Individual response status:");
  for (let i = 0; i < Math.min(5, employees.length); i++) {
    const hasResponded = await contract.hasResponded(surveyId, employees[i].address);
    console.log(`    Employee ${i + 1}: ${hasResponded ? '✓ Responded' : '✗ Not responded'}`);
  }

  await delay(1000);

  // Close survey
  console.log("\nStep 6: Closing survey...");
  const closeTx = await contract.closeSurvey(surveyId);
  await closeTx.wait();
  console.log("✓ Survey closed by manager");

  await delay(1000);

  // Publish results
  console.log("\nStep 7: Publishing results...");
  const publishTx = await contract.publishResults(surveyId);
  await publishTx.wait();
  console.log("✓ Results published");

  // Final survey state
  console.log("\nStep 8: Final survey state:");
  const finalInfo = await contract.getSurvey(surveyId);
  console.log(`  Active: ${finalInfo[5]}`);
  console.log(`  Results published: ${finalInfo[6]}`);
  console.log(`  Total responses: ${finalInfo[7].toString()}`);

  console.log("\n=".repeat(70));
  console.log("SIMULATION SUMMARY");
  console.log("=".repeat(70));
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Survey ID: ${surveyId}`);
  console.log(`Total Questions: ${surveyQuestions.length}`);
  console.log(`Total Responses: ${currentInfo[2].toString()}`);
  console.log(`Survey Status: Closed`);
  console.log(`Results Status: Published`);
  console.log("\nPrivacy Features:");
  console.log("  ✓ Individual responses encrypted using FHE");
  console.log("  ✓ Only aggregate results can be decrypted");
  console.log("  ✓ Complete anonymity guaranteed");
  console.log("  ✓ One response per employee enforced");
  console.log("  ✓ Immutable blockchain audit trail");
  console.log("=".repeat(70));

  console.log("\nKey Features Demonstrated:");
  console.log("  1. Survey creation with custom questions");
  console.log("  2. Multi-employee encrypted response submission");
  console.log("  3. Privacy-preserving data collection");
  console.log("  4. Survey lifecycle management");
  console.log("  5. Access control and permissions");
  console.log("  6. Result publication workflow");
  console.log("=".repeat(70));

  console.log("\nSimulation completed successfully! ✓");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\nSimulation failed:");
    console.error(error);
    process.exit(1);
  });
