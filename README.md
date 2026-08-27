<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/martin-k-m/martin-k-m/assets/banner.svg" />
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/martin-k-m/martin-k-m/assets/banner-light.svg" />
  <img src="https://raw.githubusercontent.com/martin-k-m/martin-k-m/assets/banner-light.svg" width="100%" alt="Martin Muskov, studying EE at UCSC, co-founder at Credda and founder at CodeReef" />
</picture>

[![Credda](https://img.shields.io/badge/Credda-C2410C?style=flat-square&logo=verifiedbadge&logoColor=white)](https://credda.io)
[![CodeReef](https://img.shields.io/badge/CodeReef-0F766E?style=flat-square&logo=github&logoColor=white)](https://codereef.app)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/martin-muskov/)
[![Email](https://img.shields.io/badge/marmu1407@gmail.com-EA4335?style=flat-square&logo=gmail&logoColor=white)](mailto:marmu1407@gmail.com)
[![Substack](https://img.shields.io/badge/Substack-FF6719?style=flat-square&logo=substack&logoColor=white)](https://martinkm.substack.com)
[![Website](https://img.shields.io/badge/martin--k--m.github.io-2B2820?style=flat-square&logo=react&logoColor=white)](https://martin-k-m.github.io)

Electrical engineering at UC Santa Cruz, co-founder of Credda and founder of CodeReef. I build systems software and try to break it before it ships: a Raft-replicated key-value store checked for linearizability under live network partitions, an execution cache that traces syscalls to work out what a build actually read, an LSM storage engine, and twill, a language whose compiler is written in itself. CodeReef is the same instinct pointed at production: watch a company's live and QA environments, reproduce the failure that is actually hurting them, and open the pull request that fixes it. Alongside that, Scalar: open-source productivity infrastructure across eleven repositories.

<br/>

## Credda &nbsp;·&nbsp; [credda.io](https://credda.io) &nbsp;·&nbsp; [@martin](https://credda.io/profile/martin) &nbsp;·&nbsp; [GitHub](https://github.com/Credda-io)

<div align="center">

  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Credda-io/.github/main/profile/assets/creddaseallockupdarktransparent.png">
    <img alt="Credda" src="https://raw.githubusercontent.com/Credda-io/.github/main/profile/assets/creddaseallockuplighttransparent.png" width="420">
  </picture>

</div>

I'm a co-founder. Credda turns real, both-party-confirmed outcome history into a
**0–100 reliability record** that a person owns and carries across marketplaces, lenders, and
clients. Your track record is stuck wherever you earned it, in a shape that platform controls, and
it does not come with you when you leave. Credda gets it out.

<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/martin-k-m/martin-k-m/assets/credda.svg" />
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/martin-k-m/martin-k-m/assets/credda-light.svg" />
  <img src="https://raw.githubusercontent.com/martin-k-m/martin-k-m/assets/credda-light.svg" width="100%" alt="Credda: deterministic scoring from an append-only ledger, portable as a signed W3C Verifiable Credential, built on commitments rather than reviews, with organizations" />
</picture>

</div>

**The formula is published, not proprietary.** A pure function turns the ledger into the record:
no human and no model can nudge a number, there is no manual override and no adjudicated appeal.
Five weighted factors summing to `1.00`, and six bands a record is earned upward through. It is
served live at [`/api/v1/scoring/model`](https://api.credda.io/api/v1/scoring/model), currently
**formula 5.6**, so it goes stale loudly rather than quietly. Publishing it costs nothing, because
the hard part was never the maths: it is getting a density of outcomes somebody else was willing to
confirm.

**Three lines the product does not cross.** An outcome counts as verified only when someone other
than the subject witnessed it, so self-reported activity lands in the ledger and never counts. A
record cannot be bought: billing is live and self-serve, and every trust capability is free forever,
with the paid tiers holding advisory and cosmetic features only. And Credda never returns a verdict
on a person: it verifies evidence and records it, and what to do about that is the reader's call.
That last one was left out deliberately and is not being added later.

The client surface is open source and published, even though the core is not. All four are MIT:
<a href="https://github.com/Credda-io/credda-go"><b>credda-go</b></a>, a stdlib-only Go client,
<a href="https://github.com/Credda-io/credda-js"><b>credda-js</b></a> (<code>@credda/js</code>) with React hooks and offline credential verification,
<a href="https://github.com/Credda-io/credda-cli"><b>credda-cli</b></a> (<code>@credda/cli</code>),
and <a href="https://github.com/Credda-io/credda-mcp"><b>credda-mcp</b></a> (<code>@credda/mcp-server</code>), which puts the trust layer in front of an agent over MCP.
A record exports as a W3C Verifiable Credential that verifies offline against a <code>did:web</code>
issuer, with SD-JWT selective disclosure so a holder can prove a band without surrendering a history.

<sub>Early, and specific about it: the scoring service, web app, credential fabric and developer
platform are live, self-serve checkout is open, and we publish no user counts, customer names,
revenue or funding. Security and compliance readiness work is in progress and Credda is not
certified against any framework until an auditor says so. Three public endpoints answer what is
actually true in production, and where one disagrees with this paragraph, the endpoint is right.</sub>

<br/>

## CodeReef &nbsp;·&nbsp; [codereef.app](https://codereef.app) &nbsp;·&nbsp; [GitHub](https://github.com/codereefai) &nbsp;·&nbsp; [Action](https://github.com/codereefai/action) &nbsp;·&nbsp; [Benchmark](https://github.com/codereefai/bench)

<div align="center">

<img src="https://raw.githubusercontent.com/codereefai/.github/main/profile/assets/codereef-disc.png" width="96" alt="CodeReef" />

</div>

**Something broke in production. CodeReef ships the fix.** CodeReef watches a company's
production and QA environments, and when a real failure appears it takes the whole problem end to
end: it prepares an environment, reproduces the failure, captures the signature as evidence,
diagnoses the cause, writes the patch, proves the patch with a test that fails before it and passes
after, and opens a pull request carrying all of it. A human reviews a diff, not a bug report. I'm
the founder.

**The hard part is not writing the patch, it is being right about the cause.** Plenty of agents will
generate a diff from a stack trace, and the diff often silences a symptom, rewrites working code, or
just asserts the bug is gone. CodeReef's invariant is that every material claim in a pull request
cites a recorded artifact: a command that ran, its exit code, its normalised failure signature, and
the file and line it came from. A claim with nothing behind it is not made, and a patch that cannot
be shown to turn a failing reproduction into a passing one is not proposed. The benchmark's sharpest
case is a crash with two possible edits where the two-line one at the crash site is wrong: it
converts a loud 500 into a customer silently told that 42 units in stock are 0. Finding the layer
below the stack trace is the product.

**It finds exposures on the same terms.** A customer does not experience "a bug" and "a
vulnerability" as different products; both are things that are wrong, and both should arrive fixed.
Nine vulnerability classes are detected by rule during an investigation, each finding carrying the
file, the line, the source text and what the rule matched, so a reviewer can judge the rule and not
only the verdict. It reports what it saw in the files it opened and says so: that is not an audit,
and a report that let silence read as an all-clear would be making the strongest claim in the
product out of the weakest evidence for it.

**Status, plainly.** Signal intake, reproduction, evidence capture and diagnosis run today. On the
in-house corpus reproduction is **7 of 7**, the cause is correctly located in **5 of 5** defect
cases, and **8 of 9** cases pass end to end with nothing errored. Cause localisation was **1 of 5**
in August and was the real blocker: a patch aimed at the wrong line is worse than no patch, so the
Fixer, the Verifier and pull-request authoring are built, tested, and held off the main path until a
model-backed run exists to measure them. That is one API key, not a piece of work. Anything above
that line is not yet a shipped guarantee, and this paragraph moves as the numbers do.

**Measured on repositories it did not choose:** [`bench/external/scorecard.json`](https://github.com/codereefai/bench/blob/codereef/external/scorecard.json)
grades 19 real issues from camelcase, deepmerge, picomatch, node-semver, yaml, js-yaml, chalk,
braces and query-string. Every one has the defect present at the pinned commit, all 19 reproductions
executed and captured a signature, and the result is **9 right failures** with **0 false
successes**.

Two things about that number. It is lower than the **7 of 7** in-house, which is what an honest
corpus is for: the in-house cases were written here and the external ones were not. And it is a
lower rate than the 6 of 10 this section quoted in August, because the corpus grew from 11 cases to
19 and the new ones are harder, not because anything regressed. The figure that matters most is the
zero: across 19 runs it never once claimed a defect that was not there. Read the rest as an upper
bound anyway, since those nine libraries were picked for needing no database, no browser and no
credentials, and the sibling corpus walked 45 repositories and rejected 40.

<sub>TypeScript engine, a Rust sandbox, a Python API. Authentication, the organisation boundary
(a predicate inside every query, not a filter around it), a licensing and metering layer, and Sentry
intake alongside the forge all exist; this line used to say none of them did, and stayed that way
after they landed. Still pre-release, and the fix stage is the part that is not shipped.
<a href="https://github.com/codereefai/bench">bench</a> is public; the engine, the console and the
sandbox are not.</sub>

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

**v1.7 closed the middle, and v1.7.1 closed the gap between the halves.** 1.7 added the
pattern language and user-defined generics, the two entries `docs/needs.md` had been calling
the largest open questions, and added them to both implementations rather than to the
bootstrap alone. 1.7.1 is the one worth quoting: the Go checker learned dtypes, and the two
checkers now agree **character for character across 405 files** of `std`, `src`, `examples`
and `testdata/cases`, with no new diagnostic on any program that never mentioned a dtype.
Two implementations of the same checker that disagree on nothing is the only real evidence
that a self-hosted language means what it says. A dtype widening also stopped halting the
program, because a warning that exits non-zero is an error wearing the wrong word.

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
plain TypeScript package with no database and no HTTP server, and that is checkable rather
than asserted: it declares two dependencies, the model SDK and a schema validator. The API
supplies the tools and owns authorization, so a Command turn returns an answer plus a set of
changes a person approves, rather than applying them itself. Free-time arithmetic is computed
rather than generated, because a model that invents an empty afternoon is worse than no
scheduler at all.

<sub><b>Stage 2.</b> The API, worker, integrations, SDK, design system and web client exist, and a Tauri 2 shell ships that same web app to macOS, Windows, Linux, iOS and Android. The API is 18 modules; the web client is ten signed-in screens, among them Today, Tasks, Spaces, Inbox, Search, Focus, Calendar and Ask. Those two lists do not line up one to one and are not meant to: Calendar is a screen served by the events, planner and timeline modules, and Command is a module reached through the Ask screen. Google Calendar and Canvas are the two implemented providers, registered in one file so adding a third is a file and a line rather than a change to the API or the worker. It is early: a route existing is not the same as it being finished, and the documentation is behind the code in places.</sub>

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

<sub>Beyond CodeReef, twill, quorum, Arc and Credda. Trimmed to the ones worth opening: everything
else, including the CSV tools and the browser tools, is on <a href="https://github.com/martin-k-m?tab=repositories">the repositories tab</a>,
which is always current in a way an edited list is not.</sub>

<table>
<tr>
<td width="34%" valign="top">

**Databases and data**

<a href="https://github.com/martin-k-m/strata"><b>strata</b></a> · <code>Java</code><br/>
An LSM-tree storage engine built from the write path up: a CRC-checked write-ahead log, SSTables with bloom filters and a sparse index, and leveled compaction. Recovery is proved by truncating the log at every byte offset and showing a reopen always yields a clean prefix.

<a href="https://github.com/martin-k-m/quarry"><b>quarry</b></a> · <code>Python</code><br/>
A SQL engine over CSV: a parser and an executor, standard library only. Its property-based fuzz suite found a real recursion overflow in deeply nested expressions. The other half of strata.

<a href="https://github.com/martin-k-m/drift"><b>drift</b></a> · <code>Rust</code><br/>
Diff two tables by key rather than by line position, so re-ordering or re-exporting a file is not a diff. Published as <code>drift-tabular</code>.

</td>
<td width="33%" valign="top">

**Developer infrastructure**

<a href="https://github.com/martin-k-m/capsule"><b>capsule</b></a> · <code>Go</code><br/>
Throwaway, isolated development environments described by one config file, gone when you exit.

<a href="https://github.com/martin-k-m/tandem"><b>tandem</b></a> · <code>Java</code><br/>
Durable workflow orchestration for the JVM: retries, compensation and resume, with no runtime dependencies.

<a href="https://github.com/martin-k-m/lincheck"><b>lincheck</b></a> · <code>Go</code><br/>
quorum's linearizability checker, extracted so it can be pointed at someone else's system through a small adapter. An operation whose outcome the client never learned is treated as indeterminate rather than failed, because a write that timed out may still have committed; both directions are regression tests, because the earlier version got it wrong.

</td>
<td width="33%" valign="top">

**Simulation**

<a href="https://poliarchitect.me"><b>PoliArchitect</b></a> · <code>TypeScript</code><br/>
A political and economic sandbox where players roleplay power brokers (politicians, oligarchs, media moguls, commanders, revolutionaries) competing for influence in a fictional 2020s world.

The design goal is interconnection rather than breadth: a budget choice moves GDP, which moves employment, which moves approval, which moves elections, which moves party dynamics, which decides which bills pass, which sets the next budget.

Authoritative state lives in Postgres and a tick engine advances the world on a schedule. Player actions are queued as intents rather than applied as immediate mutations, so the simulation stays the only thing that writes the world. <sub>Private repository; the site is the public surface.</sub>

</td>
</tr>
</table>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/martin-k-m/martin-k-m/assets/footer.svg" />
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/martin-k-m/martin-k-m/assets/footer-light.svg" />
  <img src="https://raw.githubusercontent.com/martin-k-m/martin-k-m/assets/footer-light.svg" width="100%" alt="" />
</picture>
