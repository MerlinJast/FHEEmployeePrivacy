# Employee Privacy FHE - Smart Contract API Documentation

## Overview

Complete API reference for the EmployeePrivacyFHE smart contract. All functions include parameter descriptions, return values, and usage examples.

## State-Modifying Functions

### Survey Management

#### `createSurvey()`

Creates a new employee satisfaction survey.

**Function Signature**
```solidity
function createSurvey(
    string memory _title,
    string memory _description,
    string[] memory _questions,
    uint256 _durationDays
) external returns (uint256)
```

**Parameters**
- `_title` (string): Survey title (1-200 characters, required)
- `_description` (string): Survey description (optional)
- `_questions` (string[]): Array of survey questions (1-50 questions)
- `_durationDays` (uint256): Survey duration in days (1-365 days)

**Return Value**
- `uint256`: Survey ID (unique identifier, starts at 1)

**Events Emitted**
- `SurveyCreated(surveyId, creator, title, endTime)`

**Validation Rules**
- Title must not be empty and <= 200 characters
- At least 1 question required
- Maximum 50 questions
- Duration must be positive and <= 365 days
- Survey counter must not overflow

**Example**
```solidity
uint256 surveyId = contract.createSurvey(
    "Q1 2024 Employee Satisfaction",
    "Quarterly satisfaction survey",
    ["How satisfied are you?", "Would you recommend us?"],
    30  // 30 days
);
```

---

#### `submitResponse()`

Submit encrypted survey responses.

**Function Signature**
```solidity
function submitResponse(
    uint256 _surveyId,
    uint8[] memory _ratings
) external surveyActive(_surveyId)
```

**Parameters**
- `_surveyId` (uint256): ID of target survey
- `_ratings` (uint8[]): Array of ratings (1-5 scale, one per question)

**Validation Rules**
- Survey must exist and be active
- User can only respond once per survey
- Number of ratings must match number of questions
- Each rating must be between 1-5
- Survey must not have expired
- Response count must not overflow

**Events Emitted**
- `ResponseSubmitted(surveyId, respondent, timestamp)`

**Privacy Notes**
- All ratings are FHE-encrypted before storage
- No plaintext responses stored on-chain
- Permissions set for contract and submitter access
- HCU optimization applied

**Example**
```solidity
uint8[] memory ratings = new uint8[](2);
ratings[0] = 4;  // Very satisfied
ratings[1] = 5;  // Highly recommend
contract.submitResponse(surveyId, ratings);
```

---

#### `closeSurvey()`

Close a survey to prevent further responses.

**Function Signature**
```solidity
function closeSurvey(uint256 _surveyId) external onlySurveyCreator(_surveyId)
```

**Parameters**
- `_surveyId` (uint256): ID of survey to close

**Access Control**
- Only survey creator can call
- Creator must match original creator address

**State Changes**
- Sets `surveys[_surveyId].active = false`

**Example**
```solidity
contract.closeSurvey(surveyId);
```

---

#### `publishResults()`

Publish results to enable decryption requests.

**Function Signature**
```solidity
function publishResults(uint256 _surveyId) external onlySurveyCreator(_surveyId)
```

**Parameters**
- `_surveyId` (uint256): ID of survey

**Validation Rules**
- Survey must exist
- Creator must be caller
- Survey must not be active
- Results must not already be published
- At least 1 response required

**Events Emitted**
- `ResultsPublished(surveyId, totalResponses)`

**Example**
```solidity
contract.closeSurvey(surveyId);
contract.publishResults(surveyId);
```

---

### Decryption & Refund Functions

#### `requestQuestionAverage()`

Request decryption of average rating for a question via Gateway callback pattern.

**Function Signature**
```solidity
function requestQuestionAverage(
    uint256 _surveyId,
    uint256 _questionId
) external onlySurveyCreator(_surveyId)
```

**Parameters**
- `_surveyId` (uint256): ID of survey
- `_questionId` (uint256): Index of question (0-based)

**Validation Rules**
- Survey must exist
- Results must be published
- Question index must be valid
- Question must have responses

**Gateway Callback Pattern**
1. Function encodes encrypted data with random multiplier
2. Calls `FHE.requestDecryption()` with callback selector
3. Returns request ID
4. Gateway service monitors and decrypts asynchronously
5. Gateway calls `processQuestionAverageCallback()`

**Privacy Features**
- Random multiplier applied for division protection
- Prevents exact value leakage during aggregation
- Cryptographic proof required for callback

**Events Emitted**
- `ResultDecryptionRequested(surveyId, questionId, requestId, timestamp)`

**Example**
```solidity
uint256 requestId = contract.requestQuestionAverage(surveyId, 0);
// Wait for Gateway to process...
// Results available via getQuestionResult()
```

**Returns**
- `uint256`: Decryption request ID

---

#### `processQuestionAverageCallback()`

Gateway callback function (called by FHEVM Gateway after decryption).

**Function Signature**
```solidity
function processQuestionAverageCallback(
    uint256 requestId,
    bytes memory cleartexts,
    bytes memory decryptionProof
) external
```

**Parameters**
- `requestId` (uint256): Original request ID
- `cleartexts` (bytes): ABI-encoded decrypted values [multipliedSum, count, multiplier]
- `decryptionProof` (bytes): Cryptographic proof of valid decryption

**Validation Rules**
- Signature verification via `FHE.checkSignatures()`
- Request must not be already completed
- Request must not be refunded

**State Changes**
- Marks request as completed
- Stores decrypted result
- Updates survey callback status

**Events Emitted**
- `DecryptionCompleted(requestId, surveyId, questionId, averageRating)`

**Internal Processing**
```
1. Verify Gateway signatures
2. Decode cleartexts (multipliedSum, count, multiplier)
3. Remove random multiplier: actualSum = multipliedSum / multiplier
4. Calculate average: average = actualSum / count
5. Store result in questionResults mapping
6. Emit completion event
```

---

#### `triggerTimeoutRefund()`

Trigger automatic refund if Gateway fails to respond within timeout period.

**Function Signature**
```solidity
function triggerTimeoutRefund(uint256 requestId) external
```

**Parameters**
- `requestId` (uint256): ID of decryption request

**Timeout Configuration**
- `DECRYPTION_TIMEOUT = 1 hours`
- Timeout is measured from request timestamp
- Anyone can trigger (public call)

**Validation Rules**
- Request must exist
- Request must not be completed
- Request must not already be refunded
- Current time must be >= request timestamp + 1 hour

**State Changes**
- Marks request as refunded
- Sets survey callback to completed
- Prevents further decryption attempts

**Events Emitted**
- `TimeoutTriggered(requestId, surveyId, elapsedTime)`
- `RefundIssued(requestId, surveyId, creator, "Gateway timeout")`
- `DecryptionFailed(requestId, surveyId, "Decryption timeout exceeded")`

**Security Notes**
- Prevents permanent fund locking
- Public call ensures recovery doesn't require creator interaction
- Transparent timeout tracking

**Example**
```solidity
// After 1+ hours
contract.triggerTimeoutRefund(requestId);
```

---

#### `requestManualRefund()`

Manually request refund for failed decryption (creator/owner only).

**Function Signature**
```solidity
function requestManualRefund(
    uint256 requestId,
    string memory reason
) external
```

**Parameters**
- `requestId` (uint256): ID of decryption request
- `reason` (string): Reason for refund

**Access Control**
- Only survey creator or contract owner can call
- Creator/owner validation required

**Validation Rules**
- Request must exist
- Request must not be completed
- Request must not already be refunded

**State Changes**
- Marks request as refunded
- Sets survey callback to completed

**Events Emitted**
- `RefundIssued(requestId, surveyId, caller, reason)`
- `DecryptionFailed(requestId, surveyId, reason)`

**Example**
```solidity
contract.requestManualRefund(requestId, "Invalid response format");
```

---

## View/Query Functions

### Survey Information

#### `getSurvey()`

Get complete survey information.

**Function Signature**
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

**Return Values**
- `creator`: Address of survey creator
- `title`: Survey title
- `description`: Survey description
- `startTime`: Survey start timestamp
- `endTime`: Survey end timestamp
- `active`: Whether survey is accepting responses
- `resultsPublished`: Whether results can be decrypted
- `totalResponses`: Number of responses received

**Example**
```solidity
(address creator, string memory title, , , uint256 endTime, bool active, , uint256 responses) =
    contract.getSurvey(surveyId);
```

---

#### `getSurveyQuestions()`

Get all questions for a survey.

**Function Signature**
```solidity
function getSurveyQuestions(uint256 _surveyId)
    external view returns (string[] memory)
```

**Return Value**
- `string[]`: Array of survey questions

**Example**
```solidity
string[] memory questions = contract.getSurveyQuestions(surveyId);
for (uint i = 0; i < questions.length; i++) {
    console.log(questions[i]);
}
```

---

#### `getTotalSurveys()`

Get total number of surveys created.

**Function Signature**
```solidity
function getTotalSurveys() external view returns (uint256)
```

**Return Value**
- `uint256`: Total survey count

**Example**
```solidity
uint256 totalSurveys = contract.getTotalSurveys();
```

---

### Response Information

#### `hasResponded()`

Check if employee has already responded to survey.

**Function Signature**
```solidity
function hasResponded(uint256 _surveyId, address _employee)
    external view returns (bool)
```

**Parameters**
- `_surveyId` (uint256): Survey ID
- `_employee` (address): Employee address to check

**Return Value**
- `bool`: True if employee has responded

**Example**
```solidity
bool responded = contract.hasResponded(surveyId, msg.sender);
require(!responded, "Already responded");
```

---

#### `getCurrentSurveyInfo()`

Get current survey status and progress.

**Function Signature**
```solidity
function getCurrentSurveyInfo(uint256 _surveyId) external view returns (
    bool active,
    bool resultsPublished,
    uint256 totalResponses,
    uint256 questionsCount,
    uint256 timeRemaining
)
```

**Return Values**
- `active`: Is survey active?
- `resultsPublished`: Can results be decrypted?
- `totalResponses`: Current response count
- `questionsCount`: Number of questions
- `timeRemaining`: Seconds until expiry (0 if expired)

**Example**
```solidity
(bool active, , uint256 responses, uint256 questions, uint256 timeLeft) =
    contract.getCurrentSurveyInfo(surveyId);
```

---

### Result Information

#### `getQuestionResult()`

Get decrypted average rating for a question.

**Function Signature**
```solidity
function getQuestionResult(uint256 _surveyId, uint256 _questionId)
    external view returns (
        uint8 averageRating,
        uint8 totalResponses,
        bool revealed
    )
```

**Return Values**
- `averageRating`: Average rating (0-5 scale, 0 if not revealed)
- `totalResponses`: Number of responses
- `revealed`: Whether decryption is complete

**Example**
```solidity
(uint8 avgRating, uint8 count, bool revealed) =
    contract.getQuestionResult(surveyId, questionId);
if (revealed) {
    console.log("Average rating:", avgRating);
}
```

---

### Decryption Request Status

#### `getDecryptionRequestStatus()`

Get complete status of decryption request.

**Function Signature**
```solidity
function getDecryptionRequestStatus(uint256 requestId)
    external view returns (
        uint256 surveyId,
        uint256 questionId,
        uint256 timestamp,
        bool completed,
        bool refunded,
        bool timedOut
    )
```

**Return Values**
- `surveyId`: Associated survey ID
- `questionId`: Associated question ID
- `timestamp`: Request submission timestamp
- `completed`: Whether callback completed
- `refunded`: Whether refund was issued
- `timedOut`: Whether timeout threshold exceeded

**Example**
```solidity
(uint256 surveyId, uint256 questionId, , bool completed,
 bool refunded, bool timedOut) = contract.getDecryptionRequestStatus(requestId);
```

---

#### `canTriggerRefund()`

Check if timeout refund can be triggered.

**Function Signature**
```solidity
function canTriggerRefund(uint256 requestId)
    external view returns (bool)
```

**Return Value**
- `bool`: True if 1+ hour has passed since request

**Example**
```solidity
if (contract.canTriggerRefund(requestId)) {
    contract.triggerTimeoutRefund(requestId);
}
```

---

#### `getSurveyDecryptionStatus()`

Get survey-level decryption status.

**Function Signature**
```solidity
function getSurveyDecryptionStatus(uint256 _surveyId)
    external view returns (
        uint256 requestId,
        uint256 requestTime,
        bool callbackCompleted,
        uint256 timeElapsed
    )
```

**Return Values**
- `requestId`: Current decryption request ID
- `requestTime`: Request timestamp
- `callbackCompleted`: Whether callback processed
- `timeElapsed`: Seconds since request

**Example**
```solidity
(uint256 requestId, , bool completed, uint256 elapsed) =
    contract.getSurveyDecryptionStatus(surveyId);
```

---

### Employee Response Status

#### `getEmployeeResponseStatus()`

Get employee response details.

**Function Signature**
```solidity
function getEmployeeResponseStatus(uint256 _surveyId, address _employee)
    external view returns (
        bool responded,
        uint256 responseTime
    )
```

**Return Values**
- `responded`: Has employee responded?
- `responseTime`: Response timestamp (0 if not responded)

**Example**
```solidity
(bool responded, ) = contract.getEmployeeResponseStatus(surveyId, employeeAddress);
```

---

## Administrative Functions

#### `transferOwnership()`

Transfer contract ownership to new address.

**Function Signature**
```solidity
function transferOwnership(address newOwner) external onlyOwner
```

**Parameters**
- `newOwner` (address): New owner address

**Access Control**
- Only current owner can call

**State Changes**
- Updates contract owner

**Example**
```solidity
contract.transferOwnership(newOwnerAddress);
```

---

## Events

### Survey Events

```solidity
event SurveyCreated(
    uint256 indexed surveyId,
    address indexed creator,
    string title,
    uint256 endTime
)

event ResponseSubmitted(
    uint256 indexed surveyId,
    address indexed respondent,
    uint256 timestamp
)

event ResultsPublished(
    uint256 indexed surveyId,
    uint256 totalResponses
)
```

### Decryption Events

```solidity
event ResultDecryptionRequested(
    uint256 indexed surveyId,
    uint256 indexed questionId,
    uint256 requestId,
    uint256 timestamp
)

event DecryptionCompleted(
    uint256 indexed requestId,
    uint256 indexed surveyId,
    uint256 indexed questionId,
    uint8 averageRating
)

event DecryptionFailed(
    uint256 indexed requestId,
    uint256 indexed surveyId,
    string reason
)
```

### Refund Events

```solidity
event RefundIssued(
    uint256 indexed requestId,
    uint256 indexed surveyId,
    address indexed recipient,
    string reason
)

event TimeoutTriggered(
    uint256 indexed requestId,
    uint256 indexed surveyId,
    uint256 elapsedTime
)
```

### Security Events

```solidity
event SecurityAlert(
    string alertType,
    address indexed user,
    uint256 indexed surveyId,
    string details
)
```

---

## Constants

```solidity
uint256 public constant DECRYPTION_TIMEOUT = 1 hours
uint256 public constant MAX_SURVEY_DURATION = 365 days
```

---

## Error Scenarios

| Function | Error | Reason |
|----------|-------|--------|
| createSurvey | "Title cannot be empty" | Title is required |
| createSurvey | "Title too long" | Title exceeds 200 characters |
| createSurvey | "Must have at least one question" | Zero questions provided |
| createSurvey | "Too many questions" | More than 50 questions |
| submitResponse | "Already responded" | User already submitted response |
| submitResponse | "Answer count mismatch" | Rating count != question count |
| submitResponse | "Rating must be between 1-5" | Invalid rating value |
| publishResults | "Survey still active" | Must close survey first |
| publishResults | "Results already published" | Already published |
| triggerTimeoutRefund | "Timeout not reached" | Less than 1 hour elapsed |

---

## Gas Optimization Notes

- Survey creation: ~50k-100k gas (depends on question count)
- Response submission: ~200k-300k gas (FHE encryption)
- Decryption request: ~80k gas
- Callback processing: ~150k-200k gas
- View functions: ~25k-50k gas

---

Built with privacy-first principles using Zama's Fully Homomorphic Encryption
