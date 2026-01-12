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
  Sparkles,
  Zap,
  TrendingUp,
  Lock,
  Star,
  Briefcase
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
      'Dedicated account manager',
    ],
    popular: false,
  },
];

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Criminal Defense Attorney',
    firm: 'Chen & Associates',
    image: '⚖️',
    quote: 'LegalCopilot cut my client intake time by 70%. The AI chat captures everything I need while maintaining a professional tone with clients.',
    rating: 5,
  },
  {
    name: 'Michael Rodriguez',
    role: 'Managing Partner',
    firm: 'Rodriguez Law Group',
    image: '💼',
    quote: 'As a firm with 5 attorneys, the multi-user features and custom templates have been game-changing. We are more organized than ever.',
    rating: 5,
  },
  {
    name: 'Jennifer Williams',
    role: 'Family Law Specialist',
    firm: 'Williams Legal Services',
    image: '📋',
    quote: 'I never miss a deadline anymore. The automated reminders and client portal make my practice run smoothly while impressing clients.',
    rating: 5,
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/95 backdrop-blur-lg border-b border-border/40 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Scale className="h-8 w-8 text-secondary transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 bg-secondary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="font-display text-xl font-semibold text-primary">LegalCopilot</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Pricing
            </a>
            <a href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Testimonials
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" className="font-medium">Sign In</Button>
            </Link>
            <Link to="/signup">
              <Button className="gradient-gold text-primary font-semibold shadow-lg hover:shadow-xl transition-shadow">
                Start Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-secondary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="container mx-auto text-center max-w-5xl">
          <Badge className="mb-6 bg-secondary/10 text-secondary border-secondary/20 hover:bg-secondary/20 shadow-lg animate-fade-in">
            <Zap className="w-3 h-3 mr-1" />
            Trusted by 500+ Law Firms
          </Badge>
          <h1 className="font-display text-5xl md:text-7xl font-bold text-primary mb-6 leading-tight animate-fade-in">
            Your AI-Powered{' '}
            <span className="text-gradient-gold inline-block">Legal Assistant</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed animate-fade-in">
            Automate client intake, generate documents instantly, and never miss a deadline. 
            Spend less time on paperwork and more time winning cases.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
            <Link to="/signup">
              <Button size="lg" className="gradient-gold text-primary font-semibold text-lg px-10 py-6 shadow-legal-lg hover:shadow-2xl transition-all hover:scale-105">
                Start 14-Day Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-10 py-6 border-2 hover:border-secondary hover:text-secondary hover:bg-secondary/5 transition-all group">
              <Clock className="mr-2 h-5 w-5 group-hover:text-secondary transition-colors" />
              Watch Demo
            </Button>
          </div>
          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-secondary" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-secondary" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-secondary" />
              <span>Bank-level security</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-br from-primary via-primary to-primary/90 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-secondary rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-secondary rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <div className="text-center group">
              <div className="flex items-center justify-center mb-3">
                <TrendingUp className="h-8 w-8 text-secondary mr-2" />
              </div>
              <div className="font-display text-5xl md:text-6xl font-bold text-secondary mb-2 group-hover:scale-110 transition-transform">
                85%
              </div>
              <div className="text-primary-foreground/90 font-medium">Time Saved</div>
              <div className="text-primary-foreground/60 text-sm mt-1">on client intake</div>
            </div>
            <div className="text-center group">
              <div className="flex items-center justify-center mb-3">
                <Users className="h-8 w-8 text-secondary mr-2" />
              </div>
              <div className="font-display text-5xl md:text-6xl font-bold text-secondary mb-2 group-hover:scale-110 transition-transform">
                500+
              </div>
              <div className="text-primary-foreground/90 font-medium">Law Firms</div>
              <div className="text-primary-foreground/60 text-sm mt-1">trust our platform</div>
            </div>
            <div className="text-center group">
              <div className="flex items-center justify-center mb-3">
                <Briefcase className="h-8 w-8 text-secondary mr-2" />
              </div>
              <div className="font-display text-5xl md:text-6xl font-bold text-secondary mb-2 group-hover:scale-110 transition-transform">
                15k+
              </div>
              <div className="text-primary-foreground/90 font-medium">Cases Managed</div>
              <div className="text-primary-foreground/60 text-sm mt-1">successfully</div>
            </div>
            <div className="text-center group">
              <div className="flex items-center justify-center mb-3">
                <Shield className="h-8 w-8 text-secondary mr-2" />
              </div>
              <div className="font-display text-5xl md:text-6xl font-bold text-secondary mb-2 group-hover:scale-110 transition-transform">
                99.9%
              </div>
              <div className="text-primary-foreground/90 font-medium">Uptime</div>
              <div className="text-primary-foreground/60 text-sm mt-1">guaranteed</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-28 px-4 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-20">
            <Badge className="mb-6 bg-secondary/10 text-secondary border-secondary/20 font-medium px-4 py-1.5">
              Platform Features
            </Badge>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-primary mb-6">
              Everything You Need to Run Your Practice
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              From client intake to case resolution, streamline every step of your legal workflow 
              with our comprehensive suite of AI-powered tools.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="border-border/50 shadow-legal hover:shadow-legal-lg transition-all duration-300 group hover:border-secondary/30 hover:-translate-y-1 bg-card/50 backdrop-blur"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader>
                  <div className="w-14 h-14 rounded-xl gradient-gold flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg">
                    <feature.icon className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="font-display text-xl mb-2">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-28 px-4 bg-background">
        <div className="container mx-auto">
          <div className="text-center mb-20">
            <Badge className="mb-6 bg-secondary/10 text-secondary border-secondary/20 font-medium px-4 py-1.5">
              Transparent Pricing
            </Badge>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-primary mb-6">
              Choose the Perfect Plan for Your Practice
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              No hidden fees. No surprises. All plans include a 14-day free trial with full access to features.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative transition-all duration-300 ${
                  plan.popular 
                    ? 'border-secondary shadow-legal-lg scale-105 md:scale-110 z-10 bg-card' 
                    : 'border-border/50 shadow-legal hover:shadow-legal-lg bg-card/50 backdrop-blur'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="gradient-gold text-primary font-semibold px-4 py-1.5 shadow-lg">
                      <Star className="w-3 h-3 mr-1 fill-current" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-8 pt-8">
                  <CardTitle className="font-display text-2xl mb-2">{plan.name}</CardTitle>
                  <CardDescription className="text-base">{plan.description}</CardDescription>
                  <div className="pt-6">
                    <span className="font-display text-6xl font-bold text-primary">{plan.price}</span>
                    <span className="text-muted-foreground text-lg">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                        <span className="text-sm leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/signup">
                    <Button 
                      className={`w-full py-6 text-base font-semibold transition-all ${
                        plan.popular 
                          ? 'gradient-gold text-primary shadow-lg hover:shadow-xl' 
                          : 'hover:border-secondary hover:text-secondary'
                      }`}
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      Start Free Trial
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-center text-muted-foreground mt-12">
            Need a custom plan? <a href="#" className="text-secondary hover:underline font-medium">Contact our sales team</a>
          </p>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-28 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-20">
            <Badge className="mb-6 bg-secondary/10 text-secondary border-secondary/20 font-medium px-4 py-1.5">
              Success Stories
            </Badge>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-primary mb-6">
              Trusted by Leading Legal Professionals
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              See how law firms across the country are transforming their practices with LegalCopilot.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card 
                key={index} 
                className="border-border/50 shadow-legal hover:shadow-legal-lg transition-all duration-300 hover:-translate-y-1 bg-card"
              >
                <CardHeader>
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-secondary text-secondary" />
                    ))}
                  </div>
                  <CardDescription className="text-base leading-relaxed italic text-foreground">
                    "{testimonial.quote}"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{testimonial.image}</div>
                    <div>
                      <div className="font-semibold text-primary">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      <div className="text-sm text-secondary font-medium">{testimonial.firm}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-28 px-4 bg-gradient-to-br from-primary via-primary to-primary/90 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-96 h-96 bg-secondary rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto text-center max-w-4xl relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full gradient-gold mb-8 shadow-2xl">
            <Scale className="h-10 w-10 text-primary" />
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-6 leading-tight">
            Ready to Transform Your Legal Practice?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-10 leading-relaxed max-w-2xl mx-auto">
            Join hundreds of law firms already saving time, winning more cases, and delivering 
            exceptional client experiences with LegalCopilot's AI-powered platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/signup">
              <Button size="lg" className="gradient-gold text-primary font-semibold text-lg px-10 py-6 shadow-2xl hover:shadow-2xl hover:scale-105 transition-all">
                Start Your 14-Day Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-10 py-6 text-primary-foreground border-2 border-primary-foreground/30 hover:bg-primary-foreground/10">
              Schedule a Demo
            </Button>
          </div>
          <div className="flex items-center justify-center gap-8 mt-10 text-primary-foreground/80">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-secondary" />
              <span className="text-sm">No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-secondary" />
              <span className="text-sm">14-day money-back guarantee</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 bg-primary/95 text-primary-foreground border-t border-primary-foreground/10">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <Scale className="h-8 w-8 text-secondary" />
                <span className="font-display text-2xl font-semibold">LegalCopilot</span>
              </div>
              <p className="text-primary-foreground/70 leading-relaxed mb-6 max-w-md">
                AI-powered practice management software designed specifically for solo attorneys and small law firms.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-secondary hover:text-primary flex items-center justify-center transition-colors">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-secondary hover:text-primary flex items-center justify-center transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                </a>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-4 text-secondary">Product</h3>
              <ul className="space-y-3">
                <li><a href="#features" className="text-primary-foreground/70 hover:text-secondary transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-primary-foreground/70 hover:text-secondary transition-colors">Pricing</a></li>
                <li><a href="#" className="text-primary-foreground/70 hover:text-secondary transition-colors">Security</a></li>
                <li><a href="#" className="text-primary-foreground/70 hover:text-secondary transition-colors">Roadmap</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-4 text-secondary">Company</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-primary-foreground/70 hover:text-secondary transition-colors">About Us</a></li>
                <li><a href="#" className="text-primary-foreground/70 hover:text-secondary transition-colors">Contact</a></li>
                <li><a href="#" className="text-primary-foreground/70 hover:text-secondary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-primary-foreground/70 hover:text-secondary transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-primary-foreground/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-primary-foreground/60">
              © 2025 LegalCopilot. All rights reserved.
            </div>
            <div className="flex items-center gap-4 text-sm text-primary-foreground/60">
              <Lock className="h-4 w-4" />
              <span>Bank-grade encryption • SOC 2 Type II Certified</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
