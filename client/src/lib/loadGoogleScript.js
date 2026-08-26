// Google Identity Services' vanilla <script> SDK, loaded once and cached -
// deliberately not the @react-oauth/google npm package (that's just a thin
// wrapper around this exact same script) to avoid adding a dependency for
// something this small. `window.google.accounts.id` is what
// GoogleSignInButton.jsx actually calls once this resolves.
let loadPromise = null;

export function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Failed to load Google Sign-In'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
