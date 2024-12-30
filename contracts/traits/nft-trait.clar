;; NFT trait
(define-trait nft-trait
    (
        ;; Last token ID
        (get-last-token-id () (response uint uint))

        ;; URI for token metadata
        (get-token-uri (uint) (response (optional (string-utf8 256)) uint))

        ;; Owner of the specified token
        (get-owner (uint) (response (optional principal) uint))

        ;; Transfer token to a new principal
        (transfer (uint principal principal) (response bool uint))
    )
)