Your portfolio files live here. This folder is committed to Git, so Vercel receives them.
Exact paths (they are referenced from src/data/portfolioData.js):

    profile/profile.png
    resume/SRIRAM_T.pdf
    sports/sports-national.jpg
    sports/sports-international.jpg
    sports/sports-running.jpg

Do NOT put these in the repo-root public/assets: that folder is generated and git-ignored.
`npm run build` fails with a clear message if any referenced file is missing or has the wrong capitalisation.
