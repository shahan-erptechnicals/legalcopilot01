import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';

export default function NewClient() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    // Basic Information
    full_name: '',
    email: '',
    phone: '',
    alternate_phone: '',
    
    // Personal Details
    date_of_birth: '',
    
    // Address Information
    address: '',
    city: '',
    state: '',
    zip_code: '',
    
    // Preferred Contact
    preferred_contact: 'email',
    best_time_to_call: '',
    
    // Additional Notes
    notes: '',
    
    // Emergency Contact
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.full_name.trim()) {
      toast.error('Full name is required');
      return;
    }

    setLoading(true);

    try {
      // Combine address fields
      const fullAddress = [
        formData.address,
        formData.city,
        formData.state,
        formData.zip_code,
      ]
        .filter(Boolean)
        .join(', ');

      // Build notes including additional fields
      const additionalNotes = [
        formData.alternate_phone && `Alternate Phone: ${formData.alternate_phone}`,
        formData.preferred_contact && `Preferred Contact: ${formData.preferred_contact}`,
        formData.best_time_to_call && `Best Time to Call: ${formData.best_time_to_call}`,
        formData.emergency_contact_name && `Emergency Contact: ${formData.emergency_contact_name} (${formData.emergency_contact_relation || 'Not specified'}) - ${formData.emergency_contact_phone}`,
        formData.notes,
      ]
        .filter(Boolean)
        .join('\n');

      const { error } = await supabase
        .from('clients')
        .insert({
          user_id: user.id,
          full_name: formData.full_name.trim(),
          email: formData.email || null,
          phone: formData.phone || null,
          address: fullAddress || null,
          date_of_birth: formData.date_of_birth || null,
          notes: additionalNotes || null,
        });

      if (error) throw error;

      toast.success('Client added successfully');
      navigate('/dashboard/clients');
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('Failed to add client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link
            to="/dashboard/clients"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Clients
          </Link>
        </div>

        <Card className="shadow-legal-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full gradient-gold flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="font-display text-2xl">Add New Client</CardTitle>
                <CardDescription>Enter all client information for proper case documentation</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-medium text-lg border-b pb-2">Basic Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Legal Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="John Michael Smith"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth *</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="font-medium text-lg border-b pb-2">Contact Information</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@example.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Primary Phone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(555) 123-4567"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="alternate_phone">Alternate Phone</Label>
                    <Input
                      id="alternate_phone"
                      type="tel"
                      value={formData.alternate_phone}
                      onChange={(e) => setFormData({ ...formData, alternate_phone: e.target.value })}
                      placeholder="(555) 987-6543"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preferred_contact">Preferred Contact Method</Label>
                    <Select
                      value={formData.preferred_contact}
                      onValueChange={(value) => setFormData({ ...formData, preferred_contact: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone Call</SelectItem>
                        <SelectItem value="text">Text Message</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="best_time_to_call">Best Time to Call</Label>
                  <Input
                    id="best_time_to_call"
                    value={formData.best_time_to_call}
                    onChange={(e) => setFormData({ ...formData, best_time_to_call: e.target.value })}
                    placeholder="e.g., Weekdays after 5pm"
                  />
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="font-medium text-lg border-b pb-2">Address</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Main Street, Apt 4B"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="New York"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="NY"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zip_code">ZIP Code</Label>
                    <Input
                      id="zip_code"
                      value={formData.zip_code}
                      onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                      placeholder="10001"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="space-y-4">
                <h3 className="font-medium text-lg border-b pb-2">Emergency Contact</h3>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact_name">Contact Name</Label>
                    <Input
                      id="emergency_contact_name"
                      value={formData.emergency_contact_name}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                      placeholder="Jane Smith"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
                    <Input
                      id="emergency_contact_phone"
                      type="tel"
                      value={formData.emergency_contact_phone}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                      placeholder="(555) 111-2222"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact_relation">Relationship</Label>
                    <Input
                      id="emergency_contact_relation"
                      value={formData.emergency_contact_relation}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_relation: e.target.value })}
                      placeholder="Spouse, Parent, etc."
                    />
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              <div className="space-y-4">
                <h3 className="font-medium text-lg border-b pb-2">Additional Notes</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any additional information about this client..."
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={loading || !formData.full_name}
                  className="gradient-gold text-primary"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Add Client
                    </>
                  )}
                </Button>
                <Link to="/dashboard/clients">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
