import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EventCard } from '../components/EventCard';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Search, Filter, X, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import type { EventCategory, Event } from '../types';
import { runAPI } from '../api';
import { toast } from 'sonner';

export function AllEvents() {
  const [searchParams, setSearchParams] = useSearchParams();
  const api = runAPI();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [locationText, setLocationText] = useState(searchParams.get('location') || '');
  const [eventStartDate, setEventStartDate] = useState(searchParams.get('dateFrom') || '');
  const [priceType, setPriceType] = useState<'all' | 'free' | 'paid'>(
    (searchParams.get('priceType') as 'all' | 'free' | 'paid') || 'all',
  );
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [radiusKm, setRadiusKm] = useState<number>(() => {
    const r = searchParams.get('radiusKm');
    const n = r != null && r !== '' ? Number(r) : NaN;
    return Number.isFinite(n) && n > 0 ? n : 50;
  });
  const [geoCenter, setGeoCenter] = useState<{ lat: number; lng: number } | null>(() => {
    // Important: Number(null) === 0 — absent lat/lng must NOT become (0, 0) or the URL
    // would always gain bogus geo filters on first load.
    const latRaw = searchParams.get('lat');
    const lngRaw = searchParams.get('lng');
    if (latRaw == null || lngRaw === '' || lngRaw == null || lngRaw === '') return null;
    const lat = Number(latRaw);
    const lng = Number(lngRaw);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  });
  const [geoLabel, setGeoLabel] = useState<string>('');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'date');

  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsPage, setEventsPage] = useState(Number(searchParams.get('page') || '0'));
  const [eventsTotal, setEventsTotal] = useState(0);
  const [eventsTotalPages, setEventsTotalPages] = useState(0);
  const [eventsLoading, setEventsLoading] = useState(false);

  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [debouncedLocation, setDebouncedLocation] = useState(locationText);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchQuery), 350);
    return () => window.clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedLocation(locationText), 350);
    return () => window.clearTimeout(t);
  }, [locationText]);

  useEffect(() => {
    let cancelled = false;
    api.getCategories()
      .then((rows) => { if (!cancelled) setCategories(rows); })
      .catch((err) => { if (!cancelled) console.error(err); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setEventsPage(0);
  }, [debouncedSearch, debouncedLocation, eventStartDate, priceType, category, sortBy, radiusKm, geoCenter?.lat, geoCenter?.lng]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());
    if (debouncedLocation.trim()) params.set('location', debouncedLocation.trim());
    if (eventStartDate) params.set('dateFrom', eventStartDate);
    if (priceType !== 'all') params.set('priceType', priceType);
    if (category !== 'all') params.set('category', category);
    if (sortBy !== 'date') params.set('sort', sortBy);
    if (eventsPage > 0) params.set('page', String(eventsPage));
    if (geoCenter) {
      params.set('lat', String(geoCenter.lat));
      params.set('lng', String(geoCenter.lng));
      params.set('radiusKm', String(radiusKm));
    }
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, debouncedLocation, eventStartDate, priceType, category, sortBy, eventsPage, geoCenter, radiusKm, setSearchParams]);

  const sortParam = useMemo(() => {
    switch (sortBy) {
      case 'price-low':
      case 'price-high':
        return { sortBy: 'ticketPrice', sortDir: sortBy === 'price-low' ? 'asc' as const : 'desc' as const };
      case 'name':
        return { sortBy: 'eventName', sortDir: 'asc' as const };
      case 'newest':
        return { sortBy: 'createdAt', sortDir: 'desc' as const };
      case 'date':
      default:
        return { sortBy: 'eventStartInstant', sortDir: 'asc' as const };
    }
  }, [sortBy]);

  useEffect(() => {
    let cancelled = false;
    setEventsLoading(true);
    api.discoverEvents({
      page: eventsPage,
      size: 12,
      q: debouncedSearch.trim() || undefined,
      location: debouncedLocation.trim() || undefined,
      dateFrom: eventStartDate || undefined,
      priceType,
      category: category === 'all' ? undefined : category,
      lat: geoCenter?.lat,
      lng: geoCenter?.lng,
      radiusKm: geoCenter ? radiusKm : undefined,
      sortBy: sortParam.sortBy,
      sortDir: sortParam.sortDir,
      futureOnly: true,
    })
      .then((res) => {
        if (cancelled) return;
        setEvents(Array.isArray(res.content) ? res.content : []);
        setEventsTotal(res.totalElements ?? 0);
        setEventsTotalPages(res.totalPages ?? 0);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error(err);
          toast.error('Could not load events from discovery service');
        }
      })
      .finally(() => {
        if (!cancelled) setEventsLoading(false);
      });
    return () => { cancelled = true; };
  }, [eventsPage, debouncedSearch, debouncedLocation, eventStartDate, priceType, category, geoCenter, radiusKm, sortParam]);

  const handleNearMe = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    toast.loading('Getting your location...', { id: 'near-me' });
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setGeoCenter({ lat: coords.latitude, lng: coords.longitude });
        setGeoLabel('Near me');
        toast.success(`Using your location (${radiusKm} mile radius)`, { id: 'near-me' });
      },
      () => toast.error('Unable to get your location', { id: 'near-me' }),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setLocationText('');
    setEventStartDate('');
    setPriceType('all');
    setCategory('all');
    setSortBy('date');
    setRadiusKm(50);
    setGeoCenter(null);
    setGeoLabel('');
    setEventsPage(0);
    setSearchParams({});
  };

  const hasActiveFilters = !!(
    searchQuery.trim()
    || locationText.trim()
    || eventStartDate
    || priceType !== 'all'
    || category !== 'all'
    || sortBy !== 'date'
    || geoCenter
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-16 z-40">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-6">Browse Events</h1>

          <div className="flex flex-col sm:flex-row gap-3 mb-3">
  <div className="relative flex-1 min-w-0">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
    <Input
      placeholder="Search by event name/description..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="pl-10 w-full"
    />
  </div>

  {/* <div className="flex gap-2 flex-1 min-w-0">
    <Input
      placeholder="Near location (city/address)"
      value={locationText}
      onChange={(e) => setLocationText(e.target.value)}
      className="w-full min-w-0"
    />
    <Button type="button" variant="outline" className="shrink-0" onClick={handleNearTypedLocation}>
      Near
    </Button>
  </div> */}
  <Button
    variant="outline"
    onClick={handleNearMe}
    className="shrink-0 whitespace-nowrap"
  >
    <MapPin className="h-4 w-4 mr-2" />
    Near Me
  </Button>

  <Select value={String(radiusKm)} onValueChange={(v) => setRadiusKm(Number(v))}>
              <SelectTrigger className="w-[145px]"><SelectValue placeholder="Radius" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 mile</SelectItem>
                <SelectItem value="10">10 mile</SelectItem>
                <SelectItem value="25">25 mile</SelectItem>
                <SelectItem value="50">50 mile</SelectItem>
                <SelectItem value="100">100 mile</SelectItem>
              </SelectContent>
            </Select>

  
</div>

          <div className="flex flex-wrap gap-3">
            <Select value={priceType} onValueChange={(v: 'all' | 'free' | 'paid') => setPriceType(v)}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Price" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[210px]"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={String((cat as any).categoryId || cat.id)} value={cat.categoryName}>
                    {cat.categoryName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={eventStartDate}
              onChange={(e) => setEventStartDate(e.target.value)}
              className="w-[180px]"
              aria-label="Event starts on or after date"
            />

            
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[165px]"><SelectValue placeholder="Sort" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Sort by Date</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="name">Sort by Name</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>

            

            {hasActiveFilters && (
              <Button variant="ghost" onClick={handleClearFilters} className="gap-2">
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>

          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-4">
              {searchQuery.trim() && <Badge variant="secondary">Name: {searchQuery.trim()}</Badge>}
              {locationText.trim() && <Badge variant="secondary">Location: {locationText.trim()}</Badge>}
              {eventStartDate && <Badge variant="secondary">Starts after: {eventStartDate}</Badge>}
              {priceType !== 'all' && <Badge variant="secondary">Price: {priceType}</Badge>}
              {category !== 'all' && <Badge variant="secondary">Category: {category}</Badge>}
              {geoCenter && (
                <Badge variant="secondary">
                  {geoLabel || 'Near selected point'} ({radiusKm} mile radius)
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <p className="text-gray-600">
            {eventsLoading
              ? 'Loading…'
              : `${eventsTotal} ${eventsTotal === 1 ? 'event' : 'events'} (page ${eventsPage + 1}${eventsTotalPages > 0 ? ` of ${eventsTotalPages}` : ''})`}
          </p>
        </div>

        {events.length === 0 && !eventsLoading ? (
          <div className="text-center py-16">
            <Filter className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">No events found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your filters.</p>
            {hasActiveFilters && <Button onClick={handleClearFilters}>Clear Filters</Button>}
          </div>
        ) : eventsLoading ? (
          <div className="text-center py-16 text-gray-600">Loading events…</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard key={event.eventId} event={event} />
              ))}
            </div>
            {eventsTotal > 0 && (
              <div className="flex items-center justify-between gap-4 pt-8 border-t mt-8">
                <p className="text-sm text-gray-600">
                  Page {eventsPage + 1} of {Math.max(1, eventsTotalPages)} ({eventsTotal} total)
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={eventsLoading || eventsPage <= 0}
                    onClick={() => setEventsPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={eventsLoading || eventsPage >= eventsTotalPages - 1}
                    onClick={() => setEventsPage((p) => p + 1)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
