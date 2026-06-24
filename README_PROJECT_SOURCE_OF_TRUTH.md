# EV Data Platform - Project Source of Truth

This repository contains the source-of-truth documentation for building a scalable quick-win MVP.

The project goal is not to build a large EV platform immediately.
The project goal is to build a maintainable, automatically updated, normalized EV + Charging dataset that can later be monetized through reports, API, and dashboard products.

## How to use this package

Copy the following folders into the project root:

```text
/docs
/.ai
```

Every implementation task, PR, agent prompt, and milestone review should reference these documents.

## Most important files

- `docs/00_PROJECT_CHARTER.md` - mission and non-negotiables
- `docs/02_DECISIONS.md` - locked decisions
- `docs/03_SCOPE.md` - what is in/out of MVP
- `docs/06_MILESTONES.md` - delivery plan
- `docs/07_DEFINITION_OF_DONE.md` - quality gate
- `.ai/AGENT_CONTEXT.md` - rules for AI agents and coding assistants

## Rule

If a proposed feature is not aligned with these documents, it should not be implemented until the documents are explicitly updated.
