/* ================================================================
   SYED FARHAN AHMED — PORTFOLIO SCRIPTS
   Advanced Cyber Animations + All Fixes
   ================================================================ */

document.addEventListener('DOMContentLoaded', function () {

    // ==================== PRELOADER TERMINAL ====================
    var termLines = [
        '> Initializing secure connection...',
        '> Loading threat intelligence modules...',
        '> System ready. Welcome, Farhan.'
    ];
    var lineEls = [
        document.getElementById('ptLine1'),
        document.getElementById('ptLine2'),
        document.getElementById('ptLine3')
    ];

    function typeTermLine(lineIdx, charIdx) {
        if (lineIdx >= termLines.length) return;
        var el = lineEls[lineIdx];
        if (!el) return;
        if (charIdx <= termLines[lineIdx].length) {
            el.textContent = termLines[lineIdx].substring(0, charIdx);
            setTimeout(function () { typeTermLine(lineIdx, charIdx + 1); }, 25);
        } else {
            setTimeout(function () { typeTermLine(lineIdx + 1, 0); }, 300);
        }
    }
    typeTermLine(0, 0);

    window.addEventListener('load', function () {
        setTimeout(function () {
            var pl = document.getElementById('preloader');
            if (pl) {
                pl.style.transition = 'opacity 0.6s ease, visibility 0.6s ease';
                pl.style.opacity = '0';
                pl.style.visibility = 'hidden';
                setTimeout(function () { pl.remove(); }, 600);
            }
        }, 2800);
    });

    // ==================== AOS ====================
    if (typeof AOS !== 'undefined') {
        AOS.init({ duration: 700, easing: 'ease-out-cubic', once: true, offset: 60 });
    }

    // ==================== CURSOR ====================
    var cursor = document.getElementById('cursor');
    var cursorDot = document.getElementById('cursorDot');
    if (cursor && cursorDot && window.innerWidth > 991) {
        var mx = 0, my = 0, cx = 0, cy = 0;
        document.addEventListener('mousemove', function (e) {
            mx = e.clientX; my = e.clientY;
            cursorDot.style.left = mx + 'px';
            cursorDot.style.top = my + 'px';
        });
        (function animCursor() {
            cx += (mx - cx) * 0.15; cy += (my - cy) * 0.15;
            cursor.style.left = cx + 'px'; cursor.style.top = cy + 'px';
            requestAnimationFrame(animCursor);
        })();
        document.querySelectorAll('a, button, .service-card, .cert-card, .cert-primary, .cert-secondary, .hof-card, .edu-card, .contact-card, .skill-card, .nav-cta, .btn-cyber-primary, .btn-cyber-outline').forEach(function (el) {
            el.addEventListener('mouseenter', function () { cursor.classList.add('hovering'); });
            el.addEventListener('mouseleave', function () { cursor.classList.remove('hovering'); });
        });
    } else {
        if (cursor) cursor.style.display = 'none';
        if (cursorDot) cursorDot.style.display = 'none';
    }

    // ==================== TYPING ====================
    var roles = [
        'Penetration Testing Specialist (CEH)',
        'Computer Forensics Investigator (CHFI)',
        'ISO 27001 Security Associate',
        'IT Security Analyst — 15+ Years',
        'SOC Analyst & SIEM Expert',
        'Bug Bounty Hunter — HackerOne #7 PK',
        'Incident Response & APT Hunter',
        'Cybersecurity Awareness Trainer'
    ];
    var typedOut = document.getElementById('typedOutput');
    var ri = 0, ci = 0, deleting = false;
    function typeRole() {
        if (!typedOut) return;
        var cur = roles[ri];
        if (deleting) { typedOut.textContent = cur.substring(0, ci - 1); ci--; }
        else { typedOut.textContent = cur.substring(0, ci + 1); ci++; }
        var spd = deleting ? 30 : 60;
        if (!deleting && ci === cur.length) { spd = 2200; deleting = true; }
        else if (deleting && ci === 0) { deleting = false; ri = (ri + 1) % roles.length; spd = 400; }
        setTimeout(typeRole, spd);
    }
    typeRole();

    // ==================== COUNTERS ====================
    var counters = document.querySelectorAll('.stat-num');
    var cObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
            if (e.isIntersecting) {
                var el = e.target, tgt = +el.dataset.target, dur = 2000, step = tgt / (dur / 16), cur = 0;
                (function tick() {
                    cur += step;
                    if (cur < tgt) { el.textContent = Math.floor(cur); requestAnimationFrame(tick); }
                    else el.textContent = tgt;
                })();
                cObs.unobserve(el);
            }
        });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { cObs.observe(c); });

    // ==================== SKILL BARS ====================
    var fills = document.querySelectorAll('.sb-fill');
    var sObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
            if (e.isIntersecting) { e.target.style.width = e.target.dataset.width + '%'; sObs.unobserve(e.target); }
        });
    }, { threshold: 0.3 });
    fills.forEach(function (f) { sObs.observe(f); });

    // ==================== NAVBAR ====================
    var nav = document.getElementById('mainNavbar');
    var stBtn = document.getElementById('scrollTopBtn');
    window.addEventListener('scroll', function () {
        var y = window.scrollY || window.pageYOffset;
        if (nav) nav.classList.toggle('scrolled', y > 60);
        if (stBtn) stBtn.classList.toggle('visible', y > 500);
        document.querySelectorAll('section[id]').forEach(function (sec) {
            var top = sec.offsetTop - 120, bot = top + sec.offsetHeight;
            var lnk = document.querySelector('.nav-link[href="#' + sec.id + '"]');
            if (lnk) lnk.classList.toggle('active', y >= top && y < bot);
        });
    }, { passive: true });
    if (stBtn) stBtn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });

    // Mobile nav close
    document.querySelectorAll('.nav-link, .nav-cta').forEach(function (l) {
        l.addEventListener('click', function () {
            var nc = document.getElementById('navContent');
            if (nc && nc.classList.contains('show')) bootstrap.Collapse.getOrCreateInstance(nc).hide();
        });
    });

    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (e) {
            e.preventDefault();
            var t = document.querySelector(this.getAttribute('href'));
            if (t) window.scrollTo({ top: t.getBoundingClientRect().top + window.pageYOffset - 80, behavior: 'smooth' });
        });
    });

    // ==================== CONTACT FORM ====================
    var cf = document.getElementById('contactForm');
    if (cf) cf.addEventListener('submit', function (e) {
        e.preventDefault();
        var btn = this.querySelector('button[type="submit"]'), orig = btn.innerHTML;
        btn.innerHTML = '<span class="btn-content"><i class="fas fa-check-circle me-2"></i>Message Sent!</span>';
        btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        setTimeout(function () { btn.innerHTML = orig; btn.style.background = ''; cf.reset(); }, 3000);
    });

    // ==================== PARTICLE SYSTEM ====================
    var pCanvas = document.getElementById('particleCanvas');
    if (pCanvas) {
        var pCtx = pCanvas.getContext('2d'), particles = [];
        function resizeP() { pCanvas.width = innerWidth; pCanvas.height = innerHeight; }
        resizeP(); addEventListener('resize', resizeP);

        function Pt() {
            this.x = Math.random() * pCanvas.width;
            this.y = Math.random() * pCanvas.height;
            this.s = Math.random() * 1.5 + 0.3;
            this.vx = (Math.random() - 0.5) * 0.35;
            this.vy = (Math.random() - 0.5) * 0.35;
            this.o = Math.random() * 0.3 + 0.05;
        }
        Pt.prototype.update = function () {
            this.x += this.vx; this.y += this.vy;
            if (this.x < 0 || this.x > pCanvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > pCanvas.height) this.vy *= -1;
        };
        Pt.prototype.draw = function () {
            pCtx.fillStyle = 'rgba(6,182,212,' + this.o + ')';
            pCtx.beginPath(); pCtx.arc(this.x, this.y, this.s, 0, Math.PI * 2); pCtx.fill();
        };
        for (var i = 0; i < Math.min(70, innerWidth / 20); i++) particles.push(new Pt());

        (function animP() {
            pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
            for (var i = 0; i < particles.length; i++) {
                particles[i].update(); particles[i].draw();
                for (var j = i + 1; j < particles.length; j++) {
                    var dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
                    var d = Math.sqrt(dx * dx + dy * dy);
                    if (d < 130) {
                        pCtx.strokeStyle = 'rgba(6,182,212,' + (0.06 * (1 - d / 130)) + ')';
                        pCtx.lineWidth = 0.5; pCtx.beginPath();
                        pCtx.moveTo(particles[i].x, particles[i].y);
                        pCtx.lineTo(particles[j].x, particles[j].y); pCtx.stroke();
                    }
                }
            }
            requestAnimationFrame(animP);
        })();
    }

    // ==================== MATRIX RAIN (Hex/Binary) ====================
    var mCanvas = document.getElementById('matrixCanvas');
    if (mCanvas) {
        var mCtx = mCanvas.getContext('2d');
        function resizeM() { mCanvas.width = innerWidth; mCanvas.height = innerHeight; }
        resizeM(); addEventListener('resize', resizeM);

        var chars = '01ABCDEF0123456789abcdef{}[]<>/\\|!@#$%^&*';
        var fSize = 14, cols = Math.floor(mCanvas.width / fSize);
        var drops = [];
        for (var c = 0; c < cols; c++) drops[c] = Math.floor(Math.random() * -100);

        setInterval(function () {
            mCtx.fillStyle = 'rgba(8,11,20,0.05)';
            mCtx.fillRect(0, 0, mCanvas.width, mCanvas.height);
            mCtx.fillStyle = '#06b6d4';
            mCtx.font = fSize + 'px monospace';
            for (var i = 0; i < drops.length; i++) {
                var t = chars.charAt(Math.floor(Math.random() * chars.length));
                mCtx.fillText(t, i * fSize, drops[i] * fSize);
                if (drops[i] * fSize > mCanvas.height && Math.random() > 0.975) drops[i] = 0;
                drops[i]++;
            }
        }, 55);
    }

    // ==================== 3D TILT ON CARDS ====================
    if (window.innerWidth > 991) {
        document.querySelectorAll('.service-card, .hof-card, .cert-primary').forEach(function (card) {
            card.addEventListener('mousemove', function (e) {
                var r = card.getBoundingClientRect();
                var x = e.clientX - r.left, y = e.clientY - r.top;
                var rx = (y - r.height / 2) / 25, ry = (r.width / 2 - x) / 25;
                card.style.transform = 'perspective(1000px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateY(-6px)';
            });
            card.addEventListener('mouseleave', function () {
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
            });
        });
    }

    // ==================== CONSOLE ====================
    console.log('%c🛡️ Syed Farhan Ahmed — CEH | CHFI | ISO 27001', 'color:#06b6d4; font-size:18px; font-weight:bold;');
    console.log('%c15+ Years | 20+ Certs | HackerOne #7 PK | OPPO #1', 'color:#8b5cf6; font-size:12px;');
});