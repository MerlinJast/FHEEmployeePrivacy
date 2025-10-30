# CI/CD Pipeline Documentation

Comprehensive guide for the Continuous Integration and Continuous Deployment pipeline.

## Overview

This project uses GitHub Actions for automated testing, code quality checks, and deployment workflows. Every push to main/develop branches and all pull requests trigger automated checks.

## CI/CD Workflows

### 1. Test Suite Workflow (`.github/workflows/test.yml`)

**Triggered on:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**

#### Lint Job
- **Purpose**: Code quality and style checks
- **Steps**:
  - Solidity linting with Solhint
  - Code formatting check with Prettier
  - JavaScript/TypeScript linting with ESLint
- **Node Version**: 20.x
- **Duration**: ~2-3 minutes

#### Test Job
- **Purpose**: Run test suite on multiple Node versions
- **Matrix Strategy**: Node.js 18.x and 20.x
- **Steps**:
  - Install dependencies
  - Compile smart contracts
  - Run test suite
  - Generate coverage report
  - Upload coverage to Codecov
- **Duration**: ~5-7 minutes per version

#### Build Job
- **Purpose**: Verify successful build
- **Depends on**: Lint and Test jobs
- **Steps**:
  - Compile contracts
  - Build artifacts
  - Verify build outputs
- **Duration**: ~2-3 minutes

### 2. Pull Request Workflow (`.github/workflows/pr-check.yml`)

**Triggered on:**
- Pull request opened, synchronized, or reopened

**Features:**
- Automated code validation
- Comment on PR with test results
- Coverage reports
- Build verification

**Duration**: ~8-10 minutes

## Code Quality Tools

### Solhint Configuration (`.solhint.json`)

Solidity linting rules:

- **Code Complexity**: Max 8
- **Compiler Version**: >= 0.8.24
- **Max Line Length**: 120 characters
- **Function Visibility**: Required (except constructors)
- **Naming Conventions**: Enforced
- **Security**: Best practices enabled

**Usage:**
```bash
npm run lint:sol
```

### Prettier Configuration (`.prettierrc.json`)

Code formatting rules:

- **Print Width**: 120
- **Tab Width**: 2 spaces (4 for Solidity)
- **Semicolons**: Required
- **Quotes**: Double quotes
- **Trailing Commas**: ES5
- **End of Line**: LF

**Usage:**
```bash
# Check formatting
npm run prettier:check

# Fix formatting
npm run prettier

# Format Solidity only
npm run prettier:sol
```

### Codecov Integration (`codecov.yml`)

Coverage requirements:

- **Project Target**: 80%
- **Patch Target**: 70%
- **Precision**: 2 decimal places
- **CI Required**: Yes

**Features:**
- Automated coverage reports
- PR comments with coverage diff
- Coverage badges
- Trend analysis

## NPM Scripts Reference

### Linting

```bash
# Run all linters
npm run lint

# Solidity only
npm run lint:sol

# JavaScript/TypeScript only
npm run lint:js

# Check code formatting
npm run prettier:check

# Fix formatting
npm run prettier
```

### Testing

```bash
# Run tests
npm test

# Generate coverage
npm run coverage

# Compile contracts
npm run compile
```

### Build

```bash
# Clean artifacts
npm run clean

# Full build
npm run compile
```

## GitHub Actions Setup

### Required Secrets

Add these secrets in GitHub repository settings:

1. **CODECOV_TOKEN**
   - Get from https://codecov.io/
   - Settings → Secrets and variables → Actions
   - New repository secret

### Badge Setup

Add to README.md:

```markdown
[![Tests](https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/test.yml/badge.svg)](https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/YOUR_ORG/YOUR_REPO/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_ORG/YOUR_REPO)
```

## Workflow Files

### test.yml Structure

```
test.yml
├── lint (Code Quality)
│   ├── Checkout code
│   ├── Setup Node 20.x
│   ├── Install dependencies
│   ├── Run Solhint
│   ├── Check Prettier
│   └── Run ESLint
├── test (Test Suite)
│   ├── Matrix: Node 18.x, 20.x
│   ├── Checkout code
│   ├── Setup Node
│   ├── Install dependencies
│   ├── Compile contracts
│   ├── Run tests
│   ├── Generate coverage
│   └── Upload to Codecov
└── build (Build Check)
    ├── Checkout code
    ├── Setup Node 20.x
    ├── Install dependencies
    ├── Compile contracts
    └── Verify artifacts
```

### pr-check.yml Structure

```
pr-check.yml
├── pr-validation
│   ├── Checkout code
│   ├── Setup Node 20.x
│   ├── Install dependencies
│   ├── Lint contracts
│   ├── Compile contracts
│   ├── Run tests
│   ├── Check coverage
│   └── Comment on PR
```

## Running Checks Locally

### Before Pushing

```bash
# 1. Lint code
npm run lint

# 2. Run tests
npm test

# 3. Check coverage
npm run coverage

# 4. Format code
npm run prettier
```

### Full CI Simulation

```bash
# Simulate complete CI workflow
npm run lint && \
npm run compile && \
npm test && \
npm run coverage
```

## Troubleshooting

### Lint Failures

**Solhint errors:**
```bash
# View detailed errors
npx solhint contracts/**/*.sol

# Fix automatically (if supported)
npx solhint contracts/**/*.sol --fix
```

**Prettier errors:**
```bash
# Show formatting differences
npm run prettier:check

# Auto-fix formatting
npm run prettier
```

### Test Failures

**Local vs CI differences:**
- Check Node version match
- Clear caches: `npm run clean`
- Reinstall: `rm -rf node_modules && npm install`

### Coverage Issues

**Low coverage:**
- Add missing test cases
- Check coverage report: `coverage/lcov-report/index.html`

**Upload failures:**
- Verify CODECOV_TOKEN secret
- Check network connectivity
- Review Codecov logs

## Best Practices

### Commit Workflow

1. **Before commit:**
   ```bash
   npm run lint
   npm run prettier
   npm test
   ```

2. **Commit:**
   ```bash
   git add .
   git commit -m "feat: your message"
   ```

3. **Push:**
   ```bash
   git push origin your-branch
   ```

### Pull Request Workflow

1. **Create PR**
   - Clear title and description
   - Link related issues
   - Wait for CI checks

2. **Review CI Results**
   - All checks must pass
   - Review coverage report
   - Fix any issues

3. **Merge**
   - Squash commits if needed
   - Delete branch after merge

## Configuration Files

### File Structure

```
.github/
  workflows/
    test.yml          # Main CI workflow
    pr-check.yml      # PR validation
.prettierrc.json      # Prettier config
.prettierignore       # Prettier ignore
.solhint.json         # Solhint config
.solhintignore        # Solhint ignore
codecov.yml           # Codecov config
```

### Ignored Patterns

All tools ignore:
- `node_modules/`
- `artifacts/`
- `cache/`
- `coverage/`
- `dist/`
- `typechain-types/`

## Monitoring

### GitHub Actions Dashboard

View workflow runs:
- Repository → Actions tab
- Filter by workflow name
- View logs and artifacts

### Codecov Dashboard

View coverage reports:
- https://codecov.io/gh/YOUR_ORG/YOUR_REPO
- Branch coverage
- Commit coverage
- Trends and graphs

## Performance Optimization

### Caching Strategy

GitHub Actions cache:
- `node_modules` via npm cache
- Hardhat artifacts
- Compilation outputs

### Parallel Execution

Jobs run in parallel:
- Lint (independent)
- Test matrix (18.x and 20.x parallel)
- Build (after lint + test)

### Estimated Times

- **Lint**: 2-3 minutes
- **Test (per version)**: 5-7 minutes
- **Build**: 2-3 minutes
- **Total**: 8-12 minutes (parallel execution)

## Maintenance

### Regular Updates

```bash
# Update dependencies
npm update

# Update GitHub Actions
# Check for new action versions in workflows
```

### Security

```bash
# Audit dependencies
npm audit

# Fix vulnerabilities
npm audit fix
```

## Resources

### Documentation

- [GitHub Actions](https://docs.github.com/en/actions)
- [Solhint Rules](https://github.com/protofire/solhint/blob/master/docs/rules.md)
- [Prettier Options](https://prettier.io/docs/en/options.html)
- [Codecov Docs](https://docs.codecov.com/)

### Tools

- [act](https://github.com/nektos/act) - Run GitHub Actions locally
- [Codecov CLI](https://docs.codecov.com/docs/codecov-uploader) - Upload coverage manually

## Summary

✅ **Workflows**: 2 GitHub Actions workflows
✅ **Code Quality**: Solhint + Prettier + ESLint
✅ **Testing**: Automated on push/PR
✅ **Coverage**: Codecov integration
✅ **Multi-version**: Node 18.x and 20.x
✅ **Documentation**: Complete CI/CD guide

---

**Last Updated**: 2024-10-30
**Version**: 1.0.0
**Status**: Production Ready
