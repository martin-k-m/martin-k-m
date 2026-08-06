// Tests for the coverage guard.
//
// Run with `node --test scripts/`. No dependencies: the published measurement is
// served by a throwaway HTTP server, because that is how the guard reads it in
// CI and stubbing fetch would test something else.

import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { assertCoverage } from "./coverage-guard.mjs";

/** Serve one JSON body (or a status) and return its URL. */
async function serve(body, status = 200) {
  const server = createServer((_req, res) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(body === null ? "" : JSON.stringify(body));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  return {
    url: `http://127.0.0.1:${port}/languages.json`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

/** Run the guard against a served body, with the environment cleaned up after. */
async function guard(repoCount, published, { status = 200, allow } = {}) {
  const { url, close } = await serve(published, status);
  const previousUrl = process.env.PUBLISHED_URL;
  const previousAllow = process.env.ALLOW_COVERAGE_DROP;
  process.env.PUBLISHED_URL = url;
  if (allow !== undefined) process.env.ALLOW_COVERAGE_DROP = allow;
  else delete process.env.ALLOW_COVERAGE_DROP;
  try {
    return await assertCoverage(repoCount, { repo: "o/r", label: "test" }).then(
      () => null,
      (err) => err
    );
  } finally {
    if (previousUrl === undefined) delete process.env.PUBLISHED_URL;
    else process.env.PUBLISHED_URL = previousUrl;
    if (previousAllow === undefined) delete process.env.ALLOW_COVERAGE_DROP;
    else process.env.ALLOW_COVERAGE_DROP = previousAllow;
    await close();
  }
}

test("the run that caused this is refused", async () => {
  // 57 repositories yesterday, 36 today, no error anywhere. That run published.
  // It turned out to be a real deletion, which is the point: the script cannot
  // tell, so it stops and says so.
  const err = await guard(36, { repos: 57 });
  assert.ok(err, "a 21-repo drop was allowed");
  assert.match(err.message, /36/);
  assert.match(err.message, /57/);
  // Both explanations, because guessing one is what went wrong the first time.
  assert.match(err.message, /deleted or archived/);
  assert.match(err.message, /PROFILE_TOKEN/);
  assert.match(err.message, /ALLOW_COVERAGE_DROP=1/);
});

test("a steady count passes", async () => {
  assert.equal(await guard(57, { repos: 57 }), null);
});

test("growth passes", async () => {
  assert.equal(await guard(60, { repos: 57 }), null);
});

test("a small tidy-up passes", async () => {
  // Deleting two of fifty-seven is a Tuesday. Losing twenty-one is a token.
  assert.equal(await guard(55, { repos: 57 }), null);
});

test("a small account deleting one repository passes", async () => {
  // A percentage threshold alone would trip here: one of four is 25%.
  assert.equal(await guard(3, { repos: 4 }), null);
});

test("a proportionally large drop on a large account is refused", async () => {
  assert.ok(await guard(40, { repos: 57 }));
});

test("no published count yet is not a failure", async () => {
  // The first run after this check was added has nothing to compare against.
  assert.equal(await guard(36, { updated: "2026-08-06T00:00:00Z", days: {} }), null);
});

test("a missing published file is not a failure", async () => {
  assert.equal(await guard(36, null, { status: 404 }), null);
});

test("an unreachable server is not a failure", async () => {
  // The guard must never be the reason a run fails.
  const previous = process.env.PUBLISHED_URL;
  process.env.PUBLISHED_URL = "http://127.0.0.1:1/languages.json";
  try {
    await assertCoverage(36, { repo: "o/r", label: "test" });
  } finally {
    if (previous === undefined) delete process.env.PUBLISHED_URL;
    else process.env.PUBLISHED_URL = previous;
  }
});

test("the escape hatch has to be deliberate", async () => {
  // For the legitimate case: archiving a batch on purpose.
  assert.equal(await guard(36, { repos: 57 }, { allow: "1" }), null);
  // Anything other than exactly 1 is not an opt-in.
  assert.ok(await guard(36, { repos: 57 }, { allow: "true" }));
});
