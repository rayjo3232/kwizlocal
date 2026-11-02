# Project working agreements

- Product priority: the core is teaching knowledge points clearly and checking whether the learner can independently use them. Prioritize lesson explanations, worked examples, targeted questions and valid assessment over peripheral dashboard, notebook or visual features. UI changes should serve those two core tasks.

- The user has explicitly authorized automatic Git commits and pushes after every completed, validated round of changes in this project. Push to the existing GitHub remote and current intended branch; Cloudflare deploys through the user's existing GitHub integration. Include the completed changes from earlier rounds if they are still uncommitted.
- Check remote changes before pushing. Integrate safely if needed; do not force-push or overwrite unrelated work. Keep secrets and personal learning backups out of commits.
- Every round must have a useful, visible UI improvement. Update `app/release.js` with a unique release id, version, date and concrete change notes. See `docs/RELEASES.md`.
- Run relevant checks, `node tools/smoke_studio.cjs`, build the distribution, and run `python tools/check_deploy.py` before pushing. Browser checks use an isolated Playwright profile, never the user's saved learning records.
- After pushing, verify the GitHub result and check the public Cloudflare release. Report deployment separately from local completion; never claim the public site updated without checking.
