import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Scale, ArrowLeft, ArrowRight, CheckCircle, User, Briefcase, Shield, CreditCard, Zap, Clock, Star } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex">
      <div className="flex-1 flex flex-col">
        <header className="p-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
        </header>

        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-2xl">
            <Card className="shadow-legal-lg border-border/50 backdrop-blur bg-card/95">
              <CardHeader className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl gradient-gold flex items-center justify-center shadow-legal-lg">
                      <Scale className="h-10 w-10 text-primary" />
                    </div>
                    <div className="absolute inset-0 bg-secondary/20 blur-2xl rounded-full -z-10" />
                  </div>
                </div>
                <div>
                  <CardTitle className="font-display text-3xl mb-2">Create Your Account</CardTitle>
                  <CardDescription className="text-base">Step {currentStep} of 4: {steps[currentStep - 1].title}</CardDescription>
                </div>
                
                <Progress value={progress} className="mt-4 h-2" />
                
                <div className="flex justify-between mt-6 px-4">
                  {steps.map((step) => (
                    <div
                      key={step.id}
                      className={`flex flex-col items-center gap-2 transition-all ${
                        currentStep >= step.id ? 'text-secondary scale-105' : 'text-muted-foreground'
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-lg ${
                          currentStep >= step.id ? 'bg-secondary text-secondary-foreground' : 'bg-muted'
                        }`}
                      >
                        {currentStep > step.id ? (
                          <CheckCircle className="h-6 w-6" />
                        ) : (
                          <step.icon className="h-6 w-6" />
                        )}
                      </div>
                      <span className="text-sm font-medium">{step.title}</span>
                    </div>
                  ))}
                </div>
              </CardHeader>
            
              <CardContent className="space-y-6 px-8 py-6">
                {currentStep === 1 && (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-sm font-medium">Full Name *</Label>
                      <Input
                        id="fullName"
                        placeholder="John Smith"
                        value={accountData.fullName}
                        onChange={(e) => setAccountData({ ...accountData, fullName: e.target.value })}
                        className="h-11"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="attorney@lawfirm.com"
                        value={accountData.email}
                        onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                        className="h-11"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={accountData.password}
                        onChange={(e) => setAccountData({ ...accountData, password: e.target.value })}
                        className="h-11"
                        required
                        minLength={6}
                      />
                      <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password *</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={accountData.confirmPassword}
                        onChange={(e) => setAccountData({ ...accountData, confirmPassword: e.target.value })}
                        className="h-11"
                        required
                      />
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="firmName" className="text-sm font-medium">Law Firm Name</Label>
                      <Input
                        id="firmName"
                        placeholder="Smith & Associates LLP"
                        value={professionalData.firmName}
                        onChange={(e) => setProfessionalData({ ...professionalData, firmName: e.target.value })}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="barNumber" className="text-sm font-medium">Bar Number *</Label>
                      <Input
                        id="barNumber"
                        placeholder="123456"
                        value={professionalData.barNumber}
                        onChange={(e) => setProfessionalData({ ...professionalData, barNumber: e.target.value })}
                        className="h-11"
                        required
                      />
                      <p className="text-xs text-muted-foreground">Required for attorney verification</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={professionalData.phone}
                        onChange={(e) => setProfessionalData({ ...professionalData, phone: e.target.value })}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="practiceAreas" className="text-sm font-medium">Practice Areas</Label>
                      <Input
                        id="practiceAreas"
                        placeholder="Family Law, Personal Injury, Criminal Defense"
                        value={professionalData.practiceAreas}
                        onChange={(e) => setProfessionalData({ ...professionalData, practiceAreas: e.target.value })}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="yearsExperience" className="text-sm font-medium">Years of Experience</Label>
                      <Input
                        id="yearsExperience"
                        type="number"
                        min="0"
                        placeholder="10"
                        value={professionalData.yearsExperience}
                        onChange={(e) => setProfessionalData({ ...professionalData, yearsExperience: e.target.value })}
                        className="h-11"
                      />
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">All plans include a 14-day free trial.</p>
                      <Badge className="bg-secondary/10 text-secondary border-secondary/20">
                        <Clock className="w-3 h-3 mr-1" />
                        No credit card required
                      </Badge>
                    </div>
                    <div className="space-y-4">
                      {plans.map((plan) => (
                        <div
                          key={plan.id}
                          onClick={() => setSelectedPlan(plan.id)}
                          className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                            selectedPlan === plan.id
                              ? 'border-secondary bg-secondary/5 shadow-legal scale-[1.02]'
                              : 'border-border hover:border-secondary/50 hover:shadow-lg'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <h4 className="font-semibold text-lg">{plan.name}</h4>
                              {plan.popular && (
                                <Badge className="bg-secondary text-secondary-foreground font-semibold px-2 py-0.5">
                                  <Star className="w-3 h-3 mr-1 fill-current" />
                                  Most Popular
                                </Badge>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="font-display text-2xl font-bold text-primary">{plan.price}</span>
                              <span className="text-sm font-normal text-muted-foreground">/mo</span>
                            </div>
                          </div>
                          <ul className="text-sm text-muted-foreground space-y-2">
                            {plan.features.map((feature, i) => (
                              <li key={i} className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-secondary flex-shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="p-5 bg-gradient-to-br from-secondary/5 to-secondary/10 rounded-xl border border-secondary/20 space-y-3">
                      <h4 className="font-semibold text-lg flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-secondary" />
                        Account Summary
                      </h4>
                      <div className="text-sm space-y-2 ml-7">
                        <p className="flex items-center justify-between">
                          <span className="text-muted-foreground">Name:</span> 
                          <span className="font-medium">{accountData.fullName}</span>
                        </p>
                        <p className="flex items-center justify-between">
                          <span className="text-muted-foreground">Email:</span> 
                          <span className="font-medium">{accountData.email}</span>
                        </p>
                        <p className="flex items-center justify-between">
                          <span className="text-muted-foreground">Firm:</span> 
                          <span className="font-medium">{professionalData.firmName || 'Not specified'}</span>
                        </p>
                        <p className="flex items-center justify-between">
                          <span className="text-muted-foreground">Bar Number:</span> 
                          <span className="font-medium">{professionalData.barNumber}</span>
                        </p>
                        <div className="pt-2 border-t border-secondary/20">
                          <p className="flex items-center justify-between">
                            <span className="text-muted-foreground">Plan:</span> 
                            <span className="font-semibold text-primary">{plans.find(p => p.id === selectedPlan)?.name} ({plans.find(p => p.id === selectedPlan)?.price}/mo)</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="flex items-start gap-3 cursor-pointer p-4 rounded-lg border border-border hover:border-secondary/50 hover:bg-secondary/5 transition-all">
                        <input
                          type="checkbox"
                          checked={verificationData.agreeToTerms}
                          onChange={(e) => setVerificationData({ ...verificationData, agreeToTerms: e.target.checked })}
                          className="mt-1 w-4 h-4 accent-secondary"
                        />
                        <span className="text-sm leading-relaxed">
                          I agree to the <a href="#" className="text-secondary hover:underline font-medium">Terms of Service</a> and understand that my bar number will be verified.
                        </span>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer p-4 rounded-lg border border-border hover:border-secondary/50 hover:bg-secondary/5 transition-all">
                        <input
                          type="checkbox"
                          checked={verificationData.agreeToPrivacy}
                          onChange={(e) => setVerificationData({ ...verificationData, agreeToPrivacy: e.target.checked })}
                          className="mt-1 w-4 h-4 accent-secondary"
                        />
                        <span className="text-sm leading-relaxed">
                          I agree to the <a href="#" className="text-secondary hover:underline font-medium">Privacy Policy</a> and consent to the processing of my data.
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 mt-8">
                  {currentStep > 1 && (
                    <Button type="button" variant="outline" onClick={handleBack} className="flex-1 h-11 border-2 hover:border-secondary hover:text-secondary hover:bg-secondary/5 transition-all font-semibold group">
                      <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                      Back
                    </Button>
                  )}
                  
                  {currentStep < 4 ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="flex-1 h-11 gradient-gold text-primary font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
                    >
                      Next
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading || !verificationData.agreeToTerms || !verificationData.agreeToPrivacy}
                      className="flex-1 h-11 gradient-gold text-primary font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Creating Account...' : 'Start Free Trial'}
                    </Button>
                  )}
                </div>

                <div className="mt-6 text-center">
                  <span className="text-sm text-muted-foreground">Already have an account? </span>
                  <Link to="/login" className="text-secondary hover:underline font-medium text-sm">
                    Sign in
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground p-12 flex-col justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-96 h-96 bg-secondary rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-secondary rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 space-y-12">
          <div>
            <Badge className="mb-6 bg-secondary/20 text-secondary border-secondary/30 backdrop-blur">
              <Zap className="w-3 h-3 mr-1" />
              Join 500+ Law Firms
            </Badge>
            <h2 className="font-display text-4xl font-bold mb-4 leading-tight">
              Start Your 14-Day Free Trial
            </h2>
            <p className="text-xl text-primary-foreground/80 leading-relaxed">
              No credit card required. Full access to all features. Cancel anytime.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Quick Setup in Minutes</h3>
                <p className="text-primary-foreground/70">Get started immediately with our guided onboarding</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center flex-shrink-0">
                <Zap className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">AI-Powered Automation</h3>
                <p className="text-primary-foreground/70">Save 85% of time on client intake and document drafting</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center flex-shrink-0">
                <Shield className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Enterprise Security</h3>
                <p className="text-primary-foreground/70">Bank-grade encryption and SOC 2 Type II certified</p>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-primary-foreground/20">
            <div className="flex gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-secondary text-secondary" />
              ))}
            </div>
            <p className="text-sm text-primary-foreground/70 italic mb-4">
              &quot;The best investment I&apos;ve made for my practice. Setup was seamless and I was up and running in 10 minutes.&quot;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center text-2xl">
                ⚖️
              </div>
              <div>
                <div className="font-semibold">Sarah Chen</div>
                <div className="text-sm text-primary-foreground/70">Criminal Defense Attorney</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
