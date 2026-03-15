import type { Event } from '../types';
import { Button } from './ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { CalendarPlus, Download } from 'lucide-react';
import {
    generateGoogleCalendarUrl,
    generateOutlookCalendarUrl,
    generateYahooCalendarUrl,
    downloadICSFile,
} from '../context/CalenderUtils';
import { toast } from 'sonner';

interface AddToCalendarProps {
    event: Event;
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'default' | 'sm' | 'lg';
    className?: string;
}

export function AddToCalendar({ event, variant = 'default', size = 'default', className = '' }: AddToCalendarProps) {
    const handleAddToGoogleCalendar = () => {
        window.open(generateGoogleCalendarUrl(event), '_blank');
        toast.success('Opening Google Calendar...');
    };

    const handleAddToOutlook = () => {
        window.open(generateOutlookCalendarUrl(event), '_blank');
        toast.success('Opening Outlook Calendar...');
    };

    const handleAddToYahoo = () => {
        window.open(generateYahooCalendarUrl(event), '_blank');
        toast.success('Opening Yahoo Calendar...');
    };

    const handleDownloadICS = () => {
        downloadICSFile(event);
        toast.success('Calendar file downloaded!');
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant={variant} size={size} className={className}>
                    <CalendarPlus className="h-4 w-4 mr-2" />
                    Add to Calendar
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Add to Calendar</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={handleAddToGoogleCalendar}>
                    <CalendarPlus className="h-4 w-4 mr-2" />
                    Google Calendar
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleAddToOutlook}>
                    <CalendarPlus className="h-4 w-4 mr-2" />
                    Outlook Calendar
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleAddToYahoo}>
                    <CalendarPlus className="h-4 w-4 mr-2" />
                    Yahoo Calendar
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={handleDownloadICS}>
                    <Download className="h-4 w-4 mr-2" />
                    Download .ics file
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
