<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/martin-k-m/martin-k-m/assets/banner.svg" />
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/martin-k-m/martin-k-m/assets/banner-light.svg" />
  <img src="https://raw.githubusercontent.com/martin-k-m/martin-k-m/assets/banner-light.svg" width="100%" alt="Martin Muskov, studying EE at UCSC and co-founder at Credda" />
</picture>

[![Credda](https://img.shields.io/badge/Credda-C2410C?style=flat-square&logo=verifiedbadge&logoColor=white)](https://credda.io)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/martin-muskov/)
[![Email](https://img.shields.io/badge/martinkmuskov@gmail.com-EA4335?style=flat-square&logo=gmail&logoColor=white)](mailto:martinkmuskov@gmail.com)
[![Substack](https://img.shields.io/badge/Substack-FF6719?style=flat-square&logo=substack&logoColor=white)](https://martinkm.substack.com)
[![Website](https://img.shields.io/badge/martin--k--m.github.io-2B2820?style=flat-square&logo=react&logoColor=white)](https://martin-k-m.github.io)

Electrical engineering at UC Santa Cruz, co-founder of Credda. I build systems software and try to break it before it ships: a Raft-replicated key-value store checked for linearizability under live network partitions, an execution cache that traces syscalls to work out what a build actually read, an LSM storage engine, and twill, a language whose compiler is written in itself. Alongside that, Scalar: open-source productivity infrastructure across eleven repositories.

<br/>

## Credda &nbsp;·&nbsp; [credda.io](https://credda.io) &nbsp;·&nbsp; [@martin](https://credda.io/profile/martin) &nbsp;·&nbsp; [GitHub](https://github.com/Credda-io)

<div align="center">

  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Credda-io/.github/main/profile/assets/creddaseallockupdarktransparent.png">
    <img alt="Credda" src="https://raw.githubusercontent.com/Credda-io/.github/main/profile/assets/creddaseallockuplighttransparent.png" width="420">
  </picture>

</div>

I'm a co-founder. Credda turns real, both-party-confirmed commitment history into a verified
**0–100 reliability score** that a person owns and carries across marketplaces, lenders, and clients.

<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/martin-k-m/martin-k-m/assets/credda.svg" />
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/martin-k-m/martin-k-m/assets/credda-light.svg" />
  <img src="https://raw.githubusercontent.com/martin-k-m/martin-k-m/assets/credda-light.svg" width="100%" alt="Credda: deterministic scoring from an append-only ledger, portable as a signed W3C Verifiable Credential, built on commitments rather than reviews, with organizations" />
</picture>

</div>

The client surface is open source and published, even though the core is not:
<a href="https://github.com/Credda-io/credda-go"><b>credda-go</b></a>, a stdlib-only Go client,
<a href="https://github.com/Credda-io/credda-js"><b>credda-js</b></a> (<code>@credda/js</code>) with React hooks and offline credential verification,
<a href="https://github.com/Credda-io/credda-cli"><b>credda-cli</b></a> (<code>@credda/cli</code>),
and <a href="https://github.com/Credda-io/credda-mcp"><b>credda-mcp</b></a> (<code>@credda/mcp-server</code>), which puts the trust layer in front of an agent over MCP.

<sub>Early-stage and under active development. Anything the site marks <i>coming soon</i> is direction, not a shipped guarantee.</sub>

<br/>

## twill &nbsp;·&nbsp; [twill-lang.github.io](https://twill-lang.github.io) &nbsp;·&nbsp; [GitHub](https://github.com/twill-lang/twill) &nbsp;·&nbsp; [![Release](https://img.shields.io/github/v/release/twill-lang/twill?sort=semver&display_name=tag&label=&style=flat-square&color=4FB79B)](https://github.com/twill-lang/twill/releases)

<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/twill-lang/twill/main/assets/twill-mark-glow.png" />
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/twill-lang/twill/main/assets/twill-mark.png" />
  <img src="https://raw.githubusercontent.com/twill-lang/twill/main/assets/twill-mark.png" width="96" alt="twill" />
</picture>

<br/><br/>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/martin-k-m/martin-k-m/assets/twill.svg" />
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/martin-k-m/martin-k-m/assets/twill-light.svg" />
  <img src="https://raw.githubusercontent.com/martin-k-m/martin-k-m/assets/twill-light.svg" width="100%" alt="twill: shape errors caught at check time, differentiation as syntax, one deterministic dependency-free binary" />
</picture>

</div>

Most machine-learning code is a general purpose language with a numeric framework
bolted on top. twill goes the other way. Tensors are the built-in data type,
differentiation is a language operation rather than a library call, and a static
checker reads your shapes before anything executes, so a shape mistake is an error
you see rather than a stack trace you get. Pricing a European call by Monte Carlo
and taking its delta and vega by differentiating the pricer is a handful of lines,
with no bumping and no second library.

**As of v1.4.0 the compiler written in twill runs.** The lexer, parser, checker,
evaluator, tensor kernels, formatter and CLI are written in the language itself, and
the whole tree executes on the Go bootstrap and reproduces the reference across every
stage: `twill check` matched the Go command byte for byte on every corpus file, and
`twill fmt` on every one it formats. It runs on the bootstrap rather than as its own
Go-free binary; bootstrapping to a standalone twill-built compiler is the next step.
That release is also what made the ecosystem run: nine sibling repositories had been
written against twill and most of them did not work, and the dozen shared failures
underneath that were each a place the language asked for something nobody would
naturally write.

**v1.6.0 was the completeness release.** Four things were true of twill before it and are
not now: an `I64` was a float that held 53 bits, a `match` could silently fail to cover
its cases, a systems-mode annotation was a comment, and two different mistakes in autodiff
answered with a zero instead of an error. It also brought `twill lsp`, a language server
whose hover reports the inferred type and shape, which in a tensor-first language is the
question you actually have. Its second release candidate came entirely from moving the
nine ecosystem repositories onto the first one and using them: none of what they hit was
reachable from twill's own sources.

**The current release is v1.7.1.** v1.7.0 closed the two entries `docs/needs.md` had been
calling the largest open questions, and closed them on both implementations rather than on
the bootstrap alone: patterns became a tree, with nesting, literals and guards, and
exhaustiveness checking that recurses into them and names the value that gets through; and
user-defined generics, so `struct Box[T]` and `fn first[T](xs: Arr[T]) -> T` parse, check
and run. v1.7.1 is a checker release. The Go bootstrap now carries dtypes, which the
self-hosted checker already had, so the two agree character for character across 405 files
of `std`, `src`, `examples` and `testdata`, and the one thing either of them reports as a
warning rather than an error no longer refuses to run the program it is commenting on.

<sub>Go, no dependencies. An early prototype: interpreted, first-order reverse-mode autodiff, and a best-effort shape checker rather than a full type system.</sub>

### The twill ecosystem

<sub>The ten repositories below, under <a href="https://github.com/twill-lang">github.com/twill-lang</a>, plus the site and the organization profile. Everything downstream of the compiler is written in twill itself, which is the same experiment run again: a real program against the systems subset, each with its own list of what the language is still missing.</sub>

<table>
<tr>
<td width="34%" valign="top">

**Language and tooling**

<a href="https://github.com/twill-lang/twill"><b>twill</b></a><br/>
The language and the reference implementation.

<a href="https://github.com/twill-lang/spool"><b>spool</b></a><br/>
The package manager, written in twill.

<a href="https://github.com/twill-lang/loom"><b>loom</b></a><br/>
Build and workspace tooling.

<a href="https://github.com/twill-lang/bobbin"><b>bobbin</b></a><br/>
Shared internals across the ecosystem.

</td>
<td width="33%" valign="top">

**Data and modelling**

<a href="https://github.com/twill-lang/warp"><b>warp</b></a><br/>
Data pipelines and dataset loaders.

<a href="https://github.com/twill-lang/skein"><b>skein</b></a><br/>
Tokenisers with an offset map back to the source.

<a href="https://github.com/twill-lang/heddle"><b>heddle</b></a><br/>
Probabilistic programming and Bayesian inference: NUTS, HMC, ADVI.

</td>
<td width="33%" valign="top">

**Serving and output**

<a href="https://github.com/twill-lang/shuttle"><b>shuttle</b></a><br/>
Inference and serving.

<a href="https://github.com/twill-lang/selvedge"><b>selvedge</b></a><br/>
Model serialisation and the model registry.

<a href="https://github.com/twill-lang/weft"><b>weft</b></a><br/>
Plotting and visualisation: terminal charts and SVG.

</td>
</tr>
</table>

<br/>

## quorum &nbsp;·&nbsp; [GitHub](https://github.com/martin-k-m/quorum)

<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/martin-k-m/quorum/main/assets/quorum-mark-dark.png" />
  <img src="https://raw.githubusercontent.com/martin-k-m/quorum/main/assets/quorum-mark.png" width="96" alt="quorum" />
</picture>

<br/><br/>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/martin-k-m/martin-k-m/assets/quorum.svg" />
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/martin-k-m/martin-k-m/assets/quorum-light.svg" />
  <img src="https://raw.githubusercontent.com/martin-k-m/martin-k-m/assets/quorum-light.svg" width="100%" alt="quorum: Raft consensus as a pure I/O-free state machine, a linearizability checker run against a live cluster under partitions, and a minority that refuses writes rather than diverge" />
</picture>

</div>

A replicated key-value store on Raft, written from the protocol up rather than
around a consensus library. Election and log replication are a deterministic
state machine with no I/O and no clock, so an entire cluster runs inside one
seeded simulator and any failing run replays exactly from its seed.

The part worth reading is the checking. A Wing-Gong linearizability checker
decides whether a recorded history of concurrent operations could have come from
a single sequential store, and it runs against a live three-node cluster while
the transport drops and partitions real traffic: **25 fault-injected schedules,
3,000 operations, 0 violations**. Getting to that number meant fixing three
genuine bugs it found first, including a partitioned leader that had not yet
stepped down still answering reads from stale data, and a Raft log index reused
for a different entry, which reported success to a caller whose write had
actually been discarded.

<sub>Go, no third-party runtime dependencies. Sibling to strata: where that is a storage engine correct on one machine, this is what makes a cluster of them agree.</sub>

<br/>

## Arc &nbsp;·&nbsp; [GitHub](https://github.com/martin-k-m/arc) &nbsp;·&nbsp; [![Release](https://img.shields.io/github/v/release/martin-k-m/arc?sort=semver&display_name=tag&label=&style=flat-square&color=4FB79B)](https://github.com/martin-k-m/arc/releases)

<div align="center">

<img src="https://raw.githubusercontent.com/martin-k-m/arc/main/assets/arc-mark.png" width="112" alt="Arc" />

<br/><br/>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/martin-k-m/martin-k-m/assets/arc.svg" />
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/martin-k-m/martin-k-m/assets/arc-light.svg" />
  <img src="https://raw.githubusercontent.com/martin-k-m/martin-k-m/assets/arc-light.svg" width="100%" alt="Arc: an execution cache whose dependencies are observed rather than declared, with a task graph nobody wrote, that runs the command whenever it is unsure" />
</picture>

</div>

An execution cache that sits between you and the commands you run. It watches what a
command actually reads, and when none of that has changed it replays the previous
result instead of running the command again. It is language-agnostic, so `cargo test`,
`pytest`, `npm test` and `make` are all just commands.

On Linux the first run is observed. Arc traces every syscall of the process tree
through one of two rootless backends, and after that it fingerprints only what the run
genuinely depended on. That covers the cases a file-level tracer gets wrong: a config
file that was absent and branched on, a directory that was enumerated, a `libc`
outside the project, and an intermediate the command wrote and read back, which is not
an input. Where reads cannot be observed Arc falls back to hashing the whole project,
and `arc doctor` says which. A partial trace never narrows, a shared cache is
untrusted and re-hashed on the way in, and anything Arc cannot prove is a hit gets
executed.

Those same observations also give it a task graph nobody had to write. One command's
output being another's input is the edge, so `arc affected --run` executes exactly the
work a change reaches, producers before consumers, independent branches at once. On
top of that sit a verified remote cache, remote execution of misses on compatible
workers, content-addressed toolchains that let a worker with no Rust installed run a
Rust build, and `arc ci`, which works out what a branch changed and reuses everything
the caches already hold.

<sub>Rust, four crates, v1.0. The CLI, <code>arc.toml</code>, <code>--json</code> output, the remote protocols and the stored formats are stable surfaces from here.</sub>

<br/>

## Scalar &nbsp;·&nbsp; [GitHub](https://github.com/scalar-app) &nbsp;·&nbsp; [Docs](https://github.com/scalar-app/docs)

<div align="center">

<img src="https://raw.githubusercontent.com/scalar-app/.github/main/profile/assets/scalar.png" width="96" alt="Scalar" />

</div>

**Your entire life has an inbox. Scalar turns it into a plan.**

Open-source productivity infrastructure: email, calendar, coursework, tasks and files
pulled into one action layer, so what needs doing arrives as a plan rather than a pile.
The systems you already use stay the source of record, and every imported object keeps
its provenance, so you can always get back to where a thing came from. Cross-platform,
self-hostable, AGPL-3.0.

The AI layer is deliberately the least powerful thing in the system. `@scalar/ai` is a
plain TypeScript package with no database and no HTTP server: the API supplies the tools
and owns authorization, so a Command turn returns an answer plus a set of changes a
person approves, rather than applying them itself. Free-time arithmetic is computed
rather than generated, because a model that invents an empty afternoon is worse than no
scheduler at all.

<sub><b>Stage 2.</b> The API, worker, integrations, SDK, design system and web client exist, and a Tauri 2 shell ships that same web app to macOS, Windows, Linux, iOS and Android. Google Calendar and Canvas are both implemented providers, and Today, Tasks, Spaces, Inbox, Search, Focus, Calendar and Command each have an API module and a screen. It is early: a route existing is not the same as it being finished, and the documentation is behind the code in places.</sub>

### The Scalar repositories

<sub>Eleven repositories under <a href="https://github.com/scalar-app">github.com/scalar-app</a>, one per concern, so the contract between them has to be written down rather than assumed.</sub>

<table>
<tr>
<td width="34%" valign="top">

**Clients**

<a href="https://github.com/scalar-app/web"><b>web</b></a><br/>
The web application. Next.js 16, React 19, TanStack Query.

<a href="https://github.com/scalar-app/ui"><b>ui</b></a><br/>
Design system: tokens, base styles, React primitives.

<a href="https://github.com/scalar-app/website"><b>website</b></a><br/>
The public site, in Astro.

<a href="https://github.com/scalar-app/desktop"><b>desktop</b></a><br/>
The Tauri 2 shell around the same web app: macOS, Windows, Linux, iOS and Android.

</td>
<td width="33%" valign="top">

**Services**

<a href="https://github.com/scalar-app/api"><b>api</b></a><br/>
Fastify, PostgreSQL, Redis. Owns the schema and the public contract.

<a href="https://github.com/scalar-app/worker"><b>worker</b></a><br/>
Integration synchronization and scheduled jobs.

<a href="https://github.com/scalar-app/integrations"><b>integrations</b></a><br/>
The provider framework: Google, Canvas.

<a href="https://github.com/scalar-app/infra"><b>infra</b></a><br/>
Self-hosting: PostgreSQL, Redis and MinIO in compose files.

</td>
<td width="33%" valign="top">

**Contract and intelligence**

<a href="https://github.com/scalar-app/sdk"><b>sdk</b></a><br/>
Typed TypeScript client, mirroring the API contract.

<a href="https://github.com/scalar-app/ai"><b>ai</b></a><br/>
The intelligence behind Command: tools, prompts, one turn.

<a href="https://github.com/scalar-app/docs"><b>docs</b></a><br/>
Architecture, API, security, self-hosting, ADRs.

</td>
</tr>
</table>

<br/>

## Selected projects

<sub>Beyond twill, quorum, Arc and Credda: small, dependency-light tools, one job each, with tests and CI, in the language that fits it.</sub>

<table>
<tr>
<td width="34%" valign="top">

**Databases**

<a href="https://github.com/martin-k-m/strata"><b>strata</b></a> · <code>Java</code><br/>
An LSM-tree storage engine built from the write path up: a CRC-checked write-ahead log, SSTables with bloom filters and a sparse index, and leveled compaction. Recovery is proved by truncating the log at every byte offset.

<a href="https://github.com/martin-k-m/quarry"><b>quarry</b></a> · <code>Python</code><br/>
A SQL engine over CSV: a parser and an executor, standard library only. Its property-based fuzz suite found a real recursion overflow in deeply nested expressions. The other half of strata.

</td>
<td width="33%" valign="top">

**Data**

<a href="https://github.com/martin-k-m/drift"><b>drift</b></a> · <code>Rust</code><br/>
Diff two tables by key rather than by line position, so re-ordering or re-exporting a file is not a diff.

<a href="https://github.com/martin-k-m/sift"><b>sift</b></a> · <code>Python</code><br/>
Query CSV and JSONL from the terminal with a small clause language. Streaming, zero dependencies.

<a href="https://github.com/martin-k-m/csvpeek"><b>csvpeek</b></a> · <code>Python</code><br/>
Profile a CSV: inferred types, null rates, per-column stats and distributions.

</td>
<td width="33%" valign="top">

**Developer infrastructure**

<a href="https://github.com/martin-k-m/capsule"><b>capsule</b></a> · <code>Go</code><br/>
Throwaway, isolated development environments described by one config file, gone when you exit.

<a href="https://github.com/martin-k-m/tandem"><b>tandem</b></a> · <code>Java</code><br/>
Durable workflow orchestration for the JVM: retries, compensation and resume, with no runtime dependencies.

<a href="https://github.com/martin-k-m/unscroll"><b>unscroll</b></a> · <code>Kotlin</code><br/>
Blocks short-video feeds inside apps you otherwise keep. It holds no INTERNET permission, and CI fails the build if one reaches the merged manifest.

</td>
</tr>
<tr>
<td width="34%" valign="top">

**Verification**

<a href="https://github.com/martin-k-m/lincheck"><b>lincheck</b></a> · <code>Go</code><br/>
quorum's linearizability checker, extracted so it can be pointed at someone else's system through a small adapter. An operation whose outcome the client never learned is treated as indeterminate rather than failed, because a write that timed out may still have committed; both directions are regression tests, because the earlier version got it wrong.

</td>
<td width="66%" valign="top" colspan="2">

**Browser tools** <sub>· client-side, nothing you paste leaves the page</sub>

<a href="https://github.com/martin-k-m/snare"><b>snare</b></a> · <code>TypeScript</code><br/>
A regex workbench: live matching, a plain-English reading built from an actual parse rather than a lookup table, and backtracking analysis that flags nested unbounded repetition and ambiguous alternation before the pattern reaches a public endpoint.

<a href="https://github.com/martin-k-m/cadence"><b>cadence</b></a> · <code>TypeScript</code><br/>
Read a cron expression back in plain English, with the next 24 fire times in the timezone the schedule actually runs in, daylight saving included, and the last run too, because "did it fire?" is the other half of the question.

<a href="https://github.com/martin-k-m/meridian"><b>meridian</b></a> · <code>TypeScript</code><br/>
Meeting times across timezones, in each person's own local clock, ranked by fairness before average quality: a slot that suits four people and ruins the fifth is not a good meeting time.

</td>
</tr>
</table>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/martin-k-m/martin-k-m/assets/footer.svg" />
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/martin-k-m/martin-k-m/assets/footer-light.svg" />
  <img src="https://raw.githubusercontent.com/martin-k-m/martin-k-m/assets/footer-light.svg" width="100%" alt="" />
</picture>
