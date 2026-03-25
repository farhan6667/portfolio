/* ============================================================
   SYED FARHAN AHMED — PORTFOLIO SCRIPTS
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {

    // ==================== PRELOADER ====================
    window.addEventListener('load', function () {
        setTimeout(function () {
            const preloader = document.getElementById('preloader');
            if (preloader) {
                preloader.style.transition = 'opacity 0.6s ease, visibility 0.6s ease';
                preloader.style.opacity = '0';
                preloader.style.visibility = 'hidden';
                setTimeout(function () { preloader.remove(); }, 600);
            }
        }, 2200);
    });

    // ==================== AOS INIT ====================
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 700,
            easing: 'ease-out-cubic',
            once: true,
            offset: 60,
            disable: function () { return window.innerWidth < 480; }
        });
    }

    // ==================== CUSTOM CURSOR ====================
    const cursor = document.getElementById('cursor');
    const cursorDot = document.getElementById('cursorDot');

    if (cursor && cursorDot && window.innerWidth > 991) {
        let mouseX = 0, mouseY = 0;
        let cursorX = 0, cursorY = 0;

        document.addEventListener('mousemove', function (e) {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursorDot.style.left = mouseX + 'px';
            cursorDot.style.top = mouseY + 'px';
        });

        function animateCursor() {
            cursorX += (mouseX - cursorX) * 0.15;
            cursorY += (mouseY - cursorY) * 0.15;
            cursor.style.left = cursorX + 'px';
            cursor.style.top = cursorY + 'px';
            requestAnimationFrame(animateCursor);
        }
        animateCursor();

        // Hover effect on interactive elements
        var hoverTargets = document.querySelectorAll('a, button, .service-card, .cert-card, .hof-card, .edu-card, .contact-card, .skill-card, .nav-cta, .btn-primary-cyber, .btn-outline-cyber');
        hoverTargets.forEach(function (el) {
            el.addEventListener('mouseenter', function () { cursor.classList.add('hovering'); });
            el.addEventListener('mouseleave', function () { cursor.classList.remove('hovering'); });
        });
    } else {
        if (cursor) cursor.style.display = 'none';
        if (cursorDot) cursorDot.style.display = 'none';
    }

    // ==================== TYPING EFFECT ====================
    var roles = [
        'IT Security Analyst',
        'Certified Ethical Hacker (CEH)',
        'SOC Analyst & SIEM Expert',
        'Bug Bounty Hunter — Top Ranked',
        'Penetration Testing Specialist',
        'Network Security Architect',
        'Digital Forensics Investigator (CHFI)',
        'Cybersecurity Awareness Trainer',
        'Anti-Hacker Specialist'
    ];

    var typedOutput = document.getElementById('typedOutput');
    var roleIndex = 0;
    var charIndex = 0;
    var isDeleting = false;

    function typeRole() {
        if (!typedOutput) return;

        var currentRole = roles[roleIndex];

        if (isDeleting) {
            typedOutput.textContent = currentRole.substring(0, charIndex - 1);
            charIndex--;
        } else {
            typedOutput.textContent = currentRole.substring(0, charIndex + 1);
            charIndex++;
        }

        var speed = isDeleting ? 30 : 65;

        if (!isDeleting && charIndex === currentRole.length) {
            speed = 2200;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            roleIndex = (roleIndex + 1) % roles.length;
            speed = 400;
        }

        setTimeout(typeRole, speed);
    }

    typeRole();

    // ==================== COUNTER ANIMATION ====================
    var counters = document.querySelectorAll('.stat-num');
    var counterObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                var el = entry.target;
                var target = parseInt(el.getAttribute('data-target'), 10);
                var duration = 2000;
                var step = target / (duration / 16);
                var current = 0;

                function tick() {
                    current += step;
                    if (current < target) {
                        el.textContent = Math.floor(current);
                        requestAnimationFrame(tick);
                    } else {
                        el.textContent = target;
                    }
                }

                tick();
                counterObserver.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(function (c) { counterObserver.observe(c); });

    // ==================== SKILL BARS ====================
    var skillFills = document.querySelectorAll('.sb-fill');
    var skillObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                var fill = entry.target;
                fill.style.width = fill.getAttribute('data-width') + '%';
                skillObserver.unobserve(fill);
            }
        });
    }, { threshold: 0.3 });

    skillFills.forEach(function (f) { skillObserver.observe(f); });

    // ==================== NAVBAR ====================
    var navbar = document.getElementById('mainNavbar');
    var scrollTopBtn = document.getElementById('scrollTopBtn');

    function handleScroll() {
        var scrollY = window.scrollY || window.pageYOffset;

        // Navbar scrolled state
        if (navbar) {
            navbar.classList.toggle('scrolled', scrollY > 60);
        }

        // Scroll to top button
        if (scrollTopBtn) {
            scrollTopBtn.classList.toggle('visible', scrollY > 500);
        }

        // Active nav links
        var sections = document.querySelectorAll('section[id]');
        sections.forEach(function (section) {
            var top = section.offsetTop - 120;
            var bottom = top + section.offsetHeight;
            var id = section.getAttribute('id');
            var link = document.querySelector('.nav-link[href="#' + id + '"]');

            if (link) {
                if (scrollY >= top && scrollY < bottom) {
                    document.querySelectorAll('.nav-link').forEach(function (l) {
                        l.classList.remove('active');
                    });
                    link.classList.add('active');
                }
            }
        });
    }

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Scroll to top click
    if (scrollTopBtn) {
        scrollTopBtn.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ==================== MOBILE NAV CLOSE ====================
    var navLinks = document.querySelectorAll('.nav-link, .nav-cta');
    navLinks.forEach(function (link) {
        link.addEventListener('click', function () {
            var navCollapse = document.getElementById('navContent');
            if (navCollapse && navCollapse.classList.contains('show')) {
                var bsCollapse = bootstrap.Collapse.getOrCreateInstance(navCollapse);
                bsCollapse.hide();
            }
        });
    });

    // ==================== SMOOTH SCROLL ====================
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            var target = document.querySelector(this.getAttribute('href'));
            if (target) {
                var offset = 80;
                var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({ top: top, behavior: 'smooth' });
            }
        });
    });

    // ==================== CONTACT FORM ====================
    var contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var btn = this.querySelector('button[type="submit"]');
            var originalContent = btn.innerHTML;

            btn.innerHTML = '<span class="btn-content"><i class="fas fa-check-circle me-2"></i>Message Sent!</span>';
            btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';

            setTimeout(function () {
                btn.innerHTML = originalContent;
                btn.style.background = '';
                contactForm.reset();
            }, 3000);
        });
    }

    // ==================== PARTICLE SYSTEM ====================
    var particleCanvas = document.getElementById('particleCanvas');
    if (particleCanvas) {
        var pCtx = particleCanvas.getContext('2d');
        var particles = [];

        function resizeParticleCanvas() {
            particleCanvas.width = window.innerWidth;
            particleCanvas.height = window.innerHeight;
        }

        resizeParticleCanvas();
        window.addEventListener('resize', resizeParticleCanvas);

        function Particle() {
            this.x = Math.random() * particleCanvas.width;
            this.y = Math.random() * particleCanvas.height;
            this.size = Math.random() * 1.5 + 0.3;
            this.speedX = (Math.random() - 0.5) * 0.35;
            this.speedY = (Math.random() - 0.5) * 0.35;
            this.opacity = Math.random() * 0.3 + 0.05;
        }

        Particle.prototype.update = function () {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.x < 0 || this.x > particleCanvas.width) this.speedX *= -1;
            if (this.y < 0 || this.y > particleCanvas.height) this.speedY *= -1;
        };

        Particle.prototype.draw = function () {
            pCtx.fillStyle = 'rgba(6, 182, 212, ' + this.opacity + ')';
            pCtx.beginPath();
            pCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            pCtx.fill();
        };

        // Create particles
        var particleCount = Math.min(70, Math.floor(window.innerWidth / 20));
        for (var i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }

        function animateParticles() {
            pCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

            for (var i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();

                for (var j = i + 1; j < particles.length; j++) {
                    var dx = particles[i].x - particles[j].x;
                    var dy = particles[i].y - particles[j].y;
                    var dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 130) {
                        pCtx.strokeStyle = 'rgba(6, 182, 212, ' + (0.06 * (1 - dist / 130)) + ')';
                        pCtx.lineWidth = 0.5;
                        pCtx.beginPath();
                        pCtx.moveTo(particles[i].x, particles[i].y);
                        pCtx.lineTo(particles[j].x, particles[j].y);
                        pCtx.stroke();
                    }
                }
            }

            requestAnimationFrame(animateParticles);
        }

        animateParticles();
    }

    // ==================== MATRIX RAIN ====================
    var matrixCanvas = document.getElementById('matrixCanvas');
    if (matrixCanvas) {
        var mCtx = matrixCanvas.getContext('2d');

        function resizeMatrixCanvas() {
            matrixCanvas.width = window.innerWidth;
            matrixCanvas.height = window.innerHeight;
        }

        resizeMatrixCanvas();
        window.addEventListener('resize', resizeMatrixCanvas);

        var matrixChars = '01アイウエオカキクケコサシスセソ10110100101';
        var fontSize = 14;
        var columns = Math.floor(matrixCanvas.width / fontSize);
        var drops = [];

        for (var c = 0; c < columns; c++) {
            drops[c] = Math.floor(Math.random() * -100);
        }

        function drawMatrix() {
            mCtx.fillStyle = 'rgba(8, 11, 20, 0.05)';
            mCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);

            mCtx.fillStyle = '#06b6d4';
            mCtx.font = fontSize + 'px monospace';

            for (var i = 0; i < drops.length; i++) {
                var text = matrixChars.charAt(Math.floor(Math.random() * matrixChars.length));
                mCtx.fillText(text, i * fontSize, drops[i] * fontSize);

                if (drops[i] * fontSize > matrixCanvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        }

        setInterval(drawMatrix, 55);
    }

    // ==================== TILT EFFECT ON CARDS ====================
    if (window.innerWidth > 991) {
        var tiltCards = document.querySelectorAll('.service-card, .hof-card');

        tiltCards.forEach(function (card) {
            card.addEventListener('mousemove', function (e) {
                var rect = card.getBoundingClientRect();
                var x = e.clientX - rect.left;
                var y = e.clientY - rect.top;
                var centerX = rect.width / 2;
                var centerY = rect.height / 2;
                var rotateX = (y - centerY) / 25;
                var rotateY = (centerX - x) / 25;

                card.style.transform = 'perspective(1000px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateY(-6px)';
            });

            card.addEventListener('mouseleave', function () {
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
            });
        });
    }

    // ==================== CONSOLE SIGNATURE ====================
    console.log(
        '%c🛡️ Syed Farhan Ahmed — Cybersecurity Expert',
        'color: #06b6d4; font-size: 18px; font-weight: bold; text-shadow: 0 0 10px rgba(6,182,212,0.5);'
    );
    console.log(
        '%c15+ Years | 20+ Certifications | HackerOne Ranked #7 PK | OPPO Ranked #1',
        'color: #8b5cf6; font-size: 12px;'
    );
    console.log(
        '%cIf you can read this, we should talk security. 🔐',
        'color: #f59e0b; font-size: 11px;'
    );

});