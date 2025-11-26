# Architecture Documentation - Employee Privacy Survey Platform

## System Overview

The Employee Privacy Survey Platform is a privacy-preserving application built on Fully Homomorphic Encryption (FHE) technology, implementing an innovative Gateway callback architecture with comprehensive security features.

## Core Architecture Pattern: Gateway Callback Mode

### Flow Diagram

```
User/Client                Contract                    Gateway (Zama)
    |                         |                              |
    |--Submit Encrypted------>|                              |
    |   Request               |                              |
    |                         |--Record Request----------->  |
    |                         |   (with requestId)           |
    |                         |                              |
    |                         |                      Decrypt Data
    |                         |                              |
    |                         |<--Callback with Result------|
    |                         |   (with proof)               |
    |                         |                              |
    |<--Transaction Complete--|                              |
    |                         |                              |

    [Timeout Protection]
    |                         |                              |
    | If timeout exceeded:    |                              |
    |--Trigger Refund-------->|                              |
    |                         |--Issue Refund------------->  |
    |                         |   (prevent lock)             |
```

### Three-Step Process

1. **User Submits Request**: User encrypts data and submits to contract
2. **Contract Records**: Contract stores request with unique ID and timestamp
3. **Gateway Callback**: Gateway decrypts and calls back with results
4. **Timeout Fallback**: If Gateway fails, automatic refund after timeout

## Key Architectural Components

### 1. Privacy Protection Layer

#### Random Multiplier Technique
```solidity
// Prevents division information leakage
uint8 randomMultiplier = generateSecureRandom();
euint8 multipliedSum = FHE.mul(encryptedSum, multiplier);
// Later divided out in callback to maintain privacy
```

**Problem Solved**: Division operations can leak information about encrypted values
**Solution**: Multiply by random value before division, remove multiplier after decryption

#### Fuzzy Pricing
- Aggregated statistics only (no individual data)
- Random noise injection for small sample sizes
- HCU (Homomorphic Computation Unit) optimization

### 2. Security Features

#### Input Validation
```solidity
require(bytes(_title).length > 0 && bytes(_title).length <= 200, "Invalid title");
require(_questions.length > 0 && _questions.length <= 50, "Invalid question count");
require(_durationDays * 1 days <= MAX_SURVEY_DURATION, "Duration exceeds maximum");
```

#### Access Control
- Role-based permissions (owner, creator, respondent)
- Survey creator exclusive rights
- One response per address enforcement

#### Overflow Protection
```solidity
require(surveyCounter < type(uint256).max, "Counter overflow");
require(survey.totalResponses < type(uint256).max, "Response overflow");
```

#### Audit Trail
- Comprehensive event logging
- Security alerts for suspicious activity
- Timestamp tracking for all operations

### 3. Refund Mechanism

#### Automatic Timeout Refund
```solidity
function triggerTimeoutRefund(uint256 requestId) external {
    require(block.timestamp >= request.timestamp + DECRYPTION_TIMEOUT);
    // Refund logic
    emit RefundIssued(requestId, surveyId, recipient, "Gateway timeout");
}
```

**Timeout Period**: 1 hour (configurable)
**Trigger**: Anyone can call (prevents permanent locks)
**Protection**: Prevents user funds/data from being permanently locked

#### Manual Refund
- Creator or owner can manually refund
- Requires justification reason
- Logged for audit purposes

### 4. Timeout Protection

#### Problem
- Gateway might fail to respond
- Decryption requests could hang indefinitely
- User data/state could be permanently locked

#### Solution
```solidity
uint256 public constant DECRYPTION_TIMEOUT = 1 hours;

struct DecryptionRequest {
    uint256 timestamp;
    bool completed;
    bool refunded;
}

// After timeout, anyone can trigger refund
function canTriggerRefund(uint256 requestId) external view returns (bool) {
    return block.timestamp >= request.timestamp + DECRYPTION_TIMEOUT;
}
```

## Data Structures

### Survey Storage
```solidity
struct Survey {
    address creator;
    string title;
    string description;
    string[] questions;
    uint256 startTime;
    uint256 endTime;
    bool active;
    bool resultsPublished;
    uint256 totalResponses;
    mapping(address => bool) hasResponded;
    mapping(uint256 => euint8[]) encryptedResponses;
    address[] respondents;
    uint256 decryptionRequestId;      // Gateway tracking
    uint256 decryptionRequestTime;    // Timeout tracking
    bool callbackCompleted;           // Completion flag
}
```

### Decryption Request Tracking
```solidity
struct DecryptionRequest {
    uint256 surveyId;
    uint256 questionId;
    uint256 timestamp;      // For timeout calculation
    bool completed;         // Gateway callback received
    bool refunded;          // Refund issued
}

mapping(uint256 => DecryptionRequest) public decryptionRequests;
mapping(uint256 => uint256) public surveyByRequestId;
```

## Security Considerations

### 1. Division Problem
**Issue**: FHE division can leak information
**Solution**: Random multiplier technique
```
encrypted_value * random_multiplier → decrypt → divide by multiplier
```

### 2. Price Leakage
**Issue**: Exact counts/sums could reveal sensitive data
**Solution**: Fuzzy aggregation with minimum thresholds

### 3. Async Processing Risks
**Issue**: Gateway callback might never arrive
**Solution**: Timeout protection with automatic refund

### 4. Gas Optimization
**Issue**: FHE operations are expensive (HCU costs)
**Solution**:
- Batch operations where possible
- Efficient permission management
- Minimize encrypted operations

## Gas Optimization (HCU Management)

### HCU Costs by Operation
- `FHE.add`: ~1 HCU
- `FHE.mul`: ~3 HCU
- `FHE.requestDecryption`: ~5 HCU

### Optimization Strategies
1. **Batch Operations**: Combine multiple additions
2. **Permission Caching**: Set permissions once
3. **Strategic Decryption**: Only decrypt aggregated results
4. **Avoid Redundant Encryption**: Reuse encrypted values

## Event System

### Operational Events
- `SurveyCreated`: New survey initialized
- `ResponseSubmitted`: Employee response recorded
- `ResultsPublished`: Survey closed, results ready

### Gateway Events
- `ResultDecryptionRequested`: Decryption request sent to Gateway
- `DecryptionCompleted`: Gateway callback successful
- `DecryptionFailed`: Gateway callback failed

### Refund Events
- `RefundIssued`: Refund processed
- `TimeoutTriggered`: Timeout protection activated

### Security Events
- `SecurityAlert`: Suspicious activity detected

## API Flow Examples

### Creating and Completing a Survey

```javascript
// 1. Create survey
const tx1 = await contract.createSurvey(
    "Q4 Satisfaction Survey",
    "Employee satisfaction assessment",
    ["How satisfied are you?", "Would you recommend?"],
    30 // 30 days
);

// 2. Employees submit responses (encrypted)
const tx2 = await contract.submitResponse(
    surveyId,
    [4, 5] // ratings encrypted on client side
);

// 3. Close survey
const tx3 = await contract.closeSurvey(surveyId);

// 4. Publish results
const tx4 = await contract.publishResults(surveyId);

// 5. Request decryption (Gateway callback mode)
const tx5 = await contract.requestQuestionAverage(surveyId, 0);

// 6. Gateway calls back (automatic)
// contract.processQuestionAverageCallback(requestId, data, proof)

// 7. If timeout, trigger refund
if (await contract.canTriggerRefund(requestId)) {
    await contract.triggerTimeoutRefund(requestId);
}
```

## Error Handling

### Contract Level
- Comprehensive `require` statements
- Custom error messages
- Revert on invalid state transitions

### Gateway Level
- Signature verification
- Proof validation
- Timeout fallback

### User Level
- Clear error messages
- Status checking functions
- Recovery mechanisms (refunds)

## Scalability Considerations

### Current Limits
- Max 50 questions per survey
- Max 365 days duration
- 1 hour decryption timeout

### Future Improvements
- Batch decryption requests
- Parallel Gateway callbacks
- Layer 2 integration for gas savings

## Compliance & Privacy

### Data Privacy
- Individual responses never revealed
- Only aggregated statistics available
- Cryptographic privacy guarantees (FHE)

### Audit Trail
- All operations logged on-chain
- Immutable timestamp records
- Complete event history

### Access Control
- Role-based permissions
- Creator-only administrative functions
- One-response-per-user enforcement

## Deployment Architecture

```
Frontend (React/Vue)
    ↓
Web3 Provider (MetaMask)
    ↓
Smart Contract (Ethereum/Sepolia)
    ↓
Zama Gateway (FHE Decryption)
    ↓
Callback to Contract
```

## Testing Strategy

1. **Unit Tests**: Individual function testing
2. **Integration Tests**: Full workflow testing
3. **Gateway Simulation**: Mock callback testing
4. **Timeout Testing**: Simulate Gateway failures
5. **Security Testing**: Access control validation

## Monitoring & Alerts

### Key Metrics
- Decryption success rate
- Average callback time
- Timeout frequency
- Gas usage per operation

### Alert Conditions
- Timeout threshold exceeded
- Unusual response patterns
- Failed decryption attempts
- Security violations

---

**Last Updated**: 2025-11-25
**Version**: 2.0.0
**Author**: Privacy Survey Platform Team
