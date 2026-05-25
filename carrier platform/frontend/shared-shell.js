import { Clerk } from '/node_modules/@clerk/clerk-js/dist/clerk.mjs';

const CLERK_PUBLISHABLE_KEY = 'pk_test_dGlkeS1hcmFjaG5pZC04Ni5jbGVyay5hY2NvdW50cy5kZXYk';

const links = [
  { href: '/index.html', label: 'Home', key: 'home' },
  { href: '/resume-builder/', label: 'Resume Builder', key: 'resume-builder' },
  { href: '/resume-analyzer/', label: 'Resume Analyzer', key: 'resume-analyzer' },
  { href: '/cover-letter/', label: 'Cover Letter', key: 'cover-letter' },
  { href: '/interviewer/', label: 'Interviewer', key: 'interviewer' },
  { href: '/job-listings/', label: 'Job Listings', key: 'job-listings' },
];

let clerk = null;
let pendingFeaturePath = null;

const featurePathPrefixes = ['/resume-builder', '/resume-analyzer', '/cover-letter', '/interviewer', '/job-listings'];

function isFeaturePath(pathname) {
  return featurePathPrefixes.some((prefix) => pathname.startsWith(prefix));
}

function detectPageKey() {
  const first = window.location.pathname.split('/').filter(Boolean)[0] || 'index.html';
  if (first === 'resume-builder' || first === 'resume-analyzer' || first === 'cover-letter' || first === 'interviewer') {
    return first;
  }
  return 'home';
}

function shellMarkup(activeKey) {
  const navLinks = links
    .map((link) => {
      const active = link.key === activeKey ? 'active' : '';
      return `<a class="cf-shell-link ${active}" href="${link.href}">${link.label}</a>`;
    })
    .join('');

  return `
    <header class="cf-shell-nav">
      <div class="cf-shell-inner">
        <a class="cf-shell-brand" href="/index.html">
          <span class="cf-shell-dot"></span>
          <span>Career Forge</span>
        </a>
        <nav class="cf-shell-links">${navLinks}</nav>
        <div class="cf-shell-actions" id="cf-shell-actions">
          <button class="cf-shell-btn" id="cf-login-btn">Login</button>
          <button class="cf-shell-btn" id="cf-register-btn">Register</button>
          <div id="cf-user-button" style="display:none;"></div>
        </div>
      </div>
    </header>
    <div class="cf-feature-gate" id="cf-feature-gate" aria-hidden="true">
      <div class="cf-feature-gate-card">
        <h3>Login Required</h3>
        <p>Please sign in or create an account to use this feature.</p>
        <div class="cf-feature-gate-actions">
          <button class="cf-shell-btn" id="cf-gate-login">Login</button>
          <button class="cf-shell-btn" id="cf-gate-register">Register</button>
          <a class="cf-shell-link" href="/index.html">Back to Home</a>
        </div>
      </div>
    </div>
  `;
}

function mountShell() {
  const activeKey = detectPageKey();
  document.body.dataset.cfPage = activeKey;
  document.body.classList.add('cf-shell-enabled');
  document.body.insertAdjacentHTML('afterbegin', shellMarkup(activeKey));
}

async function loadClerkUIBundle(publishableKey) {
  const parts = publishableKey.split('_');
  if (parts.length < 3) throw new Error('Invalid Clerk publishable key');
  const clerkDomain = atob(parts[2]).slice(0, -1);

  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://${clerkDomain}/npm/@clerk/ui@1/dist/ui.browser.js`;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load Clerk UI bundle'));
    document.head.appendChild(script);
  });
}

function closeAuthModal() {
  try {
    clerk.closeSignIn?.();
    clerk.closeSignUp?.();
  } catch (e) {
    // no-op
  }
}

function openAuthModal(view) {
  if (!clerk) return;

  closeAuthModal();

  if (view === 'signUp') {
    clerk.openSignUp({
      signInUrl: '/index.html',
      afterSignInUrl: window.location.href,
      afterSignUpUrl: window.location.href,
      appearance: {
        variables: {
          colorPrimary: '#57d6ff',
          colorBackground: '#0b1222',
          colorInputBackground: '#101a31',
        },
      },
    });
  } else {
    clerk.openSignIn({
      signUpUrl: '/index.html',
      afterSignInUrl: window.location.href,
      afterSignUpUrl: window.location.href,
      appearance: {
        variables: {
          colorPrimary: '#57d6ff',
          colorBackground: '#0b1222',
          colorInputBackground: '#101a31',
        },
      },
    });
  }
}

function attachShellEvents() {
  document.getElementById('cf-login-btn')?.addEventListener('click', () => openAuthModal('signIn'));
  document.getElementById('cf-register-btn')?.addEventListener('click', () => openAuthModal('signUp'));
  document.getElementById('cf-gate-login')?.addEventListener('click', () => openAuthModal('signIn'));
  document.getElementById('cf-gate-register')?.addEventListener('click', () => openAuthModal('signUp'));

  document.addEventListener('click', (event) => {
    const anchor = event.target.closest('a[href]');
    if (!anchor || !clerk || clerk.isSignedIn) return;

    const target = new URL(anchor.getAttribute('href'), window.location.origin);
    if (!isFeaturePath(target.pathname)) return;

    event.preventDefault();
    pendingFeaturePath = `${target.pathname}${target.search}${target.hash}`;
    openAuthModal('signIn');
  });
}

function updateFeatureAccess() {
  const gate = document.getElementById('cf-feature-gate');
  if (!gate || !clerk) return;

  const featurePage = detectPageKey() !== 'home';

  if (!clerk.isSignedIn && featurePage) {
    gate.classList.add('open');
    gate.setAttribute('aria-hidden', 'false');
    openAuthModal('signIn');
    return;
  }

  gate.classList.remove('open');
  gate.setAttribute('aria-hidden', 'true');
}

function updateAuthUI() {
  const loginBtn = document.getElementById('cf-login-btn');
  const registerBtn = document.getElementById('cf-register-btn');
  const userButton = document.getElementById('cf-user-button');

  if (!loginBtn || !registerBtn || !userButton || !clerk) return;

  if (clerk.isSignedIn) {
    loginBtn.style.display = 'none';
    registerBtn.style.display = 'none';
    userButton.style.display = 'block';
    userButton.innerHTML = '';
    clerk.mountUserButton(userButton, {
      userProfileMode: 'modal',
      appearance: {
        variables: {
          colorPrimary: '#57d6ff',
        },
      },
    });

    if (pendingFeaturePath) {
      const nextPath = pendingFeaturePath;
      pendingFeaturePath = null;
      window.location.href = nextPath;
      return;
    }
  } else {
    try {
      clerk.unmountUserButton(userButton);
    } catch (e) {
      // no-op
    }
    userButton.style.display = 'none';
    loginBtn.style.display = 'inline-flex';
    registerBtn.style.display = 'inline-flex';
  }

  updateFeatureAccess();
}

async function initClerk() {
  await loadClerkUIBundle(CLERK_PUBLISHABLE_KEY);

  clerk = new Clerk(CLERK_PUBLISHABLE_KEY);
  await clerk.load({
    ui: { ClerkUI: window.__internal_ClerkUICtor },
    signInFallbackRedirectUrl: window.location.href,
    signUpFallbackRedirectUrl: window.location.href,
    afterSignOutUrl: '/index.html',
  });

  clerk.addListener(() => updateAuthUI());
  updateAuthUI();
}

async function bootstrap() {
  mountShell();
  attachShellEvents();

  try {
    await initClerk();
  } catch (error) {
    console.error('Clerk initialization failed:', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
