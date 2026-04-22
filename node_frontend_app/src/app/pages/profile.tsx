import { useEffect, useMemo, useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Mail, User as UserIcon, Phone, MapPin, Calendar, Save } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';
import { runAPI } from '../api';
import type { Profile as ProfileType } from '../types';

function getApiErrorMessage(err: unknown, fallback: string): string {
    if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response?: { data?: { message?: string }; status?: number } }).response?.data?.message === 'string'
    ) {
        const response = (err as { response?: { data?: { message?: string }; status?: number } }).response;
        if (response?.status === 401) {
            return 'Session expired. Please sign in again.';
        }
        return response?.data?.message ?? fallback;
    }
    return err instanceof Error ? err.message : fallback;
}

export function Profile() {
    const { currentUser, setCurrentUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const api = runAPI();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
    const [loadingLocationSuggestions, setLoadingLocationSuggestions] = useState(false);
    const [profile, setProfile] = useState<ProfileType | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        location: '',
        bio: '',
        avatarUrl: '',
        timezone: 'UTC',
    });

    useEffect(() => {
        api.getMyProfile()
            .then((data) => {
                setProfile(data);
                setFormData({
                    username: data.username ?? '',
                    firstName: data.firstName ?? '',
                    lastName: data.lastName ?? '',
                    email: data.email ?? '',
                    phone: data.phone ?? '',
                    location: data.location ?? '',
                    bio: data.bio ?? '',
                    avatarUrl: data.avatarUrl ?? '',
                    timezone: data.timezone ?? 'UTC',
                });
            })
            .catch((err: unknown) => toast.error(getApiErrorMessage(err, 'Failed to load profile')))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        const query = formData.location.trim();
        if (!isEditing || query.length < 3) {
            setLocationSuggestions([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoadingLocationSuggestions(true);
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
                );
                const data = await response.json();
                const suggestions = Array.isArray(data)
                    ? data
                          .map((item: { display_name?: string }) => item.display_name)
                          .filter((name: unknown): name is string => typeof name === 'string' && name.length > 0)
                    : [];
                setLocationSuggestions(suggestions);
            } catch {
                setLocationSuggestions([]);
            } finally {
                setLoadingLocationSuggestions(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [formData.location, isEditing]);

    const displayName = useMemo(() => {
        const fullName = `${formData.firstName} ${formData.lastName}`.trim();
        if (fullName) return fullName;
        if (formData.username) return formData.username;
        return currentUser?.name ?? 'User';
    }, [formData.firstName, formData.lastName, formData.username, currentUser?.name]);

    const refreshFormFromProfile = (data: ProfileType) => {
        setFormData({
            username: data.username ?? '',
            firstName: data.firstName ?? '',
            lastName: data.lastName ?? '',
            email: data.email ?? '',
            phone: data.phone ?? '',
            location: data.location ?? '',
            bio: data.bio ?? '',
            avatarUrl: data.avatarUrl ?? '',
            timezone: data.timezone ?? 'UTC',
        });
    };

    const handleSave = () => {
        api.updateMyProfile({
            username: formData.username.trim() || undefined,
            firstName: formData.firstName.trim() || undefined,
            lastName: formData.lastName.trim() || undefined,
            phone: formData.phone.trim() || undefined,
            location: formData.location.trim() || undefined,
            bio: formData.bio.trim() || undefined,
            avatarUrl: formData.avatarUrl.trim() || undefined,
            timezone: formData.timezone.trim() || undefined,
        })
            .then((updated) => {
                setProfile(updated);
                refreshFormFromProfile(updated);
                setCurrentUser(currentUser ? {
                    ...currentUser,
                    name: `${updated.firstName ?? ''} ${updated.lastName ?? ''}`.trim() || updated.username || updated.email,
                    username: updated.username,
                    firstName: updated.firstName,
                    lastName: updated.lastName,
                    avatarUrl: updated.avatarUrl,
                    avatar: updated.avatarUrl,
                } : currentUser);
                toast.success('Profile updated successfully');
                setIsEditing(false);
            })
            .catch((err: unknown) => {
                const message = getApiErrorMessage(err, 'Failed to update profile');
                toast.error(message);
            });
    };

    const handleCancel = () => {
        if (profile) refreshFormFromProfile(profile);
        setIsEditing(false);
    };
    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleMyTickets = () => {
        //toast('Navigating to My Tickets...');
        navigate('/dashboard');
    };

    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser');
            return;
        }

        toast.loading('Fetching current location...', { id: 'profile-location-toast' });
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
                    );
                    const data = await response.json();
                    const resolvedLocation =
                        typeof data?.display_name === 'string'
                            ? data.display_name
                            : `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
                    handleChange('location', resolvedLocation);
                    setLocationSuggestions([]);
                    toast.success('Current location added', { id: 'profile-location-toast' });
                } catch {
                    handleChange('location', `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
                    toast.success('Coordinates added as location', { id: 'profile-location-toast' });
                }
            },
            () => {
                toast.error('Unable to retrieve your location', { id: 'profile-location-toast' });
            }
        );
    };

    if (loading) {
        return <div className="container mx-auto px-4 py-8">Loading profile...</div>;
    }
    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm mb-6">
                    <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-lg"></div>
                    <div className="px-6 pb-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-16">
                            <div className="relative">
                                <div className="w-32 h-32 rounded-full bg-white p-2 shadow-lg">
                                    {formData.avatarUrl ? (
                                        <img src={formData.avatarUrl} alt={displayName} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-4xl font-bold">
                                            {displayName.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1">
                                <h1 className="text-2xl font-bold">{displayName}</h1>
                                <p className="text-gray-600 capitalize">{currentUser?.role}</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Member since {format(new Date(String(profile?.createdAt || new Date())), 'MMMM yyyy')}
                                </p>
                            </div>

                            <div className="flex gap-2">
                                {isEditing && (
                                    <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                                )}
                                <Button
                                    variant={isEditing ? 'default' : 'default'}
                                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                                >
                                    {isEditing ? (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Save Changes
                                        </>
                                    ) : (
                                        'Edit Profile'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Profile Information */}
                <div className="grid gap-6 md:grid-cols-3">
                    {/* Main Info */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-xl font-bold mb-4">Personal Information</h2>

                            <div className="space-y-4">
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="firstName">First Name</Label>
                                        <div className="relative mt-1">
                                            <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                id="firstName"
                                                value={formData.firstName}
                                                onChange={(e) => handleChange('firstName', e.target.value)}
                                                disabled={!isEditing}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="lastName">Last Name</Label>
                                        <Input
                                            id="lastName"
                                            value={formData.lastName}
                                            onChange={(e) => handleChange('lastName', e.target.value)}
                                            disabled={!isEditing}
                                            className="mt-1"
                                        />
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="username">Username</Label>
                                        <Input
                                            id="username"
                                            value={formData.username}
                                            onChange={(e) => handleChange('username', e.target.value)}
                                            disabled={!isEditing}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="email">Email Address</Label>
                                        <div className="relative mt-1">
                                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                id="email"
                                                type="email"
                                                value={formData.email}
                                                disabled
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <div className="relative mt-1">
                                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                id="phone"
                                                value={formData.phone}
                                                onChange={(e) => handleChange('phone', e.target.value)}
                                                disabled={!isEditing}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="location">Location</Label>
                                        <div className="relative mt-1">
                                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                id="location"
                                                value={formData.location}
                                                onChange={(e) => handleChange('location', e.target.value)}
                                                disabled={!isEditing}
                                                className="pl-10"
                                            />
                                        </div>
                                        {isEditing && (
                                            <div className="mt-2">
                                                <button
                                                    type="button"
                                                    className="text-xs text-blue-600 hover:underline mb-2"
                                                    onClick={handleUseCurrentLocation}
                                                >
                                                    Use current location
                                                </button>
                                                {loadingLocationSuggestions && (
                                                    <p className="text-xs text-gray-500">Loading suggestions...</p>
                                                )}
                                                {!loadingLocationSuggestions && locationSuggestions.length > 0 && (
                                                    <div className="border rounded-md bg-white max-h-40 overflow-auto">
                                                        {locationSuggestions.map((suggestion) => (
                                                            <button
                                                                key={suggestion}
                                                                type="button"
                                                                onClick={() => {
                                                                    handleChange('location', suggestion);
                                                                    setLocationSuggestions([]);
                                                                }}
                                                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                                                            >
                                                                {suggestion}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="avatarUrl">Avatar URL</Label>
                                    <Input
                                        id="avatarUrl"
                                        value={formData.avatarUrl}
                                        onChange={(e) => handleChange('avatarUrl', e.target.value)}
                                        disabled={!isEditing}
                                        className="mt-1"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="bio">Bio</Label>
                                    <Textarea
                                        id="bio"
                                        value={formData.bio}
                                        onChange={(e) => handleChange('bio', e.target.value)}
                                        disabled={!isEditing}
                                        rows={4}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="timezone">Timezone</Label>
                                    {isEditing ? (
                                        <Select
                                            value={formData.timezone}
                                            onValueChange={(value) => handleChange('timezone', value)}
                                        >
                                            <SelectTrigger id="timezone" className="mt-1">
                                                <SelectValue placeholder="Select timezone" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="America/Los_Angeles">Pacific Time (PT) - Los Angeles</SelectItem>
                                                <SelectItem value="America/Denver">Mountain Time (MT) - Denver</SelectItem>
                                                <SelectItem value="America/Chicago">Central Time (CT) - Chicago</SelectItem>
                                                <SelectItem value="America/New_York">Eastern Time (ET) - New York</SelectItem>
                                                <SelectItem value="UTC">UTC</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Input
                                            id="timezone"
                                            value={formData.timezone}
                                            disabled
                                            className="mt-1"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-xl font-bold mb-4">Activity Stats</h2>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-600">24</div>
                                    <div className="text-sm text-gray-600">Events Attended</div>
                                </div>
                                <div className="text-center p-4 bg-purple-50 rounded-lg">
                                    <div className="text-2xl font-bold text-purple-600">12</div>
                                    <div className="text-sm text-gray-600">Upcoming</div>
                                </div>
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600">8</div>
                                    <div className="text-sm text-gray-600">Reviews</div>
                                </div>
                                <div className="text-center p-4 bg-orange-50 rounded-lg">
                                    <div className="text-2xl font-bold text-orange-600">156</div>
                                    <div className="text-sm text-gray-600">Connections</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="font-bold mb-4">Quick Actions</h3>
                            <div className="space-y-2">
                                <Button variant="outline" className="w-full justify-start" onClick={handleMyTickets}>
                                <Calendar className="h-4 w-4 mr-2" />
                                    My Tickets
                                </Button>
                                
                                {/* <Button variant="outline" className="w-full justify-start" onClick={handleSettings()}>
                                    <UserIcon className="h-4 w-4 mr-2" />
                                    Settings
                                </Button> */}
                            </div>
                        </div>

                        {/* Interests */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="font-bold mb-4">Interests</h3>
                            <div className="flex flex-wrap gap-2">
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">Music</span>
                                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">Tech</span>
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Food</span>
                                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">Art</span>
                                <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm">Sports</span>
                            </div>
                        </div>

                        {/* Badges */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="font-bold mb-4">Badges</h3>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="text-center">
                                    <div className="text-3xl mb-1">🎉</div>
                                    <div className="text-xs text-gray-600">Early Adopter</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl mb-1">⭐</div>
                                    <div className="text-xs text-gray-600">Top Attendee</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl mb-1">🔥</div>
                                    <div className="text-xs text-gray-600">Streak Master</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
