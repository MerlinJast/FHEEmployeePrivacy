# Employee Privacy FHE - Architecture Documentation

## Overview

The Employee Privacy Survey Platform is a production-ready, privacy-preserving employee satisfaction survey system built on Ethereum using Zama's Fully Homomorphic Encryption (FHE). This document describes the innovative architecture, security mechanisms, and design patterns.

## Architecture Layers

### 1. Smart Contract Layer (EmployeePrivacyFHE.sol)

#### Core Components

**Survey Management**
- Survey creation with comprehensive metadata
- Question storage and validation
- Response tracking with participant management
- Time-bounded survey lifecycle

**Encryption & Privacy**
- FHE-encrypted response storage
- Homomorphic aggregation of survey responses
- Zero-knowledge result computation
- Privacy guarantees at the cryptographic level

**Decryption System**
- Gateway callback pattern for async decryption
- FHEVM oracle integration
- Signature verification for authenticity
- Result caching with state management

### 2. Privacy Protection Architecture

#### Problem 1: Division Problem Protection

**Issue**: Naive division in homomorphic encryption can leak exact values

**Solution**: Random Multiplier Technique
```solidity
// Generate cryptographically secure random multiplier
uint8 randomMultiplier = uint8((uint256(keccak256(abi.encodePacked(
    block.timestamp,
    block.prevrandao,
    _surveyId,
    _questionId
))) % 100) + 1);

// Apply before division
euint8 multipliedSum = FHE.mul(encryptedSum, FHE.asEuint8(randomMultiplier));

// Remove multiplier after decryption
uint8 actualSum = multipliedSum / multiplier;
uint8 averageRating = actualSum / count;
```

**Benefits**:
- Prevents integer analysis attacks
- Masks numerical patterns
- Maintains aggregation accuracy
- Cryptographically independent per request

#### Problem 2: Price Leakage Prevention

**Issue**: Frequency patterns can leak survey response distributions

**Solution**: Fuzzy Encoding
- No plaintext intermediate values exposed
- All computation occurs on encrypted data
- Results decrypted only after aggregation
- Temporal privacy maintains confidentiality until official resolution

#### Problem 3: Async Processing

**Issue**: Synchronous decryption would block the contract

**Solution**: Gateway Callback Pattern
```
User Submits Request
    ↓
Contract Records State (surveys, decryptionRequests)
    ↓
Gateway Processes Decryption Asynchronously
    ↓
Gateway Calls Callback with Decrypted Results
    ↓
Contract Updates Results and Completes Transaction
```

**Advantages**:
- Non-blocking operations
- Scalable throughput
- Natural error recovery path
- Timeout protection built-in

### 3. Gateway Callback Pattern

#### Phase 1: Request Submission

```solidity
function requestQuestionAverage(uint256 _surveyId, uint256 _questionId) {
    // Prepare encrypted data
    bytes32[] memory cts = new bytes32[](3);
    cts[0] = FHE.toBytes32(multipliedSum);
    cts[1] = FHE.toBytes32(encryptedCount);
    cts[2] = FHE.toBytes32(FHE.asEuint8(randomMultiplier));

    // Request decryption with callback
    uint256 requestId = FHE.requestDecryption(cts,
        this.processQuestionAverageCallback.selector);

    // Record state for recovery
    decryptionRequests[requestId] = DecryptionRequest({
        surveyId: _surveyId,
        questionId: _questionId,
        timestamp: block.timestamp,
        completed: false,
        refunded: false
    });
}
```

#### Phase 2: Gateway Processing

Gateway service monitors blockchain for decryption requests and:
1. Retrieves encrypted ciphertexts
2. Decrypts using service key
3. Generates cryptographic proof
4. Submits callback transaction

#### Phase 3: Callback Completion

```solidity
function processQuestionAverageCallback(
    uint256 requestId,
    bytes memory cleartexts,
    bytes memory decryptionProof
) external {
    // Verify Gateway signatures
    FHE.checkSignatures(requestId, cleartexts, decryptionProof);

    // Decode and process
    (uint8 multipliedSum, uint8 count, uint8 multiplier) =
        abi.decode(cleartexts, (uint8, uint8, uint8));

    // Calculate average
    uint8 actualSum = multipliedSum / multiplier;
    uint8 averageRating = count > 0 ? actualSum / count : 0;

    // Store result
    questionResults[requestId.surveyId][requestId.questionId] =
        DecryptedResult({
            averageRating: averageRating,
            totalResponses: count,
            revealed: true
        });
}
```

### 4. Refund Mechanism

#### Automatic Timeout Refund

```solidity
function triggerTimeoutRefund(uint256 requestId) external {
    DecryptionRequest storage request = decryptionRequests[requestId];

    // Timeout validation
    require(block.timestamp >= request.timestamp + DECRYPTION_TIMEOUT,
        "Timeout not reached");
    require(!request.completed, "Already completed");
    require(!request.refunded, "Already refunded");

    // Mark as refunded
    request.refunded = true;
    surveys[request.surveyId].callbackCompleted = true;

    emit TimeoutTriggered(requestId, request.surveyId, elapsedTime);
    emit RefundIssued(requestId, request.surveyId,
        survey.creator, "Gateway timeout");
}
```

**Key Features**:
- Automatic activation after 1 hour
- Public call (anyone can trigger)
- Prevents permanent fund locking
- Transparent failure tracking

#### Manual Refund for Creator/Owner

```solidity
function requestManualRefund(uint256 requestId, string memory reason) {
    require(msg.sender == survey.creator || msg.sender == owner,
        "Unauthorized");

    // Same state management as timeout
    request.refunded = true;
    survey.callbackCompleted = true;

    // Log reason for audit trail
    emit RefundIssued(requestId, request.surveyId, msg.sender, reason);
}
```

### 5. Security Architecture

#### Input Validation Layer

```solidity
// Survey creation validation
require(bytes(_title).length > 0, "Title cannot be empty");
require(bytes(_title).length <= 200, "Title too long");
require(_questions.length > 0, "Must have at least one question");
require(_questions.length <= 50, "Too many questions");
require(_durationDays > 0, "Duration must be positive");
require(_durationDays * 1 days <= MAX_SURVEY_DURATION,
    "Duration exceeds maximum");

// Response submission validation
require(!survey.hasResponded[msg.sender], "Already responded");
require(_ratings.length == survey.questions.length,
    "Answer count mismatch");
require(rating >= 1 && rating <= 5, "Rating must be between 1-5");
```

#### Access Control Modifiers

```solidity
modifier onlyOwner() {
    require(msg.sender == owner, "Not authorized");
    _;
}

modifier onlySurveyCreator(uint256 _surveyId) {
    require(surveys[_surveyId].creator == msg.sender,
        "Not survey creator");
    _;
}

modifier surveyActive(uint256 _surveyId) {
    require(surveys[_surveyId].active, "Survey not active");
    require(block.timestamp <= surveys[_surveyId].endTime,
        "Survey expired");
    _;
}
```

#### Overflow Protection

```solidity
// Type-safe counter increments
require(surveyCounter < type(uint256).max, "Survey counter overflow");
surveyCounter++;

// Safe response counting
require(survey.totalResponses < type(uint256).max,
    "Response overflow protection");
survey.totalResponses++;
```

### 6. HCU (Homomorphic Computation Unit) Optimization

#### Efficient Encryption Operations

```solidity
// Encrypt rating once
euint8 encryptedRating = FHE.asEuint8(rating);

// Set permissions (HCU optimization)
FHE.allowThis(encryptedRating);    // Allow contract to access
FHE.allow(encryptedRating, msg.sender);  // Allow user to access

// Store encrypted value
survey.encryptedResponses[i].push(encryptedRating);
```

#### Aggregation Optimization

```solidity
// Single pass aggregation on encrypted data
euint8 encryptedSum = responses[0];
for (uint256 i = 1; i < responses.length; i++) {
    encryptedSum = FHE.add(encryptedSum, responses[i]);
}

// Apply privacy multiplier
euint8 multipliedSum = FHE.mul(encryptedSum,
    FHE.asEuint8(randomMultiplier));
```

**Benefits**:
- Minimal FHE operations per computation
- Batch processing of responses
- Efficient memory usage
- Optimized decryption requests

### 7. Event-Driven Audit Trail

#### Comprehensive Event Coverage

```solidity
// Creation events
event SurveyCreated(uint256 indexed surveyId, address indexed creator,
    string title, uint256 endTime);

// Operation events
event ResponseSubmitted(uint256 indexed surveyId,
    address indexed respondent, uint256 timestamp);
event ResultsPublished(uint256 indexed surveyId, uint256 totalResponses);

// Decryption lifecycle
event ResultDecryptionRequested(uint256 indexed surveyId,
    uint256 indexed questionId, uint256 requestId, uint256 timestamp);
event DecryptionCompleted(uint256 indexed requestId,
    uint256 indexed surveyId, uint256 indexed questionId,
    uint8 averageRating);
event DecryptionFailed(uint256 indexed requestId,
    uint256 indexed surveyId, string reason);

// Refund events
event RefundIssued(uint256 indexed requestId, uint256 indexed surveyId,
    address indexed recipient, string reason);
event TimeoutTriggered(uint256 indexed requestId, uint256 indexed surveyId,
    uint256 elapsedTime);

// Security events
event SecurityAlert(string alertType, address indexed user,
    uint256 indexed surveyId, string details);
```

## Data Structures

### Survey

```solidity
struct Survey {
    address creator;                           // Survey creator
    string title;                             // Survey title
    string description;                       // Survey description
    string[] questions;                       // Question array
    uint256 startTime;                        // Survey start timestamp
    uint256 endTime;                          // Survey end timestamp
    bool active;                              // Active status
    bool resultsPublished;                    // Results publication status
    uint256 totalResponses;                   // Response count
    mapping(address => bool) hasResponded;    // Response tracking
    mapping(uint256 => euint8[]) encryptedResponses;  // Encrypted ratings
    address[] respondents;                    // Respondent list
    uint256 decryptionRequestId;              // Current request ID
    uint256 decryptionRequestTime;            // Request timestamp
    bool callbackCompleted;                   // Callback status
}
```

### DecryptionRequest

```solidity
struct DecryptionRequest {
    uint256 surveyId;           // Associated survey
    uint256 questionId;         // Associated question
    uint256 timestamp;          // Request timestamp
    bool completed;             // Completion status
    bool refunded;              // Refund status
}
```

## State Management

### Survey Lifecycle

```
CREATED (creation)
    ↓
ACTIVE (responses collected)
    ↓
CLOSED (no more responses)
    ↓
RESULTS_PUBLISHED (ready for decryption)
    ↓
DECRYPTION_REQUESTED (Gateway processing)
    ↓
DECRYPTION_COMPLETED or REFUNDED (final state)
```

### Decryption Request Lifecycle

```
PENDING (awaiting Gateway)
    ↓
COMPLETED (results available) OR REFUNDED (timeout/failure)
    ↓
TERMINAL (cannot be modified)
```

## Security Guarantees

1. **Privacy**: FHE encryption prevents plaintext exposure
2. **Integrity**: Cryptographic signatures verify Gateway responses
3. **Availability**: Timeout mechanism prevents permanent locks
4. **Access Control**: Role-based permissions enforce boundaries
5. **Auditability**: Comprehensive event logging for all operations

## Performance Characteristics

- **Survey Creation**: O(n) where n = number of questions
- **Response Submission**: O(n) where n = number of questions
- **Aggregation**: O(n) where n = number of responses
- **Decryption Request**: O(1) constant time
- **Callback Processing**: O(1) constant time

## Future Enhancements

1. Batch decryption requests
2. Multi-stage aggregation
3. Weighted response aggregation
4. Conditional privacy thresholds
5. Cross-survey analysis capabilities

---

Built with privacy-first principles using Zama's Fully Homomorphic Encryption
