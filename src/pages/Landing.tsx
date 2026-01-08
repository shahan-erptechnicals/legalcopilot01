import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Scale, 
  MessageSquare, 
  FileText, 
  Calendar, 
  Shield, 
  Clock,
  CheckCircle,
  ArrowRight,
  Gavel,
  Users,
  Sparkles
} from 'lucide-react';

const features = [
  {
    icon: MessageSquare,
    title: 'AI Client Intake',
    description: 'Streamline client intake with intelligent chat that gathers case details efficiently.',
  },
  {
    icon: FileText,
    title: 'Case Summary Generation',
    description: 'Automatically generate comprehensive case summaries from intake conversations.',
  },
  {
    icon: CheckCircle,
    title: 'Document Checklist',
    description: 'Smart document checklists tailored to each case type for complete preparation.',
  },
  {
    icon: Sparkles,
    title: 'AI Document Drafting',
    description: 'Draft notices, affidavits, and contracts with AI-powered assistance.',
  },
  {
    icon: Calendar,
    title: 'Timeline & Reminders',
    description: 'Never miss a deadline with case timelines and automated reminders.',
  },
  {
    icon: Shield,
    title: 'Secure & Compliant',
    description: 'Bank-grade security with attorney-client privilege protection built-in.',
  },
];

const pricingPlans = [
  {
    name: 'Solo',
    price: '$79',
    period: '/month',
    description: 'Perfect for solo practitioners',
    features: [
      'Up to 25 active cases',
      'AI intake chat',
      'Case summaries',
      'Document checklists',
      'Basic document drafting',
      'Email support',
    ],
    popular: false,
  },
  {
    name: 'Professional',
    price: '$149',
    period: '/month',
    description: 'For growing practices',
    features: [
      'Up to 100 active cases',
      'Everything in Solo',
      'Advanced AI drafting',
      'Priority reminders',
      'Client portal access',
      'Priority support',
    ],
    popular: true,
  },
  {
    name: 'Firm',
    price: '$199',
    period: '/month',
    description: 'For established law firms',
    features: [
      'Unlimited cases',
      'Everything in Professional',
      'Multi-user access',
      'Custom templates',
      'API access',
      'Dedicated account manager',
    ],
    popular: false,
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Scale className="h-8 w-8 text-secondary" />
            <span className="font-display text-xl font-semibold text-primary">LegalCopilot</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/signup">
              <Button className="gradient-gold text-primary font-semibold">
                Start Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge className="mb-6 bg-secondary/10 text-secondary border-secondary/20 hover:bg-secondary/20">
            <Gavel className="w-3 h-3 mr-1" />
            Built for Small Law Firms
          </Badge>
          <h1 className="font-display text-5xl md:text-6xl font-bold text-primary mb-6 leading-tight">
            Stop Wasting Hours on{' '}
            <span className="text-gradient-gold">Paperwork</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            AI-powered case intake, document generation, and deadline management. 
            Focus on practicing law, not pushing papers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="gradient-gold text-primary font-semibold text-lg px-8">
                Start 14-Day Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8">
              <Clock className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            No credit card required • Cancel anytime
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="font-display text-4xl font-bold text-secondary mb-2">85%</div>
              <div className="text-primary-foreground/80">Time Saved on Intake</div>
            </div>
            <div>
              <div className="font-display text-4xl font-bold text-secondary mb-2">500+</div>
              <div className="text-primary-foreground/80">Law Firms Trust Us</div>
            </div>
            <div>
              <div className="font-display text-4xl font-bold text-secondary mb-2">10k+</div>
              <div className="text-primary-foreground/80">Cases Managed</div>
            </div>
            <div>
              <div className="font-display text-4xl font-bold text-secondary mb-2">99.9%</div>
              <div className="text-primary-foreground/80">Uptime Guaranteed</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-secondary/10 text-secondary border-secondary/20">
              Features
            </Badge>
            <h2 className="font-display text-4xl font-bold text-primary mb-4">
              Everything You Need to Run Your Practice
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From client intake to case resolution, streamline every step of your legal workflow.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-border/50 shadow-legal hover:shadow-legal-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg gradient-gold flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="font-display text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-secondary/10 text-secondary border-secondary/20">
              Pricing
            </Badge>
            <h2 className="font-display text-4xl font-bold text-primary mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your practice. All plans include a 14-day free trial.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative ${plan.popular ? 'border-secondary shadow-legal-lg scale-105' : 'border-border/50 shadow-legal'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="gradient-gold text-primary font-semibold">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="font-display text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="pt-4">
                    <span className="font-display text-5xl font-bold text-primary">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-secondary flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/signup">
                    <Button 
                      className={`w-full ${plan.popular ? 'gradient-gold text-primary' : ''}`}
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      Start Free Trial
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 gradient-navy">
        <div className="container mx-auto text-center max-w-3xl">
          <Users className="h-16 w-16 text-secondary mx-auto mb-6" />
          <h2 className="font-display text-4xl font-bold text-primary-foreground mb-6">
            Ready to Transform Your Practice?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8">
            Join hundreds of law firms already saving time and winning more cases with LegalCopilot.
          </p>
          <Link to="/signup">
            <Button size="lg" className="gradient-gold text-primary font-semibold text-lg px-8">
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Scale className="h-6 w-6 text-secondary" />
              <span className="font-display text-lg font-semibold">LegalCopilot</span>
            </div>
            <div className="flex gap-6 text-sm text-primary-foreground/70">
              <a href="#" className="hover:text-secondary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-secondary transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-secondary transition-colors">Contact</a>
            </div>
            <div className="text-sm text-primary-foreground/70">
              © 2025 LegalCopilot. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
