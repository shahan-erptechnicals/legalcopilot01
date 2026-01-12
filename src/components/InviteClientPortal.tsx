import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Copy, Lock, FileText, MessageSquare, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface InviteClientPortalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  clientEmail?: string;
}

type IntakeType = 'form' | 'chat' | 'view';

export function InviteClientPortal({
  open,
  onOpenChange,
  clientId,
  clientName,
  clientEmail,
}: InviteClientPortalProps) {
  const { user } = useAuth();
  const { limits } = useSubscription();
  const [email, setEmail] = useState(clientEmail || '');
  const [loading, setLoading] = useState(false);
  const [portalLink, setPortalLink] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<IntakeType>('form');

  const generateToken = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  };

  const handleCreateAccess = async (type: IntakeType) => {
    if (!user || !email.trim()) return;

    setLoading(true);
    try {
      const token = generateToken();

      const { error } = await supabase.from('client_portal_access').insert({
        client_id: clientId,
        lawyer_user_id: user.id,
        access_token: token,
        email: email.toLowerCase().trim(),
      });

      if (error) throw error;

      const link = `${window.location.origin}/client-portal?token=${token}&type=${type}`;
      setPortalLink(link);
      setSelectedType(type);
      toast.success('Client portal link created');
    } catch (error) {
      console.error('Error creating portal access:', error);
      toast.error('Failed to create portal access');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (portalLink) {
      navigator.clipboard.writeText(portalLink);
      toast.success('Link copied to clipboard');
    }
  };

  const resetDialog = () => {
    setPortalLink(null);
    setSelectedType('form');
  };

  if (!limits.hasClientPortal) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Client Portal Access</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Client portal access is available on the Professional plan and above.
            </p>
            <Button className="gradient-gold text-primary">
              Upgrade to Professional
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetDialog();
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Send Portal Link to {clientName}</DialogTitle>
          <DialogDescription>
            Choose how you want the client to provide their information.
          </DialogDescription>
        </DialogHeader>

        {portalLink ? (
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <Label>Portal Link ({selectedType === 'form' ? 'Intake Form' : selectedType === 'chat' ? 'AI Chat' : 'View Only'})</Label>
              <div className="flex gap-2">
                <Input value={portalLink} readOnly className="text-sm" />
                <Button onClick={copyLink} variant="outline" size="icon">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This link is valid for 30 days. Send it to your client via email or text.
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open(portalLink, '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Preview Link
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="clientEmail">Client Email</Label>
              <Input
                id="clientEmail"
                type="email"
                placeholder="client@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <Tabs defaultValue="form" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="form">Intake Form</TabsTrigger>
                <TabsTrigger value="chat">AI Chat</TabsTrigger>
                <TabsTrigger value="view">View Portal</TabsTrigger>
              </TabsList>

              <TabsContent value="form" className="mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Self-Service Intake Form
                    </CardTitle>
                    <CardDescription>
                      Client fills out a structured form with their personal info and case details.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• 3-step guided form</li>
                      <li>• Collects all essential information</li>
                      <li>• Best for straightforward cases</li>
                    </ul>
                    <Button
                      onClick={() => handleCreateAccess('form')}
                      disabled={loading || !email.trim()}
                      className="w-full mt-4 gradient-gold text-primary"
                    >
                      {loading ? 'Creating...' : 'Create Form Link'}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="chat" className="mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      AI-Powered Intake Chat
                    </CardTitle>
                    <CardDescription>
                      Client chats with AI to provide information in a conversational format.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Natural conversation flow</li>
                      <li>• AI asks follow-up questions</li>
                      <li>• Good for complex or emotional cases</li>
                    </ul>
                    <Button
                      onClick={() => handleCreateAccess('chat')}
                      disabled={loading || !email.trim()}
                      className="w-full mt-4 gradient-gold text-primary"
                    >
                      {loading ? 'Creating...' : 'Create Chat Link'}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="view" className="mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      View-Only Portal
                    </CardTitle>
                    <CardDescription>
                      Client can view their case status and documents (no intake).
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• View active cases</li>
                      <li>• Access shared documents</li>
                      <li>• See hearing dates</li>
                    </ul>
                    <Button
                      onClick={() => handleCreateAccess('view')}
                      disabled={loading || !email.trim()}
                      className="w-full mt-4 gradient-gold text-primary"
                    >
                      {loading ? 'Creating...' : 'Create View Link'}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {portalLink ? 'Done' : 'Cancel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
