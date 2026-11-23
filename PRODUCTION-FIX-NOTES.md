# Production fix notes

## Root causes
1. Your real images and resume sat in the repo-root `public/assets/`, which `.gitignore` excludes, so they were never pushed
   to GitHub and Vercel never had them. They now live in `universe/public/assets/` (tracked). The build copies them to `/assets/`.
2. The resume file was named `SRIRAM  T.pdf` (two spaces) but the data points to `SRIRAM_T.pdf`. Renamed (bytes unchanged).
3. The workstation Resume button linked to `/assets/resume.pdf`, which never existed. It now uses `src/config.js` (`RESUME_URL`).
4. The committed `portfolioData.js` on GitHub still has the old paths; your corrected paths were uncommitted. Commit them.
5. Skills 3D scene crashed (`reading 'toArray'`) after the data edit renamed LLM -> LLMs and SLM -> SLMs.
   `universe/src/scenes/SkillsScene.jsx` now skips skill pairs missing from the data (the only Universe code change).

## Changed / added files
    CHANGED  .gitignore (comment only), README.md, package.json (build runs the verifier; test script), scripts/build-universe.mjs
             (README no longer published), src/App.jsx (resume link), universe/src/scenes/SkillsScene.jsx,
             universe/public/assets/README.md (docs)
    ADDED    src/config.js, scripts/verify-assets.mjs, tests/assets.test.mjs,
             universe/public/assets/profile/profile.png, universe/public/assets/resume/SRIRAM_T.pdf,
             universe/public/assets/sports/sports-{national,international,running}.jpg
Not changed: universe/src/data/portfolioData.js and src/data/screenData.js (your content).

## Needs your decision (npm test fails on this, the build does not)
The workstation's left monitor (src/data/screenData.js) and your Universe data now disagree:
Edu Tantr "August 2025 - October 2025" vs "90 Days"; Bluestock "July 2025 - August 2025" vs "July 2026 - August 2026";
Emglitz "December 2024 - January 2025" vs "30 Days"; CodeBind "July 2023" vs "15 Days". Decide which is correct and edit one file.

## Commit and deploy
    npm install
    npm run build        # real Vite build; also runs the asset verifier
    git add -A && git status    # the PDF and 4 images must be listed
    git commit -m "Fix production assets, resume path and Skills scene crash"
    git push
Then open /assets/resume/SRIRAM_T.pdf and /assets/profile/profile.png on the live domain and test the Universe on a real phone.
