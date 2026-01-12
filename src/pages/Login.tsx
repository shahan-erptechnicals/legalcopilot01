import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Scale, ArrowLeft, Mail, Lock, CheckCircle, Shield, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      toast.success('Welcome back!');
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="p-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
        </header>

        {/* Login Form */}
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md">
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
                  <CardTitle className="font-display text-3xl mb-2">Welcome Back</CardTitle>
                  <CardDescription className="text-base">Sign in to your LegalCopilot account</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="attorney@lawfirm.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-11"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                      <a href="#" className="text-xs text-secondary hover:underline">
                        Forgot password?
                      </a>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 h-11"
                        required
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full gradient-gold text-primary font-semibold h-11 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
                    disabled={loading}
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?
                  </p>
                  <Link to="/signup">
                    <Button variant="outline" className="w-full border-2 hover:border-secondary hover:text-secondary transition-all h-11 font-semibold">
                      Start 14-Day Free Trial
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Right Side - Benefits (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground p-12 flex-col justify-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-96 h-96 bg-secondary rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-secondary rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 space-y-12">
          <div>
            <Badge className="mb-6 bg-secondary/20 text-secondary border-secondary/30 backdrop-blur">
              <Zap className="w-3 h-3 mr-1" />
              Trusted by 500+ Law Firms
            </Badge>
            <h2 className="font-display text-4xl font-bold mb-4 leading-tight">
              Focus on Practicing Law, Not Paperwork
            </h2>
            <p className="text-xl text-primary-foreground/80 leading-relaxed">
              AI-powered tools to streamline your practice and deliver exceptional client service.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Save 85% on Client Intake</h3>
                <p className="text-primary-foreground/70">AI-powered chat captures all case details automatically</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center flex-shrink-0">
                <Zap className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Draft Documents Instantly</h3>
                <p className="text-primary-foreground/70">Generate legal documents with advanced AI assistance</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center flex-shrink-0">
                <Shield className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Bank-Grade Security</h3>
                <p className="text-primary-foreground/70">SOC 2 certified with attorney-client privilege protection</p>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-primary-foreground/20">
            <p className="text-sm text-primary-foreground/60">
              &quot;LegalCopilot transformed my practice. I&apos;m now handling 40% more cases with less stress.&quot;
            </p>
            <div className="flex items-center gap-3 mt-4">
              <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center text-2xl">
                ⚖️
              </div>
              <div>
                <div className="font-semibold">Michael Rodriguez</div>
                <div className="text-sm text-primary-foreground/70">Managing Partner, Rodriguez Law Group</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
