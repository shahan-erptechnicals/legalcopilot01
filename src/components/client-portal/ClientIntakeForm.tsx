import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { User, FileText, AlertCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface ClientIntakeFormProps {
  clientId: string;
  lawyerId: string;
  accessToken: string;
  onComplete: () => void;
}

interface FormData {
  // Personal Information
  fullName: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  address: string;
  preferredContact: string;
  
  // Case Information
  caseType: string;
  incidentDate: string;
  incidentLocation: string;
  description: string;
  
  // Additional Details
  injuries: string;
  medicalTreatment: string;
  insuranceInfo: string;
  witnesses: string;
  additionalNotes: string;
}

const INITIAL_FORM_DATA: FormData = {
  fullName: '',
  dateOfBirth: '',
  phone: '',
  email: '',
  address: '',
  preferredContact: 'email',
  caseType: '',
  incidentDate: '',
  incidentLocation: '',
  description: '',
  injuries: '',
  medicalTreatment: '',
  insuranceInfo: '',
  witnesses: '',
  additionalNotes: '',
};

const CASE_TYPES = [
  { value: 'personal-injury', label: 'Personal Injury' },
  { value: 'family-law', label: 'Family Law' },
  { value: 'criminal-defense', label: 'Criminal Defense' },
  { value: 'employment', label: 'Employment Law' },
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'business', label: 'Business Law' },
  { value: 'estate-planning', label: 'Estate Planning' },
  { value: 'other', label: 'Other' },
];

export default function ClientIntakeForm({
  clientId,
  lawyerId,
  accessToken,
  onComplete,
}: ClientIntakeFormProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [loading, setLoading] = useState(false);

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Update client information
      await supabase
        .from('clients')
        .update({
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          date_of_birth: formData.dateOfBirth || null,
          notes: formData.additionalNotes,
        })
        .eq('id', clientId);

      // Create intake conversation with form summary
      const summary = generateSummary(formData);
      
      const { data: conversation } = await supabase
        .from('intake_conversations')
        .insert({
          user_id: lawyerId,
          client_id: clientId,
          status: 'completed',
          summary,
        })
        .select()
        .single();

      if (conversation) {
        // Save form data as a message
        await supabase.from('intake_messages').insert({
          conversation_id: conversation.id,
          role: 'user',
          content: `CLIENT INTAKE FORM SUBMISSION\n\n${summary}`,
        });
      }

      toast.success('Information submitted successfully!');
      onComplete();
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = (data: FormData): string => {
    return `
## Client Information
- **Name:** ${data.fullName}
- **Date of Birth:** ${data.dateOfBirth || 'Not provided'}
- **Phone:** ${data.phone}
- **Email:** ${data.email}
- **Address:** ${data.address || 'Not provided'}
- **Preferred Contact:** ${data.preferredContact}

## Case Information
- **Case Type:** ${CASE_TYPES.find(t => t.value === data.caseType)?.label || data.caseType}
- **Incident Date:** ${data.incidentDate || 'Not provided'}
- **Incident Location:** ${data.incidentLocation || 'Not provided'}

## Description
${data.description || 'Not provided'}

## Additional Details
- **Injuries:** ${data.injuries || 'Not provided'}
- **Medical Treatment:** ${data.medicalTreatment || 'Not provided'}
- **Insurance Information:** ${data.insuranceInfo || 'Not provided'}
- **Witnesses:** ${data.witnesses || 'Not provided'}

## Additional Notes
${data.additionalNotes || 'None'}
    `.trim();
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="font-display">Client Intake Form</CardTitle>
          <span className="text-sm text-muted-foreground">Step {step} of {totalSteps}</span>
        </div>
        <Progress value={progress} className="h-2" />
        <CardDescription className="mt-4">
          {step === 1 && 'Please provide your personal information.'}
          {step === 2 && 'Tell us about your legal matter.'}
          {step === 3 && 'Any additional details that may help your case.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Step 1: Personal Information */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary mb-4">
              <User className="h-5 w-5" />
              <span className="font-medium">Personal Information</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Legal Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => updateField('dateOfBirth', e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Full Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => updateField('address', e.target.value)}
                placeholder="123 Main St, City, State, ZIP"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredContact">Preferred Contact Method</Label>
              <Select
                value={formData.preferredContact}
                onValueChange={(value) => updateField('preferredContact', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone Call</SelectItem>
                  <SelectItem value="text">Text Message</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step 2: Case Information */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary mb-4">
              <FileText className="h-5 w-5" />
              <span className="font-medium">Case Information</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="caseType">Type of Legal Matter *</Label>
              <Select
                value={formData.caseType}
                onValueChange={(value) => updateField('caseType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select case type" />
                </SelectTrigger>
                <SelectContent>
                  {CASE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="incidentDate">Date of Incident</Label>
                <Input
                  id="incidentDate"
                  type="date"
                  value={formData.incidentDate}
                  onChange={(e) => updateField('incidentDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="incidentLocation">Location of Incident</Label>
                <Input
                  id="incidentLocation"
                  value={formData.incidentLocation}
                  onChange={(e) => updateField('incidentLocation', e.target.value)}
                  placeholder="City, State"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Describe What Happened *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Please describe the situation in as much detail as possible..."
                rows={5}
                required
              />
            </div>
          </div>
        )}

        {/* Step 3: Additional Details */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary mb-4">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Additional Details</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="injuries">Injuries Sustained (if applicable)</Label>
              <Textarea
                id="injuries"
                value={formData.injuries}
                onChange={(e) => updateField('injuries', e.target.value)}
                placeholder="Describe any injuries, both physical and emotional..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medicalTreatment">Medical Treatment Received</Label>
              <Textarea
                id="medicalTreatment"
                value={formData.medicalTreatment}
                onChange={(e) => updateField('medicalTreatment', e.target.value)}
                placeholder="List hospitals, doctors, ongoing treatment..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="insuranceInfo">Insurance Information</Label>
              <Input
                id="insuranceInfo"
                value={formData.insuranceInfo}
                onChange={(e) => updateField('insuranceInfo', e.target.value)}
                placeholder="Insurance company and policy number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="witnesses">Witnesses (names and contact info)</Label>
              <Textarea
                id="witnesses"
                value={formData.witnesses}
                onChange={(e) => updateField('witnesses', e.target.value)}
                placeholder="List any witnesses with their contact information..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalNotes">Any Additional Information</Label>
              <Textarea
                id="additionalNotes"
                value={formData.additionalNotes}
                onChange={(e) => updateField('additionalNotes', e.target.value)}
                placeholder="Anything else you think we should know..."
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          {step < totalSteps ? (
            <Button onClick={handleNext} className="gradient-gold text-primary">
              Continue
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading || !formData.fullName || !formData.phone || !formData.email || !formData.caseType}
              className="gradient-gold text-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Information'
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}