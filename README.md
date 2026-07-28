<div align="center">

# Martin Muskov

Electrical Engineering @ UC Santa Cruz, class of 2029. Brentwood, CA.
Founder of **[Credda](https://credda.io)** · building **[blinkdev.me](https://blinkdev.me)**. Mostly writing Rust.

[martin-k-m.github.io](https://martin-k-m.github.io)

</div>

---

## About

- EE student at UC Santa Cruz; most of my time is spent in Rust or TypeScript
- Founder of **[Credda](https://credda.io)** — portable trust infrastructure: a verified, user-owned reliability score
- Building **[blinkdev.me](https://blinkdev.me)** — a suite of local-first developer tools: `blink`, `beacon`, `flux`, `killer`, `orbit`
- I care about software that's honest: deterministic, local-first, private by default — no accounts, no telemetry
- Happy to talk low-level programming, embedded, EE, developer tooling, or trust infrastructure

## Credda — [credda.io](https://credda.io)

**Portable trust infrastructure.** Reputation shouldn't reset every time you join a new platform. Credda turns real, both-party-confirmed commitment history into a verified **0–100 reliability score** that a person owns and carries across marketplaces, lenders, and clients.

- **Deterministic** — the score is a pure function of an append-only event ledger; no human or AI can move it (AI is advisory only)
- **Yours to carry** — trust is portable as signed W3C Verifiable Credentials (`did:web`)
- **Real stack** — a deterministic scoring engine, a platform API, and a web app: TypeScript, Express, Prisma/PostgreSQL, Redis on AWS

## blinkdev.me — local-first developer tools

| Project | About | Stack | Latest |
| :--- | :--- | :--- | :--- |
| [blink](https://github.com/martin-k-m/blink) · [site](https://blinkdev.me) | A developer **context engine**. Indexes a codebase into a context graph of files, symbols, dependencies, and the references between them, then answers questions about it — `context`, `query`, `map`, `explain`, `export`. Local, deterministic, no LLM. | Rust | [![blink version](https://img.shields.io/github/v/tag/martin-k-m/blink?sort=semver&label=&style=flat-square&color=555555)](https://github.com/martin-k-m/blink/releases) |
| [beacon](https://github.com/martin-k-m/beacon) · [site](https://beacon.blinkdev.me) | Open-source GitHub repository intelligence. Turns a repo's commits, contributors, issues, PRs, releases, and dependencies into an explainable 0–100 **Beacon Score** and a health summary. | TypeScript | [![beacon version](https://img.shields.io/github/v/tag/martin-k-m/beacon?sort=semver&label=&style=flat-square&color=555555)](https://github.com/martin-k-m/beacon/releases) |
| [flux](https://github.com/martin-k-m/flux) · [site](https://flux.blinkdev.me) | A local-first, AI-native developer automation platform. One `.flux` file describes how to build, test, package, and deploy a project; it also makes the repo legible to agents (`flux project`, `flux ask`). | Rust | [![flux version](https://img.shields.io/github/v/tag/martin-k-m/flux?sort=semver&label=&style=flat-square&color=555555)](https://github.com/martin-k-m/flux/releases) |
| [killer](https://github.com/martin-k-m/killer) · [site](https://killer.blinkdev.me) | A security testing framework with its own rule language. Static analysis plus `.klr` attack suites, scan history, diff review, and a single CI gate. | Rust | [![killer version](https://img.shields.io/github/v/tag/martin-k-m/killer?sort=semver&label=&style=flat-square&color=555555)](https://github.com/martin-k-m/killer/releases) |
| [orbit](https://github.com/martin-k-m/orbit) · [site](https://orbit.blinkdev.me) | A local-first, native developer IDE — editor, terminal, source control, and project tooling in one desktop app. No server, no account, no telemetry. | Rust / TypeScript (Tauri 2) | [![orbit version](https://img.shields.io/github/v/tag/martin-k-m/orbit?sort=semver&label=&style=flat-square&color=555555)](https://github.com/martin-k-m/orbit/releases) |

### Try them

```sh
npm install -g @martin-k-m/blink        # blink
npm install -g @martin-k-m/beacon-cli   # beacon
cargo install killer                    # killer
brew install martin-k-m/flux/flux       # flux
```

Orbit ships prebuilt desktop installers on its [releases page](https://github.com/martin-k-m/orbit/releases/latest).

## Also building

- [atlas](https://github.com/martin-k-m/atlas) — a next-generation local knowledge IDE (Kotlin, native desktop)
- [datalib](https://github.com/martin-k-m/datalib) — an interactive, animated data-science & ML portfolio (Next.js)

## Tools

<div align="center">

![Rust](https://img.shields.io/badge/Rust-000000?style=flat-square&logo=rust&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![Tauri](https://img.shields.io/badge/Tauri-24C8DB?style=flat-square&logo=tauri&logoColor=black)

</div>

---

<div align="center">

[![Credda](https://img.shields.io/badge/Credda-7C6CFF?style=flat-square&logo=verifiedbadge&logoColor=white)](https://credda.io)
[![Portfolio](https://img.shields.io/badge/Portfolio-0A0A0A?style=flat-square&logo=github&logoColor=white)](https://martin-k-m.github.io)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/martin-muskov-3a450134b)

</div>
