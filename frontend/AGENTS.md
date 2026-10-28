<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Route flow: / (5s intro) -> /lobby -> /auth -> /_authenticated/dashboard; protected pages live under src/routes/_authenticated so the gate covers them.
- Glass/neon look comes from shared utilities in src/styles.css (glass, neon-btn, neon-border, hover-lift); reuse them instead of per-component styles so the look stays consistent.
