# GitHub Actions Workflows

This directory contains automated workflows for maintaining the ADK Streaming Guide documentation.

## Overview

The workflow system consists of two interconnected workflows that automate the process of keeping documentation up-to-date with new ADK releases:

1. **ADK Version Monitor** (`adk-version-monitor.yml`) - Detects new ADK versions and creates tracking issues
2. **Claude Code Reviewer** (`claude-code-reviewer.yml`) - Automatically reviews documentation using Claude Code

## Workflow Architecture

```
┌─────────────────────────────────────┐
│   ADK Version Monitor (Scheduled)   │
│   - Runs every 12 hours             │
│   - Checks PyPI for new versions    │
└─────────────┬───────────────────────┘
              │
              │ New version detected
              ▼
┌─────────────────────────────────────┐
│   Create Consolidated Review Issue  │
│   "ADK vX.Y.Z - Compatibility       │
│    Review"                          │
│   - Includes @claude mention        │
│   - Contains version diff info      │
│   - References change-reviewer      │
└─────────────┬───────────────────────┘
              │
              │ Triggers on issue open
              ▼
┌─────────────────────────────────────┐
│   Claude Code Reviewer              │
│   - Reads issue body                │
│   - Executes change-reviewer agent  │
│   - Analyzes ADK version diff       │
│   - Reviews ALL docs with cross-    │
│     part awareness                  │
│   - Posts consolidated findings     │
└─────────────────────────────────────┘
```

## Setup Instructions

### 1. Install Claude GitHub App

First, install the Claude GitHub App on your repository:

1. Visit the [Claude GitHub App](https://github.com/apps/claude-code) installation page
2. Click "Install" or "Configure"
3. Select the `adk-streaming-guide` repository
4. Grant the required permissions:
   - Read access to metadata and code
   - Write access to code, issues, and pull requests

### 2. Configure Claude Code Provider

The workflow supports easy switching between Anthropic API and Google Vertex AI. See **[CLAUDE_SETUP.md](CLAUDE_SETUP.md)** for detailed configuration instructions.

**Quick setup:**

1. **Choose your provider** by setting the `CLAUDE_PROVIDER` repository variable:
   - `anthropic` (default) - Uses Anthropic API
   - `vertex` - Uses Google Vertex AI

2. **Add required secrets** based on your chosen provider:
   - **Anthropic API**: `ANTHROPIC_API_KEY`
   - **Vertex AI**: `GCP_WORKLOAD_IDENTITY_PROVIDER`, `GCP_SERVICE_ACCOUNT`

3. **Switch providers anytime** by changing the `CLAUDE_PROVIDER` variable

#### Option A: Use Anthropic API (Simpler)

Set repository variable `CLAUDE_PROVIDER` to `anthropic` and add the API key secret.

#### Option B: Use Google Cloud Vertex AI (Recommended for this project)

Since you're already using Google Cloud for the ADK demo, this option is recommended:

**Prerequisites:**

1. Enable required APIs in your Google Cloud project:
   - IAM Credentials API
   - Security Token Service (STS) API
   - Vertex AI API

2. Create Workload Identity Federation:
   ```bash
   # Create Workload Identity Pool
   gcloud iam workload-identity-pools create "github-actions" \
     --project="${PROJECT_ID}" \
     --location="global" \
     --display-name="GitHub Actions Pool"

   # Add GitHub OIDC provider
   gcloud iam workload-identity-pools providers create-oidc "github-provider" \
     --project="${PROJECT_ID}" \
     --location="global" \
     --workload-identity-pool="github-actions" \
     --display-name="GitHub provider" \
     --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
     --issuer-uri="https://token.actions.githubusercontent.com"
   ```

3. Create a dedicated Service Account:
   ```bash
   # Create service account
   gcloud iam service-accounts create github-actions-claude \
     --display-name="GitHub Actions - Claude Code"

   # Grant Vertex AI User role
   gcloud projects add-iam-policy-binding ${PROJECT_ID} \
     --member="serviceAccount:github-actions-claude@${PROJECT_ID}.iam.gserviceaccount.com" \
     --role="roles/aiplatform.user"

   # Allow Workload Identity Pool impersonation
   gcloud iam service-accounts add-iam-policy-binding \
     "github-actions-claude@${PROJECT_ID}.iam.gserviceaccount.com" \
     --project="${PROJECT_ID}" \
     --role="roles/iam.workloadIdentityUser" \
     --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-actions/attribute.repository/${GITHUB_REPO}"
   ```

4. Get the Workload Identity Provider resource name:
   ```bash
   gcloud iam workload-identity-pools providers describe "github-provider" \
     --project="${PROJECT_ID}" \
     --location="global" \
     --workload-identity-pool="github-actions" \
     --format="value(name)"
   ```

5. Add these secrets to your repository:
   - `GCP_WORKLOAD_IDENTITY_PROVIDER`: The full provider resource name from step 4
   - `GCP_SERVICE_ACCOUNT`: Email of the service account (e.g., `github-actions-claude@PROJECT_ID.iam.gserviceaccount.com`)
   - `APP_GITHUB_TOKEN`: GitHub App token for authentication

The workflow is already configured to use Vertex AI (see `.github/workflows/claude-code-reviewer.yml`).

**Security Note**: Never commit API keys or credentials directly to the repository. Always use GitHub Secrets.

### 3. Enable Workflows

The workflows are enabled automatically when you push them to the repository. To verify:

1. Go to the **Actions** tab in your repository
2. You should see:
   - "ADK Version Monitor" workflow
   - "Claude Code Reviewer" workflow
3. Both should show as enabled (green checkmark)

### 4. Initial Version Setup

The `current_adk_version.txt` file tracks the last checked ADK version. It's initialized to `0.0.0`, which means the next scheduled run will detect the current PyPI version as "new" and create issues.

If you want to start from the current version without creating issues:

```bash
# Get current ADK version from PyPI
CURRENT_VERSION=$(curl -s https://pypi.org/pypi/google-adk/json | python3 -c "import sys, json; print(json.load(sys.stdin)['info']['version'])")

# Update the tracking file
echo $CURRENT_VERSION > .github/current_adk_version.txt

# Commit and push
git add .github/current_adk_version.txt
git commit -m "chore: initialize ADK version tracking"
git push
```

## Workflow Details

### ADK Version Monitor

**Trigger Schedule**: Every 12 hours (midnight and noon UTC)

**What it does**:
1. Fetches the latest `google-adk` version from PyPI
2. Compares with the version in `current_adk_version.txt`
3. If a new version is detected:
   - Creates a single consolidated review issue titled "ADK vX.Y.Z - Documentation Compatibility Review"
   - Issue includes version diff information (previous → new version)
   - Issue includes @claude mention with change-reviewer instructions
   - Updates `current_adk_version.txt` with the new version
   - Commits the version file to the repository

**Key Design Decisions**:
- **Single issue, not multiple sub-issues**: Avoids siloed reviews that create false positives
- **Version diff focus**: Review focuses on what changed between versions, not generic compatibility
- **Cross-part awareness**: Uses change-reviewer agent that checks ALL docs before reporting issues
- **No false positives**: A feature documented in any part counts as "covered"

**Manual Trigger**:

```bash
# Trigger manually via GitHub CLI
gh workflow run adk-version-monitor.yml

# Force check even if version unchanged
gh workflow run adk-version-monitor.yml -f force_check=true
```

**Outputs**:

- Single consolidated review issue with version diff info
- Link to GitHub compare view for the version range
- Commit updating the version tracking file

### Claude Code Reviewer

**Trigger**: When issues are opened or commented on

**What it does**:

1. Checks if the issue has the `adk-version-update` label
2. Checks if `@claude` is mentioned in the issue body or comment
3. If both conditions are met:
   - Checks out the `adk-streaming-guide` repository
   - Clones the `google/adk-python` repository (full clone with git history) as a sibling directory
     - This provides the `google-adk` skill with access to actual ADK source code
     - Enables deep analysis of implementation details, not just documentation
     - Ensures reviews catch subtle API behavior changes
     - Full git history allows version diff analysis (`git log v{OLD}..v{NEW}`)
   - Executes Claude Code with the issue instructions
   - Uses the **change-reviewer** agent which:
     - Analyzes ADK changes between the old and new versions
     - Reviews ALL documentation parts with cross-part awareness
     - Checks demo application for compatibility
     - Only reports issues for genuinely missing/incorrect content
   - Posts consolidated findings as a single comment
   - May create a pull request with suggested fixes
   - Adds a `reviewed` label when complete

**Repository Structure in GitHub Actions**:

```
/home/runner/work/adk-streaming-guide/
├── adk-streaming-guide/  (this repository, checked out by actions/checkout)
│   ├── docs/
│   ├── .claude/
│   │   └── skills/
│   │       └── google-adk/   (references ../adk-python)
│   └── ...
└── adk-python/           (cloned via git clone for source code review)
    ├── src/
    └── ...
```

This setup mirrors the local development environment where both repositories are siblings, ensuring the `adk-reviewer` agent can access the actual ADK source code through the `google-adk` skill for accurate compatibility analysis.

**Manual Trigger**:

You can manually trigger reviews by commenting on any issue with the `adk-version-update` label:

```markdown
@claude Please review this documentation part for ADK compatibility
```

## Consolidated Review Approach

The workflow creates a **single consolidated review issue** that covers all documentation and code. This design avoids the problems of siloed per-part reviews.

### What the Review Covers

The change-reviewer agent analyzes:

1. **Documentation (docs/part1.md through part5.md)**
   - API changes affecting any part
   - Code examples that need updates
   - Deprecated functionality to remove
   - New features that should be documented
   - Cross-part consistency

2. **Demo Application (src/bidi-demo/)**
   - Code compatibility with new ADK version
   - Deprecated API usage
   - Missing error handling for new features

### Cross-Part Awareness

The key innovation is **cross-part awareness**:

- Before reporting a feature as "missing", the agent searches ALL parts
- If documented in ANY part, it counts as covered
- Only reports issues for genuinely missing content
- Avoids false positives like "Part 1 doesn't document X" when Part 4 covers it

### Version Diff Focus

Instead of generic compatibility checks, the review focuses on:

- Actual changes between the previous and new ADK version
- Git diff analysis: `git log v{OLD}..v{NEW}`
- CHANGELOG entries for the new version
- Only streaming-related changes are analyzed

### Agent Used

The **change-reviewer** agent performs this analysis:
- Compares ADK versions using git history
- Reviews CHANGELOG.md for documented changes
- Searches all docs for coverage of each change
- Produces a consolidated report with:
  - Changes analyzed (with coverage status)
  - Critical issues (breaking changes not documented)
  - Warnings (new features not documented)
  - Demo code compatibility status

## Issue Structure

The consolidated review issue created by the version monitor includes:

**Title**: `ADK vX.Y.Z - Documentation Compatibility Review`

**Body**: Includes:

- Version information (previous → new version)
- Link to PyPI package
- Link to GitHub compare view for the version range
- Instructions for Claude to use the `change-reviewer` agent
- Labels: `adk-version-update`, `documentation`, `automated`

**Example**:

```markdown
## ADK Version Update: 1.21.0 → 1.22.0

A new version of the Google Agent Development Kit has been released.

### Version Information
- **Previous Version**: 1.21.0
- **New Version**: 1.22.0
- **Compare Changes**: [v1.21.0...v1.22.0](https://github.com/google/adk-python/compare/v1.21.0...v1.22.0)

### Review Instructions

@claude Please use the **change-reviewer** agent to perform a consolidated review:

1. **Analyze ADK changes** between v1.21.0 and v1.22.0
2. **Review all documentation** for impacts
3. **Review demo application** for compatibility
4. **Post findings** as a comment
```

## Review Process

### Automated Review Steps

1. **Version Detection** (automated, every 12 hours)
   - Monitor workflow detects new ADK version
   - Single consolidated review issue is created

2. **Claude Review** (automated, triggered by issue creation)
   - Claude reads the issue body with version diff info
   - Executes the `change-reviewer` agent
   - Analyzes ADK changes between versions
   - Reviews all documentation with cross-part awareness
   - Posts consolidated findings as a comment

3. **Manual Review** (manual, by maintainers)
   - Review Claude's findings
   - Make necessary documentation updates
   - Close issue when all findings are addressed

### Expected Review Outputs

Claude's review comment will include:

- **Changes Analyzed**: Table of ADK changes with coverage status
- **Critical Issues**: Breaking changes not documented anywhere
- **Warnings**: New features not documented anywhere
- **Suggestions**: Improvements (not missing content)
- **Cross-Part Coverage**: Confirmation that features are documented
- **Demo Code Status**: Compatibility assessment

### Manual Follow-up

After Claude posts its review:

1. **Assess the findings**: Determine which changes are necessary
2. **Update documentation**: Make required changes to the docs
3. **Test code examples**: Verify all code examples still work
4. **Update cross-references**: Fix any broken internal links
5. **Close issue**: Mark as complete when all findings are addressed

## Monitoring and Maintenance

### Check Workflow Status

```bash
# List recent workflow runs
gh run list --workflow=adk-version-monitor.yml --limit 5

# View details of the latest run
gh run view

# View logs
gh run view --log
```

### View Created Issues

```bash
# List issues with the adk-version-update label
gh issue list --label adk-version-update

# View a specific issue
gh issue view <issue-number>
```

### Troubleshooting

**Workflow not running**:

- Check that the workflow file is in the `main` branch
- Verify the cron schedule syntax is correct
- Check the Actions tab for any errors

**Claude not responding to issues**:

- Verify the `ANTHROPIC_API_KEY` secret is set correctly
- Check that the issue has the `adk-version-update` label
- Ensure `@claude` is mentioned in the issue body
- Check the Claude Code Reviewer workflow logs

**API rate limits**:

- GitHub Actions: 1,000 API requests per hour per repository
- Anthropic API: Depends on your tier
- PyPI: Generally unlimited for version checks

**False positives**:

If the workflow creates issues for versions you've already reviewed:

- Manually update `current_adk_version.txt` to the latest version
- Commit and push the change


## Cost Considerations

### GitHub Actions

- **Free tier**: 2,000 minutes/month for public repositories, 500 minutes/month for private
- **This workflow**: ~2-5 minutes per run (scheduled twice daily = ~300 minutes/month)
- **Estimate**: Well within free tier limits

### Anthropic API

- **Cost**: Based on token usage (input + output)
- **Per review**: Approximately 10K-50K tokens per documentation part
- **Estimate**: $0.50-$2.00 per ADK version (for all 5 parts)
- **Frequency**: Only runs when new ADK versions are released

## Customization

### Adjust Check Frequency

Edit `adk-version-monitor.yml`:

```yaml
on:
  schedule:
    # Check daily at midnight UTC
    - cron: '0 0 * * *'

    # Check weekly on Mondays
    - cron: '0 0 * * 1'
```

### Customize Review Scope

Edit the issue body template in `adk-version-monitor.yml` to change what Claude reviews:

```javascript
// In the create_parent_issue step
const body = `## ADK Version Update: ${currentVersion} → ${version}
...
2. **Review all documentation** for impacts:
   - docs/part1.md through docs/part5.md  // Modify this list
   - Focus ONLY on sections affected by the version changes
...
`;
```

### Customize Agent Instructions

Modify `.claude/agents/change-reviewer.md` to change how Claude performs the review.

## Testing the Workflow System

To test that the ADK version monitoring and review system is working correctly, you can manually trigger a test cycle:

### Test Procedure

1. **Simulate a version update** by setting the tracked version to an older version:

   ```bash
   # Set version to older version to trigger detection
   echo "1.21.0" > .github/current_adk_version.txt

   # Commit and push the change
   git add .github/current_adk_version.txt
   git commit -m "test: set ADK version to 1.21.0 to test workflow"
   git push
   ```

2. **Manually trigger the ADK Version Monitor workflow**:

   ```bash
   gh workflow run "ADK Version Monitor"
   ```

3. **Verify the workflow detects the version difference**:

   ```bash
   # Check workflow status
   gh run list --limit 3

   # Check for newly created issue (should be only 1, not 8)
   gh issue list --state open --label adk-version-update
   ```

4. **Expected results**:

   - Single consolidated issue: "ADK vX.Y.Z - Documentation Compatibility Review"
   - Issue contains version diff info (1.21.0 → current)
   - Issue contains @claude mention with change-reviewer instructions
   - Claude Code Reviewer workflow should automatically start

5. **Monitor the Claude review**:

   ```bash
   # Check Claude Code Reviewer workflow runs
   gh run list --workflow="Claude Code Reviewer" --limit 5

   # View issue comments to see Claude's consolidated review
   gh issue view <issue-number>
   ```

6. **Clean up after testing**:

   ```bash
   # Reset to current version and close test issue
   echo "1.22.0" > .github/current_adk_version.txt
   git add .github/current_adk_version.txt
   git commit -m "test: reset ADK version after workflow testing"
   git push

   # Close test issue
   gh issue close <issue-number> --comment "Closing test issue"
   ```

### What to Verify

- ✅ ADK Version Monitor detects version difference
- ✅ Single consolidated issue is created (not 8 separate issues)
- ✅ Issue contains version diff information (old → new)
- ✅ Issue contains @claude mention and change-reviewer instructions
- ✅ Claude Code Reviewer workflow triggers on issue creation
- ✅ Claude posts consolidated review as a single comment
- ✅ Review focuses on version changes, not generic compatibility
- ✅ No false positives for features documented in other parts


### Troubleshooting Test Issues

**No issues created**:

- Check that you committed and pushed the version file change before running the workflow
- Verify the workflow run completed successfully: `gh run view`

**Claude not responding**:

- Check `ANTHROPIC_API_KEY` or Google Cloud authentication is configured
- Verify issues have `adk-version-update` label and `@claude` mention

**Workflow failures**:

- Check workflow logs: `gh run view --log --job=<job-id>`
- Verify repository permissions and secrets are set correctly


## Best Practices

1. **Review promptly**: Address sub-issues within a week of creation to keep docs current
2. **Test thoroughly**: Always test code examples after updates
3. **Keep CLAUDE.md updated**: Ensure Claude has the latest project context
4. **Monitor costs**: Track GitHub Actions minutes and Anthropic API usage
5. **Version tracking**: Keep `current_adk_version.txt` accurate
6. **Label management**: Use labels consistently for filtering and tracking

## Related Documentation

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Claude Code Documentation](https://code.claude.com/docs)
- [ADK Documentation](https://google.github.io/adk-docs/)
- Repository `CLAUDE.md` - Project instructions for Claude Code
- Repository `STYLES.md` - Documentation style guidelines
