"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import CopyRightArena from "../contracts/CopyrightArena"; // Adjust path if needed
import { getContractAddress } from "../genlayer/client";
import { toast } from "sonner";
import {
    CreatorProfile,
    Work,
    Evidence,
    ArbitrationVerdict,
    Dispute,
    RoyaltyRedirect
} from "../contracts/types";
import { getAddress } from "viem";
import { useAccount } from "wagmi";
import { useWallet } from "../genlayer/wallet";

// ─── Main Contract Hook ─────────────────────────────────────────────────────
export function useCopyRightArenaContract(): CopyRightArena | null {
    const contractAddress = getContractAddress();
    const { address: rawAddress } = useWallet()
    const address = rawAddress ? getAddress(rawAddress) : "";

    return useMemo(() => {
        if (!contractAddress || !address) {
            return null;
        }
        return new CopyRightArena(contractAddress, address);
    }, [contractAddress, address]);
}

// ─── Profile ────────────────────────────────────────────────────────────────

export function useCheckIfCreatorExists(account_address: string | null) {
    const contract = useCopyRightArenaContract();

    return useQuery<boolean, Error>({
        queryKey: ["creatorExists", account_address],
        queryFn: async () => {
            if (!account_address) return false;
            if (!contract) throw new Error("Contract not initialized");
            return await contract.creatorExists(account_address);
        },
        enabled: !!account_address && !!contract,
        retry: false,
    });
}

export function useGetCreator(wallet_address: string) {
    const contract = useCopyRightArenaContract();

    return useQuery<CreatorProfile, Error>({
        queryKey: ["creator", wallet_address],
        queryFn: () => {
            if (!contract) throw new Error("Contract not initialized");
            return contract.getCreator(wallet_address);
        },
        enabled: !!contract && !!wallet_address,
    });
}

// ─── Works ──────────────────────────────────────────────────────────────────

export function useGetWork(work_id: string) {
    const contract = useCopyRightArenaContract();

    return useQuery<Work, Error>({
        queryKey: ["work", work_id],
        queryFn: () => {
            if (!contract) throw new Error("Contract not initialized");
            return contract.getWork(work_id);
        },
        enabled: !!contract && !!work_id,
    });
}

export function useGetAllWorks() {
    const contract = useCopyRightArenaContract();

    return useQuery<Work[], Error>({
        queryKey: ["allWorks"],
        queryFn: () => {
            if (!contract) throw new Error("Contract not initialized");
            return contract.getAllWorks();
        },
        enabled: !!contract,
    });
}

export function useGetCreatorWorks(wallet: string) {
    const contract = useCopyRightArenaContract();

    return useQuery<Work[], Error>({
        queryKey: ["creatorWorks", wallet],
        queryFn: () => {
            if (!contract) throw new Error("Contract not initialized");
            return contract.getCreatorWorks(wallet);
        },
        enabled: !!contract && !!wallet,
    });
}

export function useCheckHashRegistered(content_hash: string) {
    const contract = useCopyRightArenaContract();

    return useQuery<string, Error>({
        queryKey: ["hashRegistered", content_hash],
        queryFn: () => {
            if (!contract) throw new Error("Contract not initialized");
            return contract.checkHashRegistered(content_hash);
        },
        enabled: !!contract && !!content_hash,
    });
}

// ─── Disputes ───────────────────────────────────────────────────────────────

export function useGetDispute(dispute_id: string) {
    const contract = useCopyRightArenaContract();

    return useQuery<Dispute, Error>({
        queryKey: ["dispute", dispute_id],
        queryFn: () => {
            if (!contract) throw new Error("Contract not initialized");
            return contract.getDispute(dispute_id);
        },
        enabled: !!contract && !!dispute_id,
    });
}

export function useGetAllDisputes() {
    const contract = useCopyRightArenaContract();

    return useQuery<Dispute[], Error>({
        queryKey: ["allDisputes"],
        queryFn: () => {
            if (!contract) throw new Error("Contract not initialized");
            return contract.getAllDisputes();
        },
        enabled: !!contract,
    });
}

export function useGetOpenDisputes() {
    const contract = useCopyRightArenaContract();

    return useQuery<Dispute[], Error>({
        queryKey: ["openDisputes"],
        queryFn: () => {
            if (!contract) throw new Error("Contract not initialized");
            return contract.getOpenDisputes();
        },
        enabled: !!contract,
    });
}

export function useGetCreatorDisputes(wallet: string) {
    const contract = useCopyRightArenaContract();

    return useQuery<Dispute[], Error>({
        queryKey: ["creatorDisputes", wallet],
        queryFn: () => {
            if (!contract) throw new Error("Contract not initialized");
            return contract.getCreatorDisputes(wallet);
        },
        enabled: !!contract && !!wallet,
    });
}

export function useGetVerdict(verdict_id: string) {
    const contract = useCopyRightArenaContract();

    return useQuery<ArbitrationVerdict, Error>({
        queryKey: ["verdict", verdict_id],
        queryFn: () => {
            if (!contract) throw new Error("Contract not initialized");
            return contract.getVerdict(verdict_id);
        },
        enabled: !!contract && !!verdict_id,
    });
}

export function useGetEvidence(evidence_id: string) {
    const contract = useCopyRightArenaContract();

    return useQuery<Evidence, Error>({
        queryKey: ["evidence", evidence_id],
        queryFn: () => {
            if (!contract) throw new Error("Contract not initialized");
            return contract.getEvidence(evidence_id);
        },
        enabled: !!contract && !!evidence_id,
    });
}

// ─── Mutations ──────────────────────────────────────────────────────────────

export function useUpdateProfile() {
    const contract = useCopyRightArenaContract();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ display_name, bio }: { display_name: string; bio: string }) => {
            if (!contract) throw new Error("Contract not initialized");
            const receipt = await contract.updateProfile(display_name, bio);
            return receipt;
        },
        onSuccess: async (_, variables) => {
            await queryClient.invalidateQueries({ queryKey: ["creator"] });
        },
        onError: (error) => {
            console.error("Error updating profile:", error);
            toast.error("Failed to update profile");
        },
    });
}

export function useRegisterWork() {
    const contract = useCopyRightArenaContract();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: {
            title: string;
            description: string;
            contentType: string;
            contentUrl: string;
            transcriptUrl: string;
            contentHash: string;
            licenseType: string;
            licenseDescription: string;
            royaltyPercentage: number;
            revenueAddress: string;
        }) => {
            if (!contract) throw new Error("Contract not initialized");
            const receipt = await contract.registerWork(
                params.title,
                params.description,
                params.contentType,
                params.contentUrl,
                params.transcriptUrl,
                params.contentHash,
                params.licenseType,
                params.licenseDescription,
                params.royaltyPercentage,
                params.revenueAddress
            );
            return receipt;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["allWorks"] });
            await queryClient.invalidateQueries({ queryKey: ["creatorWorks"] });
        },
        onError: (error) => {
            console.error("Error registering work:", error);
            toast.error("Failed to register work");
        },
    });
}

export function useFileDispute() {
    const contract = useCopyRightArenaContract();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            originalWorkId,
            infringingWorkId,
            description,
        }: {
            originalWorkId: string;
            infringingWorkId: string;
            description: string;
        }) => {
            if (!contract) throw new Error("Contract not initialized");
            const receipt = await contract.fileDispute(originalWorkId, infringingWorkId, description);
            return receipt;
        },
        onSuccess: async (_, variables) => {
            await queryClient.invalidateQueries({ queryKey: ["allDisputes"] });
            await queryClient.invalidateQueries({ queryKey: ["openDisputes"] });
            await queryClient.invalidateQueries({ queryKey: ["work", variables.originalWorkId] });
            await queryClient.invalidateQueries({ queryKey: ["work", variables.infringingWorkId] });
        },
        onError: (error) => {
            console.error("Error filing dispute:", error);
            toast.error("Failed to file dispute. Please try again.");
        },
    });
}

export function useSubmitEvidence() {
    const contract = useCopyRightArenaContract();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            disputeId,
            title,
            contentUrl,
            description,
        }: {
            disputeId: string;
            title: string;
            contentUrl: string;
            description: string;
        }) => {
            if (!contract) throw new Error("Contract not initialized");
            const receipt = await contract.submitEvidence(disputeId, title, contentUrl, description);
            return receipt;
        },
        onSuccess: async (_, variables) => {
            await queryClient.invalidateQueries({ queryKey: ["dispute", variables.disputeId] });
        },
        onError: (error) => {
            console.error("Error submitting evidence:", error);
            toast.error("Failed to submit evidence");
        },
    });
}

export function useRenderVerdict() {
    const contract = useCopyRightArenaContract();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ disputeId }: { disputeId: string }) => {
            if (!contract) throw new Error("Contract not initialized");
            const receipt = await contract.renderVerdict(disputeId);
            return receipt;
        },
        onSuccess: async (_, variables) => {
            await queryClient.invalidateQueries({ queryKey: ["dispute", variables.disputeId] });
            await queryClient.invalidateQueries({ queryKey: ["verdict"] });
        },
        onError: (error) => {
            console.error("Error rendering verdict:", error);
            toast.error("Failed to render verdict");
        },
    });
}

export function usePayRoyalty() {
    const contract = useCopyRightArenaContract();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ redirectId, amountInGen }: { redirectId: string; amountInGen: number }) => {
            if (!contract) throw new Error("Contract not initialized");
            const receipt = await contract.payRoyalty(redirectId, amountInGen);
            return receipt;
        },
        onSuccess: async (_, variables) => {
            await queryClient.invalidateQueries({ queryKey: ["royaltyRedirect", variables.redirectId] });
        },
        onError: (error) => {
            console.error("Error paying royalty:", error);
            toast.error("Failed to pay royalty");
        },
    });
}

export function useAppealVerdict() {
    const contract = useCopyRightArenaContract();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            disputeId,
            appealContext,
            newEvidenceUrl,
        }: {
            disputeId: string;
            appealContext: string;
            newEvidenceUrl: string;
        }) => {
            if (!contract) throw new Error("Contract not initialized");
            const receipt = await contract.appealVerdict(disputeId, appealContext, newEvidenceUrl);
            return receipt;
        },
        onSuccess: async (_, variables) => {
            await queryClient.invalidateQueries({ queryKey: ["dispute", variables.disputeId] });
        },
        onError: (error) => {
            console.error("Error appealing verdict:", error);
            toast.error("Failed to appeal verdict");
        },
    });
}

// Add more hooks (getFilingFee, getRoyaltyRedirect, etc.) as needed
export function useGetFilingFee() {
    const contract = useCopyRightArenaContract();

    return useQuery<number, Error>({
        queryKey: ["filingFee"],
        queryFn: () => {
            if (!contract) throw new Error("Contract not initialized");
            return contract.getFilingFee();
        },
        enabled: !!contract,
    });
}

export function useFullDispute(disputeId?: string) {
    const contract = useCopyRightArenaContract();
    return useQuery({
        queryKey: ["full-dispute", disputeId],
        enabled: !!disputeId,
        queryFn: () => {
            if (!contract) throw new Error("Contract not initialized");
            
            return contract.getFullDispute(disputeId!)
        },
    });
}