/**
 * Browsers expose GPS geolocation only in a "secure context" (HTTPS, or localhost).
 * Production-style http://PUBLIC_IP deployments will fail silently or with generic errors unless we explain.
 */
export function geolocationUnavailableReason(): string | null {
    if (typeof navigator === 'undefined') return null;
    if (!navigator.geolocation) {
        return 'Geolocation is not supported by this browser.';
    }
    if (typeof window !== 'undefined' && !window.isSecureContext) {
        return "GPS only works on HTTPS or localhost (browsers block it on http://PUBLIC_IP). Add a subdomain (e.g. app.yourdomain.com → this server's IP) with TLS, or search / tap the map instead.";
    }
    return null;
}

export function geolocationFailureMessage(err: GeolocationPositionError): string {
    switch (err.code) {
        case 1:
            return 'Location permission denied. Allow location in your browser, or search / use the map instead.';
        case 2:
            return 'Could not determine your position. Try again or search / use the map.';
        case 3:
            return 'Location timed out. Try again or search / use the map.';
        default:
            return 'Unable to get GPS. Use location search or the map instead.';
    }
}
