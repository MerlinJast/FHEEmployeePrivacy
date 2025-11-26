# API Documentation - Employee Privacy Survey Platform

## Smart Contract API Reference

### Contract Address
- **Network**: Sepolia Ethereum Testnet
- **Contract**: `EmployeePrivacyFHE`

---

## Table of Contents

1. [Core Functions](#core-functions)
2. [Survey Management](#survey-management)
3. [Response Submission](#response-submission)
4. [Decryption & Gateway Callback](#decryption--gateway-callback)
5. [Refund Mechanisms](#refund-mechanisms)
6. [Query Functions](#query-functions)
7. [Administrative Functions](#administrative-functions)
8. [Events](#events)
9. [Code Examples](#code-examples)

---

## Core Functions

### createSurvey

Creates a new employee satisfaction survey.

```solidity
function createSurvey(
    string memory _title,
    string memory _description,
    string[] memory _questions,
    uint256 _durationDays
) external returns (uint256 surveyId)
```

**Parameters:**
- `_title`: Survey title (1-200 characters)
- `_description`: Survey description
- `_questions`: Array of survey questions (1-50 questions)
- `_durationDays`: Survey duration in days (1-365 days)

**Returns:**
- `surveyId`: Unique survey identifier

**Requirements:**
- Title must not be empty and ≤ 200 characters
- Must have 1-50 questions
- Duration must be 1-365 days
- Each question must not be empty

**Events Emitted:**
- `SurveyCreated(surveyId, creator, title, endTime)`

**Example:**
```javascript
const surveyId = await contract.createSurvey(
    "Q4 Employee Satisfaction",
    "Quarterly satisfaction survey",
    ["How satisfied are you with your role?", "Would you recommend us?"],
    30
);
```

---

### submitResponse

Submit encrypted survey responses.

```solidity
function submitResponse(
    uint256 _surveyId,
    uint8[] memory _ratings
) external
```

**Parameters:**
- `_surveyId`: Survey identifier
- `_ratings`: Array of ratings (1-5 scale)

**Requirements:**
- Survey must be active
- Survey not expired
- User has not already responded
- Rating count matches question count
- Each rating must be 1-5

**Security:**
- Ratings are encrypted using FHE
- Individual responses never revealed
- Access control prevents duplicate responses
- Overflow protection enabled

**Events Emitted:**
- `ResponseSubmitted(surveyId, respondent, timestamp)`

**Example:**
```javascript
const ratings = [4, 5, 3, 5]; // 1-5 scale
await contract.submitResponse(surveyId, ratings);
```

---

## Survey Management

### closeSurvey

Close a survey (only creator).

```solidity
function closeSurvey(uint256 _surveyId) external
```

**Parameters:**
- `_surveyId`: Survey identifier

**Requirements:**
- Caller must be survey creator
- Valid survey ID

**Access Control:**
- `onlySurveyCreator` modifier

**Example:**
```javascript
await contract.closeSurvey(surveyId);
```

---

### publishResults

Publish survey results and enable decryption.

```solidity
function publishResults(uint256 _surveyId) external
```

**Parameters:**
- `_surveyId`: Survey identifier

**Requirements:**
- Caller must be survey creator
- Survey must be closed (not active)
- Results not already published
- At least one response received

**Events Emitted:**
- `ResultsPublished(surveyId, totalResponses)`

**Example:**
```javascript
await contract.publishResults(surveyId);
```

---

## Decryption & Gateway Callback

### requestQuestionAverage

Request decryption of question average (Gateway callback mode).

```solidity
function requestQuestionAverage(
    uint256 _surveyId,
    uint256 _questionId
) external
```

**Parameters:**
- `_surveyId`: Survey identifier
- `_questionId`: Question index (0-based)

**Requirements:**
- Caller must be survey creator
- Results must be published
- Valid question ID
- Question has responses

**Privacy Protection:**
- Uses random multiplier technique
- Prevents division information leakage
- HCU optimized operations

**Gateway Flow:**
1. Contract calculates encrypted sum
2. Applies random multiplier
3. Requests Gateway decryption
4. Gateway calls back with results
5. Contract processes and stores average

**Events Emitted:**
- `ResultDecryptionRequested(surveyId, questionId, requestId, timestamp)`

**Timeout Protection:**
- 1 hour timeout
- Automatic refund available
- Prevents permanent locks

**Example:**
```javascript
const tx = await contract.requestQuestionAverage(surveyId, 0);
const receipt = await tx.wait();
const requestId = receipt.events[0].args.requestId;
```

---

### processQuestionAverageCallback

Gateway callback function (called by Gateway only).

```solidity
function processQuestionAverageCallback(
    uint256 requestId,
    bytes memory cleartexts,
    bytes memory decryptionProof
) external
```

**Parameters:**
- `requestId`: Decryption request identifier
- `cleartexts`: Decrypted values (ABI encoded)
- `decryptionProof`: Gateway signature proof

**Security:**
- Signature verification via `FHE.checkSignatures`
- Prevents replay attacks
- Validates request not already processed

**Processing:**
1. Verify Gateway signatures
2. Decode decrypted values
3. Remove random multiplier
4. Calculate average rating
5. Store result
6. Emit completion event

**Events Emitted:**
- `DecryptionCompleted(requestId, surveyId, questionId, averageRating)`

**Note:** This function is called automatically by the Gateway. Users should not call it directly.

---

## Refund Mechanisms

### triggerTimeoutRefund

Trigger refund when Gateway timeout exceeded.

```solidity
function triggerTimeoutRefund(uint256 requestId) external
```

**Parameters:**
- `requestId`: Decryption request identifier

**Requirements:**
- Request exists
- Not already completed or refunded
- Timeout period exceeded (1 hour)

**Access:**
- Anyone can call (public good)
- Prevents permanent state locks

**Events Emitted:**
- `TimeoutTriggered(requestId, surveyId, elapsedTime)`
- `RefundIssued(requestId, surveyId, recipient, reason)`
- `DecryptionFailed(requestId, surveyId, reason)`

**Example:**
```javascript
// Check if refund available
const canRefund = await contract.canTriggerRefund(requestId);
if (canRefund) {
    await contract.triggerTimeoutRefund(requestId);
}
```

---

### requestManualRefund

Manual refund mechanism (creator or owner only).

```solidity
function requestManualRefund(
    uint256 requestId,
    string memory reason
) external
```

**Parameters:**
- `requestId`: Decryption request identifier
- `reason`: Justification for refund

**Requirements:**
- Caller must be survey creator or contract owner
- Request not already completed or refunded

**Access Control:**
- Survey creator OR contract owner

**Events Emitted:**
- `RefundIssued(requestId, surveyId, requester, reason)`
- `DecryptionFailed(requestId, surveyId, reason)`

**Example:**
```javascript
await contract.requestManualRefund(
    requestId,
    "Gateway maintenance window"
);
```

---

## Query Functions

### getSurvey

Get survey basic information.

```solidity
function getSurvey(uint256 _surveyId) external view returns (
    address creator,
    string memory title,
    string memory description,
    uint256 startTime,
    uint256 endTime,
    bool active,
    bool resultsPublished,
    uint256 totalResponses
)
```

**Example:**
```javascript
const [creator, title, desc, start, end, active, published, responses] =
    await contract.getSurvey(surveyId);
```

---

### getSurveyQuestions

Get survey questions.

```solidity
function getSurveyQuestions(uint256 _surveyId) external view returns (
    string[] memory
)
```

**Example:**
```javascript
const questions = await contract.getSurveyQuestions(surveyId);
```

---

### hasResponded

Check if address has responded to survey.

```solidity
function hasResponded(
    uint256 _surveyId,
    address _employee
) external view returns (bool)
```

**Example:**
```javascript
const responded = await contract.hasResponded(surveyId, userAddress);
```

---

### getCurrentSurveyInfo

Get comprehensive survey status.

```solidity
function getCurrentSurveyInfo(uint256 _surveyId) external view returns (
    bool active,
    bool resultsPublished,
    uint256 totalResponses,
    uint256 questionsCount,
    uint256 timeRemaining
)
```

**Example:**
```javascript
const [active, published, responses, qCount, timeLeft] =
    await contract.getCurrentSurveyInfo(surveyId);
```

---

### getQuestionResult

Get decrypted question result (if available).

```solidity
function getQuestionResult(
    uint256 _surveyId,
    uint256 _questionId
) external view returns (
    uint8 averageRating,
    uint8 totalResponses,
    bool revealed
)
```

**Example:**
```javascript
const [avgRating, count, isRevealed] =
    await contract.getQuestionResult(surveyId, 0);

if (isRevealed) {
    console.log(`Average: ${avgRating}/5 (${count} responses)`);
}
```

---

### getDecryptionRequestStatus

Get decryption request detailed status.

```solidity
function getDecryptionRequestStatus(uint256 requestId) external view returns (
    uint256 surveyId,
    uint256 questionId,
    uint256 timestamp,
    bool completed,
    bool refunded,
    bool timedOut
)
```

**Example:**
```javascript
const [sId, qId, time, done, refund, timeout] =
    await contract.getDecryptionRequestStatus(requestId);

if (timeout) {
    console.log("Request timed out - refund available");
}
```

---

### canTriggerRefund

Check if refund can be triggered.

```solidity
function canTriggerRefund(uint256 requestId) external view returns (bool)
```

**Example:**
```javascript
const canRefund = await contract.canTriggerRefund(requestId);
```

---

### getSurveyDecryptionStatus

Get survey-level decryption status.

```solidity
function getSurveyDecryptionStatus(uint256 _surveyId) external view returns (
    uint256 requestId,
    uint256 requestTime,
    bool callbackCompleted,
    uint256 timeElapsed
)
```

**Example:**
```javascript
const [reqId, reqTime, completed, elapsed] =
    await contract.getSurveyDecryptionStatus(surveyId);

console.log(`Elapsed: ${elapsed} seconds`);
```

---

### getTotalSurveys

Get total number of surveys created.

```solidity
function getTotalSurveys() external view returns (uint256)
```

**Example:**
```javascript
const total = await contract.getTotalSurveys();
```

---

## Administrative Functions

### transferOwnership

Transfer contract ownership.

```solidity
function transferOwnership(address newOwner) external
```

**Parameters:**
- `newOwner`: New owner address

**Requirements:**
- Caller must be current owner

**Access Control:**
- `onlyOwner` modifier

**Example:**
```javascript
await contract.transferOwnership(newOwnerAddress);
```

---

## Events

### Operational Events

```solidity
event SurveyCreated(
    uint256 indexed surveyId,
    address indexed creator,
    string title,
    uint256 endTime
);

event ResponseSubmitted(
    uint256 indexed surveyId,
    address indexed respondent,
    uint256 timestamp
);

event ResultsPublished(
    uint256 indexed surveyId,
    uint256 totalResponses
);
```

### Gateway Events

```solidity
event ResultDecryptionRequested(
    uint256 indexed surveyId,
    uint256 indexed questionId,
    uint256 requestId,
    uint256 timestamp
);

event DecryptionCompleted(
    uint256 indexed requestId,
    uint256 indexed surveyId,
    uint256 indexed questionId,
    uint8 averageRating
);

event DecryptionFailed(
    uint256 indexed requestId,
    uint256 indexed surveyId,
    string reason
);
```

### Refund Events

```solidity
event RefundIssued(
    uint256 indexed requestId,
    uint256 indexed surveyId,
    address indexed recipient,
    string reason
);

event TimeoutTriggered(
    uint256 indexed requestId,
    uint256 indexed surveyId,
    uint256 elapsedTime
);
```

### Security Events

```solidity
event SecurityAlert(
    string alertType,
    address indexed user,
    uint256 indexed surveyId,
    string details
);
```

---

## Code Examples

### Complete Survey Workflow

```javascript
// 1. Create survey
const surveyTx = await contract.createSurvey(
    "Employee Satisfaction Q4 2025",
    "Quarterly employee feedback",
    [
        "Overall job satisfaction (1-5)",
        "Work-life balance (1-5)",
        "Career development opportunities (1-5)"
    ],
    30 // 30 days
);
const receipt = await surveyTx.wait();
const surveyId = receipt.events[0].args.surveyId;

// 2. Employees submit responses
const employee1 = await contract.connect(signer1).submitResponse(
    surveyId,
    [4, 5, 3]
);

const employee2 = await contract.connect(signer2).submitResponse(
    surveyId,
    [5, 4, 4]
);

// 3. Check survey status
const [active, published, responses] =
    await contract.getCurrentSurveyInfo(surveyId);

console.log(`Survey active: ${active}, Responses: ${responses}`);

// 4. Close survey (after duration or manually)
await contract.closeSurvey(surveyId);

// 5. Publish results
await contract.publishResults(surveyId);

// 6. Request decryption for question 0
const decryptTx = await contract.requestQuestionAverage(surveyId, 0);
const decryptReceipt = await decryptTx.wait();
const requestId = decryptReceipt.events[0].args.requestId;

// 7. Wait for Gateway callback or check timeout
const checkInterval = setInterval(async () => {
    const [sId, qId, time, done, refund, timeout] =
        await contract.getDecryptionRequestStatus(requestId);

    if (done) {
        console.log("Decryption completed!");
        const [avg, count, revealed] =
            await contract.getQuestionResult(surveyId, 0);
        console.log(`Average: ${avg}/5 from ${count} responses`);
        clearInterval(checkInterval);
    } else if (timeout) {
        console.log("Timeout detected - triggering refund");
        await contract.triggerTimeoutRefund(requestId);
        clearInterval(checkInterval);
    }
}, 10000); // Check every 10 seconds
```

### Monitoring Decryption Requests

```javascript
// Monitor all decryption requests
contract.on("ResultDecryptionRequested", (surveyId, questionId, requestId, timestamp) => {
    console.log(`Decryption requested for survey ${surveyId}, question ${questionId}`);
    console.log(`Request ID: ${requestId}`);
});

contract.on("DecryptionCompleted", (requestId, surveyId, questionId, averageRating) => {
    console.log(`Decryption complete! Average rating: ${averageRating}/5`);
});

contract.on("DecryptionFailed", (requestId, surveyId, reason) => {
    console.log(`Decryption failed: ${reason}`);
});

contract.on("TimeoutTriggered", (requestId, surveyId, elapsedTime) => {
    console.log(`Timeout after ${elapsedTime} seconds`);
});
```

### Error Handling

```javascript
try {
    await contract.submitResponse(surveyId, [4, 5]);
} catch (error) {
    if (error.message.includes("Already responded")) {
        console.log("You've already submitted a response");
    } else if (error.message.includes("Survey expired")) {
        console.log("This survey has closed");
    } else if (error.message.includes("Rating must be between 1-5")) {
        console.log("Invalid rating value");
    } else {
        console.error("Unknown error:", error);
    }
}
```

---

## Gas Optimization Tips

### Batch Operations
```javascript
// Instead of multiple single calls
for (let i = 0; i < questions.length; i++) {
    await contract.requestQuestionAverage(surveyId, i); // Expensive
}

// Use batch contract or aggregate off-chain
const requests = questions.map((_, i) => ({surveyId, questionId: i}));
// Process batch
```

### HCU Cost Management
- Each FHE operation costs HCU (Homomorphic Computation Units)
- `add`: ~1 HCU
- `mul`: ~3 HCU
- `requestDecryption`: ~5 HCU
- Minimize encrypted operations
- Reuse encrypted values where possible

---

## Security Best Practices

1. **Always validate inputs before calling contract functions**
2. **Check survey status before submission**
3. **Monitor for timeout events**
4. **Implement retry logic for Gateway callbacks**
5. **Never expose private keys in client-side code**
6. **Use secure RPC endpoints**
7. **Verify contract address before interaction**

---

## Constants

```solidity
uint256 public constant DECRYPTION_TIMEOUT = 1 hours;
uint256 public constant MAX_SURVEY_DURATION = 365 days;
```

---

## Support

For issues or questions:
- GitHub Issues: [Repository Issues](https://github.com/your-repo/issues)
- Documentation: [Full Docs](../README.md)
- Architecture: [ARCHITECTURE.md](./ARCHITECTURE.md)

---

**Last Updated**: 2025-11-25
**Version**: 2.0.0
**License**: MIT
