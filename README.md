<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/martin-k-m/martin-k-m/assets/banner.svg" />
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/martin-k-m/martin-k-m/assets/banner-light.svg" />
  <img src="https://raw.githubusercontent.com/martin-k-m/martin-k-m/assets/banner-light.svg" width="100%" alt="Martin Muskov, studying EE at UCSC, co-founder at Credda" />
</picture>

[![Credda](https://img.shields.io/badge/Credda-C2410C?style=flat-square&logo=verifiedbadge&logoColor=white)](https://credda.io)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/martin-muskov/)
[![Email](https://img.shields.io/badge/marmu1407@gmail.com-EA4335?style=flat-square&logo=gmail&logoColor=white)](mailto:marmu1407@gmail.com)
[![Substack](https://img.shields.io/badge/Substack-FF6719?style=flat-square&logo=substack&logoColor=white)](https://martinkm.substack.com)
[![Website](https://img.shields.io/badge/martin--k--m.github.io-2B2820?style=flat-square&logo=react&logoColor=white)](https://martin-k-m.github.io)

Electrical engineering at UC Santa Cruz, co-founder of Credda. I build systems software and try to break it before it ships: a Raft-replicated key-value store checked for linearizability under live network partitions, an execution cache that traces syscalls to work out what a build actually read, an LSM storage engine, and twill, a language whose compiler is written in itself. Credda is the same instinct pointed at other people's code: reproduce the failure that is actually hurting them, find what caused it, and propose the fix as a pull request somebody reviews.

<br/>

## Credda &nbsp;·&nbsp; [credda.io](https://credda.io) &nbsp;·&nbsp; [GitHub](https://github.com/Credda-io) &nbsp;·&nbsp; [Action](https://github.com/Credda-io/action)

<div align="center">

  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Credda-io/.github/main/profile/assets/credda-lockup-white.png">
    <img alt="Credda" src="https://raw.githubusercontent.com/Credda-io/.github/main/profile/assets/credda-lockup-black.png" width="420">
  </picture>

</div>

**Something is broken. Credda proposes the fix.** You label a bug report or a vulnerability, and
Credda takes the whole problem end to end: it prepares an environment, reproduces the reported
failure, captures the signature as evidence, diagnoses what actually caused it, writes the patch,
proves the patch with a test that fails before it and passes after, and opens a pull request
carrying all of it. A human reviews a diff rather than a bug report, and Credda never merges. I'm a
co-founder.

<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/martin-k-m/martin-k-m/assets/credda.svg" />
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/martin-k-m/martin-k-m/assets/credda-light.svg" />
  <img src="https://raw.githubusercontent.com/martin-k-m/martin-k-m/assets/credda-light.svg" width="100%" alt="Credda: reproduced before diagnosed, the cause rather than the crash site, proved with a test that fails before the fix and passes after, and a defect and an exposure treated as one thing" />
</picture>

</div>

**The hard part is not writing the patch, it is being right about the cause.** Plenty of agents will
generate a diff from a stack trace, and the diff often silences a symptom, rewrites working code, or
just asserts the bug is gone. Credda's invariant is that every material claim cites a recorded
artifact: a command that ran, its exit code, its normalised failure signature, and the file and line
it came from. A claim with nothing behind it is not made, and a patch that cannot be shown to turn a
failing reproduction into a passing one is not proposed. The sharpest case in the benchmark is a
crash with two possible edits where the two-line one at the crash site is wrong: it converts a loud
500 into a customer silently told that 42 units in stock are 0. Finding the layer below the stack
trace is the product.

**Reproduction is the gate, not a step.** A patch for a failure nobody made happen is a guess with a
diff attached, so nothing is said about a cause until a run has made the reported failure happen and
captured its signature. Where no runnable check can be derived from a report, the run says so rather
than guessing, and a reproduction is never asserted over a failure that is not the reported one.

**It finds exposures on the same terms.** A customer does not experience "a bug" and "a
vulnerability" as different products; both are things that are wrong, and both should arrive fixed.
Nine vulnerability classes are detected by rule during an investigation, each finding carrying the
file, the line, the source text and what the rule matched, so a reviewer can judge the rule and not
only the verdict. It reports what it saw in the files it opened and says so: that is not an audit,
and a report that let silence read as an all-clear would be making the strongest claim in the
product out of the weakest evidence for it.

<sub>Pre-release, and specific about it: signal intake, reproduction, evidence capture and diagnosis
run today, and the fix stage lands with the model-backed release. Anything above that line describes
what the product is for rather than a shipped guarantee. A TypeScript engine, a Rust sandbox and a
Python API, run from a GitHub Action against a checkout in your own CI, so source never leaves your
runner. The client surface is open source and MIT even though the engine is not:
<a href="https://github.com/Credda-io/credda-go"><b>credda-go</b></a>, a stdlib-only Go client,
<a href="https://github.com/Credda-io/credda-js"><b>credda-js</b></a> (<code>@credda/js</code>),
<a href="https://github.com/Credda-io/credda-cli"><b>credda-cli</b></a> (<code>@credda/cli</code>),
and <a href="https://github.com/Credda-io/credda-mcp"><b>credda-mcp</b></a> (<code>@credda/mcp-server</code>),
which reads what Credda found over MCP. We publish no user counts, customer names, revenue or
funding.</sub>

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

## Selected projects

<sub>Beyond Credda and twill, which are the two above. Trimmed to the ones worth opening: everything
else, including the CSV tools and the browser tools, is on <a href="https://github.com/martin-k-m?tab=repositories">the repositories tab</a>,
which is always current in a way an edited list is not.</sub>

<table>
<tr>
<td width="34%" valign="top">

**Databases and data**

<a href="https://github.com/martin-k-m/quorum"><b>quorum</b></a> · <code>Go</code><br/>
A replicated key-value store on Raft, written from the protocol up. Election and log replication are a deterministic state machine with no I/O and no clock, so a whole cluster runs inside one seeded simulator and a failing run replays from its seed. A linearizability checker runs against a live cluster under real partitions.

<a href="https://github.com/martin-k-m/strata"><b>strata</b></a> · <code>Java</code><br/>
An LSM-tree storage engine built from the write path up: a CRC-checked write-ahead log, SSTables with bloom filters and a sparse index, and leveled compaction. Recovery is proved by truncating the log at every byte offset and showing a reopen always yields a clean prefix.

<a href="https://github.com/martin-k-m/quarry"><b>quarry</b></a> · <code>Python</code><br/>
A SQL engine over CSV: a parser and an executor, standard library only. Its property-based fuzz suite found a real recursion overflow in deeply nested expressions. The other half of strata.

<a href="https://github.com/martin-k-m/drift"><b>drift</b></a> · <code>Rust</code><br/>
Diff two tables by key rather than by line position, so re-ordering or re-exporting a file is not a diff. Published as <code>drift-tabular</code>.

</td>
<td width="33%" valign="top">

**Developer infrastructure**

<a href="https://github.com/martin-k-m/arc"><b>Arc</b></a> · <code>Rust</code><br/>
An execution cache that watches what a command actually reads, and replays the previous result when none of it has changed. Dependencies are observed rather than declared, so the task graph is one nobody wrote, and an unobservable read makes it run the command rather than guess.

<a href="https://github.com/martin-k-m/capsule"><b>capsule</b></a> · <code>Go</code><br/>
Throwaway, isolated development environments described by one config file, gone when you exit.

<a href="https://github.com/martin-k-m/tandem"><b>tandem</b></a> · <code>Java</code><br/>
Durable workflow orchestration for the JVM: retries, compensation and resume, with no runtime dependencies.

<a href="https://github.com/martin-k-m/lincheck"><b>lincheck</b></a> · <code>Go</code><br/>
quorum's linearizability checker, extracted so it can be pointed at someone else's system through a small adapter. An operation whose outcome the client never learned is treated as indeterminate rather than failed, because a write that timed out may still have committed; both directions are regression tests, because the earlier version got it wrong.

</td>
<td width="33%" valign="top">

**Everything else**

<a href="https://github.com/scalar-app"><b>Scalar</b></a> · <code>TypeScript</code><br/>
Open-source productivity infrastructure across eleven repositories: email, calendar, coursework, tasks and files pulled into one action layer, so what needs doing arrives as a plan rather than a pile. The systems you already use stay the source of record. The AI layer is deliberately the least powerful thing in it: a Command turn returns an answer and a set of changes a person approves, rather than applying them itself. The same rule governs the one thing it writes outside itself, which is a calendar: only when asked at the time, and only ever touching events it created. Workspaces are shareable with roles, and everything in one downloads as a file that states what it withholds and why. Self-hostable, AGPL-3.0.

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
