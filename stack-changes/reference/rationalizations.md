# Common Rationalizations

| Rationalization | Reality |
|---|---|
| "It's all one feature — splitting is artificial" | The feature is one thing; the refactor that *enables* it is another. Ship them as separate changes. |
| "Smaller is always better — split it as far as it goes" | Below the single-concern threshold it's worse: more changes means more review round-trips, CI runs, and rebases, plus a reviewer who must read the whole stack to understand change 1. Right-size, don't minimize. |
| "It's a big change, so it should become many PRs" | A big change means *find the natural seams* — usually few. Line count is the symptom; concerns are the unit. One cohesive 400-line change beats five fragments that only make sense together. |
| "Reviewers can follow a big change" | They LGTM it instead of reviewing it. Small, single-purpose changes get real scrutiny. |
| "My commits are atomic, so one big PR is fine" | The reviewer opens the *whole diff*, not your commit list. Atomic commits aren't atomic reviews — split the reviewable unit into a stack. |
| "Splitting just makes the reviewer wait on a chain" | The opposite: small changes hit the one-day-review bar and stack, so you keep moving. It's the megachange that stalls for days. |
| "Our monorepo tooling handles big changes fine" | Tooling moves bytes; it doesn't make a 900-line diff reviewable or a wide presubmit cheap. Review quality and CI cost still scale with size. |
| "Stacking adds review overhead" | Native stacking tools make a stack *cheaper* than re-reviewing one megachange every time it changes. The overhead is in the megachange. |
| "I'll split it after it's approved" | Split *before* submitting. Splitting after approval is just unsquashing in reverse, with no review benefit. |
| "The refactor is small enough to include with the feature" | Then it's small enough to be its own quick change. Mixed refactor+feature makes both harder to verify. |
| "It's a 3,000-file rename, splitting is hopeless" | That's an LSC: codemod + auto-generated small changes, not a hand-built stack. |
