/**
 * Geocode an address to get coordinates (mock implementation)
 * In production, this would use the Google Geocoding API
 */
export function geocodeAddress(address: string): { lat: number; lng: number } | null {
    // Mock coordinates for common cities
    const cityCoordinates: Record<string, { lat: number; lng: number }> = {
        'san francisco': { lat: 37.7749, lng: -122.4194 },
        'new york': { lat: 40.7128, lng: -74.0060 },
        'napa valley': { lat: 38.2975, lng: -122.2869 },
        'boston': { lat: 42.3601, lng: -71.0589 },
        'chicago': { lat: 41.8781, lng: -87.6298 },
        'austin': { lat: 30.2672, lng: -97.7431 },
        'seattle': { lat: 47.6062, lng: -122.3321 },
        'sedona': { lat: 34.8697, lng: -111.7610 },
        'los angeles': { lat: 34.0522, lng: -118.2437 },
        'miami': { lat: 25.7617, lng: -80.1918 },
    };

    const normalizedAddress = address.toLowerCase();

    for (const [city, coords] of Object.entries(cityCoordinates)) {
        if (normalizedAddress.includes(city)) {
            return coords;
        }
    }

    // Default to center of US if not found
    return { lat: 39.8283, lng: -98.5795 };
}

/**
 * Generate Google Maps embed URL
 */
export function generateMapEmbedUrl(location: string, venue: string): string {
    const query = encodeURIComponent(`${venue}, ${location}`);
    return `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${query}`;
}

/**
 * Generate Google Maps link for opening in new tab
 */
export function generateMapLink(location: string, venue: string): string {
    const query = encodeURIComponent(`${venue}, ${location}`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

/**
 * Generate directions link
 */
export function generateDirectionsLink(location: string, venue: string): string {
    const destination = encodeURIComponent(`${venue}, ${location}`);
    return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
}
