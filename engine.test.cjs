'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('./engine.js');

function run(s, seconds) {
    for (let t = 0; t < seconds - 1e-8; t += .05) E.advance(s, Math.min(.05, seconds - t));
}

test('a real center-line throw reaches two different moving rings and earns a chain', () => {
    const s = E.create();
    E.start(s, true);
    E.launch(s, {angle: -Math.PI / 2, power: .6});
    run(s, 3.7);
    assert.ok(s.hits >= 2, `hits=${s.hits}`);
    assert.ok(s.bestChain >= 2);
    assert.ok(s.score >= 300);
    assert.equal(s.phase, 'aim');
});

test('the same ring cannot score again when the ball returns through it', () => {
    const s = E.create();
    E.start(s, true);
    E.launch(s, {angle: -Math.PI / 2, power: .6});
    const ids = [];
    for (let i = 0; i < 420; i++) {
        E.advance(s, 1 / 120);
        ids.push(...E.drain(s).filter(x => x.type === 'hit').map(x => x.ringId));
    }
    assert.ok(s.hits >= 2);
    assert.equal(new Set(ids).size, ids.length);
    assert.equal(ids.length, s.hits);
});

test('there is an achievable bank-and-chain route, not a decorative scoring claim', () => {
    let found = null;
    for (let a = -2.8; a <= -.3 && !found; a += .04) {
        for (const power of [.35, .6, .85, 1]) {
            const s = E.create();
            E.start(s, true);
            E.launch(s, {angle: a, power});
            run(s, 3.7);
            if (s.bestChain >= 3 && s.lastShot.banks > 0) {
                found = {angle: a, power, score: s.score, hits: s.hits, banks: s.lastShot.banks};
                break;
            }
        }
    }
    assert.ok(found, 'No playable three-ring bank route was found on the shipped board.');
    console.log('REACHABLE_BANK_ROUTE', JSON.stringify(found));
});

test('45-second timer ends once; later input cannot change the result', () => {
    const s = E.create();
    E.start(s);
    run(s, 45.5);
    assert.equal(s.status, 'over');
    assert.equal(s.remaining, 0);
    assert.equal(E.drain(s).filter(x => x.type === 'end').length, 1);
    const score = s.score;
    assert.equal(E.launch(s), false);
    run(s, .5);
    assert.equal(s.score, score);
    assert.equal(E.drain(s).filter(x => x.type === 'end').length, 0);
});

test('pause freezes timer, trajectory and rings; resume continues the same throw', () => {
    const s = E.create();
    E.start(s);
    E.launch(s);
    run(s, .2);
    E.drain(s);
    E.pause(s, true);
    const before = JSON.stringify(s);
    run(s, .8);
    assert.equal(JSON.stringify(s), before);
    assert.equal(E.launch(s), false);
    E.pause(s, false);
    const y = s.ball.y;
    run(s, .1);
    assert.notEqual(s.ball.y, y);
});

test('same seed and input produce identical score/trajectory and reset preserves no prior round', () => {
    function replay() {
        const s = E.create(42);
        E.start(s);
        E.launch(s, {angle: -1.3, power: .8});
        run(s, 4);
        E.launch(s, {angle: -2.4, power: 1});
        run(s, 4);
        return s;
    }

    const a = replay(), b = replay();
    assert.deepEqual(a, b);
    E.start(a);
    assert.equal(a.score, 0);
    assert.equal(a.shots, 0);
    assert.equal(a.hits, 0);
    assert.equal(a.remaining, 45);
    assert.deepEqual(a.rings, E.create(42).rings);
});

test('practice is untimed; switching to a timed round starts cleanly', () => {
    const s = E.create();
    E.start(s, true);
    run(s, 60);
    assert.equal(s.status, 'playing');
    assert.equal(s.remaining, 45);
    E.start(s, false);
    run(s, 1);
    assert.ok(s.remaining < 45);
    assert.equal(s.practice, false);
});

test('trajectory guide uses the playable physics rather than a separate approximate parabola', () => {
    const s = E.create();
    E.start(s, true);
    s.aim = -2.3;
    const points = E.preview(s, .75);
    E.launch(s, {power: .75});
    for (let i = 0; i < 76; i++) {
        E.advance(s, E.C.tick);
        if (i % 5 === 0) {
            const p = points[i / 5];
            assert.ok(Math.hypot(p.x - s.ball.x, p.y - s.ball.y) < 1e-7);
        }
    }
});

test('long-run shot simulation stays finite, bounded and able to return to aiming', () => {
    for (let seed = 0; seed < 24; seed++) {
        const s = E.create(seed);
        E.start(s, true);
        for (let shot = 0; shot < 5; shot++) {
            E.launch(s, {angle: -2.85 + ((seed * 19 + shot * 7) % 100) / 100 * 2.55, power: shot / 4});
            for (let frame = 0; frame < 450; frame++) {
                E.advance(s, E.C.tick);
                if (s.ball) {
                    for (const k of ['x', 'y', 'vx', 'vy']) assert.ok(Number.isFinite(s.ball[k]));
                    assert.ok(s.ball.x >= E.C.left && s.ball.x <= E.C.right);
                }
            }
            assert.equal(s.phase, 'aim');
            assert.equal(s.ball, null);
        }
    }
});

test('invalid time input is rejected without mutating the round', () => {
    const s = E.create();
    E.start(s);
    const before = JSON.stringify(s);
    for (const bad of [NaN, Infinity, -1, 2]) assert.throws(() => E.advance(s, bad), RangeError);
    assert.equal(JSON.stringify(s), before);
});
