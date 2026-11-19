# Recorded JetBrains development work

IntelliJ IDEA **2026.3 / IU-263.7307.200** ran as a real background IDE against the game's source on 2026-11-19. Its official formatter and project inspector were used; Codex reviewed the findings and made the edits. No human IDE GUI editing/debugging or JetBrains AI use is claimed.

## Provenance and free feature scope

The official Windows ZIP was 1,674,576,889 bytes. Its complete SHA-256 matched the [official checksum](https://download.jetbrains.com/idea/idea-2026.3.win.zip.sha256):

`42265a4a25cac579aaa4690bb3553f4b034d42282ecaea571818e611f66fbb35`

[Official free JS/TS support](https://blog.jetbrains.com/idea/2026/03/js-ts-free-support/) includes JavaScript, TypeScript, HTML and CSS analysis/inspections from 2026.1 onward. The unified product documents an initial evaluation; these language features are also in the continuing free set. No account, paid activation, subscription, renewal or trial code was used for this development workflow. The IDE/JBR is not bundled with the game.

## Real work, not a clean-scan claim

| Development run | Exit | Recorded outcome |
|---|---:|---|
| Before inspection | 0 | 82 findings |
| Before format check | 1 | Seven files required formatting |
| Apply formatting | 0 | Seven files formatted |
| After format check | 0 | 7/7 well formed |
| After inspection | 0 | 59 findings, classified |

The formatter processed the two JavaScript files, the CJS test, both CSS files, HTML and package JSON. The supplied `loopforge-inspections.xml` enabled nine selected verified JavaScript inspections alongside inherited defaults.

Codex explicitly defaulted an optional circle stroke to null, renamed the ambiguous DOM helper to `byId` at 48 calls, and removed an unused public geometry-helper export while retaining its internal collision use. These changes removed eight signature, sixteen jQuery-selector and one unused-export findings. They are interface/clarity improvements, not a fabricated runtime-bug repair.

The remaining findings comprised 55 CommonJS/test-module environment references, one optional legacy WebAudio fallback property, two fractional CSS pixel lengths and a documentation grammar suggestion. The independent Node runtime then passed all ten existing tests.

These numbers record the actual development revision. Later public HTML labels/navigation and documentation are a separate edition; the historical results are not presented as a fresh scan of this repository snapshot.

## Reproduction forms

With a compatible IntelliJ installation:

```text
idea64.exe format -dry -allowDefaults app.js engine.js engine.test.cjs styles.css controls.css index.html package.json
idea64.exe inspect . loopforge-inspections.xml inspection-output -format json -v2
```

See the official [formatter](https://www.jetbrains.com/help/idea/command-line-formatter.html), [inspector](https://www.jetbrains.com/help/idea/command-line-code-inspector.html) and [activation](https://www.jetbrains.com/help/idea/register.html) documentation.

The completed runs used isolated local settings/cache/log directories and standard headless mode. They generated local caches/settings and short-lived internal services, then shut down normally. The log reported no enabled external statistics uploader; this is not a packet-level assertion of zero network metadata. Only this factual summary and the profile are supplied.

Codex authored/edited and operated the recorded browser UI; IntelliJ analysed/formatted; Node tested. The video is edited real-canvas/live-HUD footage with that division of roles, not fabricated IDE footage or independently human-played game footage.
