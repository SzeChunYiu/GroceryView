
## Git workflow — MANDATORY

**Never push directly to main. Always use a branch + PR.**

```bash
git checkout -b <lane>/<short-description>
git add -p   # stage only your changes
git commit -m "feat: ..."
git push origin <lane>/<short-description>
GH_CONFIG_DIR=/projects/hep/fs10/shared/nnbar/billy/.config/gh \
  /projects/hep/fs10/shared/nnbar/billy/bin/gh pr create \
  --title "..." --body "..." --base main
```

- `gh` binary: `/projects/hep/fs10/shared/nnbar/billy/bin/gh`
- Always set `GH_CONFIG_DIR=/projects/hep/fs10/shared/nnbar/billy/.config/gh`
- Do NOT run `git push origin main` — PRs only.
