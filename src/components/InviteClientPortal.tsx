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
import { ExternalLink, Copy, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface InviteClientPortalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  clientEmail?: string;
}

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

  const generateToken = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  };

  const handleCreateAccess = async () => {
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

      const link = `${window.location.origin}/client-portal?token=${token}`;
      setPortalLink(link);
      toast.success('Client portal access created');
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite to Client Portal</DialogTitle>
          <DialogDescription>
            Create a secure portal link for {clientName} to view their case status and documents.
          </DialogDescription>
        </DialogHeader>

        {portalLink ? (
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <Label>Portal Link</Label>
              <div className="flex gap-2">
                <Input value={portalLink} readOnly className="text-sm" />
                <Button onClick={copyLink} variant="outline" size="icon">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This link is valid for 30 days. The client can view their case status and documents.
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open(portalLink, '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Preview Portal
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
              <p className="text-xs text-muted-foreground">
                We'll associate this email with the portal access for tracking.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {portalLink ? 'Done' : 'Cancel'}
          </Button>
          {!portalLink && (
            <Button
              onClick={handleCreateAccess}
              disabled={loading || !email.trim()}
              className="gradient-gold text-primary"
            >
              {loading ? 'Creating...' : 'Create Portal Link'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
