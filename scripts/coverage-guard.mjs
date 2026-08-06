// Refuse to publish a chart that measures a lot less than the last one did.
//
// This exists because of a run that succeeded and was wrong. Overnight the
// token stopped seeing the organization repositories: 57 repos became 36, the
// contributed count went 29 to 8, and Python fell from 11.7 MB to 1.0 MB. No
// step failed, so nothing was preserved and both charts published, showing
// TypeScript at 67% where the day before it was 41%. The shape of the account
// appeared to change overnight, and nothing about the account had changed.
//
// A scan that sees less than it did is nearly always an access problem, not a
// deletion: a PAT expiring, an organization's SSO authorization lapsing, a
// fine-grained token's approval running out. Those are exactly the failures
// that do not raise an error, because the API answers cheerfully with the
// subset it is willing to show.
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
      `A drop of ${drop} is almost always the token losing access rather than repositories\n` +
      "going away: check that PROFILE_TOKEN has not expired and is still authorized for the\n" +
      "organizations (SSO authorization lapses separately from the token itself).\n" +
      "If the repositories really are gone, rerun with ALLOW_COVERAGE_DROP=1."
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
