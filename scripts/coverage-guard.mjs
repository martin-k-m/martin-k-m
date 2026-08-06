// Refuse to publish a chart that measures a lot less than the last one did.
//
// This exists because of a run where 57 repositories became 36 between one
// evening and the next morning. The contributed count went 29 to 8, Python fell
// from 11.7 MB to 1.0 MB, and TypeScript read 67% where the day before it read
// 41%. No step failed, so the step that preserves the last published charts
// never fired and both charts published the smaller picture.
//
// That drop was real: three organizations' repositories had been deleted. The
// first diagnosis was a token that had lost its organization access, and it was
// wrong, which is the whole argument for this file. From inside a script the two
// causes are indistinguishable. A PAT whose SSO authorization has lapsed and an
// account that genuinely shrank both arrive as a shorter list with a 200, and
// only the person running it knows which happened.
//
// So the guard is on coverage rather than on the numbers themselves. Bytes move
// for real reasons all the time; the count of repositories a token can see does
// not drop by a third because somebody wrote code.

/** Where the last published measurement lives. */
const publishedUrl = (repo) =>
  process.env.PUBLISHED_URL ||
  `https://raw.githubusercontent.com/${repo}/assets/languages.json`;

/**
 * A drop is only worth stopping for if it is both proportionally large and
 * more than a couple of repositories.
 *
 * Two thresholds because either alone misfires. A percentage alone trips on a
 * small account where deleting one repo of four is 25%. A flat count alone trips
 * on a large account's routine tidy-up. Deleting five of fifty-seven is a
 * Tuesday; losing twenty-one is a token.
 */
const MAX_DROP_FRACTION = 0.15;
const MIN_DROP_COUNT = 3;

/**
 * Stop the run when this measurement covers far fewer repositories than the
 * published one.
 *
 * Throws rather than exiting, so the caller decides how to report it. Both
 * chart scripts are `continue-on-error` in CI with a step afterwards that pulls
 * the last published SVGs back down, so a throw here means the charts stay as
 * they were rather than being replaced with the partial ones.
 *
 * Set ALLOW_COVERAGE_DROP=1 to publish anyway. That is the escape hatch for the
 * legitimate case, archiving or deleting a batch of repositories on purpose, and
 * it has to be deliberate because the whole point is that the accidental case
 * looks identical from in here.
 */
export async function assertCoverage(repoCount, { repo, label }) {
  if (process.env.ALLOW_COVERAGE_DROP === "1") {
    console.warn(`  ALLOW_COVERAGE_DROP=1, publishing ${label} without the coverage check`);
    return;
  }

  const previous = await lastPublishedCount(repo);
  if (previous === null) {
    // No published count yet, which is the first run after this check was
    // added. Nothing to compare against is not a reason to fail.
    return;
  }

  const drop = previous - repoCount;
  if (drop < MIN_DROP_COUNT || drop / previous <= MAX_DROP_FRACTION) return;

  throw new Error(
    `${label}: this run sees ${repoCount} repositories, the last published run saw ${previous}.\n` +
      `A drop of ${drop} has two explanations and this script cannot tell them apart.\n` +
      "  Repositories were deleted or archived: rerun with ALLOW_COVERAGE_DROP=1, and the\n" +
      "    new number becomes the baseline.\n" +
      "  The token lost access: check that PROFILE_TOKEN has not expired and is still\n" +
      "    authorized for the organizations, since SSO authorization lapses separately\n" +
      "    from the token itself.\n" +
      "Publishing without deciding which is how a chart quietly starts describing a\n" +
      "different account."
  );
}

/** The repository count in the last published measurement, or null. */
async function lastPublishedCount(repo) {
  try {
    const res = await fetch(publishedUrl(repo), {
      headers: { "Cache-Control": "no-cache" },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return Number.isFinite(json?.repos) ? json.repos : null;
  } catch {
    // The guard must never be the reason a run fails. Unreachable network means
    // no comparison, not a broken build.
    return null;
  }
}
