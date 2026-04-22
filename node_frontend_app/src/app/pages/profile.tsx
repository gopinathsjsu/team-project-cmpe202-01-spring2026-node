import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Camera, Mail, User as UserIcon, Phone, MapPin, Calendar, Save } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';

export function Profile() {
    const { currentUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: currentUser?.name,
        email: currentUser?.email,
        phone: '+1 (555) 123-4567',
        location: 'San Francisco, CA',
        bio: 'Passionate about attending great events and connecting with like-minded people.',
        website: 'https://johndoe.com',
    });

    const navigate = useNavigate();

    const handleSave = () => {
        // TODO: Connect to backend API
        /*api.updateUserProfile(formData)
            .then(() => {
                toast.success('Profile updated successfully!');
                setIsEditing(false);
            })
            .catch(() => {
                toast.error('Failed to update profile. Please try again.');
            });
            */
         toast.success('Profile updated successfully!');
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleMyTickets = () => {
        //toast('Navigating to My Tickets...');
        navigate('/dashboard');
    };

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
                                    <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-4xl font-bold">
                                        {currentUser?.name.charAt(0)}
                                    </div>
                                </div>
                                <button className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow-md hover:bg-gray-50">
                                    <Camera className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="flex-1">
                                <h1 className="text-2xl font-bold">{currentUser?.name}</h1>
                                <p className="text-gray-600 capitalize">{currentUser?.role}</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    //Todo: Replace with actual member since date from backend
                                    Member since {format(new Date(), 'MMMM yyyy')}
                                </p>
                            </div>

                            <Button
                                variant={isEditing ? 'outline' : 'default'}
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

                {/* Profile Information */}
                <div className="grid gap-6 md:grid-cols-3">
                    {/* Main Info */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-xl font-bold mb-4">Personal Information</h2>

                            <div className="space-y-4">
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="name">Full Name</Label>
                                        <div className="relative mt-1">
                                            <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                id="name"
                                                value={formData.name}
                                                onChange={(e) => handleChange('name', e.target.value)}
                                                disabled={!isEditing}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="email">Email Address</Label>
                                        <div className="relative mt-1">
                                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                id="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => handleChange('email', e.target.value)}
                                                disabled={!isEditing}
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
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="website">Website</Label>
                                    <Input
                                        id="website"
                                        type="url"
                                        value={formData.website}
                                        onChange={(e) => handleChange('website', e.target.value)}
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
