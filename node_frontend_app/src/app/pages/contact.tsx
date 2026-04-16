import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { ArrowLeft, Mail, MessageSquare, Phone } from 'lucide-react';
import { toast } from 'sonner';

export function ContactPage() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!name.trim() || !email.trim() || !message.trim()) {
            toast.error('Please fill out all fields.');
            return;
        }

        const mailtoLink = `mailto:support@nodeevents.com?subject=${encodeURIComponent(`Support request from ${name}`)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`)}`;
        window.open(mailtoLink, '_blank');
        toast.success('Opening your email client...');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-12">
                <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Contact Us</CardTitle>
                                <CardDescription>Need help with a booking or event? Send us a message.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form className="space-y-4" onSubmit={handleSubmit}>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                                        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                        <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                                        <Textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={6} placeholder="Tell us how we can help." />
                                    </div>
                                    <Button type="submit">
                                        <Mail className="h-4 w-4 mr-2" />
                                        Send request
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Support Info</CardTitle>
                                <CardDescription>Quick ways to reach our team.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Phone className="h-5 w-5 text-blue-600" />
                                    <div>
                                        <p className="text-sm font-semibold">Phone</p>
                                        <p className="text-sm text-gray-600">(555) 123-4567</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Mail className="h-5 w-5 text-blue-600" />
                                    <div>
                                        <p className="text-sm font-semibold">Email</p>
                                        <p className="text-sm text-gray-600">support@nodeevents.com</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <MessageSquare className="h-5 w-5 text-blue-600" />
                                    <div>
                                        <p className="text-sm font-semibold">Response time</p>
                                        <p className="text-sm text-gray-600">Usually within 24 hours.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
