import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { runAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

export function BootstrapAdmin() {
  const navigate = useNavigate();
  const { setCurrentUser } = useAuth();
  const api = runAPI();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.password.trim()) {
      toast.error('Email and password are required');
      return;
    }
    try {
      setSubmitting(true);
      const user = await api.bootstrapAdmin({
        email: formData.email.trim(),
        password: formData.password,
        username: formData.username.trim() || undefined,
        firstName: formData.firstName.trim() || undefined,
        lastName: formData.lastName.trim() || undefined,
      });
      setCurrentUser(user);
      toast.success('Initial admin created successfully');
      navigate('/admin');
    } catch (err: unknown) {
      const message =
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
          ? (err as { response?: { data?: { message?: string } } }).response!.data!.message!
          : err instanceof Error
            ? err.message
            : 'Bootstrap failed';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Bootstrap Initial Admin</CardTitle>
          <CardDescription>Use once to create the first admin account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" value={formData.firstName} onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" value={formData.lastName} onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={formData.username} onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={formData.email} onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={formData.password} onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))} />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Creating admin...' : 'Create Initial Admin'}
            </Button>
          </form>
          <p className="mt-4 text-sm text-gray-600">
            Already bootstrapped?{' '}
            <Link to="/login" className="text-blue-600 hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
