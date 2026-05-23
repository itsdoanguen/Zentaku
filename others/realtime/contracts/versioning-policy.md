# Realtime Contract Versioning Policy

## 1. Purpose

Define compatibility and lifecycle rules for realtime contract changes.

## 2. Version Format

Use major.minor format:

1. Major version increments for breaking changes.
2. Minor version increments for additive compatible changes.

Current baseline: 1.0.

## 3. Change Classification

1. Additive change (compatible)
   - Add optional field.
   - Add new event without changing existing event payload.
2. Breaking change (incompatible)
   - Remove field.
   - Change field type or semantics.
   - Rename existing event.

## 4. Upgrade Rules

1. Existing v1 events must remain backward compatible within major version 1.
2. Breaking change requires v2 contract docs and migration notes.
3. Each PR changing contract must include PLAN-CONTRACT tag.

## 5. Deprecation Policy

1. Mark deprecated fields or events in catalog.
2. Keep deprecated elements for at least one release cycle.
3. Remove only after replacement path is documented.

## 6. FE and BE Coordination

1. FE integration must reference explicit contract version.
2. BE implementation PR must include impacted contract file changes.
