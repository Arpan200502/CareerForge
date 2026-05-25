// ================================================
// RESUMEAI - JAVASCRIPT FUNCTIONALITY
// Smooth animations, interactions, and dynamic features
// ================================================

document.addEventListener('DOMContentLoaded', () => {
    // ============== NAVBAR SCROLL EFFECT ==============
    const navbar = document.getElementById('navbar');
    
    const handleScroll = () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // ============== MOBILE MENU ==============
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
        mobileMenuBtn.classList.toggle('active');
    });
    
    // Close mobile menu when clicking on a link
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-links a');
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
        });
    });
    
    // ============== WORKFLOW TABS ==============
    const workflowTabs = document.querySelectorAll('.workflow-tab');
    const workflowContents = document.querySelectorAll('.workflow-content');
    
    workflowTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            // Remove active class from all tabs and contents
            workflowTabs.forEach(t => t.classList.remove('active'));
            workflowContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            document.getElementById(`${targetTab}-workflow`).classList.add('active');
        });
    });
    
    // ============== ANIMATED COUNTERS ==============
    const animateCounter = (element, target, suffix = '') => {
        const duration = 2000;
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;
        
        const updateCounter = () => {
            current += increment;
            if (current < target) {
                element.textContent = Math.floor(current).toLocaleString() + suffix;
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = target.toLocaleString() + suffix;
            }
        };
        
        updateCounter();
    };
    
    // Intersection Observer for counter animation
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statNumbers = entry.target.querySelectorAll('.stat-number');
                statNumbers.forEach(stat => {
                    const target = parseInt(stat.dataset.count);
                    const suffix = stat.nextElementSibling?.classList.contains('stat-suffix') ? '' : '';
                    animateCounter(stat, target, suffix);
                });
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) {
        statsObserver.observe(heroStats);
    }
    
    // ============== SCROLL ANIMATIONS ==============
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in');
                entry.target.style.opacity = '1';
                scrollObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe elements for scroll animations
    const animateElements = document.querySelectorAll('.feature-card, .step, .testimonial-card, .pricing-card, .feature-small');
    animateElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.animationDelay = `${index * 0.1}s`;
        scrollObserver.observe(el);
    });
    
    // ============== SMOOTH SCROLL FOR ANCHOR LINKS ==============
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // ============== PARALLAX EFFECT FOR ORBS ==============
    const orbs = document.querySelectorAll('.gradient-orb');
    
    window.addEventListener('mousemove', (e) => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        
        orbs.forEach((orb, index) => {
            const speed = (index + 1) * 20;
            const xOffset = (x - 0.5) * speed;
            const yOffset = (y - 0.5) * speed;
            
            orb.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
        });
    });
    
    // ============== RESUME CARD HOVER EFFECTS ==============
    const resumeCards = document.querySelectorAll('.resume-card');
    
    resumeCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            if (!card.classList.contains('resume-center')) {
                card.style.transform = 'scale(0.9)';
                card.style.opacity = '0.8';
            }
        });
        
        card.addEventListener('mouseleave', () => {
            if (card.classList.contains('resume-left')) {
                card.style.transform = 'scale(0.85) rotateY(5deg)';
                card.style.opacity = '0.6';
            } else if (card.classList.contains('resume-right')) {
                card.style.transform = 'scale(0.85) rotateY(-5deg)';
                card.style.opacity = '0.6';
            }
        });
    });
    
    // ============== GAP ANALYSIS BAR ANIMATION ==============
    const gapBars = document.querySelectorAll('.gap-fill');
    
    const gapObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const targetWidth = entry.target.style.width;
                entry.target.style.width = '0%';
                setTimeout(() => {
                    entry.target.style.width = targetWidth;
                }, 100);
                gapObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    gapBars.forEach(bar => {
        gapObserver.observe(bar);
    });
    
    // ============== BUTTON RIPPLE EFFECT ==============
    const buttons = document.querySelectorAll('.btn');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s ease-out;
                pointer-events: none;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });
    
    // Add ripple keyframes
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
    
    // ============== TYPING EFFECT FOR INPUT MOCK ==============
    const inputCursor = document.querySelector('.input-cursor');
    if (inputCursor) {
        const text = 'Senior Software Engineer';
        let index = 0;
        
        const typeText = () => {
            if (index <= text.length) {
                inputCursor.textContent = text.slice(0, index) + '|';
                index++;
                setTimeout(typeText, 100);
            } else {
                // Reset and repeat
                setTimeout(() => {
                    index = 0;
                    typeText();
                }, 3000);
            }
        };
        
        // Start typing after a delay
        setTimeout(typeText, 2000);
    }
    
    // ============== TEMPLATE SELECTION ANIMATION ==============
    const templateMocks = document.querySelectorAll('.template-mock');
    let currentTemplate = 0;
    
    const cycleTemplates = () => {
        templateMocks.forEach((t, i) => {
            t.classList.toggle('active', i === currentTemplate);
        });
        currentTemplate = (currentTemplate + 1) % templateMocks.length;
    };
    
    setInterval(cycleTemplates, 2000);
    
    // ============== SCORE CIRCLE ANIMATION ==============
    const scoreCircle = document.querySelector('.score-circle');
    
    if (scoreCircle) {
        const scoreObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const scoreValue = entry.target.querySelector('.score-value');
                    let count = 0;
                    const target = 78;
                    
                    const updateScore = () => {
                        if (count < target) {
                            count += 2;
                            scoreValue.textContent = Math.min(count, target);
                            requestAnimationFrame(updateScore);
                        }
                    };
                    
                    updateScore();
                    scoreObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        scoreObserver.observe(scoreCircle);
    }
    
    // ============== LAZY LOADING FOR IMAGES (if any) ==============
    const lazyImages = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });
    
    lazyImages.forEach(img => imageObserver.observe(img));
    
    // ============== ACCESSIBILITY: KEYBOARD NAVIGATION ==============
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            mobileMenu.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
        }
    });
    
    // ============== PRELOADER (Optional) ==============
    window.addEventListener('load', () => {
        document.body.classList.add('loaded');
    });
    
    console.log('ResumeAI Landing Page Initialized 🚀');
});