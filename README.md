# Charity Matching Token - README

## Overview

**Charity Matching Token** is a decentralized token system designed to promote charitable donations by matching user contributions based on their token holdings. The smart contract uses a matching pool to incentivize donations, providing a unique mechanism for rewarding token holders who contribute to approved causes.

---

## Features

- **Token Transfer**: Users can transfer tokens between accounts.
- **Charitable Matching**: Donations are matched based on the number of tokens held by the donor, encouraging participation in the ecosystem.
- **Cause Registration**: Only approved causes can receive donations, ensuring legitimacy.
- **Donation History**: A record of donations and matching amounts is maintained for transparency.
- **Matching Pool Management**: Contract owner can fund the matching pool to support donations.

---

## Implementation

### Contract Details

- **Language**: Clarity
- **Version**: 1.0
- **Traits**: Implements `SP000000000000000000002Q6VF78.traits.nft-trait` for NFT compliance.

### Key Components

1. **Error Codes**: 
   - `ERR-NOT-AUTHORIZED`: Unauthorized actions.
   - `ERR-INVALID-AMOUNT`: Donation amount is invalid.
   - `ERR-INSUFFICIENT-BALANCE`: Insufficient token balance for transfer.
   - `ERR-INVALID-CAUSE`: Cause is not registered or approved.

2. **Data Variables**:
   - `token-uri`: Metadata URI for the tokens.
   - `contract-owner`: The principal address of the contract owner.
   - `matching-pool`: Total funds available for matching donations.
   - `total-supply`: Total tokens minted.

3. **Data Maps**:
   - `token-balances`: Tracks token holdings for each user.
   - `approved-causes`: List of verified charitable causes.
   - `donation-history`: Records donations and matched amounts.

---

## Functions

### Public Functions

- **`transfer`**: Transfer tokens from one user to another.
- **`register-cause`**: Register a new charitable cause (only by contract owner).
- **`donate`**: Make a donation to an approved cause with matching funds.
- **`mint`**: Mint new tokens to a recipient (only by contract owner).
- **`fund-matching-pool`**: Add funds to the matching pool (only by contract owner).

### Read-Only Functions

- **`get-balance`**: Retrieve the token balance of a specific account.
- **`get-donation-history`**: Fetch donation history for a specific donor and cause.
- **`get-matching-pool`**: Check the available funds in the matching pool.
- **`is-cause-approved`**: Verify if a cause is registered and approved.

### Private Functions

- **`calculate-match`**: Calculate the matching amount for a donation based on token holdings and the matching pool.

---

## How It Works

1. **Token Minting**: The contract owner mints tokens and assigns them to users.
2. **Cause Registration**: The contract owner registers legitimate causes.
3. **Making Donations**:
   - Users donate to approved causes.
   - Donations are matched based on token holdings and available funds in the matching pool.
4. **Matching Pool Management**: The contract owner funds the matching pool to support matching contributions.

---

## Deployment

1. **Prerequisites**:
   - Install Clarinet for development and testing.
   - Ensure a Stacks Wallet is set up for deploying the contract.

2. **Deploy the Contract**:
   - Use Clarinet CLI:
     ```bash
     clarinet deploy
     ```

3. **Testing**:
   - Run unit tests using Clarinet:
     ```bash
     clarinet test
     ```

---

## Usage

- **Interact with the contract** via a blockchain interface or a custom-built frontend.
- **Verify Transactions** on the Stacks Explorer for transparency.

---

## License

This project is licensed under the MIT License. 

---

## Contributing

Feel free to submit issues or pull requests to improve the functionality of the Charity Matching Token. 

For more details, contact the project maintainer.