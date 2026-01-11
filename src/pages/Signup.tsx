import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Scale, ArrowLeft, ArrowRight, CheckCircle, User, Briefcase, Shield, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

const steps = [
  { id: 1, title: 'Account', icon: User },
  { id: 2, title: 'Professional', icon: Briefcase },
  { id: 3, title: 'Plan', icon: CreditCard },
  { id: 4, title: 'Verification', icon: Shield },
];

const plans = [
  {
    id: 'solo',
    name: 'Solo',
    price: '$79',
    features: ['Up to 25 active cases', 'AI intake chat', 'Case summaries', 'Basic document drafting'],
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '$149',
    features: ['Up to 100 active cases', 'Advanced AI drafting', 'Priority reminders', 'Client portal access'],
    popular: true,
  },
  {
    id: 'firm',
    name: 'Firm',
    price: '$199',
    features: ['Unlimited cases', 'Multi-user access', 'Custom templates', 'Dedicated account manager'],
  },
];

export default function Signup() {
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Step 1: Account Info
  const [accountData, setAccountData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Step 2: Professional Info
  const [professionalData, setProfessionalData] = useState({
    firmName: '',
    barNumber: '',
    phone: '',
    practiceAreas: '',
    yearsExperience: '',
  });

  // Step 3: Plan Selection
  const [selectedPlan, setSelectedPlan] = useState(searchParams.get('plan') || 'solo');

  // Step 4: Verification
  const [verificationData, setVerificationData] = useState({
    agreeToTerms: false,
    agreeToPrivacy: false,
  });

  const validateStep1 = () => {
    if (!accountData.fullName.trim()) {
      toast.error('Please enter your full name');
      return false;
    }
    if (!accountData.email.trim()) {
      toast.error('Please enter your email');
      return false;
    }
    if (accountData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    if (accountData.password !== accountData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!professionalData.barNumber.trim()) {
      toast.error('Bar number is required for verification');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!verificationData.agreeToTerms || !verificationData.agreeToPrivacy) {
      toast.error('Please agree to the terms and privacy policy');
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: accountData.email,
        password: accountData.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: accountData.fullName,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
          user_id: authData.user.id,
          email: accountData.email,
          full_name: accountData.fullName,
          firm_name: professionalData.firmName || null,
          bar_number: professionalData.barNumber || null,
          phone: professionalData.phone || null,
          subscription_tier: selectedPlan,
          practice_areas: professionalData.practiceAreas || null,
          years_experience: professionalData.yearsExperience ? parseInt(professionalData.yearsExperience) : null,
        });

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }
      }

      toast.success('Account created! Welcome to LegalCase Pro.');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const progress = (currentStep / 4) * 100;

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Header */}
      <header className="p-4">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          <Card className="shadow-legal-lg">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full gradient-gold flex items-center justify-center">
                  <Scale className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="font-display text-2xl">Create Account</CardTitle>
              <CardDescription>Step {currentStep} of 4: {steps[currentStep - 1].title}</CardDescription>
              
              {/* Progress Bar */}
              <Progress value={progress} className="mt-4" />
              
              {/* Step Indicators */}
              <div className="flex justify-between mt-4">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className={`flex flex-col items-center gap-1 ${
                      currentStep >= step.id ? 'text-secondary' : 'text-muted-foreground'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        currentStep >= step.id ? 'bg-secondary text-secondary-foreground' : 'bg-muted'
                      }`}
                    >
                      {currentStep > step.id ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <step.icon className="h-4 w-4" />
                      )}
                    </div>
                    <span className="text-xs">{step.title}</span>
                  </div>
                ))}
              </div>
            </CardHeader>
            
            <CardContent>
              {/* Step 1: Account Info */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      placeholder="John Smith"
                      value={accountData.fullName}
                      onChange={(e) => setAccountData({ ...accountData, fullName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="attorney@lawfirm.com"
                      value={accountData.email}
                      onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={accountData.password}
                      onChange={(e) => setAccountData({ ...accountData, password: e.target.value })}
                      required
                      minLength={6}
                    />
                    <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={accountData.confirmPassword}
                      onChange={(e) => setAccountData({ ...accountData, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Professional Info */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="firmName">Law Firm Name</Label>
                    <Input
                      id="firmName"
                      placeholder="Smith & Associates LLP"
                      value={professionalData.firmName}
                      onChange={(e) => setProfessionalData({ ...professionalData, firmName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="barNumber">Bar Number *</Label>
                    <Input
                      id="barNumber"
                      placeholder="123456"
                      value={professionalData.barNumber}
                      onChange={(e) => setProfessionalData({ ...professionalData, barNumber: e.target.value })}
                      required
                    />
                    <p className="text-xs text-muted-foreground">Required for attorney verification</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={professionalData.phone}
                      onChange={(e) => setProfessionalData({ ...professionalData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="practiceAreas">Practice Areas</Label>
                    <Input
                      id="practiceAreas"
                      placeholder="Family Law, Personal Injury, Criminal Defense"
                      value={professionalData.practiceAreas}
                      onChange={(e) => setProfessionalData({ ...professionalData, practiceAreas: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yearsExperience">Years of Experience</Label>
                    <Input
                      id="yearsExperience"
                      type="number"
                      min="0"
                      placeholder="10"
                      value={professionalData.yearsExperience}
                      onChange={(e) => setProfessionalData({ ...professionalData, yearsExperience: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Plan Selection */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">All plans include a 14-day free trial.</p>
                  <div className="space-y-3">
                    {plans.map((plan) => (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan.id)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedPlan === plan.id
                            ? 'border-secondary bg-secondary/5'
                            : 'border-border hover:border-secondary/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{plan.name}</h4>
                            {plan.popular && (
                              <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded">Popular</span>
                            )}
                          </div>
                          <span className="font-display text-xl font-bold">{plan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></span>
                        </div>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {plan.features.map((feature, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-secondary" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Verification */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                    <h4 className="font-medium">Account Summary</h4>
                    <div className="text-sm space-y-1">
                      <p><span className="text-muted-foreground">Name:</span> {accountData.fullName}</p>
                      <p><span className="text-muted-foreground">Email:</span> {accountData.email}</p>
                      <p><span className="text-muted-foreground">Firm:</span> {professionalData.firmName || 'Not specified'}</p>
                      <p><span className="text-muted-foreground">Bar Number:</span> {professionalData.barNumber}</p>
                      <p><span className="text-muted-foreground">Plan:</span> {plans.find(p => p.id === selectedPlan)?.name} ({plans.find(p => p.id === selectedPlan)?.price}/mo)</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={verificationData.agreeToTerms}
                        onChange={(e) => setVerificationData({ ...verificationData, agreeToTerms: e.target.checked })}
                        className="mt-1"
                      />
                      <span className="text-sm">
                        I agree to the <a href="#" className="text-secondary hover:underline">Terms of Service</a> and understand that my bar number will be verified.
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={verificationData.agreeToPrivacy}
                        onChange={(e) => setVerificationData({ ...verificationData, agreeToPrivacy: e.target.checked })}
                        className="mt-1"
                      />
                      <span className="text-sm">
                        I agree to the <a href="#" className="text-secondary hover:underline">Privacy Policy</a> and consent to the processing of my data.
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 mt-6">
                {currentStep > 1 && (
                  <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                )}
                
                {currentStep < 4 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 gradient-gold text-primary"
                  >
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading || !verificationData.agreeToTerms || !verificationData.agreeToPrivacy}
                    className="flex-1 gradient-gold text-primary"
                  >
                    {loading ? 'Creating Account...' : 'Start Free Trial'}
                  </Button>
                )}
              </div>

              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">Already have an account? </span>
                <Link to="/login" className="text-secondary hover:underline font-medium">
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
