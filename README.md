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

Electrical engineering at UC Santa Cruz, co-founder of Credda. I build systems software and try to break it before it ships: a Raft-replicated key-value store checked for linearizability under live network partitions, an execution cache that traces syscalls to work out what a build actually read, an LSM storage engine, and twill, a language whose compiler is written in itself.

<br/>

## twill &nbsp;·&nbsp; [GitHub](https://github.com/martin-k-m/twill) &nbsp;·&nbsp; [![Release](https://img.shields.io/github/v/release/martin-k-m/twill?sort=semver&display_name=tag&label=&style=flat-square&color=4FB79B)](https://github.com/martin-k-m/twill/releases)

<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/martin-k-m/twill/main/assets/twill-mark-glow.png" />
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/martin-k-m/twill/main/assets/twill-mark.png" />
  <img src="https://raw.githubusercontent.com/martin-k-m/twill/main/assets/twill-mark.png" width="96" alt="twill" />
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

**As of v1.4.0 it is self-hosting.** The compiler written in twill compiles itself,
and the binary it produces reproduces the original byte for byte.

<sub>Go, no dependencies.</sub>

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

<sub>Early-stage and under active development. Anything the site marks <i>coming soon</i> is direction, not a shipped guarantee.</sub>

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
</table>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/martin-k-m/martin-k-m/assets/footer.svg" />
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/martin-k-m/martin-k-m/assets/footer-light.svg" />
  <img src="https://raw.githubusercontent.com/martin-k-m/martin-k-m/assets/footer-light.svg" width="100%" alt="" />
</picture>
