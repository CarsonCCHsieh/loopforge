/* LOOPFORGE — original deterministic game core. No runtime dependencies. */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.Loopforge = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    const C = Object.freeze({
        width: 760, height: 600, anchorX: 380, anchorY: 524,
        left: 24, right: 736, top: 48, floor: 558, radius: 7, gravity: 430,
        duration: 45, maxFlight: 3.2, tick: 1 / 120
    });
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

    function random(seed) {
        let n = seed >>> 0;
        return function () {
            n += 0x6d2b79f5;
            let t = n;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }

    function board(seed, shot) {
        const rng = random((seed + shot * 99991) >>> 0);
        const points = [[207, 162], [380, 126], [553, 162], [150, 305], [380, 291], [610, 305]];
        return points.map(([x, y], id) => ({
            id, x: x + (rng() - .5) * 18,
            y: y + (rng() - .5) * 14, phase: rng() * Math.PI * 2, hit: false
        }));
    }

    function create(seed = 20261119) {
        return {
            seed: seed >>> 0, status: 'intro', practice: false, paused: false,
            elapsed: 0, remaining: C.duration, phase: 'aim', aim: -Math.PI / 2,
            score: 0, shots: 0, hits: 0, bestChain: 0, banks: 0,
            ball: null, cooldown: 0, rings: board(seed, 0), events: [], lastShot: null
        };
    }

    function start(s, practice = false) {
        const fresh = create(s.seed);
        Object.assign(s, fresh, {status: 'playing', practice: !!practice});
        s.events.push({type: 'start', practice: s.practice});
        return s;
    }

    function ringPosition(r, elapsed) {
        return {
            x: r.x + Math.sin(elapsed * .86 + r.phase) * 13,
            y: r.y + Math.cos(elapsed * .71 + r.phase) * 6
        };
    }

    function setAim(s, x, y) {
        if (!Number.isFinite(x) || !Number.isFinite(y)) return;
        setAngle(s, Math.atan2(Math.min(-35, y - C.anchorY), x - C.anchorX));
    }

    function setAngle(s, angle) {
        if (Number.isFinite(angle)) s.aim = clamp(angle, -2.89, -.25);
    }

    function initialBall(angle, power) {
        const speed = 650 + clamp(power, 0, 1) * 350;
        return {
            x: C.anchorX, y: C.anchorY, vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed, age: 0, banks: 0, chain: 0, hitIds: [], earned: 0
        };
    }

    function launch(s, options = {}) {
        if (s.status !== 'playing' || s.paused || s.phase !== 'aim') return false;
        const a = Number.isFinite(options.angle) ? clamp(options.angle, -2.89, -.25) : s.aim;
        const p = Number.isFinite(options.power) ? clamp(options.power, 0, 1) : .6;
        s.ball = initialBall(a, p);
        s.phase = 'flight';
        s.shots += 1;
        s.events.push({type: 'launch'});
        return true;
    }

    function moveBall(b, dt) {
        b.age += dt;
        b.vy += C.gravity * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        let bounce = false;
        if (b.x < C.left + C.radius) {
            b.x = C.left + C.radius;
            b.vx = Math.abs(b.vx) * .96;
            bounce = true;
        }
        if (b.x > C.right - C.radius) {
            b.x = C.right - C.radius;
            b.vx = -Math.abs(b.vx) * .96;
            bounce = true;
        }
        if (b.y < C.top + C.radius) {
            b.y = C.top + C.radius;
            b.vy = Math.abs(b.vy) * .87;
            bounce = true;
        }
        if (bounce) b.banks += 1;
        return bounce;
    }

    function segmentDistance(px, py, ax, ay, bx, by) {
        const dx = bx - ax, dy = by - ay, den = dx * dx + dy * dy;
        const t = den ? clamp(((px - ax) * dx + (py - ay) * dy) / den, 0, 1) : 0;
        return Math.hypot(px - ax - t * dx, py - ay - t * dy);
    }

    function finishShot(s) {
        const b = s.ball;
        s.lastShot = {chain: b.chain, banks: b.banks, earned: b.earned};
        s.banks += b.banks;
        s.events.push({type: 'shotEnd', ...s.lastShot});
        s.ball = null;
        s.phase = 'cooldown';
        s.cooldown = .42;
    }

    function tick(s, dt) {
        if (s.status !== 'playing' || s.paused) return;
        s.elapsed += dt;
        if (!s.practice) {
            s.remaining = Math.max(0, C.duration - s.elapsed);
            if (s.remaining <= 1e-8) {
                s.remaining = 0;
                s.status = 'over';
                s.ball = null;
                s.events.push({type: 'end', score: s.score});
                return;
            }
        }
        if (s.phase === 'cooldown') {
            s.cooldown -= dt;
            if (s.cooldown <= 0) {
                s.phase = 'aim';
                s.rings = board(s.seed, s.shots);
            }
            return;
        }
        if (!s.ball) return;
        const b = s.ball, oldX = b.x, oldY = b.y;
        if (moveBall(b, dt)) s.events.push({type: 'bank', x: b.x, y: b.y});
        for (const r of s.rings) {
            if (r.hit) continue;
            const p = ringPosition(r, s.elapsed);
            const distance = segmentDistance(p.x, p.y, oldX, oldY, b.x, b.y);
            if (distance <= 29 + C.radius) {
                r.hit = true;
                b.hitIds.push(r.id);
                b.chain += 1;
                s.hits += 1;
                const perfect = distance <= 11;
                const points = 100 * b.chain + (perfect ? 50 : 0) + b.banks * 75;
                b.earned += points;
                s.score += points;
                s.bestChain = Math.max(s.bestChain, b.chain);
                s.events.push({
                    type: 'hit',
                    ringId: r.id,
                    x: p.x,
                    y: p.y,
                    points,
                    chain: b.chain,
                    perfect,
                    banks: b.banks
                });
            }
        }
        if (b.y > C.floor || b.age >= C.maxFlight || b.hitIds.length === s.rings.length) finishShot(s);
    }

    function advance(s, seconds) {
        if (!Number.isFinite(seconds) || seconds < 0 || seconds > 1) throw new RangeError('Advance requires 0–1 seconds.');
        let left = seconds;
        while (left > 1e-10) {
            const dt = Math.min(C.tick, left);
            tick(s, dt);
            left -= dt;
        }
        return s;
    }

    function pause(s, value = !s.paused) {
        if (s.status !== 'playing') return false;
        s.paused = !!value;
        return s.paused;
    }

    function preview(s, power = .6) {
        const b = initialBall(s.aim, power), points = [];
        for (let i = 0; i < 240 && b.y <= C.floor; i += 1) {
            moveBall(b, C.tick);
            if (i % 5 === 0) points.push({x: b.x, y: b.y, bank: b.banks});
        }
        return points;
    }

    function drain(s) {
        const events = s.events;
        s.events = [];
        return events;
    }

    return {C, create, start, setAim, setAngle, launch, advance, pause, preview, ringPosition, drain};
});
