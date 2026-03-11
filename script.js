/* ═══════════════════════════════════════════════════════════════
   COGNI v4.0 — COMPLETE REWRITE
   All bugs fixed · Premium design · Claude streaming
   ═══════════════════════════════════════════════════════════════ */

const CLAUDE_KEY = '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';

const state = {
    currentUser: null,
    chatHistory: [],
    breathRunning: false,
    selectedMood: 3,
    sortSorted: false,
    mouseX: 0,
    mouseY: 0,
    scrollY: 0,
    chatUserScrolled: false,
};

const $ = id => document.getElementById(id);
const raf = requestAnimationFrame;
const rand = (a, b) => Math.random() * (b - a) + a;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp = (a, b, t) => a + (b - a) * t;
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ── TOAST ── */
function showToast(msg) {
    const t = $('sysToast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._t);
    t._t = setTimeout(() => t.classList.remove('show'), 3000);
}

window.togglePwd = function (id, btn) {
    const inp = $(id); if (!inp) return;
    inp.type = inp.type === 'password' ? 'text' : 'password';
    btn.innerHTML = inp.type === 'password'
        ? `<svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="1.5" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`
        : `<svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="1.5" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
};

/* ════════════════════════
   CURSOR
   ════════════════════════ */
function initCursor() {
    const ring = $('cursorRing');
    const dots = Array.from({ length: 10 }, (_, i) => $('cd' + i));
    const N = dots.length;
    const pos = Array.from({ length: N }, () => ({ x: window.innerWidth / 2, y: window.innerHeight / 2 }));
    let mx = pos[0].x, my = pos[0].y;
    let ringX = mx, ringY = my, ringScale = 1, targetScale = 1;
    const lerps = [1, 0.82, 0.68, 0.56, 0.46, 0.37, 0.30, 0.23, 0.18, 0.13];

    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

    (function loop() {
        raf(loop);
        pos[0].x += (mx - pos[0].x) * lerps[0];
        pos[0].y += (my - pos[0].y) * lerps[0];
        for (let i = 1; i < N; i++) {
            pos[i].x += (pos[i - 1].x - pos[i].x) * lerps[i];
            pos[i].y += (pos[i - 1].y - pos[i].y) * lerps[i];
        }
        dots.forEach((d, i) => {
            if (!d) return;
            d.style.transform = `translate3d(${pos[i].x}px,${pos[i].y}px,0) translate(-50%,-50%)`;
            d.style.opacity = (0.9 - i * 0.08).toFixed(2);
        });
        ringX += (mx - ringX) * 0.1;
        ringY += (my - ringY) * 0.1;
        ringScale += (targetScale - ringScale) * 0.12;
        if (ring) ring.style.transform = `translate3d(${ringX}px,${ringY}px,0) translate(-50%,-50%) scale(${ringScale})`;
    })();

    document.addEventListener('mouseover', e => {
        if (!ring) return;
        if (e.target.closest('a,button,.tcard,.dsa-card,.wheel-petal,.dist-card,.med-sound-btn,.med-dur-btn,.habit-check,.crisis-card')) {
            ring.classList.add('hov'); targetScale = 1.5;
        }
        if (e.target.closest('input,textarea')) { ring.classList.add('txt'); targetScale = 0.7; }
    });
    document.addEventListener('mouseout', e => {
        if (!ring) return;
        if (e.target.closest('a,button,.tcard,.dsa-card,.wheel-petal,.dist-card,.med-sound-btn,.med-dur-btn,.habit-check,.crisis-card')) {
            ring.classList.remove('hov'); targetScale = 1;
        }
        if (e.target.closest('input,textarea')) { ring.classList.remove('txt'); targetScale = 1; }
    });
    document.addEventListener('mousedown', () => { targetScale = 0.8; ring && ring.classList.add('ck'); });
    document.addEventListener('mouseup', () => { targetScale = 1; ring && ring.classList.remove('ck'); });
}

/* ════════════════════════
   LOADER
   ════════════════════════ */
function startLoader() {
    const loaderEl = $('loaderScreen');
    if (!loaderEl) { showSplash(); return; }
    loaderEl.style.display = 'flex';
    requestAnimationFrame(() => { loaderEl.style.opacity = '1'; });

    const texts = ['CALIBRATING NEURAL ARCHITECTURE', 'MAPPING THOUGHT PATHWAYS', 'INITIALIZING AWARENESS ENGINE'];
    let textIdx = 0;
    const textEl = $('loaderText');

    function typeText(str) {
        if (!textEl) return;
        textEl.style.opacity = '0';
        setTimeout(() => {
            textEl.textContent = '';
            textEl.style.transition = 'opacity .3s';
            textEl.style.opacity = '1';
            let i = 0;
            const t = setInterval(() => { textEl.textContent += str[i++]; if (i >= str.length) clearInterval(t); }, 28);
        }, 200);
    }

    let progress = 0;
    const numEl = $('loaderNum'), barEl = $('loaderBar');
    typeText(texts[0]);

    let last = performance.now();
    function tick(now) {
        const dt = Math.min((now - last) / 16.67, 3); last = now;
        progress = Math.min(progress + rand(0.3, 1.6) * (1 - progress / 120) * dt, 100);
        const fl = Math.floor(progress);
        if (numEl) numEl.textContent = fl.toString().padStart(2, '0');
        if (barEl) barEl.style.width = progress + '%';
        if (progress >= 33 && textIdx === 0) { textIdx = 1; typeText(texts[1]); }
        if (progress >= 66 && textIdx === 1) { textIdx = 2; typeText(texts[2]); }
        if (progress < 100) { raf(tick); }
        else {
            setTimeout(() => {
                burstLoader(() => {
                    loaderEl.style.transition = 'opacity .8s ease';
                    loaderEl.style.opacity = '0';
                    setTimeout(() => { loaderEl.style.display = 'none'; showSplash(); }, 800);
                });
            }, 300);
        }
    }
    raf(tick);
}

function burstLoader(cb) {
    const canvas = $('loaderBurst');
    if (!canvas) { setTimeout(cb, 400); return; }
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    const particles = Array.from({ length: 90 }, (_, i) => {
        const angle = (i / 90) * Math.PI * 2 + rand(-0.1, 0.1), speed = rand(3, 9);
        return {
            x: cx, y: cy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
            life: 1, decay: rand(0.018, 0.03), size: rand(1.5, 3.5), hue: rand(28, 48)
        };
    });
    let done = false;
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;
        particles.forEach(p => {
            p.x += p.vx; p.y += p.vy; p.vy += 0.13; p.vx *= 0.975; p.life -= p.decay;
            if (p.life > 0) {
                alive = true;
                ctx.globalAlpha = Math.pow(p.life, 1.4);
                ctx.fillStyle = `hsl(${p.hue},42%,72%)`;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); ctx.fill();
            }
        });
        ctx.globalAlpha = 1;
        if (alive) raf(draw);
        else if (!done) { done = true; cb(); }
    }
    draw();
    setTimeout(() => { if (!done) { done = true; cb(); } }, 2200);
}

/* ════════════════════════
   SPLASH
   ════════════════════════ */
function showSplash() {
    const splash = $('introSplash');
    if (!splash) return;
    splash.style.display = 'flex';
    let stopNeural;
    setTimeout(() => {
        splash.style.opacity = '1';
        splash.classList.add('visible');
        stopNeural = initNeuralCanvas();
        splash.querySelectorAll('.splash-letter').forEach((l, i) => {
            setTimeout(() => l.classList.add('vis'), 120 + i * 85);
        });
        setTimeout(() => {
            [$('splashSub'), $('splashRule'), $('splashEnterBtn')].forEach((el, i) => {
                if (el) { setTimeout(() => el.classList.add('vis'), i * 100); }
            });
        }, 650);
    }, 80);

    $('splashEnterBtn') && $('splashEnterBtn').addEventListener('click', () => {
        if (stopNeural) stopNeural();
        splash.style.transition = 'opacity 1s ease';
        splash.style.opacity = '0';
        setTimeout(() => { splash.style.display = 'none'; showLogin(); }, 1000);
    });
}

function initNeuralCanvas() {
    const canvas = $('neuralCanvas');
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    let mx = canvas.width / 2, my = canvas.height / 2;
    canvas.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
    const nodes = Array.from({ length: 90 }, () => ({
        x: rand(0, canvas.width), y: rand(0, canvas.height),
        vx: rand(-.2, .2), vy: rand(-.2, .2),
        r: rand(1.5, 3.5), baseR: rand(1.5, 3.5), pulse: rand(0, Math.PI * 2)
    }));
    let running = true;
    function draw() {
        if (!running) return; raf(draw);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        nodes.forEach(n => {
            n.x += n.vx; n.y += n.vy; n.pulse += 0.016;
            const dx = mx - n.x, dy = my - n.y, d = Math.hypot(dx, dy);
            if (d < 200) { n.vx += dx / d * 0.015; n.vy += dy / d * 0.015; }
            n.vx *= 0.989; n.vy *= 0.989;
            if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
            if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
            n.r = n.baseR * (0.85 + Math.sin(n.pulse) * 0.15);
        });
        for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y, dist = Math.hypot(dx, dy);
            if (dist < 140) {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(175,160,137,${(1 - dist / 140) * .25})`;
                ctx.lineWidth = (1 - dist / 140) * 1.2;
                ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); ctx.stroke();
            }
        }
        nodes.forEach(n => {
            const a = 0.3 + Math.sin(n.pulse) * 0.22;
            ctx.shadowBlur = 8; ctx.shadowColor = 'rgba(212,197,160,0.5)';
            ctx.fillStyle = `rgba(212,197,160,${a})`;
            ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
        });
    }
    draw(); return () => { running = false; };
}

/* ════════════════════════
   LOGIN
   ════════════════════════ */
let lpRunning = false;
function initLoginParticles() {
    const lc = $('loginCanvas'); if (!lc) return;
    const ctx = lc.getContext('2d');
    lc.width = window.innerWidth; lc.height = window.innerHeight;
    const pts = Array.from({ length: 200 }, () => ({
        x: rand(0, lc.width), y: rand(0, lc.height),
        vx: rand(-.1, .1), vy: rand(-.55, -.12),
        a: rand(.04, .28), r: rand(1.2, 2.8), pulse: rand(0, Math.PI * 2)
    }));
    lpRunning = true;
    (function anim() {
        if (!lpRunning) return;
        ctx.clearRect(0, 0, lc.width, lc.height);
        pts.forEach(p => {
            p.x += p.vx; p.y += p.vy; p.pulse += 0.02;
            if (p.y < -10) { p.y = lc.height + 10; p.x = rand(0, lc.width); }
            ctx.fillStyle = `rgba(212,197,160,${p.a * (0.75 + Math.sin(p.pulse) * 0.25)})`;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        });
        raf(anim);
    })();
}

function showLogin() {
    const s = $('loginSection'); if (!s) return;
    s.style.display = 'flex'; s.style.opacity = '0';
    setTimeout(() => { s.style.transition = 'opacity .7s var(--eex)'; s.style.opacity = '1'; s.classList.add('visible'); }, 50);
    initLoginParticles();
}

/* ════════════════════════
   AUTH
   ════════════════════════ */
const USERS_KEY = 'cogni_auth_users';
function getUsers() { return JSON.parse(localStorage.getItem(USERS_KEY)) || {}; }

function initAuth() {
    const tabSignIn = $('tabSignIn'), tabCreate = $('tabCreate');
    const panelSignIn = $('panelSignIn'), panelCreate = $('panelCreate'), authInk = $('authInk');

    tabSignIn && tabSignIn.addEventListener('click', () => {
        panelSignIn.classList.remove('hidden'); panelCreate.classList.add('hidden');
        tabSignIn.classList.add('active'); tabCreate.classList.remove('active');
        authInk.classList.remove('right');
    });
    tabCreate && tabCreate.addEventListener('click', () => {
        panelCreate.classList.remove('hidden'); panelSignIn.classList.add('hidden');
        tabCreate.classList.add('active'); tabSignIn.classList.remove('active');
        authInk.classList.add('right');
    });

    function showAuthErr(title, msg) {
        if ($('aeTitle')) $('aeTitle').innerHTML = title;
        if ($('aeMsg')) $('aeMsg').innerHTML = msg;
        const ov = $('authErrorOverlay');
        if (ov) { ov.style.opacity = '0'; ov.classList.add('visible'); requestAnimationFrame(() => { ov.style.transition = 'opacity .35s'; ov.style.opacity = '1'; }); }
    }
    $('aeBackBtn') && $('aeBackBtn').addEventListener('click', () => {
        $('authErrorOverlay').classList.remove('visible');
        [$('siPass'), $('regPass'), $('regConf')].forEach(el => { if (el) el.value = ''; });
    });

    const doLogin = () => {
        const u = $('siUser').value.trim(), p = $('siPass').value, users = getUsers();
        if (users[u] && users[u] === p) { state.currentUser = u; localStorage.setItem('cogni_active_user', u); triggerPostLoginLoader(); }
        else showAuthErr("Take a <em>breath.</em>", "Those credentials didn't match. Try again when you're ready.");
    };
    $('loginBtn') && $('loginBtn').addEventListener('click', doLogin);
    $('siPass') && $('siPass').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

    const doRegister = () => {
        const u = $('regUser').value.trim(), p = $('regPass').value, cp = $('regConf').value, users = getUsers();
        if (p.length < 4) { showAuthErr("Hold up.", "Use at least 4 characters."); return; }
        if (p !== cp) { showAuthErr("Take your time.", "Passwords didn't match."); return; }
        if (users[u]) { showAuthErr("Already claimed.", "Username taken. Try another."); return; }
        users[u] = p; localStorage.setItem(USERS_KEY, JSON.stringify(users));
        state.currentUser = u; localStorage.setItem('cogni_active_user', u);
        triggerPostLoginLoader();
    };
    $('registerBtn') && $('registerBtn').addEventListener('click', doRegister);
    $('regConf') && $('regConf').addEventListener('keydown', e => { if (e.key === 'Enter') doRegister(); });

    // Forgot password
    const forgotLink = $('forgotLink'), forgotOverlay = $('forgotOverlay'), forgotClose = $('forgotClose');
    forgotLink && forgotLink.addEventListener('click', () => { if (forgotOverlay) { forgotOverlay.style.display = 'flex'; setTimeout(() => { forgotOverlay.style.opacity = '1'; }, 10); } });
    forgotClose && forgotClose.addEventListener('click', () => { if (forgotOverlay) { forgotOverlay.style.opacity = '0'; setTimeout(() => forgotOverlay.style.display = 'none', 300); } });
    $('fpSubmit') && $('fpSubmit').addEventListener('click', () => {
        const u = $('fpUser').value.trim(), p = $('fpNew').value, c = $('fpConf').value, users = getUsers(), msg = $('fpMsg');
        if (!users[u]) { msg.textContent = 'Username not found.'; msg.className = 'fp-msg err'; return; }
        if (p.length < 4) { msg.textContent = 'Min 4 characters.'; msg.className = 'fp-msg err'; return; }
        if (p !== c) { msg.textContent = "Passwords don't match."; msg.className = 'fp-msg err'; return; }
        users[u] = p; localStorage.setItem(USERS_KEY, JSON.stringify(users));
        msg.textContent = 'Password updated!'; msg.className = 'fp-msg ok';
        setTimeout(() => { if (forgotOverlay) { forgotOverlay.style.opacity = '0'; setTimeout(() => forgotOverlay.style.display = 'none', 300); } }, 1800);
    });
}

function triggerPostLoginLoader() {
    const loader = $('postLoader'), textEl = $('plText'), subEl = $('plSub');
    if (!loader) { enterApp(); return; }
    loader.style.display = 'flex'; setTimeout(() => loader.classList.add('visible'), 50);
    const msgs = [{ t: "Aligning neural pathways...", s: "building your map" }, { t: "Calibrating awareness...", s: "almost there" }, { t: "Entering your sanctuary...", s: "finding stillness" }];
    let i = 0;
    const iv = setInterval(() => {
        if (textEl) textEl.classList.add('fade');
        setTimeout(() => {
            i++;
            if (i < msgs.length) { if (textEl) { textEl.textContent = msgs[i].t; textEl.classList.remove('fade'); } if (subEl) subEl.textContent = msgs[i].s; }
            else { clearInterval(iv); loader.classList.remove('visible'); setTimeout(() => loader.style.display = 'none', 800); enterApp(); }
        }, 450);
    }, 2400);
}

function enterApp() {
    const nu = $('navUser'); if (nu) nu.textContent = state.currentUser;
    window.INSIGHTS_KEY = `cogni_insights_${state.currentUser}`;
    window.JOURNAL_KEY = `cogni_journal_${state.currentUser}`;
    lpRunning = false;
    const ls = $('loginSection');
    if (ls) { ls.style.transition = 'opacity .9s ease'; ls.style.opacity = '0'; setTimeout(() => ls.style.display = 'none', 900); }
    const app = $('appShell');
    if (app) {
        app.style.display = 'block';
        setTimeout(() => { app.style.opacity = '1'; app.style.filter = 'blur(0)'; app.style.transform = 'scale(1)'; app.classList.add('revealed'); initAppFeatures(); }, 1050);
    }
    const bf = $('breathFab'); if (bf) bf.style.display = 'block';
}

$('navLogout') && $('navLogout').addEventListener('click', () => { localStorage.removeItem('cogni_active_user'); location.reload(); });

/* ════════════════════════
   APP FEATURES
   ════════════════════════ */
function initAppFeatures() {
    try { initThreeBg(); } catch (e) { const cv = $('threeCanvas'); if (cv) cv.style.display = 'none'; }
    splitTypography();
    initScrollReveal();
    initHeroAnimations();
    initHeroParticles();
    initScrollEffects();
    initBreathing();
    initWheel();
    initDSA();
    initSpotlightCards();
    initThoughtVisualizer();
    initChat();
    initDashboard();
    initJournal();
    initCountUpAnimations();
    initTiltCards();
    initParallax();
    initMagneticButtons();
    initNavHighlight();
    initTheme();
    initProfile();
    initOnboarding();
    initHabits();
    initMeditation();
    initWeeklySummary();
    initVoiceInput($('thoughtVizInput'), $('tvVoiceBtn'));
    initVoiceInput($('chatInput'), $('chatVoiceBtn'));
    $('navThemeBtn') && $('navThemeBtn').addEventListener('click', cycleTheme);
    $('navProfileBtn') && $('navProfileBtn').addEventListener('click', openProfile);
    setTimeout(() => { renderMoodChart(); renderDistFreqBars(); }, 500);
}

/* ── Typography split ── */
function splitTypography() {
    document.querySelectorAll('.reveal-split').forEach(el => {
        const text = el.innerText; el.innerHTML = ''; let ci = 0;
        text.split(' ').forEach((word, wi, arr) => {
            const ww = document.createElement('span'); ww.className = 'word-wrap';
            word.split('').forEach(ch => {
                const cs = document.createElement('span'); cs.className = 'char';
                cs.innerHTML = `<span class="char-inner" style="--ci:${ci}">${ch}</span>`;
                ww.appendChild(cs); ci++;
            });
            el.appendChild(ww);
            if (wi < arr.length - 1) el.appendChild(document.createTextNode(' '));
        });
    });
}

/* ── Scroll reveal ── */
function initScrollReveal() {
    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (!e.isIntersecting) return;
            e.target.classList.add('in-view');
            if (e.target.classList.contains('reveal-scale')) {
                e.target.querySelectorAll('.wheel-petal').forEach((p, i) => setTimeout(() => p.classList.add('vis'), i * 75 + 150));
            }
            obs.unobserve(e.target);
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal-up,.reveal-split,.reveal-left,.reveal-right,.reveal-scale').forEach(el => obs.observe(el));
}

/* ── Nav section highlight ── */
function initNavHighlight() {
    const sections = document.querySelectorAll('section[id]');
    const links = document.querySelectorAll('.nl');
    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                links.forEach(a => a.classList.toggle('nav-active', a.getAttribute('href') === '#' + e.target.id));
            }
        });
    }, { threshold: 0.35 });
    sections.forEach(s => obs.observe(s));
}

/* ── Hero ── */
function initHeroAnimations() {
    document.querySelectorAll('.wr-inner').forEach((w, i) => {
        setTimeout(() => w.classList.add('vis'), 500 + i * 130);
    });
    const actions = $('heroActions');
    if (actions) setTimeout(() => { actions.style.opacity = '1'; actions.style.transform = 'translateY(0)'; }, 1400);
    const scramble = $('heroScramble');
    if (scramble) {
        function glitch() { scramble.classList.add('glitch'); setTimeout(() => scramble.classList.remove('glitch'), rand(120, 280)); setTimeout(glitch, rand(3500, 7000)); }
        setTimeout(glitch, 2000);
    }
}

function initHeroParticles() {
    const container = $('heroParticles'); if (!container) return;
    for (let i = 0; i < 28; i++) {
        const p = document.createElement('div'); p.className = 'hp';
        p.style.cssText = `left:${rand(2, 98)}%;bottom:${rand(-15, 10)}%;--dur:${rand(8, 20)}s;--delay:${rand(0, 16)}s;--op:${rand(.12, .5)};--dx:${rand(-90, 90)}px;width:${rand(1.5, 4)}px;height:${rand(1.5, 4)}px;`;
        container.appendChild(p);
    }
}

/* ── Scroll effects ── */
function initScrollEffects() {
    const bar = $('scrollProgressBar'), nav = $('siteNav');
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            raf(() => {
                const sp = document.documentElement.scrollTop;
                const wh = document.documentElement.scrollHeight - document.documentElement.clientHeight;
                if (bar) bar.style.width = (sp / wh * 100) + '%';
                if (nav) nav.classList.toggle('scrolled', sp > 50);
                ticking = false;
            }); ticking = true;
        }
    });
}

/* ── Parallax ── */
function initParallax() {
    const gl1 = document.querySelector('.p-glow-1'), gl2 = document.querySelector('.p-glow-2'), gl3 = document.querySelector('.p-glow-3');
    let t1x = 0, t1y = 0, t2x = 0, t2y = 0, t3x = 0, t3y = 0, c1x = 0, c1y = 0, c2x = 0, c2y = 0, c3x = 0, c3y = 0;
    document.addEventListener('mousemove', e => {
        const x = (e.clientX / window.innerWidth - .5) * 32, y = (e.clientY / window.innerHeight - .5) * 32;
        t1x = x * .6; t1y = y * .6; t2x = -x * .4; t2y = -y * .4; t3x = x * .9; t3y = y * .9;
    });
    (function loop() {
        raf(loop); const s = 0.055;
        c1x = lerp(c1x, t1x, s); c1y = lerp(c1y, t1y, s);
        c2x = lerp(c2x, t2x, s); c2y = lerp(c2y, t2y, s);
        c3x = lerp(c3x, t3x, s); c3y = lerp(c3y, t3y, s);
        if (gl1) gl1.style.transform = `translate(${c1x}px,${c1y}px)`;
        if (gl2) gl2.style.transform = `translate(${c2x}px,${c2y}px)`;
        if (gl3) gl3.style.transform = `translate(${c3x}px,${c3y}px)`;
    })();
}

/* ── Magnetic buttons ── */
function initMagneticButtons() {
    document.querySelectorAll('.bs-btn,.lc-btn-giant,.cta-main').forEach(btn => {
        btn.addEventListener('mousemove', e => {
            const r = btn.getBoundingClientRect();
            const dx = (e.clientX - r.left - r.width / 2) * 0.25, dy = (e.clientY - r.top - r.height / 2) * 0.25;
            btn.style.transform = `translate(${dx}px,${dy}px)`;
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transition = 'transform .5s var(--spring)'; btn.style.transform = 'translate(0,0)';
            setTimeout(() => btn.style.transition = '', 500);
        });
    });
}

/* ── Spotlight cards ── */
function initSpotlightCards() {
    document.querySelectorAll('.tcard,.dsa-card,.dist-card').forEach(card => {
        card.addEventListener('mousemove', e => {
            const r = card.getBoundingClientRect();
            card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
            card.style.setProperty('--my', (e.clientY - r.top) + 'px');
        });
    });
}

/* ── 3D Tilt cards ── */
function initTiltCards() {
    document.querySelectorAll('.tilt-card').forEach(card => {
        let af, txR = 0, tyR = 0, cxR = 0, cyR = 0;
        card.addEventListener('mousemove', e => {
            cancelAnimationFrame(af);
            const r = card.getBoundingClientRect();
            txR = ((e.clientY - r.top) / r.height - .5) * 8;
            tyR = ((e.clientX - r.left) / r.width - .5) * -8;
            af = raf(function animate() {
                cxR = lerp(cxR, txR, .1); cyR = lerp(cyR, tyR, .1);
                card.style.transform = `perspective(1100px) rotateX(${cxR}deg) rotateY(${cyR}deg) scale3d(1.02,1.02,1.02)`;
                if (Math.abs(cxR - txR) > 0.01 || Math.abs(cyR - tyR) > 0.01) af = raf(animate);
            });
        });
        card.addEventListener('mouseleave', () => {
            cancelAnimationFrame(af); txR = 0; tyR = 0;
            card.style.transition = 'transform .7s var(--eex)';
            card.style.transform = 'perspective(1100px) rotateX(0) rotateY(0) scale3d(1,1,1)';
            setTimeout(() => card.style.transition = '', 700);
        });
    });
}

/* ── Breathing ── */
function initBreathing() {
    const btn = $('breathSectionBtn'), fab = $('breathFab'), overlay = $('breathOverlay'),
        closeBtn = $('breathClose'), startBtn = $('breathStartBtn'),
        phaseEl = $('breathPhase'), countEl = $('breathCount'), roundEl = $('breathRound'), orb = $('breathOrb');
    const open = () => overlay && overlay.classList.add('open');
    const closeF = () => {
        overlay && overlay.classList.remove('open'); state.breathRunning = false;
        if (orb) orb.className = 'breath-orb-modal';
        if (phaseEl) phaseEl.textContent = 'Ready'; if (countEl) countEl.textContent = '—';
        if (startBtn) startBtn.style.display = 'inline-flex';
    };
    btn && btn.addEventListener('click', open); fab && fab.addEventListener('click', open); closeBtn && closeBtn.addEventListener('click', closeF);
    const phases = [{ name: 'Inhale', cls: 'inhale' }, { name: 'Hold', cls: 'hold' }, { name: 'Exhale', cls: 'exhale' }, { name: 'Hold', cls: 'hold' }];
    async function run() {
        if (startBtn) startBtn.style.display = 'none'; state.breathRunning = true;
        for (let r = 1; r <= 5; r++) {
            if (!state.breathRunning) break; if (roundEl) roundEl.textContent = r;
            for (const ph of phases) {
                if (!state.breathRunning) break;
                if (phaseEl) phaseEl.textContent = ph.name; if (orb) orb.className = `breath-orb-modal ${ph.cls}`;
                for (let c = 4; c > 0; c--) { if (!state.breathRunning) break; if (countEl) countEl.textContent = c; await sleep(1000); }
            }
        }
        closeF();
    }
    startBtn && startBtn.addEventListener('click', run);
}

/* ── Thought Visualizer ── */
function initThoughtVisualizer() {
    const canvas = $('thoughtVizCanvas'), input = $('thoughtVizInput'), sendBtn = $('tvSendBtn');
    if (!canvas || !input) return;
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = canvas.parentElement.clientWidth; canvas.height = canvas.parentElement.clientHeight; };
    window.addEventListener('resize', resize); resize();
    let time = 0;
    function draw() {
        raf(draw); time += 0.045; ctx.clearRect(0, 0, canvas.width, canvas.height);
        const len = input.value.length, amp = Math.min(len * 1.8, 44);
        ctx.beginPath();
        for (let i = 0; i < canvas.width; i += 3) {
            const y = canvas.height / 2 + Math.sin(i * .018 + time) * amp * Math.cos(i * .009 - time * .5);
            i === 0 ? ctx.moveTo(i, y) : ctx.lineTo(i, y);
        }
        ctx.strokeStyle = `rgba(175,160,137,${len > 0 ? .8 : .18})`; ctx.lineWidth = 1.8; ctx.stroke();
        if (len > 0) {
            ctx.beginPath();
            for (let i = 0; i < canvas.width; i += 3) {
                const y = canvas.height / 2 + Math.sin(i * .026 + time * 1.4) * amp * .5 * Math.sin(i * .013 - time * .7);
                i === 0 ? ctx.moveTo(i, y) : ctx.lineTo(i, y);
            }
            ctx.strokeStyle = 'rgba(212,197,160,.28)'; ctx.lineWidth = 1; ctx.stroke();
        }
    }
    draw();
    sendBtn && sendBtn.addEventListener('click', () => {
        const text = input.value.trim();
        if (text) {
            const ci = $('chatInput'), cs = $('chatSend');
            if (ci && cs) { ci.value = text; $('s-chat').scrollIntoView({ behavior: 'smooth' }); input.value = ''; setTimeout(() => cs.click(), 700); }
        }
    });
}

/* ── Count-up ── */
function initCountUpAnimations() {
    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (!e.isIntersecting) return;
            const el = e.target, target = parseInt(el.getAttribute('data-target') || 0);
            const dur = 1600, start = performance.now();
            function up(now) { const t = Math.min((now - start) / dur, 1); el.textContent = Math.ceil(Math.pow(t, 0.4) * target); if (t < 1) raf(up); else el.textContent = target; }
            raf(up); obs.unobserve(el);
        });
    }, { threshold: .5 });
    document.querySelectorAll('.em-n').forEach(s => obs.observe(s));
}

/* ── Emotion Wheel ── */
function initWheel() {
    const center = $('wheelCenter'), text = $('wheelText');
    if (!center || !text) return;
    const info = { Joy: 'Warmth and lightness. Let it be.', Calm: 'Stillness is presence, not absence.', Trust: 'The willingness to be known.', Sadness: 'Grief honours what mattered.', Fear: 'A signal, not a verdict.', Anger: 'A boundary speaking loudly.' };
    const colors = { Joy: '#d4c560', Calm: '#60b4d4', Trust: '#80d490', Sadness: '#8090d4', Fear: '#d4a060', Anger: '#d46060' };
    document.querySelectorAll('.wheel-petal').forEach(p => {
        const span = p.querySelector('span'); if (!span) return;
        const name = span.textContent;
        p.addEventListener('mouseenter', () => {
            text.style.cssText = 'font-size:7.5px;text-align:center;padding:0 6px;line-height:1.45;transition:all .3s';
            text.textContent = info[name] || name;
            center.classList.add('active'); center.style.borderColor = colors[name] || 'var(--gd)';
            center.style.boxShadow = `0 0 32px ${colors[name]}55`;
        });
        p.addEventListener('mouseleave', () => {
            text.textContent = 'Feel'; text.style.cssText = 'font-size:9px;padding:0;transition:all .3s';
            center.classList.remove('active'); center.style.borderColor = 'rgba(175,160,137,0.3)'; center.style.boxShadow = '';
        });
    });
}

/* ════════════════════════════════════════════
   DSA — COMPLETELY FIXED
   ════════════════════════════════════════════ */
function initDSA() { initLinkedList(); initStack(); initSearch(); initSort(); }

/* ── 1. Linked List ── */
function initLinkedList() {
    const nodes = Array.from(document.querySelectorAll('[data-ll]'));
    const arrows = [$('llArrow0'), $('llArrow1'), $('llArrow2')];
    const statusEl = $('llStatus');
    const labels = ['Present', 'Yesterday', 'Last Week', '∅ NULL'];
    let current = 0, direction = 1, running = true;

    function step() {
        if (!running) return;
        nodes.forEach(n => n.classList.remove('ll-active', 'll-visited'));
        arrows.forEach(a => a && a.classList.remove('ll-arrow-active'));
        for (let i = 0; i < current; i++) nodes[i].classList.add('ll-visited');
        nodes[current].classList.add('ll-active');
        if (current > 0 && arrows[current - 1]) arrows[current - 1].classList.add('ll-arrow-active');
        if (statusEl) {
            statusEl.innerHTML = current === nodes.length - 1
                ? 'Reached <span class="ll-status-node">NULL</span> — end of list'
                : `Visiting <span class="ll-status-node">${labels[current]}</span>`;
        }
        const atEnd = current === nodes.length - 1, atStart = current === 0;
        if (atEnd) direction = -1; else if (atStart && direction < 0) direction = 1;
        current += direction;
        setTimeout(step, atEnd || atStart ? 1700 : 850);
    }
    const obs = new IntersectionObserver(e => { if (e[0].isIntersecting) { running = true; step(); obs.disconnect(); } }, { threshold: 0.3 });
    const card = nodes[0] && nodes[0].closest('.dsa-card');
    if (card) obs.observe(card);
}

/* ── 2. Stack ── */
function initStack() {
    const visual = $('stackVisual'), popBtn = $('popStackBtn'), pushBtn = $('stackPushBtn');
    if (!visual) return;
    const pushItems = ['Mindfulness', 'Acceptance', 'Awareness', 'Curiosity'];
    let pushIdx = 0;
    function getItems() { return Array.from(visual.querySelectorAll('.stack-item')); }
    function updateTop() {
        const items = getItems();
        items.forEach(item => { item.classList.remove('top'); const op = item.querySelector('.stack-op'); if (op) op.remove(); });
        if (items.length) {
            items[0].classList.add('top');
            const op = document.createElement('span'); op.className = 'stack-op'; op.textContent = '← top';
            items[0].prepend(op);
        }
    }
    popBtn && popBtn.addEventListener('click', () => {
        const items = getItems(); if (!items.length) { showToast('Stack empty'); return; }
        const top = items[0]; if (top._animating) return; top._animating = true;
        top.classList.add('popping');
        setTimeout(() => {
            top.remove(); const rem = getItems();
            if (!rem.length) { visual.innerHTML = '<div class="stack-empty">All layers processed</div><div class="stack-base"><span class="s-val">Triggering Event</span></div>'; }
            else updateTop();
        }, 340);
    });
    pushBtn && pushBtn.addEventListener('click', () => {
        const emptyEl = visual.querySelector('.stack-empty'); if (emptyEl) emptyEl.remove();
        const label = pushItems[pushIdx++ % pushItems.length];
        const item = document.createElement('div'); item.className = 'stack-item pushing';
        item.innerHTML = `<span class="s-val">${label}</span>`;
        visual.insertBefore(item, visual.firstChild);
        setTimeout(() => item.classList.remove('pushing'), 400);
        updateTop();
    });
    const obs = new IntersectionObserver(e => {
        if (e[0].isIntersecting) { setInterval(() => { if (getItems().length > 1) popBtn && popBtn.click(); }, 2800); obs.disconnect(); }
    }, { threshold: 0.3 });
    if (visual.closest('.dsa-card')) obs.observe(visual.closest('.dsa-card'));
}

/* ── 3. Search ── */
function initSearch() {
    const words = Array.from(document.querySelectorAll('.sw'));
    const pointer = $('searchPointer'), pLabel = $('spLabel');
    const resultEl = $('searchResult'), resultText = $('searchResultText');
    const restartBtn = $('searchRestartBtn'), speedInput = $('searchSpeed');
    if (!words.length) return;
    const distortionMap = { always: 'Overgeneralization', fail: 'Catastrophizing', everything: 'All-or-Nothing', never: 'Overgeneralization', everyone: 'Mind Reading', nothing: 'All-or-Nothing' };
    let scanIv = null, scanning = false;
    function getDelay() { return 1600 / parseInt(speedInput ? speedInput.value : 3); }
    function reset() {
        words.forEach(w => w.classList.remove('scanning', 'found', 'clear'));
        if (resultEl) resultEl.style.display = 'none';
        if (pointer) pointer.style.display = 'flex';
        if (pLabel) { pLabel.textContent = 'scanning...'; pLabel.style.color = ''; }
        scanning = false; clearInterval(scanIv);
    }
    function scan() {
        if (scanning) return; scanning = true; reset(); scanning = false;
        let i = 0; const found = [];
        scanIv = setInterval(() => {
            if (i > 0) words[i - 1].classList.remove('scanning');
            if (i >= words.length) {
                clearInterval(scanIv);
                if (pointer) pointer.style.display = 'none';
                if (found.length) {
                    const types = [...new Set(found.map(w => distortionMap[w.dataset.word] || 'Distortion'))];
                    if (resultText) resultText.textContent = types[0] + ' detected';
                    if (resultEl) resultEl.style.display = 'flex';
                } else {
                    if (pLabel) { pLabel.textContent = '✓ Clear thought pattern'; pLabel.style.color = 'rgba(160,220,160,.8)'; }
                    if (pointer) pointer.style.display = 'flex';
                }
                return;
            }
            const word = words[i]; const wt = word.textContent.toLowerCase().trim();
            word.dataset.word = wt; word.classList.add('scanning');
            if (pLabel) pLabel.textContent = `"${wt}"`;
            setTimeout(() => {
                word.classList.remove('scanning');
                if (distortionMap[wt]) { word.classList.add('found'); found.push(word); }
                else word.classList.add('clear');
            }, getDelay() * .6);
            i++;
        }, getDelay());
    }
    restartBtn && restartBtn.addEventListener('click', () => { reset(); setTimeout(scan, 300); });
    const obs = new IntersectionObserver(e => { if (e[0].isIntersecting) { setTimeout(scan, 600); obs.disconnect(); } }, { threshold: 0.3 });
    const card = words[0] && words[0].closest('.dsa-card');
    if (card) obs.observe(card);
}

/* ── 4. Bubble Sort — FIXED ── */
function initSort() {
    const barsC = $('sortBars');
    if (!barsC) return;

    let data = [72, 58, 45, 38, 25];
    let labels = ['ALL/NOTHING', 'SHOULD', 'CATASTROPHIZE', 'LABELING', 'MIND READ'];
    let sorting = false;

    // Build bars dynamically so heights work correctly
    function buildBarsDOM() {
        barsC.innerHTML = '';
        data.forEach((_, i) => {
            const bar = document.createElement('div');
            bar.className = 'sort-bar';
            bar.innerHTML = `<div class="bar-fill"><div class="bar-inner"></div></div><div class="bar-label"></div>`;
            barsC.appendChild(bar);
        });
    }

    function renderBars(arr, cmp = [], sorted = []) {
        const bars = barsC.querySelectorAll('.sort-bar');
        const maxV = Math.max(...arr);
        bars.forEach((bar, i) => {
            const inner = bar.querySelector('.bar-inner');
            const lbl = bar.querySelector('.bar-label');
            if (inner) inner.style.height = (arr[i] / maxV * 100) + '%';
            if (lbl) lbl.textContent = labels[i];
            bar.classList.toggle('comparing', cmp.includes(i));
            bar.classList.toggle('sorted', sorted.includes(i));
        });
    }

    function swapBars(i, j) {
        const bars = barsC.querySelectorAll('.sort-bar');
        const bI = bars[i], bJ = bars[j];
        const rI = bI.getBoundingClientRect(), rJ = bJ.getBoundingClientRect();
        const diff = rJ.left - rI.left;
        bI.style.transition = bJ.style.transition = 'transform .32s cubic-bezier(.34,1.56,.64,1)';
        bI.style.transform = `translateX(${diff}px)`;
        bJ.style.transform = `translateX(${-diff}px)`;
        return new Promise(res => setTimeout(() => {
            bI.style.transition = bJ.style.transition = ''; bI.style.transform = bJ.style.transform = '';
            [data[i], data[j]] = [data[j], data[i]];[labels[i], labels[j]] = [labels[j], labels[i]];
            renderBars(data); res();
        }, 340));
    }

    async function bubbleSort() {
        if (sorting) return; sorting = true;
        const runBtn = $('sortRunBtn'); if (runBtn) runBtn.disabled = true;
        const passLbl = $('sortPass'), cmpEl = $('sortCompare'), scA = $('scA'), scB = $('scB');
        const n = data.length, sortedIdx = [];
        for (let pass = 0; pass < n - 1; pass++) {
            if (passLbl) passLbl.textContent = pass + 1;
            let swapped = false;
            for (let j = 0; j < n - 1 - pass; j++) {
                renderBars(data, [j, j + 1], sortedIdx);
                if (cmpEl) cmpEl.style.display = 'flex';
                if (scA) scA.textContent = data[j]; if (scB) scB.textContent = data[j + 1];
                await sleep(420);
                if (data[j] < data[j + 1]) { await swapBars(j, j + 1); swapped = true; }
                renderBars(data, [], sortedIdx); await sleep(100);
            }
            sortedIdx.push(n - 1 - pass); renderBars(data, [], sortedIdx);
            if (!swapped) break;
        }
        sortedIdx.push(0);
        renderBars(data, [], Array.from({ length: n }, (_, i) => i));
        const cmpEl2 = $('sortCompare'), passLbl2 = $('sortPass');
        if (cmpEl2) cmpEl2.style.display = 'none';
        if (passLbl2) passLbl2.textContent = 'done ✓';
        sorting = false;
        const runBtnF = $('sortRunBtn'); if (runBtnF) runBtnF.disabled = false;
        showToast('Sort complete ✦');
    }

    function shuffle() {
        if (sorting) return;
        for (let i = data.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[data[i], data[j]] = [data[j], data[i]];[labels[i], labels[j]] = [labels[j], labels[i]]; }
        const cmpEl = $('sortCompare'), passLbl = $('sortPass');
        if (cmpEl) cmpEl.style.display = 'none'; if (passLbl) passLbl.textContent = '0';
        renderBars(data, [], []);
    }

    buildBarsDOM();
    const runBtn = $('sortRunBtn'), shuffleB = $('sortShuffleBtn');
    runBtn && runBtn.addEventListener('click', bubbleSort);
    shuffleB && shuffleB.addEventListener('click', shuffle);

    const obs = new IntersectionObserver(e => {
        if (e[0].isIntersecting) { renderBars(data); obs.disconnect(); }
    }, { threshold: 0.2 });
    if (barsC.closest('.dsa-card')) obs.observe(barsC.closest('.dsa-card'));
}

/* ════════════════════════
   THREE.JS BG
   ════════════════════════ */
function initThreeBg() {
    if (typeof THREE === 'undefined') throw new Error('no three');
    const cv = $('threeCanvas'); if (!cv) return;
    const gl = cv.getContext('webgl') || cv.getContext('experimental-webgl');
    if (!gl) throw new Error('no webgl');
    const renderer = new THREE.WebGLRenderer({ canvas: cv, context: gl, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, .1, 1000);
    camera.position.z = 5;
    function mkPts(n, rMin, rMax, size, color, opacity) {
        const geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) { const r = rand(rMin, rMax), t = rand(0, Math.PI * 2), p = rand(0, Math.PI); pos[i * 3] = r * Math.sin(p) * Math.cos(t); pos[i * 3 + 1] = r * Math.sin(p) * Math.sin(t); pos[i * 3 + 2] = r * Math.cos(p); }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({ size, color: new THREE.Color(color), transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });
        return new THREE.Points(geo, mat);
    }
    const pts1 = mkPts(2400, 2, 8, .025, 0xd4c5a0, .38), pts2 = mkPts(500, .5, 2.5, .015, 0xafa089, .62);
    scene.add(pts1); scene.add(pts2);
    let mx2 = 0, my2 = 0, targetZ = 5, time = 0;
    document.addEventListener('mousemove', e => { mx2 = (e.clientX / window.innerWidth - .5) * 2; my2 = (e.clientY / window.innerHeight - .5) * 2; });
    window.addEventListener('scroll', () => { targetZ = 5 + window.scrollY * .0012; });
    (function anim() {
        raf(anim); time += .0007;
        pts1.rotation.y = time * .14 + mx2 * .07; pts1.rotation.x = time * .07 + my2 * .05;
        pts2.rotation.y = -time * .22 + mx2 * .11; pts2.rotation.x = -time * .13 - my2 * .07;
        camera.position.x += (mx2 * .22 - camera.position.x) * .022; camera.position.y += (-my2 * .18 - camera.position.y) * .022;
        camera.position.z += (targetZ - camera.position.z) * .038; camera.lookAt(scene.position); renderer.render(scene, camera);
    })();
    window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });
}

/* ════════════════════════════════════════════════
   CHAT — COMPLETELY REBUILT
   • No glitching streaming
   • Smart scroll (can scroll up freely)
   • Beautiful bubble design
   ════════════════════════════════════════════════ */
const SYS_PROMPT = `You are COGNI, a compassionate cognitive behavioral therapy assistant. Analyze the thought and identify the cognitive distortion.
Respond EXACTLY in this format (no markdown, no asterisks):
DISTORTION: [name or "None detected"]
EMPATHY: [one warm, validating sentence]

[2-3 sentences of clear, warm reframing]`;

async function callClaude(messages, onToken) {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': CLAUDE_KEY,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
            'accept': 'text/event-stream'
        },
        body: JSON.stringify({
            model: 'claude-sonnet-4-5',
            max_tokens: 600,
            stream: true,
            system: SYS_PROMPT,
            messages
        })
    });
    if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error((err.error && err.error.message) || 'Claude API ' + resp.status);
    }
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '', buffer = '';
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n'); buffer = lines.pop();
        for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6).trim();
            if (raw === '[DONE]') continue;
            try {
                const evt = JSON.parse(raw);
                if (evt.type === 'content_block_delta' && evt.delta?.text) {
                    fullText += evt.delta.text;
                    onToken && onToken(evt.delta.text, fullText);
                }
            } catch (_) { }
        }
    }
    return fullText;
}

/* Smart scroll — only auto-scroll when user is near bottom */
function smartScroll(container) {
    const threshold = 80;
    if (!state.chatUserScrolled || container.scrollHeight - container.scrollTop - container.clientHeight < threshold) {
        container.scrollTop = container.scrollHeight;
    }
}

function parseCogni(text) {
    const lines = text.split('\n');
    let dist = '', emp = '', bodyStart = 0;
    lines.forEach((l, i) => {
        if (l.startsWith('DISTORTION:')) { dist = l.slice(11).trim(); bodyStart = i + 1; }
        if (l.startsWith('EMPATHY:')) { emp = l.slice(8).trim(); bodyStart = i + 1; }
    });
    while (bodyStart < lines.length && !lines[bodyStart].trim()) bodyStart++;
    return { dist, emp, body: lines.slice(bodyStart).join('\n').trim() };
}

function initChat() {
    const send = $('chatSend');
    const input = $('chatInput');
    const msgs = $('chatMessages');
    if (!send || !input || !msgs) return;

    // Track when user scrolls up
    msgs.addEventListener('scroll', () => {
        const atBottom = msgs.scrollHeight - msgs.scrollTop - msgs.clientHeight < 100;
        state.chatUserScrolled = !atBottom;
    });

    // Auto-resize textarea
    input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 140) + 'px';
    });
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); }
    });
    send.addEventListener('click', doSend);

    $('chatClear') && $('chatClear').addEventListener('click', () => {
        msgs.innerHTML = '';
        appendSysMsg(msgs, 'The slate is clear. Begin again when ready.');
        state.chatHistory = [];
        state.chatUserScrolled = false;
        showToast('Conversation cleared ✦');
    });

    async function doSend() {
        const text = input.value.trim();
        if (!text || send.disabled) return;

        // User bubble
        const userEl = document.createElement('div');
        userEl.className = 'cm cm-user';
        userEl.innerHTML = `<div class="cm-bubble cm-user-bubble"><p>${text.replace(/</g, '&lt;').replace(/\n/g, '<br>')}</p></div>`;
        appendMsg(msgs, userEl);
        input.value = ''; input.style.height = 'auto';
        send.disabled = true;
        state.chatUserScrolled = false;
        state.chatHistory.push({ role: 'user', content: text });

        // Thinking indicator
        const thinkEl = document.createElement('div');
        thinkEl.className = 'cm cm-sys';
        thinkEl.innerHTML = `<div class="cm-avatar"><span>✦</span></div><div class="cm-bubble cm-think-bubble"><div class="cm-dots"><span></span><span></span><span></span></div></div>`;
        appendMsg(msgs, thinkEl);

        // Key check
        if (!CLAUDE_KEY || CLAUDE_KEY === 'YOUR_CLAUDE_API_KEY_HERE') {
            await sleep(500); thinkEl.remove();
            appendSysMsg(msgs, '⚠ Claude API key not set. Open script.js line 3 and add your key from console.anthropic.com');
            send.disabled = false; return;
        }

        try {
            await sleep(600);
            thinkEl.style.transition = 'opacity .3s, transform .3s';
            thinkEl.style.opacity = '0'; thinkEl.style.transform = 'translateY(-8px) scale(.97)';
            await sleep(300); thinkEl.remove();

            // Response bubble
            const sysEl = document.createElement('div'); sysEl.className = 'cm cm-sys';
            const avatar = document.createElement('div'); avatar.className = 'cm-avatar cogni-pulse'; avatar.innerHTML = '<span>✦</span>';
            const bubble = document.createElement('div'); bubble.className = 'cm-bubble cm-sys-bubble';
            const streamEl = document.createElement('div'); streamEl.className = 'cm-stream-text';
            bubble.appendChild(streamEl);
            sysEl.append(avatar, bubble);
            appendMsg(msgs, sysEl);

            // Live streaming — simple and glitch-free
            let accumulated = '';
            const fullText = await callClaude(state.chatHistory, (tok, full) => {
                accumulated = full;
                // Clean display: remove the structured prefixes during streaming
                let display = full
                    .replace(/^DISTORTION:.*\n?/, '')
                    .replace(/^EMPATHY:.*\n?/, '')
                    .trimStart();
                streamEl.textContent = display;
                smartScroll(msgs);
            });

            state.chatHistory.push({ role: 'assistant', content: fullText });

            // Parse and render structured response
            const { dist, emp, body } = parseCogni(fullText);

            bubble.innerHTML = '';

            // Distortion tag
            if (dist && dist !== 'None detected') {
                const tag = document.createElement('div');
                tag.className = 'cm-dist-tag';
                tag.innerHTML = `<span class="cm-dist-icon">⚑</span> <span class="cm-dist-name">${dist}</span>`;
                bubble.appendChild(tag);
                requestAnimationFrame(() => { tag.style.opacity = '1'; tag.style.transform = 'translateY(0)'; });
            }

            // Empathy line
            if (emp) {
                const empEl = document.createElement('p');
                empEl.className = 'cm-empathy';
                empEl.textContent = emp;
                bubble.appendChild(empEl);
                requestAnimationFrame(() => { empEl.style.opacity = '1'; });
            }

            // Body text
            if (body) {
                const bodyEl = document.createElement('p');
                bodyEl.className = 'cm-body';
                bodyEl.textContent = body;
                bubble.appendChild(bodyEl);
                requestAnimationFrame(() => { bodyEl.style.opacity = '1'; });
            }

            avatar.classList.remove('cogni-pulse');
            state.chatUserScrolled = false;
            smartScroll(msgs);

            // Save insight
            if (dist && dist !== 'None detected') {
                const d = JSON.parse(localStorage.getItem(window.INSIGHTS_KEY)) || [];
                d.push({ distortion: dist, date: new Date().toISOString() });
                localStorage.setItem(window.INSIGHTS_KEY, JSON.stringify(d));
                renderDashboard();
            }
        } catch (err) {
            thinkEl.remove && thinkEl.remove();
            appendSysMsg(msgs, `⚠ ${err.message || 'Connection issue. Check your API key and network.'}`);
            console.error('Claude error:', err);
        }
        send.disabled = false;
    }
}

function appendMsg(container, el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px) scale(.98)';
    container.appendChild(el);
    requestAnimationFrame(() => {
        el.style.transition = 'opacity .4s cubic-bezier(.16,1,.3,1), transform .45s cubic-bezier(.34,1.56,.64,1)';
        el.style.opacity = '1'; el.style.transform = 'translateY(0) scale(1)';
    });
    smartScroll(container);
}

function appendSysMsg(container, text) {
    const el = document.createElement('div');
    el.className = 'cm cm-sys';
    el.innerHTML = `<div class="cm-avatar"><span>✦</span></div><div class="cm-bubble cm-sys-bubble"><p>${text}</p></div>`;
    appendMsg(container, el);
}

/* ════════════════════════
   DASHBOARD & JOURNAL
   ════════════════════════ */
function initDashboard() { renderDashboard(); }
function renderDashboard() {
    const data = JSON.parse(localStorage.getItem(window.INSIGHTS_KEY)) || [];
    if ($('totalSessions')) $('totalSessions').textContent = data.length;
    if (!data.length) { if ($('topDistortion')) $('topDistortion').textContent = '—'; if ($('streakCount')) $('streakCount').textContent = '0'; return; }
    const freq = {};
    data.forEach(d => freq[d.distortion] = (freq[d.distortion] || 0) + 1);
    const top = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
    if (top && $('topDistortion')) $('topDistortion').textContent = top[0];
    const days = new Set(data.map(d => d.date.slice(0, 10)));
    let streak = 0, c = new Date(); c.setHours(0, 0, 0, 0);
    while (days.has(c.toISOString().slice(0, 10))) { streak++; c.setDate(c.getDate() - 1); }
    if ($('streakCount')) $('streakCount').textContent = streak;
    const journals = JSON.parse(localStorage.getItem(window.JOURNAL_KEY)) || [];
    const week = new Date(); week.setDate(week.getDate() - 7);
    const recentJ = journals.filter(e => new Date(e.date) > week);
    if (recentJ.length && $('avgMoodStat')) {
        const avg = recentJ.reduce((s, e) => s + e.mood, 0) / recentJ.length;
        $('avgMoodStat').textContent = avg.toFixed(1);
    }
    renderMoodChart(); renderDistFreqBars();
}

function renderJournal() {
    const entries = JSON.parse(localStorage.getItem(window.JOURNAL_KEY)) || [];
    const list = $('journalEntries'); if (!list) return;
    const countEl = $('entriesCount'); if (countEl) countEl.textContent = entries.length;
    if (!entries.length) { list.innerHTML = '<p class="j-empty">Your first entry awaits.</p>'; return; }
    list.innerHTML = entries.slice(0, 20).map((e, i) => `
    <div class="j-entry" style="--di:${i}">
      <div class="j-entry-top">
        <span class="j-date">${new Date(e.date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        <span class="j-mood-badge">mood ${e.mood}/5</span>
        <button class="j-del" data-idx="${i}">×</button>
      </div>
      <p class="j-text">${e.text.replace(/</g, '&lt;')}</p>
    </div>`).join('');
    list.querySelectorAll('.j-entry').forEach((el, i) => {
        el.style.opacity = '0'; el.style.transform = 'translateY(10px)';
        setTimeout(() => { el.style.transition = 'opacity .4s var(--eex),transform .4s var(--eex)'; el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }, i * 50);
    });
    list.querySelectorAll('.j-del').forEach(btn => {
        btn.addEventListener('click', e => {
            const idx = parseInt(e.target.getAttribute('data-idx'));
            const d = JSON.parse(localStorage.getItem(window.JOURNAL_KEY)) || [];
            d.splice(idx, 1); localStorage.setItem(window.JOURNAL_KEY, JSON.stringify(d));
            showToast('Entry removed'); renderJournal();
        });
    });
}

function initJournal() {
    document.querySelectorAll('.mood-btn').forEach(b => {
        b.addEventListener('click', () => {
            document.querySelectorAll('.mood-btn').forEach(x => x.classList.remove('active'));
            b.classList.add('active'); state.selectedMood = parseInt(b.dataset.mood);
        });
    });
    $('journalSave') && $('journalSave').addEventListener('click', () => {
        const t = $('journalInput').value.trim(); if (!t) return;
        const d = JSON.parse(localStorage.getItem(window.JOURNAL_KEY)) || [];
        d.unshift({ text: t, mood: state.selectedMood, date: new Date().toISOString() });
        localStorage.setItem(window.JOURNAL_KEY, JSON.stringify(d));
        $('journalInput').value = ''; renderJournal(); renderDashboard();
        showToast('Entry saved ✦');
    });
    $('generateInsightBtn') && $('generateInsightBtn').addEventListener('click', async () => {
        const entries = JSON.parse(localStorage.getItem(window.JOURNAL_KEY)) || [];
        const box = $('aiInsightBox');
        if (!entries.length) { if (box) { box.style.display = 'block'; box.textContent = 'Write a few entries first.'; } return; }
        if (!CLAUDE_KEY || CLAUDE_KEY === 'YOUR_CLAUDE_API_KEY_HERE') { if (box) { box.style.display = 'block'; box.textContent = 'Add your Claude API key to enable AI insights.'; } return; }
        if (box) { box.style.display = 'block'; box.innerHTML = '<em>✦ Reading your patterns...</em>'; }
        const recent = entries.slice(0, 8).map(e => `Mood ${e.mood}/5: "${e.text.slice(0, 60)}"`).join('\n');
        try {
            const resp = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_KEY, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }, body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 180, messages: [{ role: 'user', content: `Analyze these journal entries. Give a warm, insightful 2-sentence observation about emotional patterns. Speak directly to them. Be specific.\n\n${recent}` }] }) });
            const data = await resp.json();
            if (box) box.innerHTML = '<strong style="color:var(--gd)">✦ Pattern Detected</strong><br>' + data.content[0].text;
        } catch (e) { if (box) box.textContent = 'Could not reach Claude AI.'; }
    });
    renderJournal();
}

/* ════════════════════════
   VOICE INPUT — FIXED STOP
   ════════════════════════ */
function initVoiceInput(inputEl, btnEl) {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        if (btnEl) { btnEl.style.opacity = '.3'; btnEl.title = 'Voice not supported'; } return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    let rec = null, isListening = false;

    function start() {
        rec = new SR(); rec.continuous = false; rec.interimResults = true; rec.lang = 'en-US';
        rec.onresult = e => {
            const trans = Array.from(e.results).map(r => r[0].transcript).join('');
            if (inputEl) inputEl.value = trans;
        };
        rec.onend = () => { isListening = false; if (btnEl) btnEl.classList.remove('listening'); rec = null; };
        rec.onerror = () => { isListening = false; if (btnEl) btnEl.classList.remove('listening'); rec = null; showToast('Voice error. Try again.'); };
        rec.start(); isListening = true; if (btnEl) btnEl.classList.add('listening');
        showToast('Listening... speak now');
    }

    function stop() { if (rec) { try { rec.stop(); } catch (e) { } } isListening = false; if (btnEl) btnEl.classList.remove('listening'); }

    btnEl && btnEl.addEventListener('click', () => { if (isListening) stop(); else start(); });
}

/* ════════════════════════
   THEMES
   ════════════════════════ */
const THEMES = ['dark', 'sepia', 'midnight'];
let themeIdx = 0;
function initTheme() {
    const saved = localStorage.getItem('cogni_theme') || 'dark';
    themeIdx = Math.max(0, THEMES.indexOf(saved)); applyTheme();
}
function applyTheme() {
    document.body.classList.remove('theme-sepia', 'theme-midnight');
    if (themeIdx === 1) document.body.classList.add('theme-sepia');
    if (themeIdx === 2) document.body.classList.add('theme-midnight');
    localStorage.setItem('cogni_theme', THEMES[themeIdx]);
    const icons = ['☽', '☀', '✦'], btn = $('navThemeBtn'); if (btn) btn.textContent = icons[themeIdx];
}
function cycleTheme() { themeIdx = (themeIdx + 1) % THEMES.length; applyTheme(); showToast(['Dark', 'Sepia', 'Midnight'][themeIdx] + ' theme ✦'); }

/* ════════════════════════
   PROFILE
   ════════════════════════ */
function initProfile() {
    const overlay = $('profileOverlay'), closeBtn = $('profileClose');
    closeBtn && closeBtn.addEventListener('click', closeProfile);
    overlay && overlay.addEventListener('click', e => { if (e.target === overlay) closeProfile(); });
    $('profileThemeToggle') && $('profileThemeToggle').addEventListener('click', () => { cycleTheme(); closeProfile(); });
    $('profileLogout') && $('profileLogout').addEventListener('click', () => { localStorage.removeItem('cogni_active_user'); location.reload(); });
}
function openProfile() {
    const overlay = $('profileOverlay'); if (!overlay) return;
    const user = state.currentUser;
    if ($('profileAvatar')) $('profileAvatar').textContent = (user || 'U')[0].toUpperCase();
    if ($('profileName')) $('profileName').textContent = user || 'User';
    const joinKey = `cogni_join_${user}`;
    if (!localStorage.getItem(joinKey)) localStorage.setItem(joinKey, new Date().toISOString());
    const joined = new Date(localStorage.getItem(joinKey));
    if ($('profileSince')) $('profileSince').textContent = 'Member since ' + joined.toLocaleDateString('en', { month: 'long', year: 'numeric' });
    const analyses = JSON.parse(localStorage.getItem(window.INSIGHTS_KEY)) || [];
    const journals = JSON.parse(localStorage.getItem(window.JOURNAL_KEY)) || [];
    if ($('pTotalAnalyses')) $('pTotalAnalyses').textContent = analyses.length;
    if ($('pJournalCount')) $('pJournalCount').textContent = journals.length;
    let streak = 0, c = new Date(); c.setHours(0, 0, 0, 0);
    const days = new Set(analyses.map(d => d.date.slice(0, 10)));
    while (days.has(c.toISOString().slice(0, 10))) { streak++; c.setDate(c.getDate() - 1); }
    if ($('pStreak')) $('pStreak').textContent = streak;
    const freq = {}; analyses.forEach(d => freq[d.distortion] = (freq[d.distortion] || 0) + 1);
    const top = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
    const ptd = $('profileTopDist');
    if (ptd) { ptd.style.display = top ? 'block' : 'none'; if (top && $('ptdLabel')) $('ptdLabel').textContent = top[0]; }
    overlay.style.display = 'flex'; overlay.style.opacity = '0';
    requestAnimationFrame(() => { overlay.style.transition = 'opacity .35s'; overlay.style.opacity = '1'; });
}
function closeProfile() {
    const overlay = $('profileOverlay'); if (!overlay) return;
    overlay.style.opacity = '0'; setTimeout(() => overlay.style.display = 'none', 300);
}

/* ════════════════════════
   ONBOARDING
   ════════════════════════ */
function initOnboarding() {
    const overlay = $('onboardOverlay'); if (!overlay) return;
    const key = `cogni_onboarded_${state.currentUser}`;
    if (localStorage.getItem(key)) return;
    overlay.style.display = 'flex'; overlay.style.opacity = '0';
    requestAnimationFrame(() => { overlay.style.transition = 'opacity .5s var(--eex)'; overlay.style.opacity = '1'; });
    let step = 0;
    const steps = overlay.querySelectorAll('.onboard-step'), dots = overlay.querySelectorAll('.ob-dot');
    function goTo(n) { steps[step].classList.remove('active'); dots[step].classList.remove('active'); step = Math.max(0, Math.min(n, steps.length - 1)); steps[step].classList.add('active'); dots[step].classList.add('active'); }
    const finish = () => { overlay.style.opacity = '0'; setTimeout(() => overlay.style.display = 'none', 500); localStorage.setItem(key, '1'); };
    $('ob0Next') && $('ob0Next').addEventListener('click', () => goTo(1));
    $('ob1Back') && $('ob1Back').addEventListener('click', () => goTo(0)); $('ob1Next') && $('ob1Next').addEventListener('click', () => goTo(2));
    $('ob2Back') && $('ob2Back').addEventListener('click', () => goTo(1)); $('ob2Next') && $('ob2Next').addEventListener('click', () => goTo(3));
    $('ob3Back') && $('ob3Back').addEventListener('click', () => goTo(2));
    $('ob3Next') && $('ob3Next').addEventListener('click', finish); $('obFinish') && $('obFinish').addEventListener('click', finish); $('obSkip') && $('obSkip').addEventListener('click', finish);
    dots.forEach(d => d.addEventListener('click', () => goTo(parseInt(d.dataset.step))));
}

/* ════════════════════════
   HABITS
   ════════════════════════ */
function initHabits() {
    const today = new Date().toISOString().slice(0, 10);
    const dateEl = $('habitDate'); if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' });
    const KEY = `cogni_habits_${state.currentUser}`;
    const habits = ['sleep', 'water', 'exercise', 'mindfulness', 'journal'];
    function load() { return JSON.parse(localStorage.getItem(KEY)) || {}; }
    function save(d) { localStorage.setItem(KEY, JSON.stringify(d)); }
    function getStreak(habit, data) { let streak = 0, d = new Date(); d.setHours(0, 0, 0, 0); while (true) { const k = d.toISOString().slice(0, 10); if (data[k] && data[k][habit]) { streak++; d.setDate(d.getDate() - 1); } else break; } return streak; }
    function render() {
        const data = load();
        habits.forEach(h => {
            const id = 'h' + h[0].toUpperCase() + h.slice(1);
            const item = document.querySelector(`[data-habit="${h}"]`), btn = $(id), streakEl = $(id + 'Streak');
            const done = data[today] && data[today][h];
            if (item) item.classList.toggle('done', !!done);
            if (streakEl) streakEl.textContent = getStreak(h, data) > 0 ? getStreak(h, data) + ' day streak' : 'Not started';
        });
    }
    habits.forEach(h => {
        const btn = $('h' + h[0].toUpperCase() + h.slice(1)); if (!btn) return;
        btn.addEventListener('click', () => {
            const data = load(); if (!data[today]) data[today] = {};
            data[today][h] = !data[today][h]; save(data); render();
            if (data[today][h]) showToast('Habit logged ✦');
        });
    });
    render();
}

/* ════════════════════════
   MEDITATION
   ════════════════════════ */
let medRunning = false, medTimer = null, medAudioCtx = null, medAudioNodes = [];
const MED_PHASES = ['Inhale', 'Hold', 'Exhale', 'Hold'];
const MED_GUIDE = ['Find a comfortable position. Close your eyes gently.', 'Notice the weight of your body. Let it be fully supported.', 'Breathe naturally. Nothing to control, nothing to fix.', 'Observe your thoughts like clouds drifting past.', 'Return, gently, to this breath. To this moment.', 'You are here. You are safe. That is enough.'];
let medGuideIdx = 0, medPhaseIdx = 0, medPhaseIv = null, medGuideIv = null;

function initMeditation() {
    const startBtn = $('medStartBtn'), stopBtn = $('medStopBtn');
    const durBtns = document.querySelectorAll('.med-dur-btn'), sndBtns = document.querySelectorAll('.med-sound-btn');
    const aiBtn = $('medAiSuggestBtn');
    let selMin = 5, selSound = 'silence';
    durBtns.forEach(b => b.addEventListener('click', () => { durBtns.forEach(x => x.classList.remove('active')); b.classList.add('active'); selMin = parseInt(b.dataset.min); updateMedTime(selMin * 60); }));
    sndBtns.forEach(b => b.addEventListener('click', () => { sndBtns.forEach(x => x.classList.remove('active')); b.classList.add('active'); selSound = b.dataset.sound; }));
    updateMedTime(selMin * 60);
    initMedCanvas($('medCanvas'));
    startBtn && startBtn.addEventListener('click', () => {
        if (medRunning) return;
        startBtn.style.display = 'none'; if (stopBtn) stopBtn.style.display = 'inline-flex';
        startMed(selMin * 60, selSound);
    });
    stopBtn && stopBtn.addEventListener('click', () => {
        stopMed(); stopBtn.style.display = 'none'; if (startBtn) startBtn.style.display = 'inline-flex';
    });
    aiBtn && aiBtn.addEventListener('click', async () => {
        const box = $('medAiSuggestion'); if (!box) return;
        if (!CLAUDE_KEY || CLAUDE_KEY === 'YOUR_CLAUDE_API_KEY_HERE') { box.style.display = 'block'; box.textContent = 'Add your Claude API key to enable AI suggestions.'; return; }
        box.style.display = 'block'; box.innerHTML = '<em>✦ Analysing your mood...</em>';
        const journals = JSON.parse(localStorage.getItem(window.JOURNAL_KEY)) || [];
        const recent = journals.slice(0, 5).map(e => `Mood: ${e.mood}/5`).join(', ') || 'No data';
        try {
            const resp = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_KEY, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }, body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 100, messages: [{ role: 'user', content: `Based on recent moods (${recent}), suggest one meditation duration and one of these ambient sounds: silence, rain, ocean, forest, singing bowl, white noise. One warm sentence.` }] }) });
            const data = await resp.json();
            box.innerHTML = '✦ ' + data.content[0].text;
        } catch (e) { box.textContent = 'Could not reach Claude AI.'; }
    });
}

function updateMedTime(secs) { const el = $('medTime'); if (el) el.textContent = Math.floor(secs / 60) + ':' + String(secs % 60).padStart(2, '0'); }

function startMed(total, sound) {
    medRunning = true; let remaining = total;
    startMedAudio(sound);
    const guidEl = $('medGuidance'), phEl = $('medPhase');
    medPhaseIdx = 0; medGuideIdx = 0;
    medPhaseIv = setInterval(() => { if (!medRunning) { clearInterval(medPhaseIv); return; } medPhaseIdx = (medPhaseIdx + 1) % 4; if (phEl) phEl.textContent = MED_PHASES[medPhaseIdx]; }, 4000);
    medGuideIv = setInterval(() => { if (!medRunning) { clearInterval(medGuideIv); return; } medGuideIdx = (medGuideIdx + 1) % MED_GUIDE.length; if (guidEl) { guidEl.style.opacity = '0'; setTimeout(() => { guidEl.textContent = MED_GUIDE[medGuideIdx]; guidEl.style.transition = 'opacity .8s'; guidEl.style.opacity = '1'; }, 600); } }, 30000);
    medTimer = setInterval(() => { if (!medRunning) return; remaining--; updateMedTime(remaining); if (remaining <= 0) { clearInterval(medTimer); clearInterval(medPhaseIv); clearInterval(medGuideIv); stopMed(true); const sb = $('medStartBtn'), eb = $('medStopBtn'); if (sb) sb.style.display = 'inline-flex'; if (eb) eb.style.display = 'none'; } }, 1000);
}

function stopMed(completed = false) {
    medRunning = false; clearInterval(medTimer); clearInterval(medPhaseIv); clearInterval(medGuideIv);
    stopMedAudio();
    const selMin = parseInt(document.querySelector('.med-dur-btn.active')?.dataset.min || 5);
    updateMedTime(selMin * 60);
    if ($('medPhase')) $('medPhase').textContent = completed ? 'Complete ✦' : 'Ready';
    if ($('medGuidance')) $('medGuidance').textContent = completed ? 'Well done. Carry this stillness with you.' : 'Find a comfortable position. Close your eyes gently.';
    if (completed) showToast('Meditation complete ✦');
}

function startMedAudio(type) {
    if (type === 'silence') return;
    try {
        medAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const master = medAudioCtx.createGain(); master.gain.value = 0.15; master.connect(medAudioCtx.destination);
        const makeNoise = (freq, q, gain, ftype = 'bandpass') => {
            const b = medAudioCtx.createBuffer(1, 4096, medAudioCtx.sampleRate), d = b.getChannelData(0);
            for (let i = 0; i < 4096; i++) d[i] = Math.random() * 2 - 1;
            const s = medAudioCtx.createBufferSource(); s.buffer = b; s.loop = true;
            const f = medAudioCtx.createBiquadFilter(); f.type = ftype; f.frequency.value = freq; f.Q.value = q;
            const g = medAudioCtx.createGain(); g.gain.value = gain;
            s.connect(f); f.connect(g); g.connect(master); s.start(); return s;
        };
        if (type === 'rain') medAudioNodes = [makeNoise(400, .5, 1.8), makeNoise(800, 1.5, 1.2)];
        if (type === 'ocean') medAudioNodes = [makeNoise(200, .3, 2), makeNoise(600, .8, .8)];
        if (type === 'forest') medAudioNodes = [makeNoise(300, .6, 1.4), makeNoise(1200, 3, .3)];
        if (type === 'white') medAudioNodes = [makeNoise(600, .1, 2, 'lowpass')];
        if (type === 'bowl') {
            const iv = setInterval(() => {
                if (!medRunning) { clearInterval(iv); return; }
                [432, 528].forEach(f => {
                    const osc = medAudioCtx.createOscillator(); osc.frequency.value = f; osc.type = 'sine';
                    const g = medAudioCtx.createGain(); g.gain.setValueAtTime(0, medAudioCtx.currentTime);
                    g.gain.linearRampToValueAtTime(0.06, medAudioCtx.currentTime + 1);
                    g.gain.exponentialRampToValueAtTime(0.001, medAudioCtx.currentTime + 8);
                    osc.connect(g); g.connect(master); osc.start(); osc.stop(medAudioCtx.currentTime + 9);
                });
            }, 9000);
            medAudioNodes = [{ stop: () => clearInterval(iv) }];
        }
    } catch (e) { console.warn('Audio unavailable'); }
}

function stopMedAudio() { medAudioNodes.forEach(n => { try { n.stop && n.stop(); } catch (e) { } }); medAudioNodes = []; if (medAudioCtx) { try { medAudioCtx.close(); } catch (e) { } medAudioCtx = null; } }

function initMedCanvas(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d'); let w = 220, h = 220; canvas.width = w; canvas.height = h; let t = 0;
    (function loop() {
        raf(loop); t += 0.018; ctx.clearRect(0, 0, w, h);
        const cx = w / 2, cy = h / 2, layers = [{ r: 88, a: .055, spd: 1 }, { r: 66, a: .09, spd: 1.4 }, { r: 44, a: .12, spd: 1.9 }];
        layers.forEach((l, i) => {
            const pulse = medRunning ? Math.sin(t * l.spd + i) * .14 + .86 : 1;
            ctx.beginPath(); ctx.arc(cx, cy, l.r * pulse, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(175,160,137,${l.a + Math.sin(t) * .02})`; ctx.lineWidth = medRunning ? 1.5 : 1; ctx.stroke();
        });
    })();
}

/* ════════════════════════
   CHARTS
   ════════════════════════ */
function renderMoodChart() {
    const canvas = $('moodChart'); if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const journals = JSON.parse(localStorage.getItem(window.JOURNAL_KEY)) || [];
    const W = canvas.offsetWidth || 600, H = 160; canvas.width = W; canvas.height = H;
    const days = 14, today = new Date(); today.setHours(0, 0, 0, 0);
    const pts = Array.from({ length: days }, (_, i) => {
        const d = new Date(today); d.setDate(d.getDate() - (days - 1 - i));
        const key = d.toISOString().slice(0, 10);
        const entries = journals.filter(e => e.date && e.date.slice(0, 10) === key);
        return { mood: entries.length ? entries.reduce((s, e) => s + e.mood, 0) / entries.length : null, label: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }) };
    });
    const pad = { t: 20, r: 20, b: 28, l: 30 }, iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
    ctx.clearRect(0, 0, W, H);
    // Grid
    for (let v = 1; v <= 5; v++) { const y = pad.t + iH - (v - 1) / 4 * iH; ctx.beginPath(); ctx.strokeStyle = 'rgba(175,160,137,0.07)'; ctx.lineWidth = 1; ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + iW, y); ctx.stroke(); }
    const valid = pts.filter(p => p.mood !== null);
    if (valid.length > 1) {
        // Area
        ctx.beginPath();
        valid.forEach((p, i) => { const idx = pts.indexOf(p); const x = pad.l + idx / (days - 1) * iW, y = pad.t + iH - (p.mood - 1) / 4 * iH; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
        const lastX = pad.l + pts.indexOf(valid[valid.length - 1]) / (days - 1) * iW, firstX = pad.l + pts.indexOf(valid[0]) / (days - 1) * iW;
        ctx.lineTo(lastX, pad.t + iH); ctx.lineTo(firstX, pad.t + iH); ctx.closePath();
        const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + iH);
        grad.addColorStop(0, 'rgba(175,160,137,.18)'); grad.addColorStop(1, 'rgba(175,160,137,0)');
        ctx.fillStyle = grad; ctx.fill();
        // Line
        ctx.beginPath();
        valid.forEach((p, i) => { const idx = pts.indexOf(p); const x = pad.l + idx / (days - 1) * iW, y = pad.t + iH - (p.mood - 1) / 4 * iH; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
        ctx.strokeStyle = 'rgba(175,160,137,.55)'; ctx.lineWidth = 1.5; ctx.stroke();
        // Points
        valid.forEach(p => { const idx = pts.indexOf(p); const x = pad.l + idx / (days - 1) * iW, y = pad.t + iH - (p.mood - 1) / 4 * iH; ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fillStyle = 'rgba(212,197,160,.9)'; ctx.fill(); });
    }
    ctx.fillStyle = 'rgba(139,139,139,.55)'; ctx.font = '8px DM Mono,monospace'; ctx.textAlign = 'center';
    pts.forEach((p, i) => { if (i % 3 === 0) { const x = pad.l + i / (days - 1) * iW; ctx.fillText(p.label, x, H - 4); } });
}

function renderDistFreqBars() {
    const container = $('distFreqBars'); if (!container) return;
    const data = JSON.parse(localStorage.getItem(window.INSIGHTS_KEY)) || [];
    const freq = {}; data.forEach(d => freq[d.distortion] = (freq[d.distortion] || 0) + 1);
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 6);
    if (!sorted.length) { container.innerHTML = '<p style="font-family:var(--fm);font-size:11px;color:var(--crd);letter-spacing:.08em">Analyse thoughts to build your frequency chart.</p>'; return; }
    const max = sorted[0][1];
    container.innerHTML = sorted.map(([name, count]) => `<div class="dfb-row"><div class="dfb-label">${name}</div><div class="dfb-track"><div class="dfb-fill" style="width:0" data-pct="${count / max * 100}"></div></div><div class="dfb-count">${count}</div></div>`).join('');
    setTimeout(() => { container.querySelectorAll('.dfb-fill').forEach(el => { el.style.width = el.dataset.pct + '%'; }); }, 200);
}

/* ════════════════════════
   WEEKLY SUMMARY
   ════════════════════════ */
function initWeeklySummary() {
    const btn = $('weeklySummaryBtn'), box = $('weeklySummaryBox'); if (!btn || !box) return;
    btn.addEventListener('click', async () => {
        if (!CLAUDE_KEY || CLAUDE_KEY === 'YOUR_CLAUDE_API_KEY_HERE') { box.style.display = 'block'; box.textContent = 'Add your Claude API key to enable AI summaries.'; return; }
        const journals = JSON.parse(localStorage.getItem(window.JOURNAL_KEY)) || [];
        const analyses = JSON.parse(localStorage.getItem(window.INSIGHTS_KEY)) || [];
        const week = new Date(); week.setDate(week.getDate() - 7);
        const recentJ = journals.filter(e => new Date(e.date) > week);
        const recentA = analyses.filter(e => new Date(e.date) > week);
        if (!recentJ.length && !recentA.length) { box.style.display = 'block'; box.textContent = 'Not enough data from this week yet.'; return; }
        box.style.display = 'block'; box.innerHTML = '<em>✦ Generating your weekly insight...</em>';
        try {
            const resp = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_KEY, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }, body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 250, messages: [{ role: 'user', content: `Write a compassionate 3-sentence weekly mental health summary.\n\nMood journals: ${recentJ.map(e => `Mood ${e.mood}/5`).join(', ') || 'none'}\nDistortions: ${recentA.map(e => e.distortion).join(', ') || 'none'}\n\nBe warm and specific. Address as "you". End with one small actionable suggestion.` }] }) });
            const d = await resp.json();
            box.innerHTML = '<strong style="color:var(--gd);display:block;margin-bottom:8px">✦ Your Week</strong>' + d.content[0].text;
        } catch (e) { box.textContent = 'Error connecting to Claude AI.'; }
    });
}

/* ════════════════════════
   BOOT
   ════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    initCursor(); initAuth();
    const activeUser = localStorage.getItem('cogni_active_user');
    if (activeUser) {
        state.currentUser = activeUser;
        const nu = $('navUser'); if (nu) nu.textContent = activeUser;
        window.INSIGHTS_KEY = `cogni_insights_${activeUser}`;
        window.JOURNAL_KEY = `cogni_journal_${activeUser}`;
        [$('loaderScreen'), $('introSplash'), $('loginSection'), $('postLoader')].forEach(el => { if (el) el.style.display = 'none'; });
        const app = $('appShell');
        if (app) { app.style.display = 'block'; setTimeout(() => { app.style.opacity = '1'; app.style.filter = 'blur(0)'; app.style.transform = 'scale(1)'; app.classList.add('revealed'); initAppFeatures(); }, 50); }
        if ($('breathFab')) $('breathFab').style.display = 'block';
    } else { startLoader(); }
});