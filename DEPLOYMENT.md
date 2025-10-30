# Deployment Guide

Complete deployment documentation for the Employee Privacy Survey Platform using Hardhat.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Local Development](#local-development)
- [Sepolia Testnet Deployment](#sepolia-testnet-deployment)
- [Contract Verification](#contract-verification)
- [Post-Deployment](#post-deployment)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher
- **Git**: For version control
- **MetaMask**: Browser extension for wallet management

### Required Accounts

1. **Ethereum Wallet**: MetaMask or similar
2. **Etherscan API Key**: For contract verification
3. **Infura/Alchemy Account**: For RPC endpoint (optional)

### Get Test ETH

For Sepolia testnet deployment, obtain test ETH from:

- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
- [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)

## Environment Setup

### 1. Clone Repository

```bash
git clone <your-repository-url>
cd employee-privacy-survey
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Private key (DO NOT SHARE OR COMMIT)
PRIVATE_KEY=your_wallet_private_key_here

# RPC URLs
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR-PROJECT-ID
ZAMA_RPC_URL=https://devnet.zama.ai

# Etherscan API Key for verification
ETHERSCAN_API_KEY=your_etherscan_api_key

# Optional: Gas reporting
REPORT_GAS=true
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key
```

**Security Warning**: Never commit your `.env` file or share your private key!

## Local Development

### 1. Start Local Hardhat Network

```bash
npx hardhat node
```

This starts a local Ethereum network at `http://127.0.0.1:8545/`.

### 2. Deploy to Local Network

In a new terminal:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

### 3. Run Tests

```bash
# Run all tests
npx hardhat test

# Run with gas reporting
REPORT_GAS=true npx hardhat test

# Run specific test file
npx hardhat test test/EmployeePrivacyFHE.test.js

# Run with coverage
npx hardhat coverage
```

### 4. Run Simulation

```bash
npx hardhat run scripts/simulate.js --network localhost
```

## Sepolia Testnet Deployment

### Step 1: Verify Configuration

Ensure your `.env` file is properly configured:

```bash
# Check environment variables are loaded
npx hardhat vars list
```

### Step 2: Compile Contracts

```bash
npx hardhat compile
```

Expected output:
```
Compiled 1 Solidity file successfully
```

### Step 3: Deploy Contract

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

Expected output:
```
Starting deployment process...
==================================================
Deploying contract with account: 0x...
Account balance: X.XX ETH
==================================================
Deploying EmployeePrivacyFHE contract...
✓ EmployeePrivacyFHE deployed to: 0x...
==================================================
```

**Save the contract address** - you'll need it for verification and interaction!

### Step 4: Verify Contract on Etherscan

```bash
npx hardhat run scripts/verify.js --network sepolia
```

Or verify directly:

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

### Step 5: Test Interaction

Update the contract address in `scripts/interact.js` or set environment variable:

```bash
export CONTRACT_ADDRESS=0xYourContractAddress
npx hardhat run scripts/interact.js --network sepolia
```

## Contract Verification

### Automatic Verification

The verification script handles this automatically:

```bash
node scripts/verify.js <CONTRACT_ADDRESS>
```

### Manual Verification

If automatic verification fails:

1. Visit [Sepolia Etherscan](https://sepolia.etherscan.io/)
2. Navigate to your contract address
3. Click "Contract" tab → "Verify and Publish"
4. Select:
   - Compiler Type: Solidity (Single file)
   - Compiler Version: v0.8.24
   - License Type: MIT
5. Paste contract source code
6. Click "Verify and Publish"

## Post-Deployment

### 1. Update Frontend Configuration

Update your frontend with the deployed contract address and ABI:

```javascript
// In your frontend config
const CONTRACT_ADDRESS = "0xYourDeployedContractAddress";
const CONTRACT_ABI = require("./artifacts/contracts/EmployeePrivacyFHE.sol/EmployeePrivacyFHE.json").abi;
```

### 2. Test Contract Functions

Run the interaction script:

```bash
npx hardhat run scripts/interact.js --network sepolia
```

This will:
- Create a sample survey
- Submit employee responses
- Close and publish results
- Demonstrate all contract features

### 3. Monitor Contract

View your contract on Etherscan:
```
https://sepolia.etherscan.io/address/<YOUR_CONTRACT_ADDRESS>
```

## Deployment Information

### Current Deployment

| Network | Contract Address | Etherscan Link |
|---------|-----------------|----------------|
| Sepolia | `0x32db9e03494b45a0b2b2B85Cfb767CD65B49275A` | [View](https://sepolia.etherscan.io/address/0x32db9e03494b45a0b2b2B85Cfb767CD65B49275A) |

### Network Information

**Sepolia Testnet**
- Chain ID: `11155111`
- RPC URL: `https://sepolia.infura.io/v3/YOUR-PROJECT-ID`
- Currency: `ETH` (test)
- Block Explorer: `https://sepolia.etherscan.io/`

**Zama fhEVM Sepolia**
- Chain ID: `8009`
- RPC URL: `https://devnet.zama.ai`
- Currency: `ZAMA`
- Documentation: [Zama Docs](https://docs.zama.ai)

## Hardhat Tasks

### Built-in Tasks

```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Clean artifacts
npx hardhat clean

# Get accounts
npx hardhat accounts

# Check contract size
npx hardhat size-contracts
```

### Custom Scripts

```bash
# Deploy contract
npx hardhat run scripts/deploy.js --network <network>

# Verify contract
npx hardhat run scripts/verify.js --network <network>

# Interact with contract
npx hardhat run scripts/interact.js --network <network>

# Run simulation
npx hardhat run scripts/simulate.js --network <network>
```

## Troubleshooting

### Common Issues

#### 1. Insufficient Funds

**Error**: `insufficient funds for gas * price + value`

**Solution**:
- Get more test ETH from faucet
- Check wallet balance: `npx hardhat run scripts/checkBalance.js --network sepolia`

#### 2. Nonce Too Low

**Error**: `nonce too low`

**Solution**:
```bash
# Reset account nonce in MetaMask
# Settings → Advanced → Reset Account
```

#### 3. Network Connection Issues

**Error**: `network connection timeout`

**Solution**:
- Check RPC URL in `.env`
- Try alternative RPC endpoints
- Verify internet connection

#### 4. Verification Failed

**Error**: `verification failed`

**Solution**:
- Wait 1-2 minutes after deployment
- Ensure exact compiler version (0.8.24)
- Check constructor arguments match
- Try manual verification on Etherscan

#### 5. Gas Estimation Failed

**Error**: `cannot estimate gas`

**Solution**:
- Check contract code for errors
- Verify function parameters
- Ensure account has sufficient balance
- Try with manual gas limit

### Debug Commands

```bash
# Check Hardhat configuration
npx hardhat config

# Verify compilation
npx hardhat compile --force

# Test with verbose output
npx hardhat test --verbose

# Check network connectivity
npx hardhat run scripts/checkNetwork.js --network sepolia
```

## Gas Optimization

### Tips for Reducing Gas Costs

1. **Batch Operations**: Submit multiple responses in one transaction
2. **Optimize Storage**: Use appropriate data types
3. **Remove Redundant Checks**: Only essential validations
4. **Use Events**: Cheaper than storage for historical data

### Gas Reporting

Enable gas reporting in `.env`:

```env
REPORT_GAS=true
```

Run tests with gas report:

```bash
REPORT_GAS=true npx hardhat test
```

## Security Considerations

### Before Deployment

- [ ] Audit smart contract code
- [ ] Run comprehensive tests
- [ ] Check for known vulnerabilities
- [ ] Verify access controls
- [ ] Test with various scenarios

### After Deployment

- [ ] Verify contract on Etherscan
- [ ] Test all functions
- [ ] Monitor for unusual activity
- [ ] Keep private keys secure
- [ ] Document contract addresses

## Maintenance

### Upgrading Contracts

This contract is not upgradeable. To update:

1. Deploy new contract version
2. Migrate data if necessary
3. Update frontend configuration
4. Deprecate old contract

### Monitoring

- Monitor contract events
- Track gas usage
- Review user feedback
- Check for errors

## Support

### Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Zama fhEVM Documentation](https://docs.zama.ai)

### Getting Help

- GitHub Issues: [Report issues](https://github.com/your-repo/issues)
- Discord: Join development community
- Email: support@yourproject.com

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

**Last Updated**: 2024
**Version**: 1.0.0
