const { ethers } = require("hardhat");

/**
 * Interaction script for Employee Privacy Survey Contract
 * Demonstrates all contract functions and usage patterns
 *
 * Usage: npx hardhat run scripts/interact.js --network sepolia
 */

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x32db9e03494b45a0b2b2B85Cfb767CD65B49275A";

async function main() {
  console.log("Employee Privacy Survey - Contract Interaction");
  console.log("=".repeat(60));

  // Get signer
  const [owner, employee1, employee2] = await ethers.getSigners();
  console.log("Owner address:", owner.address);
  console.log("Employee 1 address:", employee1.address);
  console.log("Employee 2 address:", employee2.address);
  console.log("=".repeat(60));

  // Connect to deployed contract
  const EmployeePrivacyFHE = await ethers.getContractFactory("EmployeePrivacyFHE");
  const contract = EmployeePrivacyFHE.attach(CONTRACT_ADDRESS);

  console.log("Connected to contract at:", CONTRACT_ADDRESS);
  console.log("=".repeat(60));

  // 1. Check contract owner
  console.log("\n1. Checking contract owner...");
  const contractOwner = await contract.owner();
  console.log("   Contract owner:", contractOwner);

  // 2. Get total surveys
  console.log("\n2. Getting total surveys...");
  const totalSurveys = await contract.getTotalSurveys();
  console.log("   Total surveys:", totalSurveys.toString());

  // 3. Create a new survey
  console.log("\n3. Creating new employee satisfaction survey...");
  const questions = [
    "How satisfied are you with your work-life balance?",
    "How would you rate the company culture?",
    "How satisfied are you with career development opportunities?",
    "How would you rate team collaboration?",
    "How satisfied are you with compensation and benefits?"
  ];

  const tx = await contract.createSurvey(
    "Q4 2024 Employee Satisfaction Survey",
    "Anonymous quarterly employee feedback survey to improve workplace satisfaction",
    questions,
    7 // 7 days duration
  );

  const receipt = await tx.wait();
  console.log("   ✓ Survey created!");
  console.log("   Transaction hash:", receipt.hash);

  // Get survey ID from event
  const surveyId = await contract.getTotalSurveys();
  console.log("   Survey ID:", surveyId.toString());

  // 4. Get survey details
  console.log("\n4. Fetching survey details...");
  const surveyInfo = await contract.getSurvey(surveyId);
  console.log("   Creator:", surveyInfo[0]);
  console.log("   Title:", surveyInfo[1]);
  console.log("   Description:", surveyInfo[2]);
  console.log("   Active:", surveyInfo[5]);
  console.log("   Total responses:", surveyInfo[7].toString());

  // 5. Get survey questions
  console.log("\n5. Survey questions:");
  const surveyQuestions = await contract.getSurveyQuestions(surveyId);
  surveyQuestions.forEach((q, i) => {
    console.log(`   ${i + 1}. ${q}`);
  });

  // 6. Submit employee responses
  console.log("\n6. Submitting anonymous employee responses...");

  // Employee 1 response (satisfied)
  const ratings1 = [5, 4, 5, 5, 4]; // High satisfaction
  const tx1 = await contract.connect(employee1).submitResponse(surveyId, ratings1);
  await tx1.wait();
  console.log("   ✓ Employee 1 response submitted");

  // Employee 2 response (mixed)
  const ratings2 = [3, 3, 2, 4, 3]; // Mixed satisfaction
  const tx2 = await contract.connect(employee2).submitResponse(surveyId, ratings2);
  await tx2.wait();
  console.log("   ✓ Employee 2 response submitted");

  // 7. Check response status
  console.log("\n7. Checking response status...");
  const hasResponded1 = await contract.hasResponded(surveyId, employee1.address);
  const hasResponded2 = await contract.hasResponded(surveyId, employee2.address);
  console.log("   Employee 1 responded:", hasResponded1);
  console.log("   Employee 2 responded:", hasResponded2);

  // 8. Get current survey info
  console.log("\n8. Current survey status...");
  const currentInfo = await contract.getCurrentSurveyInfo(surveyId);
  console.log("   Active:", currentInfo[0]);
  console.log("   Results published:", currentInfo[1]);
  console.log("   Total responses:", currentInfo[2].toString());
  console.log("   Questions count:", currentInfo[3].toString());
  console.log("   Time remaining (seconds):", currentInfo[4].toString());

  // 9. Close survey (only owner)
  console.log("\n9. Closing survey...");
  const closeTx = await contract.closeSurvey(surveyId);
  await closeTx.wait();
  console.log("   ✓ Survey closed");

  // 10. Publish results
  console.log("\n10. Publishing results...");
  const publishTx = await contract.publishResults(surveyId);
  await publishTx.wait();
  console.log("   ✓ Results published");

  console.log("\n" + "=".repeat(60));
  console.log("Interaction complete!");
  console.log("=".repeat(60));
  console.log("\nSummary:");
  console.log(`- Created survey: ${surveyId}`);
  console.log("- Questions:", questions.length);
  console.log("- Responses collected: 2");
  console.log("- Survey status: Closed, Results Published");
  console.log("\nNote: Individual responses remain encrypted using FHE.");
  console.log("Only aggregated statistics can be decrypted by the survey creator.");
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\nInteraction failed:");
    console.error(error);
    process.exit(1);
  });
