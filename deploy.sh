#!/usr/bin/env bash
# Deploy this portfolio to GitHub Pages.
#
# Asks for a GitHub token each time it runs and never saves it:
#   - not in gh's config (no `gh auth login`)
#   - not in .git/config or the remote URL
#   - not in shell history or command-line arguments
#
# Token needs the `repo` scope (classic token), or for a fine-grained token:
# Administration, Contents and Pages = read & write.
#
# Usage: ./deploy.sh [repo-name]      (default: art-portfolio)

set -euo pipefail
cd "$(dirname "$0")"

REPO_NAME="${1:-art-portfolio}"

command -v gh  >/dev/null || { echo "GitHub CLI not found. Install it with: brew install gh"; exit 1; }
command -v git >/dev/null || { echo "git not found."; exit 1; }

# --- Token (hidden input, kept only in this process) ------------------------
printf "GitHub token (input hidden): "
read -rs GH_TOKEN
echo
# Strip spaces, tabs and stray line breaks picked up while copy-pasting.
GH_TOKEN="$(printf '%s' "$GH_TOKEN" | tr -d '[:space:]')"
[ -n "$GH_TOKEN" ] || { echo "No token entered."; exit 1; }
export GH_TOKEN
trap 'unset GH_TOKEN' EXIT

if ! OWNER="$(gh api user --jq .login 2>/tmp/deploy-gh-err.$$)"; then
  echo "GitHub rejected the token: $(head -1 /tmp/deploy-gh-err.$$)"
  rm -f /tmp/deploy-gh-err.$$
  echo "Likely causes: the token was deleted or has expired, or it was only partly pasted."
  echo "(The token you pasted was ${#GH_TOKEN} characters long; a classic token is 40.)"
  exit 1
fi
rm -f /tmp/deploy-gh-err.$$
echo "Signed in as $OWNER (for this run only)."

# --- Make sure there is something committed to push ------------------------
if [ -n "$(git status --porcelain)" ]; then
  echo
  echo "You have uncommitted changes:"
  git status --short
  printf "Commit them before deploying? [Y/n] "
  read -r ans
  if [ "${ans:-Y}" != "n" ] && [ "${ans:-Y}" != "N" ]; then
    git add -A
    git commit -q -m "Update portfolio"
    echo "Committed."
  else
    echo "Deploying the last commit only."
  fi
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"

# --- Create the repository if it doesn't exist ------------------------------
if gh api "repos/$OWNER/$REPO_NAME" >/dev/null 2>&1; then
  echo "Repository $OWNER/$REPO_NAME already exists."
else
  echo "Creating public repository $OWNER/$REPO_NAME ..."
  gh repo create "$OWNER/$REPO_NAME" --public \
    --description "Art portfolio" >/dev/null
fi

REMOTE_URL="https://github.com/$OWNER/$REPO_NAME.git"
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REMOTE_URL"
else
  git remote add origin "$REMOTE_URL"
fi

# --- Push, handing the token to git via a one-off credential helper ---------
# The helper reads GH_TOKEN from the environment, so the token never appears
# in arguments or gets written to disk. Saved credential helpers are disabled
# for this push so nothing gets stored in the macOS keychain either.
echo "Pushing $BRANCH ..."
git -c credential.helper= \
    -c 'credential.helper=!f() { test "$1" = get || return 0; echo username=x-access-token; echo "password=$GH_TOKEN"; }; f' \
    push -u origin "$BRANCH"

# --- Turn on GitHub Pages ---------------------------------------------------
if gh api "repos/$OWNER/$REPO_NAME/pages" >/dev/null 2>&1; then
  echo "GitHub Pages is already on."
else
  echo "Turning on GitHub Pages ..."
  gh api -X POST "repos/$OWNER/$REPO_NAME/pages" --input - >/dev/null <<EOF
{"source": {"branch": "$BRANCH", "path": "/"}}
EOF
fi

echo
echo "Done."
echo "  Repository: https://github.com/$OWNER/$REPO_NAME"
echo "  Website:    https://$OWNER.github.io/$REPO_NAME/   (first build takes a minute or two)"
