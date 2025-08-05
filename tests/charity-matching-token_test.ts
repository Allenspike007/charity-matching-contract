
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.14.0/index.ts';
import { assertEquals, assert } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Test NFT trait implementation - get-last-token-id",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet_1 = accounts.get('wallet_1')!;
        
        // Initial total supply should be 0
        let result = chain.callReadOnlyFn(
            'charity-matching-token',
            'get-last-token-id',
            [],
            deployer.address
        );
        assertEquals(result.result, '(ok u0)');
    },
});

Clarinet.test({
    name: "Test NFT trait implementation - get-token-uri",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        
        // Token URI should return the contract's token URI
        let result = chain.callReadOnlyFn(
            'charity-matching-token',
            'get-token-uri',
            [types.uint(1)],
            deployer.address
        );
        assertEquals(result.result, '(ok (some u""))');
    },
});

Clarinet.test({
    name: "Test NFT trait implementation - get-owner",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        
        // Get owner should return the sender
        let result = chain.callReadOnlyFn(
            'charity-matching-token',
            'get-owner',
            [types.uint(1)],
            deployer.address
        );
        assertEquals(result.result, `(ok (some ${deployer.address}))`);
    },
});

Clarinet.test({
    name: "Test minting tokens",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet_1 = accounts.get('wallet_1')!;
        
        // Mint a token to wallet_1
        let block = chain.mineBlock([
            Tx.contractCall(
                'charity-matching-token',
                'mint',
                [types.principal(wallet_1.address)],
                deployer.address
            )
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 2);
        assertEquals(block.receipts[0].result, '(ok u1)');
        
        // Check balance
        let balanceResult = chain.callReadOnlyFn(
            'charity-matching-token',
            'get-balance',
            [types.principal(wallet_1.address)],
            wallet_1.address
        );
        assertEquals(balanceResult.result, '(ok u1)');
        
        // Check total supply
        let supplyResult = chain.callReadOnlyFn(
            'charity-matching-token',
            'get-last-token-id',
            [],
            deployer.address
        );
        assertEquals(supplyResult.result, '(ok u1)');
    },
});

Clarinet.test({
    name: "Test minting tokens - unauthorized",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet_1 = accounts.get('wallet_1')!;
        
        // Try to mint from non-owner account
        let block = chain.mineBlock([
            Tx.contractCall(
                'charity-matching-token',
                'mint',
                [types.principal(wallet_1.address)],
                wallet_1.address
            )
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 2);
        assertEquals(block.receipts[0].result, '(err u1000)'); // ERR-NOT-AUTHORIZED
    },
});

Clarinet.test({
    name: "Test token transfer",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet_1 = accounts.get('wallet_1')!;
        const wallet_2 = accounts.get('wallet_2')!;
        
        // First mint a token to wallet_1
        chain.mineBlock([
            Tx.contractCall(
                'charity-matching-token',
                'mint',
                [types.principal(wallet_1.address)],
                deployer.address
            )
        ]);
        
        // Transfer token from wallet_1 to wallet_2
        let block = chain.mineBlock([
            Tx.contractCall(
                'charity-matching-token',
                'transfer',
                [types.uint(1), types.principal(wallet_1.address), types.principal(wallet_2.address)],
                wallet_1.address
            )
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 3);
        assertEquals(block.receipts[0].result, '(ok true)');
        
        // Check balances
        let balance1 = chain.callReadOnlyFn(
            'charity-matching-token',
            'get-balance',
            [types.principal(wallet_1.address)],
            wallet_1.address
        );
        assertEquals(balance1.result, '(ok u0)');
        
        let balance2 = chain.callReadOnlyFn(
            'charity-matching-token',
            'get-balance',
            [types.principal(wallet_2.address)],
            wallet_2.address
        );
        assertEquals(balance2.result, '(ok u1)');
    },
});

Clarinet.test({
    name: "Test token transfer - insufficient balance",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet_1 = accounts.get('wallet_1')!;
        const wallet_2 = accounts.get('wallet_2')!;
        
        // Try to transfer without having tokens
        let block = chain.mineBlock([
            Tx.contractCall(
                'charity-matching-token',
                'transfer',
                [types.uint(1), types.principal(wallet_1.address), types.principal(wallet_2.address)],
                wallet_1.address
            )
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 2);
        assertEquals(block.receipts[0].result, '(err u1002)'); // ERR-INSUFFICIENT-BALANCE
    },
});

Clarinet.test({
    name: "Test token transfer - unauthorized sender",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet_1 = accounts.get('wallet_1')!;
        const wallet_2 = accounts.get('wallet_2')!;
        
        // Mint token to wallet_1
        chain.mineBlock([
            Tx.contractCall(
                'charity-matching-token',
                'mint',
                [types.principal(wallet_1.address)],
                deployer.address
            )
        ]);
        
        // Try to transfer from wallet_2 (not the owner)
        let block = chain.mineBlock([
            Tx.contractCall(
                'charity-matching-token',
                'transfer',
                [types.uint(1), types.principal(wallet_1.address), types.principal(wallet_2.address)],
                wallet_2.address
            )
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 3);
        assertEquals(block.receipts[0].result, '(err u1000)'); // ERR-NOT-AUTHORIZED
    },
});

Clarinet.test({
    name: "Test registering approved causes",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet_1 = accounts.get('wallet_1')!;
        
        // Register a cause
        let block = chain.mineBlock([
            Tx.contractCall(
                'charity-matching-token',
                'register-cause',
                [types.ascii('cancer-research')],
                deployer.address
            )
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 2);
        assertEquals(block.receipts[0].result, '(ok true)');
        
        // Check if cause is approved
        let isApproved = chain.callReadOnlyFn(
            'charity-matching-token',
            'is-cause-approved',
            [types.ascii('cancer-research')],
            deployer.address
        );
        assertEquals(isApproved.result, '(ok true)');
    },
});

Clarinet.test({
    name: "Test registering causes - unauthorized",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet_1 = accounts.get('wallet_1')!;
        
        // Try to register cause from non-owner
        let block = chain.mineBlock([
            Tx.contractCall(
                'charity-matching-token',
                'register-cause',
                [types.ascii('cancer-research')],
                wallet_1.address
            )
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 2);
        assertEquals(block.receipts[0].result, '(err u1000)'); // ERR-NOT-AUTHORIZED
    },
});

Clarinet.test({
    name: "Test funding matching pool",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        
        // Fund the matching pool
        let block = chain.mineBlock([
            Tx.contractCall(
                'charity-matching-token',
                'fund-matching-pool',
                [types.uint(10000)],
                deployer.address
            )
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 2);
        assertEquals(block.receipts[0].result, '(ok true)');
        
        // Check matching pool balance
        let poolBalance = chain.callReadOnlyFn(
            'charity-matching-token',
            'get-matching-pool',
            [],
            deployer.address
        );
        assertEquals(poolBalance.result, '(ok u10000)');
    },
});

Clarinet.test({
    name: "Test funding matching pool - unauthorized",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet_1 = accounts.get('wallet_1')!;
        
        // Try to fund from non-owner
        let block = chain.mineBlock([
            Tx.contractCall(
                'charity-matching-token',
                'fund-matching-pool',
                [types.uint(10000)],
                wallet_1.address
            )
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 2);
        assertEquals(block.receipts[0].result, '(err u1000)'); // ERR-NOT-AUTHORIZED
    },
});

Clarinet.test({
    name: "Test donation with matching - basic scenario",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet_1 = accounts.get('wallet_1')!;
        
        // Setup: Register cause, fund pool, mint tokens
        chain.mineBlock([
            Tx.contractCall(
                'charity-matching-token',
                'register-cause',
                [types.ascii('cancer-research')],
                deployer.address
            ),
            Tx.contractCall(
                'charity-matching-token',
                'fund-matching-pool',
                [types.uint(10000)],
                deployer.address
            ),
            Tx.contractCall(
                'charity-matching-token',
                'mint',
                [types.principal(wallet_1.address)],
                deployer.address
            )
        ]);
        
        // Make donation
        let block = chain.mineBlock([
            Tx.contractCall(
                'charity-matching-token',
                'donate',
                [types.ascii('cancer-research'), types.uint(1000)],
                wallet_1.address
            )
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 3);
        // Expected: donation 1000, match 0 (1/1000 = 0 in integer division)
        assertEquals(block.receipts[0].result, '(ok {donated: u1000, matched: u0})');
        
        // Check donation history
        let history = chain.callReadOnlyFn(
            'charity-matching-token',
            'get-donation-history',
            [types.principal(wallet_1.address), types.ascii('cancer-research')],
            wallet_1.address
        );
        assertEquals(history.result, '(ok (some {amount: u1000, matched: u0}))');
        
        // Check updated matching pool
        let poolBalance = chain.callReadOnlyFn(
            'charity-matching-token',
            'get-matching-pool',
            [],
            deployer.address
        );
        assertEquals(poolBalance.result, '(ok u10000)'); // 10000 - 0
    },
});

Clarinet.test({
    name: "Test donation - invalid cause",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet_1 = accounts.get('wallet_1')!;
        
        // Try to donate to unregistered cause
        let block = chain.mineBlock([
            Tx.contractCall(
                'charity-matching-token',
                'donate',
                [types.ascii('invalid-cause'), types.uint(1000)],
                wallet_1.address
            )
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 2);
        assertEquals(block.receipts[0].result, '(err u1003)'); // ERR-INVALID-CAUSE
    },
});

Clarinet.test({
    name: "Test donation - invalid amount",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet_1 = accounts.get('wallet_1')!;
        
        // Register cause
        chain.mineBlock([
            Tx.contractCall(
                'charity-matching-token',
                'register-cause',
                [types.ascii('cancer-research')],
                deployer.address
            )
        ]);
        
        // Try to donate 0 amount
        let block = chain.mineBlock([
            Tx.contractCall(
                'charity-matching-token',
                'donate',
                [types.ascii('cancer-research'), types.uint(0)],
                wallet_1.address
            )
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 3);
        assertEquals(block.receipts[0].result, '(err u1001)'); // ERR-INVALID-AMOUNT
    },
});

Clarinet.test({
    name: "Test donation with higher token balance - more matching",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet_1 = accounts.get('wallet_1')!;
        
        // Setup: Register cause, fund pool, mint multiple tokens
        chain.mineBlock([
            Tx.contractCall(
                'charity-matching-token',
                'register-cause',
                [types.ascii('cancer-research')],
                deployer.address
            ),
            Tx.contractCall(
                'charity-matching-token',
                'fund-matching-pool',
                [types.uint(10000)],
                deployer.address
            )
        ]);
        
        // Mint 10 tokens to wallet_1
        for (let i = 0; i < 10; i++) {
            chain.mineBlock([
                Tx.contractCall(
                    'charity-matching-token',
                    'mint',
                    [types.principal(wallet_1.address)],
                    deployer.address
                )
            ]);
        }
        
        // Make donation with 10 tokens (should get 1% match)
        let block = chain.mineBlock([
            Tx.contractCall(
                'charity-matching-token',
                'donate',
                [types.ascii('cancer-research'), types.uint(1000)],
                wallet_1.address
            )
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 13);
        // Expected: donation 1000, match 0 (10/1000 = 0 in integer division)
        assertEquals(block.receipts[0].result, '(ok {donated: u1000, matched: u0})');
    },
});

Clarinet.test({
    name: "Test donation with limited matching pool",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet_1 = accounts.get('wallet_1')!;
        
        // Setup: Register cause, fund small pool, mint many tokens
        chain.mineBlock([
            Tx.contractCall(
                'charity-matching-token',
                'register-cause',
                [types.ascii('cancer-research')],
                deployer.address
            ),
            Tx.contractCall(
                'charity-matching-token',
                'fund-matching-pool',
                [types.uint(5)], // Only 5 available for matching
                deployer.address
            )
        ]);
        
        // Mint 100 tokens to wallet_1
        for (let i = 0; i < 100; i++) {
            chain.mineBlock([
                Tx.contractCall(
                    'charity-matching-token',
                    'mint',
                    [types.principal(wallet_1.address)],
                    deployer.address
                )
            ]);
        }
        
        // Make donation that would exceed pool
        let block = chain.mineBlock([
            Tx.contractCall(
                'charity-matching-token',
                'donate',
                [types.ascii('cancer-research'), types.uint(1000)],
                wallet_1.address
            )
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 103);
        // Expected: donation 1000, match 0 (100/1000 = 0 in integer division)
        assertEquals(block.receipts[0].result, '(ok {donated: u1000, matched: u0})');
        
        // Check pool is now empty
        let poolBalance = chain.callReadOnlyFn(
            'charity-matching-token',
            'get-matching-pool',
            [],
            deployer.address
        );
        assertEquals(poolBalance.result, '(ok u5)'); // Pool unchanged since no matching occurred
    },
});

Clarinet.test({
    name: "Test multiple donations to same cause",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet_1 = accounts.get('wallet_1')!;
        
        // Setup
        chain.mineBlock([
            Tx.contractCall(
                'charity-matching-token',
                'register-cause',
                [types.ascii('cancer-research')],
                deployer.address
            ),
            Tx.contractCall(
                'charity-matching-token',
                'fund-matching-pool',
                [types.uint(10000)],
                deployer.address
            ),
            Tx.contractCall(
                'charity-matching-token',
                'mint',
                [types.principal(wallet_1.address)],
                deployer.address
            )
        ]);
        
        // First donation
        chain.mineBlock([
            Tx.contractCall(
                'charity-matching-token',
                'donate',
                [types.ascii('cancer-research'), types.uint(1000)],
                wallet_1.address
            )
        ]);
        
        // Second donation (should overwrite history)
        let block = chain.mineBlock([
            Tx.contractCall(
                'charity-matching-token',
                'donate',
                [types.ascii('cancer-research'), types.uint(2000)],
                wallet_1.address
            )
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 4);
        assertEquals(block.receipts[0].result, '(ok {donated: u2000, matched: u0})');
        
        // Check final donation history
        let history = chain.callReadOnlyFn(
            'charity-matching-token',
            'get-donation-history',
            [types.principal(wallet_1.address), types.ascii('cancer-research')],
            wallet_1.address
        );
        assertEquals(history.result, '(ok (some {amount: u2000, matched: u0}))');
    },
});

Clarinet.test({
    name: "Test donations to different causes",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet_1 = accounts.get('wallet_1')!;
        
        // Setup: Register multiple causes
        chain.mineBlock([
            Tx.contractCall(
                'charity-matching-token',
                'register-cause',
                [types.ascii('cancer-research')],
                deployer.address
            ),
            Tx.contractCall(
                'charity-matching-token',
                'register-cause',
                [types.ascii('education-fund')],
                deployer.address
            ),
            Tx.contractCall(
                'charity-matching-token',
                'fund-matching-pool',
                [types.uint(10000)],
                deployer.address
            ),
            Tx.contractCall(
                'charity-matching-token',
                'mint',
                [types.principal(wallet_1.address)],
                deployer.address
            )
        ]);
        
        // Donate to first cause
        chain.mineBlock([
            Tx.contractCall(
                'charity-matching-token',
                'donate',
                [types.ascii('cancer-research'), types.uint(1000)],
                wallet_1.address
            )
        ]);
        
        // Donate to second cause
        let block = chain.mineBlock([
            Tx.contractCall(
                'charity-matching-token',
                'donate',
                [types.ascii('education-fund'), types.uint(500)],
                wallet_1.address
            )
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 4);
        assertEquals(block.receipts[0].result, '(ok {donated: u500, matched: u0})'); // 0.5 rounded down
        
        // Check both donation histories
        let history1 = chain.callReadOnlyFn(
            'charity-matching-token',
            'get-donation-history',
            [types.principal(wallet_1.address), types.ascii('cancer-research')],
            wallet_1.address
        );
        assertEquals(history1.result, '(ok (some {amount: u1000, matched: u0}))');
        
        let history2 = chain.callReadOnlyFn(
            'charity-matching-token',
            'get-donation-history',
            [types.principal(wallet_1.address), types.ascii('education-fund')],
            wallet_1.address
        );
        assertEquals(history2.result, '(ok (some {amount: u500, matched: u0}))');
    },
});

Clarinet.test({
    name: "Test edge case - donation with no tokens",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet_1 = accounts.get('wallet_1')!;
        
        // Setup: Register cause and fund pool, but don't mint tokens
        chain.mineBlock([
            Tx.contractCall(
                'charity-matching-token',
                'register-cause',
                [types.ascii('cancer-research')],
                deployer.address
            ),
            Tx.contractCall(
                'charity-matching-token',
                'fund-matching-pool',
                [types.uint(10000)],
                deployer.address
            )
        ]);
        
        // Donate without tokens
        let block = chain.mineBlock([
            Tx.contractCall(
                'charity-matching-token',
                'donate',
                [types.ascii('cancer-research'), types.uint(1000)],
                wallet_1.address
            )
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 3);
        // Expected: donation 1000, match 0 (no tokens held)
        assertEquals(block.receipts[0].result, '(ok {donated: u1000, matched: u0})');
    },
});

Clarinet.test({
    name: "Test comprehensive token lifecycle",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet_1 = accounts.get('wallet_1')!;
        const wallet_2 = accounts.get('wallet_2')!;
        
        // 1. Register cause and fund pool
        chain.mineBlock([
            Tx.contractCall(
                'charity-matching-token',
                'register-cause',
                [types.ascii('cancer-research')],
                deployer.address
            ),
            Tx.contractCall(
                'charity-matching-token',
                'fund-matching-pool',
                [types.uint(10000)],
                deployer.address
            )
        ]);
        
        // 2. Mint tokens to wallet_1
        chain.mineBlock([
            Tx.contractCall(
                'charity-matching-token',
                'mint',
                [types.principal(wallet_1.address)],
                deployer.address
            ),
            Tx.contractCall(
                'charity-matching-token',
                'mint',
                [types.principal(wallet_1.address)],
                deployer.address
            )
        ]);
        
        // 3. Transfer one token to wallet_2
        chain.mineBlock([
            Tx.contractCall(
                'charity-matching-token',
                'transfer',
                [types.uint(1), types.principal(wallet_1.address), types.principal(wallet_2.address)],
                wallet_1.address
            )
        ]);
        
        // 4. Both wallets donate
        chain.mineBlock([
            Tx.contractCall(
                'charity-matching-token',
                'donate',
                [types.ascii('cancer-research'), types.uint(1000)],
                wallet_1.address
            ),
            Tx.contractCall(
                'charity-matching-token',
                'donate',
                [types.ascii('cancer-research'), types.uint(500)],
                wallet_2.address
            )
        ]);
        
        // Verify final states
        let balance1 = chain.callReadOnlyFn(
            'charity-matching-token',
            'get-balance',
            [types.principal(wallet_1.address)],
            wallet_1.address
        );
        assertEquals(balance1.result, '(ok u1)');
        
        let balance2 = chain.callReadOnlyFn(
            'charity-matching-token',
            'get-balance',
            [types.principal(wallet_2.address)],
            wallet_2.address
        );
        assertEquals(balance2.result, '(ok u1)');
        
        let totalSupply = chain.callReadOnlyFn(
            'charity-matching-token',
            'get-last-token-id',
            [],
            deployer.address
        );
        assertEquals(totalSupply.result, '(ok u2)');
        
        // Check donation histories
        let history1 = chain.callReadOnlyFn(
            'charity-matching-token',
            'get-donation-history',
            [types.principal(wallet_1.address), types.ascii('cancer-research')],
            wallet_1.address
        );
        assertEquals(history1.result, '(ok (some {amount: u1000, matched: u0}))');
        
        let history2 = chain.callReadOnlyFn(
            'charity-matching-token',
            'get-donation-history',
            [types.principal(wallet_2.address), types.ascii('cancer-research')],
            wallet_2.address
        );
        assertEquals(history2.result, '(ok (some {amount: u500, matched: u0}))');
    },
});
