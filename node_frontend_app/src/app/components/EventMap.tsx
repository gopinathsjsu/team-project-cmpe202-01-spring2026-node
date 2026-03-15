import { generateMapLink, generateDirectionsLink } from '../context/mapUtils';
import { Button } from './ui/button';
import { ExternalLink, Navigation } from 'lucide-react';

interface EventMapProps {
    location: string;
    venue: string;
    className?: string;
}

export function EventMap({ location, venue, className = '' }: EventMapProps) {
    // Using Google Maps static image with a marker
    //const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${mapQuery}&zoom=14&size=600x300&markers=color:red%7C${mapQuery}&key=YOUR_API_KEY`;

    // Fallback: Use OpenStreetMap with Leaflet-style embed
    //const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=-0.1,51.5,-0.09,51.51&layer=mapnik&marker=51.505,-0.09`;

    return (
        <div className={`space-y-3 ${className}`}>
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-200 border">
                {/* Interactive Map Placeholder */}
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                    <div className="text-center p-6">
                        <div className="w-16 h-16 bg-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <div className="w-4 h-4 bg-white rounded-full"></div>
                        </div>
                        <p className="font-medium text-gray-700 mb-1">{venue}</p>
                        <p className="text-sm text-gray-600">{location}</p>
                    </div>
                </div>

                {/* Overlay for clickable area */}
                <a
                    href={generateMapLink(location, venue)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/50 transition-opacity"
                >
                    <Button variant="secondary" size="lg">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open in Google Maps
                    </Button>
                </a>
            </div>

            <div className="flex gap-2">
                <Button
                    variant="outline"
                    className="flex-1"
                    asChild
                >
                    <a
                        href={generateMapLink(location, venue)}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View on Map
                    </a>
                </Button>

                <Button
                    variant="outline"
                    className="flex-1"
                    asChild
                >
                    <a
                        href={generateDirectionsLink(location, venue)}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Navigation className="h-4 w-4 mr-2" />
                        Get Directions
                    </a>
                </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
                Click to open in Google Maps for full interactive experience
            </p>
        </div>
    );
}
