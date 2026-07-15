# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
from dataclasses import dataclass
from datetime import datetime, timezone
import json
import hashlib


@gl.evm.contract_interface
class _Recipient:
    class View:
        pass
    class Write:
        pass


# ─── Data Structures ──────────────────────────────────────────

@allow_storage
@dataclass
class CreatorProfile:
    wallet: str
    display_name: str
    bio: str
    total_works: i32
    total_disputes_filed: i32
    total_disputes_received: i32
    total_disputes_won: i32
    reputation_score: i32
    joined_at: str


@allow_storage
@dataclass
class Work:
    work_id: str
    creator: str
    title: str
    description: str
    content_type: str       # "image" | "audio" | "video" | "text" | "music"
    content_url: str        # publicly accessible URL to the work
    transcript_url: str     # for audio/video — URL to text transcript or summary
    content_hash: str       # SHA256 hash of content for tamper detection
    license_type: str       # "all_rights_reserved" | "non_commercial" |
                            # "attribution_required" | "no_derivatives" |
                            # "creative_commons_by" | "creative_commons_by_nc" |
                            # "creative_commons_by_nd" | "creative_commons_by_sa"
    license_description: str    # plain English description of allowed usage
    royalty_percentage: i32     # % of revenue creator expects for licensed use
    revenue_address: str        # wallet to receive royalty payments
    registered_at: str
    status: str             # "active" | "disputed" | "delisted"
    dispute_ids: DynArray[str]


@allow_storage
@dataclass
class Evidence:
    evidence_id: str
    dispute_id: str
    submitted_by: str
    title: str
    content_url: str        # URL to evidence document, image, or page
    description: str
    submitted_at: str


@allow_storage
@dataclass
class ArbitrationVerdict:
    verdict_id: str
    dispute_id: str
    verdict: str            # "violation_found" | "no_violation" | "partial_violation" | "inconclusive"
    similarity_score: i32   # 0-100 how similar the works are
    license_violated: str   # which specific license term was violated
    reasoning: str          # detailed AI reasoning stored on-chain
    confidence: str         # "high" | "medium" | "low"
    recommended_action: str # "royalty_redirect" | "content_removal" | "attribution_required" | "no_action"
    royalty_redirect_percentage: i32  # % of infringer revenue to redirect to claimant
    is_appeal: bool
    rendered_at: str
    rendered_by: str        # wallet that triggered arbitration


@allow_storage
@dataclass
class Dispute:
    dispute_id: str
    claimant: str           # creator filing the complaint
    respondent: str         # creator accused of infringement
    original_work_id: str   # the work being infringed
    infringing_work_id: str # the allegedly infringing work
    description: str        # plain English explanation of the complaint
    status: str             # "open" | "under_review" | "verdict_rendered" |
                            # "appealed" | "resolved" | "dismissed"
    filing_fee_paid: i32
    verdict_id: str
    appeal_verdict_id: str
    filed_at: str
    resolved_at: str
    evidence_ids: DynArray[str]
    royalty_active: bool    # whether royalty redirect is currently enforced


@allow_storage
@dataclass
class RoyaltyRedirect:
    redirect_id: str
    dispute_id: str
    from_wallet: str        # infringer paying royalties
    to_wallet: str          # original creator receiving royalties
    percentage: i32         # % of payments to redirect
    active: bool
    created_at: str
    total_redirected: i32


class CopyrightArena(gl.Contract):

    # Creator profiles — lazily created on first interaction
    creators: TreeMap[str, CreatorProfile]

    # Works — keyed by work_id
    works: TreeMap[str, Work]
    work_ids: DynArray[str]
    work_counter: i32

    # Disputes — keyed by dispute_id
    disputes: TreeMap[str, Dispute]
    dispute_ids: DynArray[str]
    dispute_counter: i32

    # Evidence — keyed by evidence_id
    evidence: TreeMap[str, Evidence]
    evidence_counter: i32

    # Arbitration verdicts — keyed by verdict_id
    verdicts: TreeMap[str, ArbitrationVerdict]
    verdict_counter: i32

    # Royalty redirects — keyed by redirect_id
    royalty_redirects: TreeMap[str, RoyaltyRedirect]
    redirect_counter: i32

    # Active redirects per wallet — wallet -> list of redirect_ids
    wallet_redirects: TreeMap[str, DynArray[str]]

    # Content hash registry — hash -> work_id (first registration wins)
    hash_registry: TreeMap[str, str]

    # Filing fee in GEN
    filing_fee: i32

    # Platform treasury (from filing fees)
    treasury: i32

    # Admin
    admin: str

    def __init__(self, admin_address: str, filing_fee_gen: i32):
        self.admin = admin_address
        self.filing_fee = filing_fee_gen
        self.work_counter = i32(0)
        self.dispute_counter = i32(0)
        self.evidence_counter = i32(0)
        self.verdict_counter = i32(0)
        self.redirect_counter = i32(0)
        self.treasury = i32(0)

    # ─── Helpers ──────────────────────────────────────────────

    def _only_admin(self) -> None:
        assert str(gl.message.sender_address) == self.admin, "Only admin"

    def _ensure_profile(self, wallet: str) -> None:
        if wallet not in self.creators:
            self.creators[wallet] = CreatorProfile(
                wallet=wallet,
                display_name="",
                bio="",
                total_works=i32(0),
                total_disputes_filed=i32(0),
                total_disputes_received=i32(0),
                total_disputes_won=i32(0),
                reputation_score=i32(50),
                joined_at=gl.message_raw["datetime"]
            )
            self.wallet_redirects[wallet] = []

    def _license_description(self, license_type: str) -> str:
        descriptions = {
            "all_rights_reserved": "All rights reserved. No use without explicit permission.",
            "non_commercial": "Free to use for non-commercial purposes only. Commercial use requires permission.",
            "attribution_required": "Free to use with proper attribution to the original creator.",
            "no_derivatives": "Can be shared but not modified or built upon.",
            "creative_commons_by": "CC BY — Use freely with attribution.",
            "creative_commons_by_nc": "CC BY-NC — Non-commercial use with attribution.",
            "creative_commons_by_nd": "CC BY-ND — Share with attribution but no modifications.",
            "creative_commons_by_sa": "CC BY-SA — Use freely with attribution and same license."
        }
        return descriptions.get(license_type, "Custom license terms apply.")

    # ─── Creator Profile ──────────────────────────────────────

    @gl.public.write
    def update_profile(self, display_name: str, bio: str) -> None:
        wallet = str(gl.message.sender_address)
        self._ensure_profile(wallet)

        if len(display_name) > 0:
            assert len(display_name) <= 50, "Display name too long"
            self.creators[wallet].display_name = display_name

        if len(bio) > 0:
            assert len(bio) <= 300, "Bio too long"
            self.creators[wallet].bio = bio

    @gl.public.view
    def get_creator(self, wallet: str) -> CreatorProfile:
        assert wallet in self.creators, "Creator not found"
        return gl.storage.copy_to_memory(self.creators[wallet])

    @gl.public.view
    def creator_exists(self, wallet: str) -> bool:
        return wallet in self.creators

    # ─── Work Registration ────────────────────────────────────

    @gl.public.write
    def register_work(
        self,
        title: str,
        description: str,
        content_type: str,
        content_url: str,
        transcript_url: str,
        content_hash: str,
        license_type: str,
        license_description: str,
        royalty_percentage: i32,
        revenue_address: str
    ) -> str:
        """
        Register a creative work on-chain.
        The content_hash is a SHA256 of the original file.
        First registration of a hash wins — this establishes timestamp priority.
        The content_url must be publicly accessible for AI comparison during disputes.
        For audio/video, provide a transcript_url pointing to a text version.
        """
        creator = str(gl.message.sender_address)
        self._ensure_profile(creator)

        assert len(title) >= 2, "Title too short"
        assert len(title) <= 200, "Title too long"
        assert content_type in [
            "image", "audio", "video", "text", "music"
        ], "Invalid content type"
        assert content_url.startswith("http"), "Content URL must be a valid public URL"
        assert len(content_hash) >= 32, "Content hash required"
        assert license_type in [
            "all_rights_reserved", "non_commercial", "attribution_required",
            "no_derivatives", "creative_commons_by", "creative_commons_by_nc",
            "creative_commons_by_nd", "creative_commons_by_sa"
        ], "Invalid license type"
        assert 0 <= int(royalty_percentage) <= 50, "Royalty percentage must be 0-50"
        assert len(revenue_address) > 0, "Revenue address required"

        # Check if hash already registered
        assert content_hash not in self.hash_registry, \
            "This content hash is already registered — possible duplicate"

        self.work_counter += i32(1)
        work_id = f"work_{self.work_counter}"

        # Use provided license description or generate from type
        final_license_desc = license_description if len(license_description) > 0 \
            else self._license_description(license_type)

        self.works[work_id] = Work(
            work_id=work_id,
            creator=creator,
            title=title,
            description=description,
            content_type=content_type,
            content_url=content_url,
            transcript_url=transcript_url,
            content_hash=content_hash,
            license_type=license_type,
            license_description=final_license_desc,
            royalty_percentage=royalty_percentage,
            revenue_address=revenue_address if revenue_address else creator,
            registered_at=gl.message_raw["datetime"],
            status="active",
            dispute_ids=[]
        )

        self.work_ids.append(work_id)
        self.hash_registry[content_hash] = work_id
        self.creators[creator].total_works += i32(1)

        return work_id

    @gl.public.write
    def update_work_license(
        self,
        work_id: str,
        license_type: str,
        license_description: str,
        royalty_percentage: i32
    ) -> None:
        creator = str(gl.message.sender_address)
        assert work_id in self.works, "Work not found"
        assert self.works[work_id].creator == creator, "Not your work"
        assert self.works[work_id].status == "active", "Work not active"

        if len(license_type) > 0:
            self.works[work_id].license_type = license_type
        if len(license_description) > 0:
            self.works[work_id].license_description = license_description
        if int(royalty_percentage) >= 0:
            self.works[work_id].royalty_percentage = royalty_percentage

    @gl.public.view
    def get_work(self, work_id: str) -> Work:
        assert work_id in self.works, "Work not found"
        return gl.storage.copy_to_memory(self.works[work_id])

    @gl.public.view
    def get_all_works(self) -> list[Work]:
        result = []
        for wid in self.work_ids:
            w = self.works[wid]
            if w.status == "active":
                result.append(gl.storage.copy_to_memory(w))
        return result

    @gl.public.view
    def get_creator_works(self, wallet: str) -> list[Work]:
        result = []
        for wid in self.work_ids:
            w = self.works[wid]
            if w.creator == wallet:
                result.append(gl.storage.copy_to_memory(w))
        return result

    @gl.public.view
    def check_hash_registered(self, content_hash: str) -> str:
        if content_hash in self.hash_registry:
            return self.hash_registry[content_hash]
        return ""

    # ─── File a Dispute ───────────────────────────────────────

    @gl.public.write.payable
    def file_dispute(
        self,
        original_work_id: str,
        infringing_work_id: str,
        description: str
    ) -> str:
        """
        File a copyright infringement dispute.
        Requires payment of the filing fee in GEN.
        The fee discourages frivolous claims.
        If the dispute is upheld, the fee is returned to the claimant.
        If dismissed, the fee goes to the platform treasury.
        """
        claimant = str(gl.message.sender_address)
        self._ensure_profile(claimant)

        assert original_work_id in self.works, "Original work not found"
        assert infringing_work_id in self.works, "Infringing work not found"

        original = self.works[original_work_id]
        infringing = self.works[infringing_work_id]

        assert original.creator == claimant, "You can only file disputes for your own works"
        assert infringing.creator != claimant, "Cannot file dispute against your own work"
        assert original_work_id != infringing_work_id, "Cannot dispute a work against itself"
        assert len(description) >= 20, "Please describe the infringement"
        assert len(description) <= 2000, "Description too long"

        expected_fee = u256(self.filing_fee) * u256(10**18)
        assert gl.message.value == expected_fee, "Must pay exact filing fee in GEN"

        respondent = infringing.creator

        self.dispute_counter += i32(1)
        dispute_id = f"dispute_{self.dispute_counter}"

        self.disputes[dispute_id] = Dispute(
            dispute_id=dispute_id,
            claimant=claimant,
            respondent=respondent,
            original_work_id=original_work_id,
            infringing_work_id=infringing_work_id,
            description=description,
            status="open",
            filing_fee_paid=self.filing_fee,
            verdict_id="",
            appeal_verdict_id="",
            filed_at=gl.message_raw["datetime"],
            resolved_at="",
            evidence_ids=[],
            royalty_active=False
        )

        self.dispute_ids.append(dispute_id)
        self.works[original_work_id].dispute_ids.append(dispute_id)
        self.works[infringing_work_id].dispute_ids.append(dispute_id)
        self.works[infringing_work_id].status = "disputed"

        self.creators[claimant].total_disputes_filed += i32(1)
        self.creators[respondent].total_disputes_received += i32(1)

        self.treasury += self.filing_fee

        return dispute_id

    # ─── Submit Evidence ──────────────────────────────────────

    @gl.public.write
    def submit_evidence(
        self,
        dispute_id: str,
        title: str,
        content_url: str,
        description: str
    ) -> str:
        """
        Both claimant and respondent can submit evidence URLs.
        Evidence can be links to:
        - Original creation files or process documents
        - Timestamps proving earlier creation
        - License agreements
        - Communication showing attribution or permission
        - External articles or references
        """
        submitter = str(gl.message.sender_address)
        assert dispute_id in self.disputes, "Dispute not found"

        d = self.disputes[dispute_id]
        assert d.status in ["open", "under_review"], "Dispute not accepting evidence"
        assert submitter == d.claimant or submitter == d.respondent, \
            "Only parties to the dispute can submit evidence"
        assert content_url.startswith("http"), "Evidence must be a valid public URL"
        assert len(title) >= 2, "Title required"
        assert len(description) >= 10, "Description required"

        self.evidence_counter += i32(1)
        evidence_id = f"evidence_{self.evidence_counter}"

        self.evidence[evidence_id] = Evidence(
            evidence_id=evidence_id,
            dispute_id=dispute_id,
            submitted_by=submitter,
            title=title,
            content_url=content_url,
            description=description,
            submitted_at=gl.message_raw["datetime"]
        )

        self.disputes[dispute_id].evidence_ids.append(evidence_id)
        self.disputes[dispute_id].status = "under_review"

        return evidence_id

    # ─── AI Arbitration (Core GenLayer Logic) ─────────────────

    @gl.public.write
    def render_verdict(self, dispute_id: str) -> None:
        """
        Triggers AI arbitration on a dispute.
        GenLayer validators independently:
        1. Fetch both original and allegedly infringing works
        2. Compare content for similarity
        3. Evaluate the license terms of the original work
        4. Review submitted evidence from both parties
        5. Reach consensus on whether a violation occurred
        6. Recommend a remedy (royalty redirect, removal, attribution, or nothing)

        Anyone can trigger this once evidence has been submitted.
        The verdict is stored permanently on-chain.
        """
        triggered_by = str(gl.message.sender_address)
        assert dispute_id in self.disputes, "Dispute not found"

        d = self.disputes[dispute_id]
        assert d.status in ["open", "under_review"], "Dispute not eligible for arbitration"

        original = self.works[d.original_work_id]
        infringing = self.works[d.infringing_work_id]

        original_url = original.content_url
        original_transcript = original.transcript_url
        infringing_url = infringing.content_url
        infringing_transcript = infringing.transcript_url
        license_type = original.license_type
        license_desc = original.license_description
        original_title = original.title
        original_desc = original.description
        infringing_title = infringing.title
        infringing_desc = infringing.description
        content_type = original.content_type
        royalty_pct = int(original.royalty_percentage)
        complaint = d.description
        evidence_ids = list(d.evidence_ids)

        def run_arbitration() -> str:
            # Fetch original work
            original_content = ""
            try:
                resp = gl.nondet.web.get(original_url)
                original_content = resp.body.decode("utf-8")[:3000]
            except:
                original_content = f"Could not fetch content from {original_url}"

            # Fetch original transcript if provided
            original_text = ""
            if original_transcript and original_transcript.startswith("http"):
                try:
                    resp = gl.nondet.web.get(original_transcript)
                    original_text = resp.body.decode("utf-8")[:3000]
                except:
                    original_text = "Could not fetch transcript"

            # Fetch infringing work
            infringing_content = ""
            try:
                resp = gl.nondet.web.get(infringing_url)
                infringing_content = resp.body.decode("utf-8")[:3000]
            except:
                infringing_content = f"Could not fetch content from {infringing_url}"

            # Fetch infringing transcript if provided
            infringing_text = ""
            if infringing_transcript and infringing_transcript.startswith("http"):
                try:
                    resp = gl.nondet.web.get(infringing_transcript)
                    infringing_text = resp.body.decode("utf-8")[:3000]
                except:
                    infringing_text = "Could not fetch transcript"

            # Fetch evidence
            evidence_summary = ""
            for eid in evidence_ids[:5]:  # cap at 5 evidence items
                ev_obj = self.evidence.get(eid)
                if ev_obj:
                    try:
                        ev_resp = gl.nondet.web.get(ev_obj.content_url)
                        ev_content = ev_resp.body.decode("utf-8")[:1000]
                        evidence_summary += f"\nEvidence: {ev_obj.title}\n"
                        evidence_summary += f"Submitted by: {ev_obj.submitted_by}\n"
                        evidence_summary += f"Description: {ev_obj.description}\n"
                        evidence_summary += f"Content: {ev_content}\n---\n"
                    except:
                        evidence_summary += f"\nEvidence: {ev_obj.title} (could not fetch)\n---\n"

            prompt = f"""You are an impartial AI copyright arbitrator evaluating an intellectual property dispute.

ORIGINAL WORK (registered first — the claimed source):
Title: "{original_title}"
Description: {original_desc}
Content Type: {content_type}
Content URL: {original_url}
Fetched Content: {original_content}
Transcript/Text: {original_text if original_text else "Not provided"}
License Type: {license_type}
License Terms: {license_desc}
Royalty Requested: {royalty_pct}%

ALLEGEDLY INFRINGING WORK:
Title: "{infringing_title}"
Description: {infringing_desc}
Content URL: {infringing_url}
Fetched Content: {infringing_content}
Transcript/Text: {infringing_text if infringing_text else "Not provided"}

CLAIMANT'S COMPLAINT:
{complaint}

SUBMITTED EVIDENCE:
{evidence_summary if evidence_summary else "No evidence submitted by either party"}

YOUR TASK:
Carefully analyze both works and evaluate whether the allegedly infringing work
violates the license terms of the original work.

Consider:
1. SIMILARITY: How similar are the two works? Compare structure, content, style, themes.
2. LICENSE COMPLIANCE: Does the infringing work's usage comply with the stated license?
   - If license is "non_commercial": is the infringing work used commercially?
   - If license is "attribution_required": is proper credit given?
   - If license is "no_derivatives": has the work been modified?
   - If license is "all_rights_reserved": is there any unauthorized use?
3. FAIR USE: Consider if the use might qualify as commentary, parody, education, or news reporting.
4. EVIDENCE WEIGHT: What do the submitted evidence items indicate?

Verdicts:
- "violation_found": Clear infringement of license terms
- "partial_violation": Some license terms violated but not all
- "no_violation": Work does not infringe on the original's license
- "inconclusive": Insufficient evidence to make a determination

Recommended actions:
- "royalty_redirect": Redirect a % of infringing work revenue to original creator
- "attribution_required": Require proper credit to be added
- "content_removal": Work should be removed from the platform
- "no_action": No remedy required

Return ONLY valid JSON:
{{
  "verdict": "violation_found" | "partial_violation" | "no_violation" | "inconclusive",
  "similarity_score": <int 0-100>,
  "license_violated": "which specific license term was violated or empty string",
  "reasoning": "3-5 sentences explaining the verdict with specific observations",
  "confidence": "high" | "medium" | "low",
  "recommended_action": "royalty_redirect" | "attribution_required" | "content_removal" | "no_action",
  "royalty_redirect_percentage": <int 0-30>
}}
"""
            result = gl.nondet.exec_prompt(prompt).strip()
            cleaned = result.replace("```json", "").replace("```", "").strip()
            try:
                parsed = json.loads(cleaned)
                verdict = parsed.get("verdict", "inconclusive")
                if verdict not in ["violation_found", "partial_violation", "no_violation", "inconclusive"]:
                    verdict = "inconclusive"
                action = parsed.get("recommended_action", "no_action")
                if action not in ["royalty_redirect", "attribution_required", "content_removal", "no_action"]:
                    action = "no_action"
                return json.dumps({
                    "verdict": verdict,
                    "similarity_score": max(0, min(100, int(parsed.get("similarity_score", 0)))),
                    "license_violated": str(parsed.get("license_violated", "")),
                    "reasoning": str(parsed.get("reasoning", "")),
                    "confidence": str(parsed.get("confidence", "medium")),
                    "recommended_action": action,
                    "royalty_redirect_percentage": max(0, min(30, int(parsed.get("royalty_redirect_percentage", 0))))
                }, sort_keys=True, separators=(',', ':'))
            except:
                return json.dumps({
                    "verdict": "inconclusive",
                    "similarity_score": 0,
                    "license_violated": "",
                    "reasoning": "Could not parse arbitration response",
                    "confidence": "low",
                    "recommended_action": "no_action",
                    "royalty_redirect_percentage": 0
                }, sort_keys=True, separators=(',', ':'))

        raw = gl.eq_principle.prompt_non_comparative(
            run_arbitration,
            task="Evaluate a copyright infringement dispute between two creators and render a fair verdict",
            criteria="""The verdict must be based on actual content comparison and license terms.
Only find violation if the evidence clearly supports it.
Be fair to both parties. Consider fair use principles.
Similarity score must reflect genuine textual or visual similarity."""
        )

        try:
            data = json.loads(raw.strip().strip('"').replace('\\"', '"'))
            verdict = data.get("verdict", "inconclusive")
            similarity_score = int(data.get("similarity_score", 0))
            license_violated = data.get("license_violated", "")
            reasoning = data.get("reasoning", "")
            confidence = data.get("confidence", "medium")
            action = data.get("recommended_action", "no_action")
            royalty_pct_awarded = int(data.get("royalty_redirect_percentage", 0))
        except:
            verdict = "inconclusive"
            similarity_score = 0
            license_violated = ""
            reasoning = "Arbitration consensus could not be parsed"
            confidence = "low"
            action = "no_action"
            royalty_pct_awarded = 0

        if verdict not in ["violation_found", "partial_violation", "no_violation", "inconclusive"]:
            verdict = "inconclusive"

        self.verdict_counter += i32(1)
        verdict_id = f"verdict_{self.verdict_counter}"

        self.verdicts[verdict_id] = ArbitrationVerdict(
            verdict_id=verdict_id,
            dispute_id=dispute_id,
            verdict=verdict,
            similarity_score=i32(similarity_score),
            license_violated=license_violated,
            reasoning=reasoning,
            confidence=confidence,
            recommended_action=action,
            royalty_redirect_percentage=i32(royalty_pct_awarded),
            is_appeal=False,
            rendered_at=gl.message_raw["datetime"],
            rendered_by=triggered_by
        )

        self.disputes[dispute_id].verdict_id = verdict_id
        self.disputes[dispute_id].status = "verdict_rendered"
        self.disputes[dispute_id].resolved_at = gl.message_raw["datetime"]

        claimant = d.claimant
        respondent = d.respondent
        filing_fee = int(d.filing_fee_paid)

        if verdict in ["violation_found", "partial_violation"]:
            # Claimant wins — refund filing fee
            self.treasury -= i32(filing_fee)
            _Recipient(Address(claimant)).emit_transfer(
                value=u256(filing_fee) * u256(10**18)
            )

            self.creators[claimant].total_disputes_won += i32(1)
            self.creators[claimant].reputation_score += i32(10)
            self.creators[respondent].reputation_score -= i32(10)

            # Activate royalty redirect if recommended
            if action == "royalty_redirect" and royalty_pct_awarded > 0:
                self._create_royalty_redirect(
                    dispute_id,
                    respondent,
                    self.works[d.original_work_id].revenue_address,
                    royalty_pct_awarded
                )
                self.disputes[dispute_id].royalty_active = True

            # Mark infringing work status
            if action == "content_removal":
                self.works[d.infringing_work_id].status = "delisted"
            else:
                self.works[d.infringing_work_id].status = "active"

        else:
            # No violation or inconclusive — restore work status
            self.works[d.infringing_work_id].status = "active"
            self.creators[respondent].reputation_score += i32(5)

    def _create_royalty_redirect(
        self,
        dispute_id: str,
        from_wallet: str,
        to_wallet: str,
        percentage: int
    ) -> None:
        self.redirect_counter += i32(1)
        redirect_id = f"redirect_{self.redirect_counter}"

        self.royalty_redirects[redirect_id] = RoyaltyRedirect(
            redirect_id=redirect_id,
            dispute_id=dispute_id,
            from_wallet=from_wallet,
            to_wallet=to_wallet,
            percentage=i32(percentage),
            active=True,
            created_at=gl.message_raw["datetime"],
            total_redirected=i32(0)
        )

        self.wallet_redirects[from_wallet].append(redirect_id)

    # ─── Pay Royalty ──────────────────────────────────────────

    @gl.public.write.payable
    def pay_royalty(self, redirect_id: str) -> None:
        """
        Infringer sends GEN revenue through this function.
        The contract automatically splits the payment according
        to the royalty redirect percentage — original creator
        receives their share, infringer keeps the rest.
        """
        payer = str(gl.message.sender_address)
        assert redirect_id in self.royalty_redirects, "Redirect not found"
        rr = self.royalty_redirects[redirect_id]
        assert rr.active, "Royalty redirect not active"
        assert rr.from_wallet == payer, "Not your royalty redirect"

        total = int(gl.message.value) // (10**18)
        assert total > 0, "Must send GEN"

        creator_share = total * int(rr.percentage) // 100
        payer_share = total - creator_share

        if creator_share > 0:
            _Recipient(Address(rr.to_wallet)).emit_transfer(
                value=u256(creator_share) * u256(10**18)
            )

        if payer_share > 0:
            _Recipient(Address(payer)).emit_transfer(
                value=u256(payer_share) * u256(10**18)
            )

        self.royalty_redirects[redirect_id].total_redirected += i32(creator_share)

    # ─── Appeal ───────────────────────────────────────────────

    @gl.public.write
    def appeal_verdict(
        self,
        dispute_id: str,
        appeal_context: str,
        new_evidence_url: str
    ) -> None:
        """
        The respondent can appeal a violation verdict.
        A second AI review runs with the appeal context.
        Higher bar required to overturn the original verdict.
        """
        appellant = str(gl.message.sender_address)
        assert dispute_id in self.disputes, "Dispute not found"

        d = self.disputes[dispute_id]
        assert d.respondent == appellant, "Only respondent can appeal"
        assert d.status == "verdict_rendered", "No verdict to appeal"
        assert d.verdict_id != "", "No verdict found"
        assert d.appeal_verdict_id == "", "Already appealed"

        original_verdict = self.verdicts[d.verdict_id]
        assert original_verdict.verdict in ["violation_found", "partial_violation"], \
            "Can only appeal violation verdicts"

        original = self.works[d.original_work_id]
        infringing = self.works[d.infringing_work_id]

        original_url = original.content_url
        infringing_url = infringing.content_url
        license_desc = original.license_description
        orig_reasoning = original_verdict.reasoning
        context = appeal_context
        new_ev_url = new_evidence_url

        self.disputes[dispute_id].status = "appealed"

        def run_appeal() -> str:
            new_evidence_content = ""
            if new_ev_url and new_ev_url.startswith("http"):
                try:
                    resp = gl.nondet.web.get(new_ev_url)
                    new_evidence_content = resp.body.decode("utf-8")[:2000]
                except:
                    new_evidence_content = "Could not fetch new evidence"

            prompt = f"""You are reviewing an appeal of a copyright arbitration verdict.

ORIGINAL WORK URL: {original_url}
INFRINGING WORK URL: {infringing_url}
LICENSE TERMS: {license_desc}

ORIGINAL VERDICT: {original_verdict.verdict}
ORIGINAL REASONING: {orig_reasoning}

RESPONDENT'S APPEAL:
{context}

NEW EVIDENCE PROVIDED:
URL: {new_ev_url if new_ev_url else "None"}
Content: {new_evidence_content if new_evidence_content else "None provided"}

Re-evaluate with fresh eyes. The original verdict found a violation.
For this appeal to succeed the respondent must present compelling new
evidence or argument that the original analysis was incorrect.

Be fair but maintain a high bar for overturning verdicts.
Only overturn if the new evidence clearly changes the analysis.

Return ONLY valid JSON:
{{
  "verdict": "violation_found" | "no_violation" | "partial_violation",
  "reasoning": "3-4 sentences explaining the appeal outcome",
  "confidence": "high" | "medium" | "low",
  "appeal_outcome": "upheld" | "overturned" | "modified",
  "recommended_action": "royalty_redirect" | "attribution_required" | "content_removal" | "no_action",
  "royalty_redirect_percentage": <int 0-30>
}}
"""
            result = gl.nondet.exec_prompt(prompt).strip()
            cleaned = result.replace("```json", "").replace("```", "").strip()
            try:
                parsed = json.loads(cleaned)
                verdict = parsed.get("verdict", "violation_found")
                if verdict not in ["violation_found", "partial_violation", "no_violation"]:
                    verdict = "violation_found"
                action = parsed.get("recommended_action", "no_action")
                if action not in ["royalty_redirect", "attribution_required", "content_removal", "no_action"]:
                    action = "no_action"
                return json.dumps({
                    "verdict": verdict,
                    "reasoning": str(parsed.get("reasoning", "")),
                    "confidence": str(parsed.get("confidence", "medium")),
                    "appeal_outcome": str(parsed.get("appeal_outcome", "upheld")),
                    "recommended_action": action,
                    "royalty_redirect_percentage": max(0, min(30, int(parsed.get("royalty_redirect_percentage", 0))))
                }, sort_keys=True, separators=(',', ':'))
            except:
                return json.dumps({
                    "verdict": "violation_found",
                    "reasoning": "Appeal evaluation failed",
                    "confidence": "low",
                    "appeal_outcome": "upheld",
                    "recommended_action": "no_action",
                    "royalty_redirect_percentage": 0
                }, sort_keys=True, separators=(',', ':'))

        raw = gl.eq_principle.prompt_non_comparative(
            run_appeal,
            task="Review an appeal of a copyright infringement arbitration verdict",
            criteria="""Only overturn the original verdict if compelling new evidence
clearly changes the analysis. Maintain a high bar for overturning verdicts.
Be fair but give appropriate weight to the original decision."""
        )

        try:
            data = json.loads(raw.strip().strip('"').replace('\\"', '"'))
            verdict = data.get("verdict", "violation_found")
            reasoning = data.get("reasoning", "")
            confidence = data.get("confidence", "medium")
            appeal_outcome = data.get("appeal_outcome", "upheld")
            action = data.get("recommended_action", "no_action")
            royalty_pct = int(data.get("royalty_redirect_percentage", 0))
        except:
            verdict = "violation_found"
            reasoning = "Appeal consensus failed"
            confidence = "low"
            appeal_outcome = "upheld"
            action = "no_action"
            royalty_pct = 0

        self.verdict_counter += i32(1)
        appeal_verdict_id = f"verdict_{self.verdict_counter}"

        self.verdicts[appeal_verdict_id] = ArbitrationVerdict(
            verdict_id=appeal_verdict_id,
            dispute_id=dispute_id,
            verdict=verdict,
            similarity_score=self.verdicts[d.verdict_id].similarity_score,
            license_violated=self.verdicts[d.verdict_id].license_violated,
            reasoning=reasoning,
            confidence=confidence,
            recommended_action=action,
            royalty_redirect_percentage=i32(royalty_pct),
            is_appeal=True,
            rendered_at=gl.message_raw["datetime"],
            rendered_by=appellant
        )

        self.disputes[dispute_id].appeal_verdict_id = appeal_verdict_id
        self.disputes[dispute_id].status = "resolved"
        self.disputes[dispute_id].resolved_at = gl.message_raw["datetime"]

        if verdict == "no_violation":
            # Appeal overturned — restore work and deactivate redirects
            self.works[d.infringing_work_id].status = "active"
            self.disputes[dispute_id].royalty_active = False

            # Deactivate any royalty redirects from this dispute
            for rid in self.wallet_redirects[d.respondent]:
                rr = self.royalty_redirects[rid]
                if rr.dispute_id == dispute_id:
                    self.royalty_redirects[rid].active = False

            self.creators[appellant].reputation_score += i32(5)

    # ─── Admin ────────────────────────────────────────────────

    @gl.public.write
    def admin_dismiss_dispute(self, dispute_id: str, reason: str) -> None:
        self._only_admin()
        assert dispute_id in self.disputes, "Dispute not found"
        d = self.disputes[dispute_id]
        assert d.status in ["open", "under_review"], "Cannot dismiss at this stage"

        self.disputes[dispute_id].status = "dismissed"
        self.disputes[dispute_id].resolved_at = gl.message_raw["datetime"]
        self.works[d.infringing_work_id].status = "active"

    @gl.public.write
    def admin_update_filing_fee(self, new_fee: i32) -> None:
        self._only_admin()
        self.filing_fee = new_fee

    @gl.public.write
    def admin_withdraw_treasury(self, amount: i32) -> None:
        self._only_admin()
        assert int(amount) <= int(self.treasury), "Insufficient treasury"
        self.treasury -= amount
        _Recipient(Address(self.admin)).emit_transfer(
            value=u256(amount) * u256(10**18)
        )

    # ─── Read Methods ─────────────────────────────────────────

    @gl.public.view
    def get_dispute(self, dispute_id: str) -> Dispute:
        assert dispute_id in self.disputes, "Dispute not found"
        return gl.storage.copy_to_memory(self.disputes[dispute_id])

    @gl.public.view
    def get_verdict(self, verdict_id: str) -> ArbitrationVerdict:
        assert verdict_id in self.verdicts, "Verdict not found"
        return gl.storage.copy_to_memory(self.verdicts[verdict_id])

    @gl.public.view
    def get_evidence(self, evidence_id: str) -> Evidence:
        assert evidence_id in self.evidence, "Evidence not found"
        return gl.storage.copy_to_memory(self.evidence[evidence_id])

    @gl.public.view
    def get_all_disputes(self) -> list[Dispute]:
        result = []
        for did in self.dispute_ids:
            result.append(gl.storage.copy_to_memory(self.disputes[did]))
        return result

    @gl.public.view
    def get_open_disputes(self) -> list[Dispute]:
        result = []
        for did in self.dispute_ids:
            d = self.disputes[did]
            if d.status in ["open", "under_review"]:
                result.append(gl.storage.copy_to_memory(d))
        return result

    @gl.public.view
    def get_creator_disputes(self, wallet: str) -> list[Dispute]:
        result = []
        for did in self.dispute_ids:
            d = self.disputes[did]
            if d.claimant == wallet or d.respondent == wallet:
                result.append(gl.storage.copy_to_memory(d))
        return result

    @gl.public.view
    def get_royalty_redirect(self, redirect_id: str) -> RoyaltyRedirect:
        assert redirect_id in self.royalty_redirects, "Redirect not found"
        return gl.storage.copy_to_memory(self.royalty_redirects[redirect_id])

    @gl.public.view
    def get_wallet_redirects(self, wallet: str) -> list[RoyaltyRedirect]:
        result = []
        if wallet in self.wallet_redirects:
            for rid in self.wallet_redirects[wallet]:
                result.append(gl.storage.copy_to_memory(self.royalty_redirects[rid]))
        return result

    @gl.public.view
    def get_filing_fee(self) -> i32:
        return self.filing_fee

    @gl.public.view
    def get_total_works(self) -> i32:
        return self.work_counter

    @gl.public.view
    def get_total_disputes(self) -> i32:
        return self.dispute_counter