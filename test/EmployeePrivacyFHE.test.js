const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("EmployeePrivacyFHE", function () {
  // Fixture to deploy contract
  async function deployContractFixture() {
    const [owner, employee1, employee2, employee3] = await ethers.getSigners();

    const EmployeePrivacyFHE = await ethers.getContractFactory("EmployeePrivacyFHE");
    const contract = await EmployeePrivacyFHE.deploy();

    return { contract, owner, employee1, employee2, employee3 };
  }

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      const { contract, owner } = await loadFixture(deployContractFixture);
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("Should initialize survey counter to 0", async function () {
      const { contract } = await loadFixture(deployContractFixture);
      expect(await contract.surveyCounter()).to.equal(0);
    });
  });

  describe("Survey Creation", function () {
    it("Should create a survey successfully", async function () {
      const { contract } = await loadFixture(deployContractFixture);

      const questions = [
        "Question 1",
        "Question 2",
        "Question 3"
      ];

      await expect(
        contract.createSurvey(
          "Test Survey",
          "Test Description",
          questions,
          7
        )
      ).to.emit(contract, "SurveyCreated");

      expect(await contract.surveyCounter()).to.equal(1);
    });

    it("Should store correct survey details", async function () {
      const { contract, owner } = await loadFixture(deployContractFixture);

      const questions = ["Q1", "Q2"];
      await contract.createSurvey("Title", "Description", questions, 7);

      const surveyInfo = await contract.getSurvey(1);
      expect(surveyInfo[0]).to.equal(owner.address); // creator
      expect(surveyInfo[1]).to.equal("Title"); // title
      expect(surveyInfo[2]).to.equal("Description"); // description
      expect(surveyInfo[5]).to.be.true; // active
    });

    it("Should fail with empty title", async function () {
      const { contract } = await loadFixture(deployContractFixture);

      await expect(
        contract.createSurvey("", "Description", ["Q1"], 7)
      ).to.be.revertedWith("Title cannot be empty");
    });

    it("Should fail with no questions", async function () {
      const { contract } = await loadFixture(deployContractFixture);

      await expect(
        contract.createSurvey("Title", "Description", [], 7)
      ).to.be.revertedWith("Must have at least one question");
    });

    it("Should fail with zero duration", async function () {
      const { contract } = await loadFixture(deployContractFixture);

      await expect(
        contract.createSurvey("Title", "Description", ["Q1"], 0)
      ).to.be.revertedWith("Duration must be positive");
    });
  });

  describe("Response Submission", function () {
    async function createSurveyFixture() {
      const { contract, owner, employee1, employee2, employee3 } =
        await loadFixture(deployContractFixture);

      const questions = ["Q1", "Q2", "Q3"];
      await contract.createSurvey("Survey", "Description", questions, 7);

      return { contract, owner, employee1, employee2, employee3 };
    }

    it("Should submit response successfully", async function () {
      const { contract, employee1 } = await loadFixture(createSurveyFixture);

      const ratings = [5, 4, 3];
      await expect(
        contract.connect(employee1).submitResponse(1, ratings)
      ).to.emit(contract, "ResponseSubmitted");
    });

    it("Should track response count", async function () {
      const { contract, employee1 } = await loadFixture(createSurveyFixture);

      const ratings = [5, 4, 3];
      await contract.connect(employee1).submitResponse(1, ratings);

      const info = await contract.getCurrentSurveyInfo(1);
      expect(info[2]).to.equal(1); // totalResponses
    });

    it("Should prevent duplicate responses", async function () {
      const { contract, employee1 } = await loadFixture(createSurveyFixture);

      const ratings = [5, 4, 3];
      await contract.connect(employee1).submitResponse(1, ratings);

      await expect(
        contract.connect(employee1).submitResponse(1, ratings)
      ).to.be.revertedWith("Already responded");
    });

    it("Should fail with incorrect answer count", async function () {
      const { contract, employee1 } = await loadFixture(createSurveyFixture);

      const ratings = [5, 4]; // Only 2 ratings for 3 questions
      await expect(
        contract.connect(employee1).submitResponse(1, ratings)
      ).to.be.revertedWith("Answer count mismatch");
    });

    it("Should fail with invalid rating value (too low)", async function () {
      const { contract, employee1 } = await loadFixture(createSurveyFixture);

      const ratings = [0, 4, 3]; // 0 is invalid
      await expect(
        contract.connect(employee1).submitResponse(1, ratings)
      ).to.be.revertedWith("Rating must be between 1-5");
    });

    it("Should fail with invalid rating value (too high)", async function () {
      const { contract, employee1 } = await loadFixture(createSurveyFixture);

      const ratings = [5, 6, 3]; // 6 is invalid
      await expect(
        contract.connect(employee1).submitResponse(1, ratings)
      ).to.be.revertedWith("Rating must be between 1-5");
    });

    it("Should allow multiple employees to respond", async function () {
      const { contract, employee1, employee2, employee3 } =
        await loadFixture(createSurveyFixture);

      const ratings1 = [5, 4, 3];
      const ratings2 = [3, 2, 4];
      const ratings3 = [4, 5, 5];

      await contract.connect(employee1).submitResponse(1, ratings1);
      await contract.connect(employee2).submitResponse(1, ratings2);
      await contract.connect(employee3).submitResponse(1, ratings3);

      const info = await contract.getCurrentSurveyInfo(1);
      expect(info[2]).to.equal(3); // 3 responses
    });

    it("Should track response status correctly", async function () {
      const { contract, employee1, employee2 } =
        await loadFixture(createSurveyFixture);

      const ratings = [5, 4, 3];
      await contract.connect(employee1).submitResponse(1, ratings);

      expect(await contract.hasResponded(1, employee1.address)).to.be.true;
      expect(await contract.hasResponded(1, employee2.address)).to.be.false;
    });
  });

  describe("Survey Management", function () {
    async function createSurveyWithResponsesFixture() {
      const { contract, owner, employee1, employee2 } =
        await loadFixture(deployContractFixture);

      const questions = ["Q1", "Q2", "Q3"];
      await contract.createSurvey("Survey", "Description", questions, 7);

      const ratings = [5, 4, 3];
      await contract.connect(employee1).submitResponse(1, ratings);
      await contract.connect(employee2).submitResponse(1, ratings);

      return { contract, owner, employee1, employee2 };
    }

    it("Should close survey by creator", async function () {
      const { contract } = await loadFixture(createSurveyWithResponsesFixture);

      await contract.closeSurvey(1);
      const info = await contract.getSurvey(1);
      expect(info[5]).to.be.false; // active = false
    });

    it("Should fail to close survey by non-creator", async function () {
      const { contract, employee1 } =
        await loadFixture(createSurveyWithResponsesFixture);

      await expect(
        contract.connect(employee1).closeSurvey(1)
      ).to.be.revertedWith("Not survey creator");
    });

    it("Should publish results after closing", async function () {
      const { contract } = await loadFixture(createSurveyWithResponsesFixture);

      await contract.closeSurvey(1);
      await expect(contract.publishResults(1))
        .to.emit(contract, "ResultsPublished");
    });

    it("Should fail to publish results for active survey", async function () {
      const { contract } = await loadFixture(createSurveyWithResponsesFixture);

      await expect(
        contract.publishResults(1)
      ).to.be.revertedWith("Survey still active");
    });

    it("Should fail to publish results with no responses", async function () {
      const { contract } = await loadFixture(deployContractFixture);

      const questions = ["Q1", "Q2"];
      await contract.createSurvey("Survey", "Description", questions, 7);
      await contract.closeSurvey(1);

      await expect(
        contract.publishResults(1)
      ).to.be.revertedWith("No responses");
    });

    it("Should fail to submit response after closing", async function () {
      const { contract, employee1 } =
        await loadFixture(createSurveyWithResponsesFixture);

      await contract.closeSurvey(1);

      await expect(
        contract.connect(employee1).submitResponse(1, [5, 4, 3])
      ).to.be.revertedWith("Survey not active");
    });
  });

  describe("Survey Queries", function () {
    it("Should return correct survey questions", async function () {
      const { contract } = await loadFixture(deployContractFixture);

      const questions = ["Question 1", "Question 2", "Question 3"];
      await contract.createSurvey("Survey", "Desc", questions, 7);

      const retrievedQuestions = await contract.getSurveyQuestions(1);
      expect(retrievedQuestions.length).to.equal(3);
      expect(retrievedQuestions[0]).to.equal("Question 1");
      expect(retrievedQuestions[1]).to.equal("Question 2");
      expect(retrievedQuestions[2]).to.equal("Question 3");
    });

    it("Should return total surveys count", async function () {
      const { contract } = await loadFixture(deployContractFixture);

      expect(await contract.getTotalSurveys()).to.equal(0);

      await contract.createSurvey("S1", "D1", ["Q1"], 7);
      expect(await contract.getTotalSurveys()).to.equal(1);

      await contract.createSurvey("S2", "D2", ["Q1"], 7);
      expect(await contract.getTotalSurveys()).to.equal(2);
    });

    it("Should return current survey info correctly", async function () {
      const { contract, employee1 } = await loadFixture(deployContractFixture);

      const questions = ["Q1", "Q2"];
      await contract.createSurvey("Survey", "Desc", questions, 7);
      await contract.connect(employee1).submitResponse(1, [5, 4]);

      const info = await contract.getCurrentSurveyInfo(1);
      expect(info[0]).to.be.true; // active
      expect(info[1]).to.be.false; // resultsPublished
      expect(info[2]).to.equal(1); // totalResponses
      expect(info[3]).to.equal(2); // questionsCount
    });
  });

  describe("Ownership", function () {
    it("Should transfer ownership", async function () {
      const { contract, employee1 } = await loadFixture(deployContractFixture);

      await contract.transferOwnership(employee1.address);
      expect(await contract.owner()).to.equal(employee1.address);
    });

    it("Should fail to transfer ownership by non-owner", async function () {
      const { contract, employee1, employee2 } =
        await loadFixture(deployContractFixture);

      await expect(
        contract.connect(employee1).transferOwnership(employee2.address)
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("Time-based Functionality", function () {
    it("Should expire survey after duration", async function () {
      const { contract, employee1 } = await loadFixture(deployContractFixture);

      const questions = ["Q1"];
      await contract.createSurvey("Survey", "Desc", questions, 1); // 1 day

      // Fast forward time
      await time.increase(2 * 24 * 60 * 60); // 2 days

      // Should fail to submit response after expiration
      await expect(
        contract.connect(employee1).submitResponse(1, [5])
      ).to.be.revertedWith("Survey expired");
    });

    it("Should allow response before expiration", async function () {
      const { contract, employee1 } = await loadFixture(deployContractFixture);

      const questions = ["Q1"];
      await contract.createSurvey("Survey", "Desc", questions, 7);

      // Submit before expiration
      await contract.connect(employee1).submitResponse(1, [5]);

      expect(await contract.hasResponded(1, employee1.address)).to.be.true;
    });
  });

  describe("Edge Cases", function () {
    it("Should handle maximum questions", async function () {
      const { contract } = await loadFixture(deployContractFixture);

      const questions = Array(20).fill().map((_, i) => `Question ${i + 1}`);
      await contract.createSurvey("Survey", "Desc", questions, 7);

      const retrievedQuestions = await contract.getSurveyQuestions(1);
      expect(retrievedQuestions.length).to.equal(20);
    });

    it("Should handle all ratings as 5", async function () {
      const { contract, employee1 } = await loadFixture(deployContractFixture);

      const questions = ["Q1", "Q2", "Q3"];
      await contract.createSurvey("Survey", "Desc", questions, 7);

      await contract.connect(employee1).submitResponse(1, [5, 5, 5]);
      expect(await contract.hasResponded(1, employee1.address)).to.be.true;
    });

    it("Should handle all ratings as 1", async function () {
      const { contract, employee1 } = await loadFixture(deployContractFixture);

      const questions = ["Q1", "Q2", "Q3"];
      await contract.createSurvey("Survey", "Desc", questions, 7);

      await contract.connect(employee1).submitResponse(1, [1, 1, 1]);
      expect(await contract.hasResponded(1, employee1.address)).to.be.true;
    });
  });
});
