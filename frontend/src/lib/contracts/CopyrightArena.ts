import { TransactionReceipt, CreatorProfile, Work, Dispute, ArbitrationVerdict, RoyaltyRedirect, FullDispute } from "../contracts/types";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";
import { parseEther } from "viem";

// ─── Type Definitions (matching your smart contract dataclasses) ─────────────

// ─── Contract Client ─────────────────────────────────────────────────────────

class CopyRightArena {
    private contractAddress: `0x${string}`;
    private client: ReturnType<typeof createClient>;

    constructor(
        contractAddress: string,
        address?: string | null,
        studioUrl?: string
    ) {
        this.contractAddress = contractAddress as `0x${string}`;

        const config: any = {
            chain: studionet,
        };

        if (address) {
            config.account = address as `0x${string}`;
        }

        if (studioUrl) {
            config.endpoint = studioUrl;
        }

        this.client = createClient(config);
    }

    /**
     * Update the wallet address used for signing transactions
     */
    updateAccount(address: string): void {
        const config: any = {
            chain: studionet,
            account: address as `0x${string}`,
        };
        this.client = createClient(config);
    }

    // ─── Profile ─────────────────────────────────────────────────────────────

    async updateProfile(displayName: string, bio: string): Promise<TransactionReceipt> {
        await this.client.connect("studionet");
        try {
            const txHash = await this.client.writeContract({
                address: this.contractAddress,
                functionName: "update_profile",
                args: [displayName, bio],
                value: BigInt(0),
            });

            const receipt = await this.client.waitForTransactionReceipt({
                hash: txHash,
                status: TransactionStatus.ACCEPTED,
            });
            return receipt as TransactionReceipt;
        } catch (error) {
            console.error("Error updating profile:", error);
            throw new Error("Failed to update profile");
        }
    }

    async getCreator(wallet: string): Promise<CreatorProfile> {
        try {
            const profile = await this.client.readContract({
                address: this.contractAddress,
                functionName: "get_creator",
                args: [wallet],
            });
            return profile as CreatorProfile;
        } catch (error) {
            console.error("Error fetching creator:", error);
            throw new Error("Failed to fetch creator profile");
        }
    }

    async creatorExists(wallet: string): Promise<boolean> {
        try {
            return await this.client.readContract({
                address: this.contractAddress,
                functionName: "creator_exists",
                args: [wallet],
            });
        } catch (error) {
            console.error("Error checking creator exists:", error);
            return false;
        }
    }

    // ─── Work Registration ───────────────────────────────────────────────────

    async registerWork(
        title: string,
        description: string,
        contentType: string,
        contentUrl: string,
        transcriptUrl: string,
        contentHash: string,
        licenseType: string,
        licenseDescription: string,
        royaltyPercentage: number,
        revenueAddress: string
    ): Promise<TransactionReceipt> {
        await this.client.connect("studionet");
        try {
            const txHash = await this.client.writeContract({
                address: this.contractAddress,
                functionName: "register_work",
                args: [
                    title,
                    description,
                    contentType,
                    contentUrl,
                    transcriptUrl,
                    contentHash,
                    licenseType,
                    licenseDescription,
                    royaltyPercentage,
                    revenueAddress,
                ],
                value: BigInt(0),
            });

            const receipt = await this.client.waitForTransactionReceipt({
                hash: txHash,
                status: TransactionStatus.ACCEPTED,
            });
            return receipt as TransactionReceipt;
        } catch (error) {
            console.error("Error registering work:", error);
            throw new Error("Failed to register work");
        }
    }

    async updateWorkLicense(
        workId: string,
        licenseType: string,
        licenseDescription: string,
        royaltyPercentage: number
    ): Promise<TransactionReceipt> {
        await this.client.connect("studionet");
        try {
            const txHash = await this.client.writeContract({
                address: this.contractAddress,
                functionName: "update_work_license",
                args: [workId, licenseType, licenseDescription, royaltyPercentage],
                value: BigInt(0),
            });

            const receipt = await this.client.waitForTransactionReceipt({
                hash: txHash,
                status: TransactionStatus.ACCEPTED,
            });
            return receipt as TransactionReceipt;
        } catch (error) {
            console.error("Error updating work license:", error);
            throw new Error("Failed to update work license");
        }
    }

    async getWork(workId: string): Promise<Work> {
        try {
            const work = await this.client.readContract({
                address: this.contractAddress,
                functionName: "get_work",
                args: [workId],
            });
            return work as Work;
        } catch (error) {
            console.error("Error fetching work:", error);
            throw new Error("Failed to fetch work");
        }
    }

    async getAllWorks(): Promise<Work[]> {
        try {
            const works = await this.client.readContract({
                address: this.contractAddress,
                functionName: "get_all_works",
            });
            return works as Work[];
        } catch (error) {
            console.error("Error fetching all works:", error);
            throw new Error("Failed to fetch works");
        }
    }

    async getCreatorWorks(wallet: string): Promise<Work[]> {
        try {
            const works = await this.client.readContract({
                address: this.contractAddress,
                functionName: "get_creator_works",
                args: [wallet],
            });
            return works as Work[];
        } catch (error) {
            console.error("Error fetching creator works:", error);
            throw new Error("Failed to fetch creator's works");
        }
    }

    async checkHashRegistered(contentHash: string): Promise<string> {
        try {
            return await this.client.readContract({
                address: this.contractAddress,
                functionName: "check_hash_registered",
                args: [contentHash],
            });
        } catch (error) {
            console.error("Error checking hash:", error);
            return "";
        }
    }

    // ─── Disputes ────────────────────────────────────────────────────────────

    async fileDispute(
        originalWorkId: string,
        infringingWorkId: string,
        description: string
    ): Promise<TransactionReceipt> {
        await this.client.connect("studionet");
        try {
            const filingFee = await this.getFilingFee();
            const value = BigInt(filingFee) * BigInt(10 ** 18);

            const txHash = await this.client.writeContract({
                address: this.contractAddress,
                functionName: "file_dispute",
                args: [originalWorkId, infringingWorkId, description],
                value,
            });

            const receipt = await this.client.waitForTransactionReceipt({
                hash: txHash,
                status: TransactionStatus.ACCEPTED,
                retries: 60,
                interval: 5000,
            });
            return receipt as TransactionReceipt;
        } catch (error) {
            console.error("Error filing dispute:", error);
            throw new Error("Failed to file dispute");
        }
    }

    async submitEvidence(
        disputeId: string,
        title: string,
        contentUrl: string,
        description: string
    ): Promise<TransactionReceipt> {
        await this.client.connect("studionet");
        try {
            const txHash = await this.client.writeContract({
                address: this.contractAddress,
                functionName: "submit_evidence",
                args: [disputeId, title, contentUrl, description],
                value: BigInt(0),
            });

            const receipt = await this.client.waitForTransactionReceipt({
                hash: txHash,
                status: TransactionStatus.ACCEPTED,
            });
            return receipt as TransactionReceipt;
        } catch (error) {
            console.error("Error submitting evidence:", error);
            throw new Error("Failed to submit evidence");
        }
    }

    async renderVerdict(disputeId: string): Promise<TransactionReceipt> {
        await this.client.connect("studionet");
        try {
            const txHash = await this.client.writeContract({
                address: this.contractAddress,
                functionName: "render_verdict",
                args: [disputeId],
                value: BigInt(0),
            });

            const receipt = await this.client.waitForTransactionReceipt({
                hash: txHash,
                status: TransactionStatus.ACCEPTED,
                retries: 60,
                interval: 5000,
            });
            return receipt as TransactionReceipt;
        } catch (error) {
            console.error("Error rendering verdict:", error);
            throw new Error("Failed to render verdict");
        }
    }

    async payRoyalty(redirectId: string, amountInGen: number): Promise<TransactionReceipt> {
        await this.client.connect("studionet");
        try {
            const value = parseEther(amountInGen.toString());

            const txHash = await this.client.writeContract({
                address: this.contractAddress,
                functionName: "pay_royalty",
                args: [redirectId],
                value,
            });

            const receipt = await this.client.waitForTransactionReceipt({
                hash: txHash,
                status: TransactionStatus.ACCEPTED,
            });
            return receipt as TransactionReceipt;
        } catch (error) {
            console.error("Error paying royalty:", error);
            throw new Error("Failed to pay royalty");
        }
    }

    async appealVerdict(
        disputeId: string,
        appealContext: string,
        newEvidenceUrl: string
    ): Promise<TransactionReceipt> {
        await this.client.connect("studionet");
        try {
            const txHash = await this.client.writeContract({
                address: this.contractAddress,
                functionName: "appeal_verdict",
                args: [disputeId, appealContext, newEvidenceUrl],
                value: BigInt(0),
            });

            const receipt = await this.client.waitForTransactionReceipt({
                hash: txHash,
                status: TransactionStatus.ACCEPTED,
                retries: 60,
                interval: 5000,
            });
            return receipt as TransactionReceipt;
        } catch (error) {
            console.error("Error appealing verdict:", error);
            throw new Error("Failed to appeal verdict");
        }
    }

    // ─── Read Methods ────────────────────────────────────────────────────────

    async getDispute(disputeId: string): Promise<Dispute> {
        try {
            const dispute = await this.client.readContract({
                address: this.contractAddress,
                functionName: "get_dispute",
                args: [disputeId],
            });
            return dispute as Dispute;
        } catch (error) {
            console.error("Error fetching dispute:", error);
            throw new Error("Failed to fetch dispute");
        }
    }

    async getVerdict(verdictId: string): Promise<ArbitrationVerdict> {
        try {
            const verdict = await this.client.readContract({
                address: this.contractAddress,
                functionName: "get_verdict",
                args: [verdictId],
            });
            return verdict as ArbitrationVerdict;
        } catch (error) {
            console.error("Error fetching verdict:", error);
            throw new Error("Failed to fetch verdict");
        }
    }

    async getEvidence(evidenceId: string): Promise<Evidence> {
        try {
            const evidence = await this.client.readContract({
                address: this.contractAddress,
                functionName: "get_evidence",
                args: [evidenceId],
            });
            return evidence as Evidence;
        } catch (error) {
            console.error("Error fetching evidence:", error);
            throw new Error("Failed to fetch evidence");
        }
    }

    async getAllDisputes(): Promise<Dispute[]> {
        try {
            const disputes = await this.client.readContract({
                address: this.contractAddress,
                functionName: "get_all_disputes",
            });
            return disputes as Dispute[];
        } catch (error) {
            console.error("Error fetching all disputes:", error);
            throw new Error("Failed to fetch disputes");
        }
    }

    async getOpenDisputes(): Promise<Dispute[]> {
        try {
            const disputes = await this.client.readContract({
                address: this.contractAddress,
                functionName: "get_open_disputes",
            });
            return disputes as Dispute[];
        } catch (error) {
            console.error("Error fetching open disputes:", error);
            throw new Error("Failed to fetch open disputes");
        }
    }

    async getCreatorDisputes(wallet: string): Promise<Dispute[]> {
        try {
            const disputes = await this.client.readContract({
                address: this.contractAddress,
                functionName: "get_creator_disputes",
                args: [wallet],
            });
            return disputes as Dispute[];
        } catch (error) {
            console.error("Error fetching creator disputes:", error);
            throw new Error("Failed to fetch creator disputes");
        }
    }

    async getRoyaltyRedirect(redirectId: string): Promise<RoyaltyRedirect> {
        try {
            const redirect = await this.client.readContract({
                address: this.contractAddress,
                functionName: "get_royalty_redirect",
                args: [redirectId],
            });
            return redirect as RoyaltyRedirect;
        } catch (error) {
            console.error("Error fetching royalty redirect:", error);
            throw new Error("Failed to fetch royalty redirect");
        }
    }

    async getWalletRedirects(wallet: string): Promise<RoyaltyRedirect[]> {
        try {
            const redirects = await this.client.readContract({
                address: this.contractAddress,
                functionName: "get_wallet_redirects",
                args: [wallet],
            });
            return redirects as RoyaltyRedirect[];
        } catch (error) {
            console.error("Error fetching wallet redirects:", error);
            throw new Error("Failed to fetch wallet redirects");
        }
    }

    async getFilingFee(): Promise<number> {
        try {
            return await this.client.readContract({
                address: this.contractAddress,
                functionName: "get_filing_fee",
            });
        } catch (error) {
            console.error("Error fetching filing fee:", error);
            throw new Error("Failed to fetch filing fee");
        }
    }

    async getTotalWorks(): Promise<number> {
        try {
            return await this.client.readContract({
                address: this.contractAddress,
                functionName: "get_total_works",
            });
        } catch (error) {
            console.error("Error fetching total works:", error);
            return 0;
        }
    }

    async getTotalDisputes(): Promise<number> {
        try {
            return await this.client.readContract({
                address: this.contractAddress,
                functionName: "get_total_disputes",
            });
        } catch (error) {
            console.error("Error fetching total disputes:", error);
            return 0;
        }
    }

    // ─── Admin Methods ───────────────────────────────────────────────────────

    async adminDismissDispute(disputeId: string, reason: string): Promise<TransactionReceipt> {
        await this.client.connect("studionet");
        try {
            const txHash = await this.client.writeContract({
                address: this.contractAddress,
                functionName: "admin_dismiss_dispute",
                args: [disputeId, reason],
                value: BigInt(0),
            });

            const receipt = await this.client.waitForTransactionReceipt({
                hash: txHash,
                status: TransactionStatus.ACCEPTED,
            });
            return receipt as TransactionReceipt;
        } catch (error) {
            console.error("Error dismissing dispute (admin):", error);
            throw new Error("Failed to dismiss dispute (admin only)");
        }
    }

   
    async adminUpdateFilingFee(newFee: number): Promise<TransactionReceipt> {
        await this.client.connect("studionet");
        try {
            const txHash = await this.client.writeContract({
                address: this.contractAddress,
                functionName: "admin_update_filing_fee",
                args: [newFee],
                value: BigInt(0),
            });

            const receipt = await this.client.waitForTransactionReceipt({
                hash: txHash,
                status: TransactionStatus.ACCEPTED,
            });
            return receipt as TransactionReceipt;
        } catch (error) {
            console.error("Error updating filing fee (admin):", error);
            throw new Error("Failed to update filing fee (admin only)");
        }
    }

    async adminWithdrawTreasury(amount: number): Promise<TransactionReceipt> {
        await this.client.connect("studionet");
        try {
            const txHash = await this.client.writeContract({
                address: this.contractAddress,
                functionName: "admin_withdraw_treasury",
                args: [amount],
                value: BigInt(0),
            });

            const receipt = await this.client.waitForTransactionReceipt({
                hash: txHash,
                status: TransactionStatus.ACCEPTED,
            });
            return receipt as TransactionReceipt;
        } catch (error) {
            console.error("Error withdrawing treasury (admin):", error);
            throw new Error("Failed to withdraw treasury (admin only)");
        }
    }
    async getFullDispute(disputeId: string): Promise<FullDispute> {

    const dispute = await this.getDispute(disputeId);

    const [
        verdict,
        appealVerdict,
        evidence,
    ] = await Promise.all([

        dispute.verdict_id
            ? this.getVerdict(dispute.verdict_id)
            : Promise.resolve(undefined),

        dispute.appeal_verdict_id
            ? this.getVerdict(dispute.appeal_verdict_id)
            : Promise.resolve(undefined),

        Promise.all(
            dispute.evidence_ids.map((id) =>
                this.getEvidence(id)
            )
        ),
    ]);

    return {
        ...dispute,
        verdict,
        appealVerdict,
        evidence,
    };
}
}

export default CopyRightArena;