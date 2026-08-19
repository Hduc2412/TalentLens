# Domain Docs

How engineering skills should consume this repo's domain documentation.

## Before exploring, read these

- `CONTEXT.md` at the repo root, or `CONTEXT-MAP.md` if it exists.
- `docs/adr/` for architecture decisions that touch the area being explored.

If these files do not exist, proceed silently. The domain-modeling skill creates
them when terms or decisions are resolved.

## File structure

This is a single-context repo:

```text
/
├── CONTEXT.md
├── docs/adr/
└── src/
```

## Use the glossary vocabulary

When output names a domain concept, use the term defined in `CONTEXT.md`. If a
needed concept is not defined, note the gap for domain modeling.

## Flag ADR conflicts

If an output contradicts an existing ADR, surface that conflict explicitly
instead of silently overriding it.
