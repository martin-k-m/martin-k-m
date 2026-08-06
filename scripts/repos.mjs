// The set of repositories both charts measure, so they can never disagree
// about what counts.
//
// It takes two queries, because neither one is complete on its own:
//
//   user.repositories(ownerAffiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER])
//     Everything owned, plus repos where the account is a named collaborator.
//     Despite the ORGANIZATION_MEMBER affiliation this does NOT return the
//     repositories of organizations the account belongs to; it only returns
//     ones where the account itself is attached to the repository. Every
//     Credda-io and fabricml repository was missing from the charts because of
//     this, which is most of the real work.
//
//   viewer.repositoriesContributedTo
//     GitHub's own record of where commits, pull requests and reviews landed,
//     which is what picks up the organization work. On its own it misses repos
//     that were inherited or set up rather than committed to, so it does not
//     replace the first query either.
//
//   viewer.organizations -> repositories
//     The repositories of every organization the account belongs to. Added
//     after fabric-ml, twelve repositories including the only C++ in the
//     account, was invisible to both charts: the first query does not return
//     organization repositories despite the affiliation, and the second only
//     finds them once GitHub has recorded a contribution against them, which it
//     had not.
//
// The second query used to be the only route to organization work, on the
// reasoning that membership is not authorship and a chart of bytes should not
// count a repository nobody here wrote in. That reasoning is sound and the
// implementation was not: contributed-to is a record GitHub keeps, and a
// private repository, a renamed organization or a run of commits made under a
// different email can all leave it empty for work that certainly happened. It
// silently answered "no contributions" and the repositories vanished.
//
// So membership is the rule now for organizations this account belongs to.
// These are its own labs rather than places it happens to have commit access,
// and a chart that omits them is wrong in the direction that matters more.

const FIELDS = `
  nameWithOwner
  isPrivate
  isFork
  owner{ login }
  createdAt
  defaultBranchRef{ name }
  languages(first:30, orderBy:{field:SIZE, direction:DESC}){
    edges{ size node{ name color } }
  }`;

const OWNED = `
query($login:String!,$cursor:String){
  user(login:$login){
    repositories(first:100, after:$cursor, isFork:false,
                 ownerAffiliations:[OWNER,COLLABORATOR,ORGANIZATION_MEMBER]){
      pageInfo{ hasNextPage endCursor }
      nodes{ ${FIELDS} }
    }
  }
}`;

const ORG_REPOS = `
query($org:String!,$cursor:String){
  organization(login:$org){
    repositories(first:100, after:$cursor, isFork:false){
      pageInfo{ hasNextPage endCursor }
      nodes{ ${FIELDS} }
    }
  }
}`;

const ORGS = `
query($cursor:String){
  viewer{
    organizations(first:100, after:$cursor){
      pageInfo{ hasNextPage endCursor }
      nodes{ login }
    }
  }
}`;

const CONTRIBUTED = `
query($cursor:String){
  viewer{
    repositoriesContributedTo(first:100, after:$cursor,
                              includeUserRepositories:true,
                              contributionTypes:[COMMIT,PULL_REQUEST,REPOSITORY,PULL_REQUEST_REVIEW]){
      pageInfo{ hasNextPage endCursor }
      nodes{ ${FIELDS} }
    }
  }
}`;

async function gql(token, query, variables) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

async function pageThrough(token, query, variables, pick) {
  const out = [];
  let cursor = null;
  do {
    const page = pick(await gql(token, query, { ...variables, cursor }));
    out.push(...page.nodes);
    cursor = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
  } while (cursor);
  return out;
}

/**
 * Every repository worth measuring, deduplicated, forks excluded.
 *
 * Forks are left out because their bytes are someone else's work. Archived
 * repos are kept: the code was still written.
 *
 * How much of this the caller actually sees depends on the token. A PAT with
 * `repo` scope sees private repositories; the Actions GITHUB_TOKEN sees only
 * the repository it is running in, which is why both charts refuse to render
 * when fewer than two come back.
 */
export async function fetchRepos(login, token) {
  const [owned, contributed, orgOwned] = await Promise.all([
    pageThrough(token, OWNED, { login }, (d) => d.user.repositories),
    pageThrough(token, CONTRIBUTED, {}, (d) => d.viewer.repositoriesContributedTo),
    fetchOrgRepos(token),
  ]);

  const byName = new Map();
  const colors = new Map();
  for (const repo of [...owned, ...contributed, ...orgOwned]) {
    if (repo.isFork) continue;
    byName.set(repo.nameWithOwner, repo);
    for (const e of repo.languages.edges) if (e.node.color) colors.set(e.node.name, e.node.color);
  }

  const repos = [...byName.values()];
  const owner = login.toLowerCase();
  return {
    repos,
    colors,
    privateCount: repos.filter((r) => r.isPrivate).length,
    // Repos under someone else's account or an organization, which is the
    // number the footer reports as "contributed".
    contributedCount: repos.filter((r) => r.owner.login.toLowerCase() !== owner).length,
  };
}

/**
 * Every repository of every organization the account belongs to.
 *
 * A token without the `read:org` scope sees no organizations at all, which
 * comes back as an empty list rather than an error. That is the pre-existing
 * behaviour restored, not a new failure, so it does not stop the run: the
 * coverage guard is what notices the result got smaller.
 */
async function fetchOrgRepos(token) {
  let orgs;
  try {
    orgs = await pageThrough(token, ORGS, {}, (d) => d.viewer.organizations);
  } catch (err) {
    console.warn(`  organizations unavailable (${err.message}), continuing without them`);
    return [];
  }

  const repos = [];
  for (const { login } of orgs) {
    try {
      repos.push(...(await pageThrough(token, ORG_REPOS, { org: login }, (d) => d.organization.repositories)));
    } catch (err) {
      // One organization the token cannot read must not lose the others.
      console.warn(`  ${login}: ${err.message}`);
    }
  }
  return repos;
}
