# LOOPFORGE · 環鏈工坊

A 45-second replayable booth arcade. Catch a line. Build a chain.

Aim a projectile through moving rings, use wall banks, and reach another ring before the ball falls. Each round ends with a score and a reset option. The project was made for the Event Mini Game theme: a short game that can be played again at a booth.

## Play

[Play in your browser](https://microusada.com/loopforge/) · [Project overview](https://microusada.com/demos/loopforge/?lang=en) · [87.5-second demonstration](https://youtu.be/b4bMbVIORqI)

Open `index.html` in a desktop browser. The game is plain HTML, CSS and JavaScript with no install or build step. Static hosting only needs `index.html`, `styles.css`, `controls.css`, `engine.js`, and `app.js`.

1. Choose **Play 45 seconds**, or **Try without a timer**.
2. Set the visible **Angle** and **Power** sliders, then press **Launch shot**. Slider controls accept keyboard arrow presses.
3. Alternatively aim with the pointer and hold/release to throw. On the focused canvas, Left/Right aims and hold/release Space throws.
4. Catch different rings in one flight to grow the chain: 100, 200, 300... points. Center hits add 50; each earlier wall bank adds 75 to each subsequent catch. A ring scores once per shot.
5. **Pause**, **Restart**, **One more round**, and practice-to-**45s round** use the real game state. P pauses and Esc cancels charging. Hiding the tab pauses the game.

The dotted guide uses the same ball-motion code as play; the targets continue to move. Optional procedural sound starts off. The game has no account, runtime API, model call, player upload, cookies or local-storage record. Its session-best number exists in page memory. A hosting service can separately process normal request metadata.

## Design and originality

A short event-booth visit calls for a visible goal, a short score chase and a clean reset. LOOPFORGE uses aim, power and a second-ring decision to create that loop. Practice removes the clock. This is a design aim, not evidence of human usability, enjoyment, endurance or training benefit.

The concept, implementation, code-drawn artwork and oscillator sound code were newly generated for this project with OpenAI Codex at the user's direction. Earlier local game descriptions were compared for overlap; their code, assets and levels were not reused. That is a bounded provenance statement rather than a global novelty or trademark-clearance claim.

## Actual production roles

OpenAI Codex generated the concept, game code, visual/sound code, tests and documentation. Codex also operated normal visible game controls through Chrome extension during the recorded demonstration. The recorder copied actual canvas pixels and visible HUD text; it did not drive gameplay or generate the score.

IntelliJ IDEA 2026.3 supplied real formatting and static analysis, and Node ran the tests. See [AI and recording disclosure](AI_DISCLOSURE.md) and [actual JetBrains work](TOOLING.md).

## Verification and demonstration

The existing post-IntelliJ revision passed ten core tests under Node v24.14.0. Run them with:

```text
node --test engine.test.cjs
```

The engine is shared with the browser. Tests cover scoring and reachable banks, duplicate-hit prevention, timer/result locking, pause/resume, deterministic replay/reset, practice, shared preview physics and bounded repeated shots.

A Chrome-extension UI run recorded a real first throw reaching two rings for 300 points, pause at 36 game seconds, resume, a second miss, a natural 300-point result and reset to 0 points/45 seconds. An earlier 375px review is separate evidence. Real touch hardware, audio listening and sustained event use have not been established by these checks.

The demonstration is an **87.50-second silent English-captioned video**, composed from actual game canvas pixels and live visible-DOM HUD text. It removes only paused/result waiting, explicitly holds an actual reset frame for readability, and adds tool/AI-role cards. Decoding, sampled-frame inspection, normal browser playback and seeking were checked; this does not imply continuous human inspection of every frame. This public edition changes surrounding HTML labels/navigation from the recorded source while retaining its gameplay and control code.

## Source and license

All runtime source, drawing and sound code is included. The [MIT License](LICENSE) applies to this supplied project. No third-party runtime libraries, external fonts, sampled audio, game datasets, Riot assets or sponsor logos are bundled. JetBrains is a development tool and is not redistributed.

`package.json` uses `private: true` to guard against accidental package-registry publication; the source license remains MIT. The supplied inspection profile supports reproducing the development analysis. The project does not implement a separate-screen leaderboard, multiplayer, coaching analytics or a measured esports-training system.
