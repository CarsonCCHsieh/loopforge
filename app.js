(function () {
    'use strict';
    const E = window.Loopforge, C = E.C;
    const byId = id => document.getElementById(id);
    const canvas = byId('field'), ctx = canvas.getContext('2d');
    const state = E.create();
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let charge = null, lastFrame = performance.now(), visualTime = 0;
    let particles = [], labels = [], trail = [], best = 0, sound = false, audio = null;
    const palette = ['#79dfcf', '#d9ff67', '#ffb380'];

    function say(text) {
        byId('live').textContent = text;
    }

    function selectedPower() {
        return Number(byId('power-level').value) / 100;
    }

    function power() {
        return charge ? Math.min(1, selectedPower() + (performance.now() - charge.start) / 1400) : selectedPower();
    }

    function resize() {
        const ratio = Math.min(2, window.devicePixelRatio || 1);
        canvas.width = C.width * ratio;
        canvas.height = C.height * ratio;
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    function sync() {
        byId('score').textContent = String(state.score).padStart(4, '0');
        byId('chain').innerHTML = state.bestChain + '<span>×</span>';
        byId('clock').textContent = state.practice ? '∞' : String(Math.ceil(state.remaining)).padStart(2, '0');
        byId('clock-label').textContent = state.practice ? 'PRACTICE' : 'SECONDS';
        byId('clock').parentElement.classList.toggle('urgent', !state.practice && state.remaining < 10);
        byId('pause').disabled = state.status !== 'playing';
        byId('pause').innerHTML = (state.paused ? 'Resume' : 'Pause') + ' <kbd>P</kbd>';
        byId('pause-screen').hidden = !state.paused;
        byId('timed').hidden = !state.practice || state.status !== 'playing';
        byId('power-label').textContent = state.status === 'over' ? 'ROUND COMPLETE' : charge ? 'HOLD → RELEASE' : state.phase === 'flight' ? 'SHOT IN FLIGHT' : 'READY TO THROW';
        byId('power-fill').style.width = Math.round(power() * 100) + '%';
        const ready = state.status === 'playing' && !state.paused && state.phase === 'aim';
        byId('fire').disabled = !ready;
        byId('angle').disabled = !ready;
        byId('power-level').disabled = !ready;
        byId('restart').disabled = state.status === 'intro';
        byId('angle').value = Math.round(state.aim * 180 / Math.PI);
        byId('angle-value').textContent = Math.round(state.aim * 180 / Math.PI) + '°';
        byId('power-value').textContent = Math.round(power() * 100) + '%';
    }

    function start(practice = false) {
        charge = null;
        trail = [];
        particles = [];
        labels = [];
        E.start(state, practice);
        E.drain(state);
        byId('splash').hidden = true;
        byId('results').hidden = true;
        byId('shot-message').textContent = practice ? 'No timer. Find a bank shot, then try a 45s round.' : 'Find your line. Hold and release to throw.';
        canvas.focus({preventScroll: true});
        sync();
        say(practice ? 'Practice started, no timer.' : '45-second round started.');
    }

    function togglePause(value) {
        if (state.status !== 'playing') return;
        charge = null;
        E.pause(state, value === undefined ? !state.paused : value);
        sync();
        if (state.paused) byId('resume').focus({preventScroll: true}); else canvas.focus({preventScroll: true});
        say(state.paused ? 'Paused. Time and ball are stopped.' : 'Resumed.');
    }

    function begin(kind) {
        if (state.status !== 'playing' || state.paused || state.phase !== 'aim' || charge) return;
        charge = {start: performance.now(), kind};
        sync();
    }

    function release(kind) {
        if (!charge || charge.kind !== kind) return;
        const p = power();
        charge = null;
        shoot(p);
    }

    function shoot(p = selectedPower()) {
        if (E.launch(state, {power: p})) {
            trail = [];
            byId('shot-message').textContent = 'Watch the second ring.';
        }
        sync();
        consumeEvents();
    }

    function point(event) {
        const r = canvas.getBoundingClientRect();
        return {x: (event.clientX - r.left) * C.width / r.width, y: (event.clientY - r.top) * C.height / r.height};
    }

    canvas.addEventListener('pointerdown', event => {
        if (event.button !== 0 && event.pointerType === 'mouse') return;
        if (state.status !== 'playing' || state.paused || state.phase !== 'aim') return;
        event.preventDefault();
        canvas.focus({preventScroll: true});
        const p = point(event);
        E.setAim(state, p.x, p.y);
        begin('pointer');
        canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener('pointermove', event => {
        if (state.phase !== 'aim' || state.paused) return;
        const p = point(event);
        E.setAim(state, p.x, p.y);
    });
    canvas.addEventListener('pointerup', event => {
        if (charge && charge.kind === 'pointer') {
            const p = point(event);
            E.setAim(state, p.x, p.y);
            release('pointer');
        }
        if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    });
    canvas.addEventListener('pointercancel', () => {
        charge = null;
        sync();
    });
    canvas.addEventListener('keydown', event => {
        if (['ArrowLeft', 'ArrowRight', ' ', 'Escape'].includes(event.key)) event.preventDefault();
        if (event.key === 'ArrowLeft' && state.phase === 'aim') E.setAngle(state, state.aim - .065);
        if (event.key === 'ArrowRight' && state.phase === 'aim') E.setAngle(state, state.aim + .065);
        if (event.key === ' ' && !event.repeat) begin('keyboard');
        if (event.key === 'Escape') {
            charge = null;
            sync();
        }
    });
    document.addEventListener('keyup', event => {
        if (event.key === ' ') release('keyboard');
    });
    document.addEventListener('keydown', event => {
        if (event.key.toLowerCase() === 'p' && !event.repeat && !event.ctrlKey && !event.metaKey && !event.altKey) togglePause();
    });
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && state.status === 'playing' && !state.paused) togglePause(true);
    });
    window.addEventListener('blur', () => {
        charge = null;
        sync();
    });
    byId('start').addEventListener('click', () => start(false));
    byId('practice').addEventListener('click', () => start(true));
    byId('retry').addEventListener('click', () => start(false));
    byId('end-practice').addEventListener('click', () => start(true));
    byId('timed').addEventListener('click', () => start(false));
    byId('angle').addEventListener('input', () => {
        E.setAngle(state, Number(byId('angle').value) * Math.PI / 180);
        sync();
    });
    byId('power-level').addEventListener('input', sync);
    byId('fire').addEventListener('click', () => shoot());
    byId('restart').addEventListener('click', () => start(state.practice));
    byId('pause').addEventListener('click', () => togglePause());
    byId('resume').addEventListener('click', () => togglePause(false));
    byId('sound').addEventListener('click', async () => {
        sound = !sound;
        if (sound) {
            try {
                audio ||= new (window.AudioContext || window.webkitAudioContext)();
                await audio.resume();
            } catch (_) {
                sound = false;
            }
        }
        byId('sound').textContent = sound ? 'Sound on' : 'Sound off';
        byId('sound').setAttribute('aria-pressed', String(sound));
        if (sound) tone(540, .08);
    });

    function tone(frequency, length = .06) {
        if (!sound || !audio) return;
        const osc = audio.createOscillator(), gain = audio.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, audio.currentTime);
        gain.gain.setValueAtTime(.0001, audio.currentTime);
        gain.gain.exponentialRampToValueAtTime(.07, audio.currentTime + .006);
        gain.gain.exponentialRampToValueAtTime(.0001, audio.currentTime + length);
        osc.connect(gain);
        gain.connect(audio.destination);
        osc.start();
        osc.stop(audio.currentTime + length + .01);
    }

    function consumeEvents() {
        for (const event of E.drain(state)) {
            if (event.type === 'launch') tone(220, .045);
            if (event.type === 'bank') tone(280, .035);
            if (event.type === 'hit') {
                tone(430 + event.chain * 110, .085);
                labels.push({x: event.x, y: event.y, text: '+' + event.points, life: 1.0});
                if (!reducedMotion.matches) for (let i = 0; i < 11; i++) {
                    const angle = i / 11 * Math.PI * 2;
                    particles.push({
                        x: event.x,
                        y: event.y,
                        vx: Math.cos(angle) * 75,
                        vy: Math.sin(angle) * 75,
                        life: .45
                    });
                }
                const text = (event.perfect ? 'CENTER HIT · ' : '') + 'CHAIN ' + event.chain + (event.banks ? ' · BANK BONUS' : '') + ' · +' + event.points;
                byId('shot-message').textContent = text;
                say(text + '. Score ' + state.score + '.');
            }
            if (event.type === 'shotEnd') {
                byId('shot-message').textContent = event.chain ? event.chain + ' rings · +' + event.earned + '. Find your next line.' : 'A fresh throw is ready. Try a steeper angle.';
            }
            if (event.type === 'end') {
                charge = null;
                best = Math.max(best, state.score);
                byId('rank').textContent = state.score >= 4500 ? 'You found the flow.' : state.score >= 2000 ? 'A chain worth chasing.' : 'A good spark.';
                byId('final-score').textContent = state.score.toLocaleString('en-US');
                byId('final-summary').textContent = state.hits + ' rings · best chain ' + state.bestChain + ' · ' + state.shots + ' shots. Session best: ' + best.toLocaleString('en-US') + '.';
                byId('results').hidden = false;
                byId('retry').focus({preventScroll: true});
                say('Round over. ' + state.score + ' points. Best chain ' + state.bestChain + '.');
            }
        }
    }

    function circle(x, y, radius, fill, stroke = null, width = 1) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        if (fill) {
            ctx.fillStyle = fill;
            ctx.fill();
        }
        if (stroke) {
            ctx.strokeStyle = stroke;
            ctx.lineWidth = width;
            ctx.stroke();
        }
    }

    function draw() {
        ctx.clearRect(0, 0, C.width, C.height);
        ctx.fillStyle = '#1c2b2d';
        ctx.fillRect(0, 0, C.width, C.height);
        ctx.fillStyle = '#365052';
        for (let x = 20; x < C.width; x += 30) for (let y = 20; y < C.height; y += 30) {
            ctx.globalAlpha = .42;
            ctx.fillRect(x, y, 1.3, 1.3);
        }
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#56746e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(24, 112);
        ctx.lineTo(24, 420);
        ctx.moveTo(736, 112);
        ctx.lineTo(736, 420);
        ctx.stroke();
        ctx.fillStyle = '#90a59a';
        ctx.font = '10px monospace';
        ctx.fillText('FIELD / 01', 30, 28);
        ctx.textAlign = 'right';
        ctx.fillText(state.practice ? 'PRACTICE — NO CLOCK' : 'FIND THE SECOND RING', 730, 28);
        ctx.textAlign = 'left';
        const t = state.status === 'intro' ? visualTime * .45 : state.elapsed;
        for (const r of state.rings) {
            const p = E.ringPosition(r, t), color = palette[r.id % palette.length];
            if (r.hit) {
                circle(p.x, p.y, 6, '#50665b');
                continue;
            }
            circle(p.x, p.y, 35, color + '08', color + '20');
            circle(p.x, p.y, 29, '#1d2c2b', color, 3);
            circle(p.x, p.y, 10, color + '13', color + '65');
            circle(p.x, p.y, 3, color);
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x - 41, p.y);
            ctx.lineTo(p.x - 35, p.y);
            ctx.moveTo(p.x + 35, p.y);
            ctx.lineTo(p.x + 41, p.y);
            ctx.stroke();
        }
        if (state.phase === 'aim' && !state.paused && state.status !== 'over') {
            const path = E.preview(state, power());
            path.forEach((p, i) => circle(p.x, p.y, i < 4 ? 2.7 : 2, '#d9ff67' + Math.max(20, Math.round(150 * (1 - i / path.length))).toString(16).padStart(2, '0')));
            ctx.strokeStyle = '#d9ff67';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(C.anchorX, C.anchorY);
            ctx.lineTo(C.anchorX + Math.cos(state.aim) * 37, C.anchorY + Math.sin(state.aim) * 37);
            ctx.stroke();
        }
        if (!reducedMotion.matches) trail.forEach((p, i) => circle(p.x, p.y, 2 + i / trail.length * 4, '#d9ff67' + Math.round(i / trail.length * 100).toString(16).padStart(2, '0')));
        if (state.ball) {
            ctx.shadowBlur = 16;
            ctx.shadowColor = '#d9ff67';
            circle(state.ball.x, state.ball.y, 7, '#f3ffc8');
            ctx.shadowBlur = 0;
        }
        ctx.strokeStyle = '#648577';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(C.anchorX - 40, C.anchorY + 17);
        ctx.lineTo(C.anchorX + 40, C.anchorY + 17);
        ctx.stroke();
        circle(C.anchorX, C.anchorY, 20, '#203832', '#597365', 1);
        circle(C.anchorX, C.anchorY, 12, state.phase === 'aim' ? '#d9ff67' : '#5d7360');
        circle(C.anchorX, C.anchorY, 4, '#1e3027');
        particles.forEach(p => {
            ctx.globalAlpha = Math.max(0, p.life / .45);
            circle(p.x, p.y, 2.5, '#d9ff67');
        });
        labels.forEach(p => {
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillStyle = '#f4ffd7';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(p.text, p.x, p.y - (1 - p.life) * 38);
        });
        ctx.globalAlpha = 1;
        ctx.textAlign = 'left';
    }

    function frame(now) {
        const dt = Math.min(.05, Math.max(0, (now - lastFrame) / 1000));
        lastFrame = now;
        visualTime += dt;
        E.advance(state, dt);
        consumeEvents();
        if (!state.paused) {
            if (state.ball) {
                trail.push({x: state.ball.x, y: state.ball.y});
                if (trail.length > 30) trail.shift();
            } else trail = [];
            particles.forEach(p => {
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.life -= dt;
            });
            labels.forEach(p => {
                p.life -= dt;
            });
            particles = particles.filter(p => p.life > 0);
            labels = labels.filter(p => p.life > 0);
        }
        sync();
        draw();
        requestAnimationFrame(frame);
    }

    window.addEventListener('resize', resize);
    resize();
    sync();
    draw();
    requestAnimationFrame(frame);
})();
