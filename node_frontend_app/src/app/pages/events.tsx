import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom'
import { EventCard } from "../components/EventCard";
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Search, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import type { EventCategory, Event } from '../types';
import { runAPI } from '../api';
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Command, CommandGroup, CommandItem, CommandInput, CommandList } from "../components/ui/command";
import { Check, ChevronDown } from "lucide-react";

export function AllEvents() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const [selectedCategories, setselectedCategories] = useState<string[]>(
        searchParams.get('category')?.split(',') || []
    );
    const [priceFilter, setPriceFilter] = useState(searchParams.get('price') || 'all');
    const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'date');

    const [categories, setCategories] = useState<EventCategory[]>([]);

    const api = runAPI();

    const [events, setEvents] = useState<Event[]>([]);
    const [eventsPage, setEventsPage] = useState(0);
    const [eventsTotal, setEventsTotal] = useState(0);
    const [eventsTotalPages, setEventsTotalPages] = useState(0);
    const [eventsLoading, setEventsLoading] = useState(false);
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const t = window.setTimeout(() => setDebouncedSearch(searchQuery), 400);
        return () => window.clearTimeout(t);
    }, [searchQuery]);

    useEffect(() => {
        setEventsPage(0);
    }, [debouncedSearch]);

    useEffect(() => {
        setEventsPage(0);
    }, [selectedCategories, priceFilter, sortBy]);

    useEffect(() => {
        let cancelled = false;
        api.getCategories()
            .then((categories) => {
                if (!cancelled) setCategories(categories);
            })
            .catch((err) => {
                if (!cancelled) console.error(err);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        let cancelled = false;
        setEventsLoading(true);
        api
            .getActiveEventsPaged({
                page: eventsPage,
                size: 12,
                q: debouncedSearch.trim() || undefined,
            })
            .then((res) => {
                if (cancelled) return;
                setEvents(Array.isArray(res.content) ? res.content : []);
                setEventsTotal(res.totalElements);
                setEventsTotalPages(res.totalPages);
            })
            .catch((err) => {
                if (!cancelled) console.error(err);
            })
            .finally(() => {
                if (!cancelled) setEventsLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [debouncedSearch, eventsPage]);

    const toggleCategory = (categoryName: string) => {
        setselectedCategories(prev => {
            let next;
            if (categoryName === "None") {
                // If selecting "None", you might want to clear others
                next = prev.includes("None") ? [] : ["None"];
            } else {
                // If selecting a real category, remove "None"
                next = prev.filter(c => c !== "None");
                next = next.includes(categoryName)
                    ? next.filter(c => c !== categoryName)
                    : [...next, categoryName];
            }

            // Update SearchParams...
            return next;
        });
    };

    // const handleCategoryChange = (value: string) => {
    //     // value is a comma-separated string of category names
    //     const selected = value.split(',').filter(Boolean);
    //     setselectedCategories(selected);

    //     // Update URL
    //     const params = new URLSearchParams(window.location.search);
    //     if (selected.length > 0) {
    //         params.set('category', selected.join(','));
    //     } else {
    //         params.delete('category');
    //     }
    //     window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
    // };

    const filteredEvents = useMemo(() => {
        let filtered = events.filter((e: Event) => e.status === 'PUBLISHED');


        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(event =>
                event.eventName.toLowerCase().includes(query) ||
                event.eventDescription.toLowerCase().includes(query) ||
                event.eventLocation.locationAddress.toLowerCase().includes(query) ||
                event.eventLocation.locationName.toLowerCase().includes(query) //||
                //event.eventLocation?.locationCity?.toLowerCase().includes(query) ||
                //event.eventLocation?.locationState?.toLowerCase().includes(query) ||
                //event.eventLocation?.locationCountry?.toLowerCase().includes(query)
                //|| event.categories.some(cat => cat.toLowerCase().includes(query))
                //event.tags.some(tag => tag.toLowerCase().includes(query))
            );
        }

        // Category filter
        if (selectedCategories.length > 0) {
            filtered = filtered.filter(event => event.categories.some(cat => selectedCategories.includes(cat)));
        }

        // Price filter
        if (priceFilter === 'free') {
            filtered = filtered.filter(event => event.ticketPrice === 0);
        } else if (priceFilter === 'paid') {
            filtered = filtered.filter(event => event.ticketPrice > 0);
        }

        // Sort
        filtered = [...filtered].sort((a, b) => {
            switch (sortBy) {
                case 'date':
                    return new Date(a.eventStartInstant).getTime() - new Date(b.eventStartInstant).getTime();
                case 'price-low':
                    return a.ticketPrice - b.ticketPrice;
                case 'price-high':
                    return b.ticketPrice - a.ticketPrice;
                case 'popular':
                    return b.ticketsSold - a.ticketsSold;
                default:
                    return 0;
            }
        });

        return filtered;
    }, [events, searchQuery, selectedCategories, priceFilter, sortBy]);

    const handleClearFilters = () => {
        setSearchQuery('');
        setselectedCategories([]);
        setPriceFilter('all');
        setSortBy('date');
        setSearchParams({});
    };

    const hasActiveFilters = searchQuery || selectedCategories.length > 0 || priceFilter !== 'all';

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b sticky top-16 z-40">
                <div className="container mx-auto px-4 py-6">
                    <h1 className="text-3xl font-bold mb-6">Browse Events</h1>

                    {/* Search */}
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                            placeholder="Search events by name, location, or tags..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-3">
                        {/* <Select value={selectedCategories.join(',')} onValueChange={toggleCategory}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="None">None</SelectItem>
                                {categories.map(cat => {
                                    const catId = String((cat as any).categoryId || cat.id);
                                    return (
                                        <SelectItem key={catId} value={cat.categoryName}>{cat.categoryName}</SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select> */}

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-[200px] justify-between text-left font-normal border-gray-300"
                                >
                                    <span className="truncate">
                                        {selectedCategories.length > 0
                                            ? selectedCategories.join(", ")
                                            : "Select Categories"}
                                    </span>
                                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Search categories..." />
                                    <CommandList>
                                        <CommandGroup>
                                            {/* None Option */}
                                            <CommandItem onSelect={() => toggleCategory("None")}>
                                                <div className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary ${selectedCategories.includes("None") ? "bg-primary text-primary-foreground" : "opacity-50"}`}>
                                                    {selectedCategories.includes("None") && <Check className="h-4 w-4" />}
                                                </div>
                                                None
                                            </CommandItem>

                                            {/* Dynamic Categories */}
                                            {categories.map((cat) => {
                                                const isSelected = selectedCategories.includes(cat.categoryName);
                                                return (
                                                    <CommandItem
                                                        key={cat.id || cat.categoryName}
                                                        onSelect={() => toggleCategory(cat.categoryName)}
                                                    >
                                                        <div className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary ${isSelected ? "bg-primary text-primary-foreground" : "opacity-50"}`}>
                                                            {isSelected && <Check className="h-4 w-4" />}
                                                        </div>
                                                        {cat.categoryName}
                                                    </CommandItem>
                                                );
                                            })}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>

                        <Select value={priceFilter} onValueChange={setPriceFilter}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Price/Free" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Prices</SelectItem>
                                <SelectItem value="free">Free</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="date">Date</SelectItem>
                                <SelectItem value="popular">Popularity</SelectItem>
                                <SelectItem value="price-low">Price: Low to High</SelectItem>
                                <SelectItem value="price-high">Price: High to Low</SelectItem>
                            </SelectContent>
                        </Select>

                        {hasActiveFilters && (
                            <Button
                                variant="ghost"
                                onClick={handleClearFilters}
                                className="gap-2"
                            >
                                <X className="h-4 w-4" />
                                Clear Filters
                            </Button>
                        )}
                    </div>

                    {/* Active Filters */}
                    {hasActiveFilters && (
                        <div className="flex flex-wrap gap-2 mt-4">
                            {searchQuery && (
                                <Badge variant="secondary">
                                    Search: {searchQuery}
                                </Badge>
                            )}
                            {selectedCategories.length > 0 && !selectedCategories.includes("None") && (
                                <Badge variant="secondary">
                                    Category: {selectedCategories.join(', ')}
                                </Badge>
                            )}
                            {priceFilter !== 'all' && (
                                <Badge variant="secondary">
                                    {priceFilter === 'free' ? 'Free Events' : 'Paid Events'}
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
                            : `${filteredEvents.length} of ${eventsTotal} ${eventsTotal === 1 ? 'event' : 'events'} (page ${eventsPage + 1}${eventsTotalPages > 0 ? ` of ${eventsTotalPages}` : ''})`}
                    </p>
                </div>

                {filteredEvents.length === 0 && !eventsLoading ? (
                    <div className="text-center py-16">
                        <Filter className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-medium mb-2">No events found</h3>
                        <p className="text-gray-600 mb-4">
                            Try adjusting your filters or search query
                        </p>
                        {hasActiveFilters && (
                            <Button onClick={handleClearFilters}>Clear Filters</Button>
                        )}
                    </div>
                ) : eventsLoading ? (
                    <div className="text-center py-16 text-gray-600">Loading events…</div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredEvents.map((event) => (
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
