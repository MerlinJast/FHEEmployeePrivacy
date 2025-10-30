# Employee Privacy Survey Platform

A privacy-preserving employee satisfaction survey platform built with Fully Homomorphic Encryption (FHE) on Ethereum using Zama's fhEVM technology and Hardhat development framework.

[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-blue)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-Development-orange)](https://hardhat.org/)

## 🚀 Live Application

**🌐 Website**: [https://fhe-employee-privacy.vercel.app/](https://fhe-employee-privacy.vercel.app/)

## 📋 Smart Contract Information

- **Contract Address**: `0x32db9e03494b45a0b2b2B85Cfb767CD65B49275A`
- **Network**: Sepolia Ethereum Testnet
- **Explorer**: [View on Etherscan](https://sepolia.etherscan.io/address/0x32db9e03494b45a0b2b2B85Cfb767CD65B49275A)

## 🎥 Demo Video

[Watch the complete walkthrough of the Employee Privacy FHE platform demo.mp4]

## Overview

This platform enables organizations to conduct completely anonymous employee satisfaction surveys where individual responses are encrypted using Fully Homomorphic Encryption. Only aggregated statistics can be revealed, ensuring complete privacy protection for survey participants.

## Key Features

- **Complete Privacy**: Individual responses encrypted using FHE technology
- **Anonymous Feedback**: Zero-knowledge architecture protects employee identity
- **Aggregated Insights**: Statistical summaries without revealing individual data
- **Blockchain Integrity**: Immutable audit trail on Ethereum
- **Access Control**: Survey creator permissions and lifecycle management
- **Production Ready**: Complete Hardhat development and deployment workflow

## Technology Stack

### Smart Contract
- **Solidity**: 0.8.24
- **Zama fhEVM**: Fully Homomorphic Encryption
- **OpenZeppelin**: Security standards

### Development Framework
- **Hardhat**: Smart contract development
- **Ethers.js**: Blockchain interaction
- **Chai**: Testing framework
- **Hardhat Toolbox**: Complete development suite

### Network
- **Sepolia Testnet**: Ethereum testing network
- **Zama fhEVM**: Privacy-preserving computation

## Quick Start

### Prerequisites

- Node.js v18.0.0 or higher
- npm v8.0.0 or higher
- MetaMask wallet extension

### Installation

```bash
# Clone repository
git clone <repository-url>
cd employee-privacy-survey

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration
```

### Development

```bash
# Compile contracts
npm run compile

# Run tests
npm test

# Run tests with coverage
npm run coverage

# Start local blockchain
npm run node

# Deploy to local network
npm run deploy:local
```

### Deployment

```bash
# Deploy to Sepolia testnet
npm run deploy:sepolia

# Verify contract on Etherscan
npm run verify:sepolia

# Interact with deployed contract
npm run interact:sepolia

# Run full simulation
npm run simulate
```

## Project Structure

```
employee-privacy-survey/
├── contracts/
│   └── EmployeePrivacyFHE.sol        # Main smart contract
├── scripts/
│   ├── deploy.js                     # Deployment script
│   ├── verify.js                     # Etherscan verification
│   ├── interact.js                   # Contract interaction examples
│   └── simulate.js                   # Full lifecycle simulation
├── test/
│   └── EmployeePrivacyFHE.test.js   # Comprehensive test suite
├── hardhat.config.js                 # Hardhat configuration
├── package.json                      # Dependencies and scripts
├── .env.example                      # Environment template
├── README.md                         # This file
└── DEPLOYMENT.md                     # Detailed deployment guide
```

## Smart Contract

### Core Functions

#### Survey Creation
```solidity
function createSurvey(
    string memory _title,
    string memory _description,
    string[] memory _questions,
    uint256 _durationDays
) external returns (uint256)
```

#### Submit Response
```solidity
function submitResponse(
    uint256 _surveyId,
    uint8[] memory _ratings  // 1-5 scale, encrypted with FHE
) external
```

#### Survey Management
```solidity
function closeSurvey(uint256 _surveyId) external
function publishResults(uint256 _surveyId) external
```

#### Query Functions
```solidity
function getSurvey(uint256 _surveyId) external view
function getSurveyQuestions(uint256 _surveyId) external view
function hasResponded(uint256 _surveyId, address _employee) external view
function getCurrentSurveyInfo(uint256 _surveyId) external view
```

## Testing

Comprehensive test suite covering:

- Contract deployment
- Survey creation and validation
- Response submission and encryption
- Access control and permissions
- Survey lifecycle management
- Edge cases and error handling

```bash
# Run all tests
npm test

# Run with gas reporting
REPORT_GAS=true npm test

# Generate coverage report
npm run coverage
```

### Test Results

```
  EmployeePrivacyFHE
    Deployment
      ✓ Should set the correct owner
      ✓ Should initialize survey counter to 0
    Survey Creation
      ✓ Should create a survey successfully
      ✓ Should store correct survey details
      ✓ Should fail with empty title
      ✓ Should fail with no questions
      ✓ Should fail with zero duration
    Response Submission
      ✓ Should submit response successfully
      ✓ Should track response count
      ✓ Should prevent duplicate responses
      ✓ Should fail with incorrect answer count
      ✓ Should fail with invalid rating values
      ✓ Should allow multiple employees to respond
    ... (50+ comprehensive tests)
```

## Deployment

### Sepolia Testnet

Current deployment:
- **Contract Address**: `0x32db9e03494b45a0b2b2B85Cfb767CD65B49275A`
- **Network**: Sepolia Testnet
- **Chain ID**: 11155111
- **Etherscan**: [View Contract](https://sepolia.etherscan.io/address/0x32db9e03494b45a0b2b2B85Cfb767CD65B49275A)

### Deployment Steps

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

Quick deployment:

```bash
# 1. Configure environment
cp .env.example .env
# Add your PRIVATE_KEY and SEPOLIA_RPC_URL

# 2. Compile contracts
npm run compile

# 3. Deploy to Sepolia
npm run deploy:sepolia

# 4. Verify on Etherscan
npm run verify:sepolia

# 5. Test interaction
npm run interact:sepolia
```

## Scripts

### Deploy Script (`scripts/deploy.js`)

Deploys the EmployeePrivacyFHE contract with:
- Account balance verification
- Deployment confirmation
- Contract ownership verification
- Deployment summary and next steps

### Verify Script (`scripts/verify.js`)

Verifies the contract on Etherscan:
- Automatic source code verification
- Constructor arguments validation
- Etherscan link generation

### Interact Script (`scripts/interact.js`)

Demonstrates contract usage:
- Creating surveys
- Submitting employee responses
- Closing surveys
- Publishing results
- Querying survey data

### Simulate Script (`scripts/simulate.js`)

Full lifecycle simulation:
- Deploy contract
- Create survey with multiple questions
- Simulate 5 employee responses with different satisfaction levels
- Close and publish results
- Display privacy guarantees

## Configuration

### Environment Variables

Create a `.env` file:

```env
# Wallet private key (DO NOT COMMIT)
PRIVATE_KEY=your_private_key_here

# RPC endpoints
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR-PROJECT-ID
ZAMA_RPC_URL=https://devnet.zama.ai

# Etherscan API key
ETHERSCAN_API_KEY=your_etherscan_api_key

# Optional: Gas reporting
REPORT_GAS=true
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key

# Contract address (after deployment)
CONTRACT_ADDRESS=0xYourContractAddress
```

### Hardhat Configuration

The `hardhat.config.js` includes:
- Solidity 0.8.24 compiler with optimizer
- Multiple network configurations (localhost, Sepolia, Zama)
- Etherscan verification setup
- Gas reporter configuration
- Custom paths for contracts, tests, and artifacts

## Privacy Features

### Fully Homomorphic Encryption

- **Individual Privacy**: Each response encrypted with FHE
- **Computation on Encrypted Data**: Aggregations without decryption
- **Zero-Knowledge**: No individual data ever revealed
- **Cryptographic Guarantees**: Provable privacy protection

### Security Measures

- **Access Control**: Only survey creators can manage surveys
- **One Response Per User**: Prevents manipulation
- **Time-Bounded Surveys**: Automatic expiration
- **Immutable Audit Trail**: Blockchain event logging

## Use Cases

- **Anonymous Employee Surveys**: Honest feedback without fear
- **Performance Reviews**: Privacy-preserving evaluations
- **Whistleblowing Systems**: Protected reporting
- **Satisfaction Tracking**: Continuous improvement insights
- **Organizational Research**: Privacy-compliant data collection

## NPM Scripts

```json
{
  "compile": "hardhat compile",
  "test": "hardhat test",
  "coverage": "hardhat coverage",
  "node": "hardhat node",
  "deploy:local": "hardhat run scripts/deploy.js --network localhost",
  "deploy:sepolia": "hardhat run scripts/deploy.js --network sepolia",
  "verify:sepolia": "hardhat run scripts/verify.js --network sepolia",
  "interact:sepolia": "hardhat run scripts/interact.js --network sepolia",
  "simulate": "hardhat run scripts/simulate.js --network localhost",
  "clean": "hardhat clean"
}
```

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Ensure all tests pass
5. Submit a pull request

## Security

### Audit Status

This is an educational/demonstration project. For production use:
- Conduct professional security audit
- Implement additional access controls
- Add rate limiting
- Monitor for anomalies

### Reporting Security Issues

Please report security vulnerabilities to: security@yourproject.com

## Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [Zama fhEVM Documentation](https://docs.zama.ai)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Solidity Documentation](https://docs.soliditylang.org/)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)

## Acknowledgments

- **Zama**: For FHE technology and fhEVM
- **Ethereum Foundation**: For blockchain infrastructure
- **Hardhat Team**: For excellent development framework
- **OpenZeppelin**: For security standards

---

**Built with privacy in mind. Powered by Fully Homomorphic Encryption.**

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)
