# Realtime Plan Index and Governance

## EX. ABOUT THE COMMENT ON THE CODE

MUST REMEMBER TO NOT EXPLAIN EVERYTHING BY COMMENT, ONLY EXPLAIN FOR COMPLEX THINGS
LET THE CODE EXPLAIN IT SELF, THE NAME AND OTHERS.

## 1. Purpose

This file is the single entry point to read, navigate, and maintain all realtime planning documents.

It defines:

1. Reading order
2. Cross-document call flow
3. Ownership and update rules
4. Mandatory plan-sync policy when implementation changes scope

## 2. Plan Map

## 2.1 Master and Execution Plans

1. Master roadmap:
   - ./realtime-foundation-community-watch-party-plan.md
2. Phase execution detail:
   - ./realtime-phase-execution-detailed-plan.md
3. Ticket-level backlog:
   - ./realtime-ticket-breakdown-by-phase.md

## 2.2 Contract Pack (Phase 0 Gate)

1. Event envelope:
   - ./contracts/event-envelope-v1.md
2. Event catalog:
   - ./contracts/event-catalog-v1.md
3. Error codes:
   - ./contracts/error-codes-v1.md
4. Authorization matrix:
   - ./contracts/authorization-matrix-v1.md
5. Auth lifecycle:
   - ./contracts/auth-v1.md
6. Reliability and recovery:
   - ./contracts/reliability-v1.md
7. Flow control:
   - ./contracts/flow-control-v1.md
8. Observability:
   - ./contracts/observability-v1.md
9. Versioning policy:
   - ./contracts/versioning-policy.md
10. REST API contract:

- ./contracts/rest-api-v1.md

11. Hybrid persistence contract:

- ./contracts/hybrid-persistence-contract-v1.md

## 2.3 Per-Phase Technical Plans

1. Phase 0:
   - ./phases/phase-0-architecture-and-contract-technical-plan.md
2. Phase 1:
   - ./phases/phase-1-shared-realtime-foundation-technical-plan.md
3. Phase 2:
   - ./phases/phase-2-community-and-chat-mvp-technical-plan.md
4. Phase 3:
   - ./phases/phase-3-watch-party-mvp-technical-plan.md
5. Phase 4:
   - ./phases/phase-4-hardening-and-production-readiness-technical-plan.md

## 3. Required Reading Order

Always read in this order before implementation or review:

1. realtime-foundation-community-watch-party-plan.md
   - Understand product and release intent.
2. realtime-phase-execution-detailed-plan.md
   - Understand phase boundaries and outputs.
3. contracts/\*
   - Contract gate. Required before coding any realtime implementation.
4. realtime-ticket-breakdown-by-phase.md
   - Understand execution workload and dependencies.
5. phases/phase-X-...-technical-plan.md
   - Use only the current phase technical plan for coding decisions.

## 4. Cross-Plan Call Rules

Contract docs under ./contracts are canonical for transport, event, auth, reliability, flow-control, and observability behavior. If a phase plan conflicts with a contract file, the contract file wins.

## 4.1 From Master to Technical

1. Master plan defines direction and scope.
2. Execution detailed plan translates scope into phase-level engineering outputs.
3. Ticket breakdown translates engineering outputs into deliverable tasks.
4. Per-phase technical plan defines implementation details for active work.

## 4.2 During Development

1. Developer starts from the active phase technical plan.
2. If ambiguity exists, check the phase execution detailed plan.
3. If scope conflict exists, the master roadmap is the final source of truth.

## 4.3 During Sprint Planning

1. Use ticket breakdown as the planning source.
2. Validate every ticket against the matching phase technical plan.
3. Any ticket outside phase scope must be marked as deferred or change request.

## 5. Scope Control and Plan Sync Policy

## 5.1 Mandatory Rule

If code changes outside the approved scope, plans must be updated in the same pull request.

No exception for:

1. New module creation outside planned module map
2. New event names or payload fields
3. New endpoint groups or route contracts
4. New database model behavior or migration impacts
5. New reliability, security, or observability controls not previously planned

## 5.2 Minimum Update Set When Scope Changes

At minimum, update:

1. The active phase technical plan file
2. realtime-phase-execution-detailed-plan.md
3. realtime-ticket-breakdown-by-phase.md
4. This index file if reading flow or ownership rules change

Update master roadmap when the release strategy or phase sequence changes.

## 5.3 Change Classification

1. Minor change:
   - No scope expansion
   - Update only the active phase technical plan and ticket estimates if needed
2. Major change:
   - Scope expansion or architecture change
   - Update active phase plan, execution plan, ticket breakdown, and possibly master roadmap
3. Breaking contract change:
   - Any event or payload incompatibility
   - Must update all impacted plans and add migration note in technical plan

## 6. Pull Request Governance Checklist

Every PR touching realtime implementation must include:

1. Target phase ID in PR description
2. Scope statement: in-scope or scope-change
3. Plan files updated list
4. Updated ticket references
5. Validation evidence:
   - unit/integration test impact
   - contract impact if any

If scope-change is true and plan files are not updated, PR is not eligible to merge.

## 7. Ownership Model

1. Product owner:
   - Owns master roadmap acceptance and phase objective changes
2. Tech lead:
   - Owns architecture decisions and phase technical plan integrity
3. Engineering team:
   - Owns implementation alignment and ticket-level updates
4. QA:
   - Owns validation criteria traceability to phase plans

## 8. Versioning Convention

Use semantic tags in PR notes and commit messages for plan updates:

1. PLAN-MINOR: wording, estimates, non-scope clarifications
2. PLAN-MAJOR: scope, architecture, or phase boundary changes
3. PLAN-CONTRACT: event contract or payload compatibility changes

## 9. Recommended Usage Workflow

1. Before coding:
   - Read this index and the active phase technical plan
2. During coding:
   - Compare code decisions against phase scope and module map
3. Before opening PR:
   - Run plan-sync checklist and update affected plan files
4. During review:
   - Reviewer checks scope alignment and plan-update completeness
5. After merge:
   - Ensure ticket status and estimates reflect actual delivery

## 10. Quick Navigation Table

1. Strategic why and release sequence:
   - ./realtime-foundation-community-watch-party-plan.md
2. Engineering phase outputs and dependencies:
   - ./realtime-phase-execution-detailed-plan.md
3. Sprint planning and estimation:
   - ./realtime-ticket-breakdown-by-phase.md
4. Contract gate for FE and BE alignment:
   - ./contracts/
5. Current phase implementation details:
   - ./phases/

## 11. Mapping Matrix

Use this matrix as the operational mapping between planning scope and implementation surface.

| Phase   | Primary Goal                       | Planned Modules                                | Core Files to Touch                                                                                                                                                                                             | Suggested Owners            | Validation Gate              |
| ------- | ---------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ---------------------------- |
| Phase 0 | Freeze architecture and contracts  | docs only                                      | docs/plan/realtime/contracts/\*, docs/plan/realtime/realtime-phase-execution-detailed-plan.md, docs/plan/realtime/realtime-ticket-breakdown-by-phase.md                                                         | Tech Lead, BE Lead, FE Lead | Contract review sign-off     |
| Phase 1 | Build shared realtime foundation   | realtime                                       | src/server.ts, src/config/container.ts, src/config/loaders/index.ts, src/config/loaders/realtime.loader.ts, src/modules/realtime/\*                                                                             | BE Platform, Tech Lead      | Foundation integration tests |
| Phase 2 | Deliver community and chat MVP     | community, channel, message, realtime handlers | src/modules/community/_, src/modules/channel/_, src/modules/message/\*, src/config/loaders/community.loader.ts, src/config/loaders/channel.loader.ts, src/config/loaders/message.loader.ts, src/routes/index.ts | BE Feature Team, QA         | Chat end-to-end tests        |
| Phase 3 | Deliver watch-party MVP            | watch-party, realtime handlers                 | src/modules/watch-party/\*, src/modules/realtime/handlers/watch-party.handler.ts, src/config/loaders/watch-party.loader.ts, src/routes/index.ts                                                                 | BE Feature Team, QA         | Watch sync consistency tests |
| Phase 4 | Hardening and production readiness | realtime, test harness, ops docs               | test/realtime/_, docs/plan/realtime/ops/_, src/modules/realtime/\*, src/server.ts, src/app.ts                                                                                                                   | BE Platform, SRE, QA        | SLO and readiness gate       |

### 11.1 Phase-to-Plan Link Matrix

| Phase   | Technical Plan                                                        | Ticket Source                           | Scope Authority                                     |
| ------- | --------------------------------------------------------------------- | --------------------------------------- | --------------------------------------------------- |
| Phase 0 | ./phases/phase-0-architecture-and-contract-technical-plan.md          | ./realtime-ticket-breakdown-by-phase.md | ./realtime-foundation-community-watch-party-plan.md |
| Phase 1 | ./phases/phase-1-shared-realtime-foundation-technical-plan.md         | ./realtime-ticket-breakdown-by-phase.md | ./realtime-phase-execution-detailed-plan.md         |
| Phase 2 | ./phases/phase-2-community-and-chat-mvp-technical-plan.md             | ./realtime-ticket-breakdown-by-phase.md | ./realtime-phase-execution-detailed-plan.md         |
| Phase 3 | ./phases/phase-3-watch-party-mvp-technical-plan.md                    | ./realtime-ticket-breakdown-by-phase.md | ./realtime-phase-execution-detailed-plan.md         |
| Phase 4 | ./phases/phase-4-hardening-and-production-readiness-technical-plan.md | ./realtime-ticket-breakdown-by-phase.md | ./realtime-phase-execution-detailed-plan.md         |

### 11.2 Scope-Change Trigger Matrix

| Change Type                    | Trigger Example                              | Mandatory Plan Updates                                              |
| ------------------------------ | -------------------------------------------- | ------------------------------------------------------------------- |
| Module scope change            | New module outside mapped phase modules      | active phase plan, execution detailed plan, ticket breakdown, index |
| Contract change                | New event or payload field change            | phase 0 contract docs, active phase plan, ticket breakdown, index   |
| Route/API surface change       | New route group or endpoint family           | active phase plan, execution detailed plan, ticket breakdown        |
| Reliability/security expansion | New resiliency mechanism or security control | active phase plan, phase 4 plan, ticket breakdown, index            |

## 12. Effective Date

Effective immediately for all realtime-related implementation work in this repository.
