import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Users, UserPlus, Mail, Shield, Trash2, Crown, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface TeamMember {
  id: string;
  member_user_id: string;
  invited_email: string;
  role: 'admin' | 'member' | 'viewer';
  status: 'pending' | 'active' | 'inactive';
  created_at: string;
}

export default function TeamManagement() {
  const { user } = useAuth();
  const { tier, limits } = useSubscription();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (user && limits.hasMultiUserAccess) {
      fetchTeamMembers();
    } else {
      setLoading(false);
    }
  }, [user, limits]);

  const fetchTeamMembers = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_owner_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTeamMembers(data as TeamMember[]);
    }
    setLoading(false);
  };

  const handleInvite = async () => {
    if (!user || !inviteEmail.trim()) return;

    setInviting(true);
    try {
      const { error } = await supabase.from('team_members').insert({
        team_owner_id: user.id,
        member_user_id: user.id, // Placeholder, updated when they accept
        invited_email: inviteEmail.toLowerCase().trim(),
        role: inviteRole,
        status: 'pending',
      });

      if (error) throw error;

      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteOpen(false);
      setInviteEmail('');
      setInviteRole('member');
      fetchTeamMembers();
    } catch (error) {
      console.error('Error inviting team member:', error);
      toast.error('Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId);

    if (!error) {
      setTeamMembers(prev => prev.filter(m => m.id !== memberId));
      toast.success('Team member removed');
    } else {
      toast.error('Failed to remove team member');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4" />;
      case 'viewer':
        return <Shield className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success/10 text-success';
      case 'pending':
        return 'bg-warning/10 text-warning';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  // If not on Firm tier, show upgrade prompt
  if (!limits.hasMultiUserAccess) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-legal-lg text-center py-12">
            <CardContent>
              <Lock className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
              <h2 className="font-display text-2xl font-bold mb-4">
                Multi-User Access
              </h2>
              <p className="text-muted-foreground mb-6">
                Team collaboration and multi-user access is available on the Firm plan.
                Upgrade to invite team members and manage your practice together.
              </p>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Current plan: <Badge className="ml-2">{tier.charAt(0).toUpperCase() + tier.slice(1)}</Badge>
                </p>
                <Link to="/dashboard/settings">
                  <Button className="gradient-gold text-primary mt-4">
                    Upgrade to Firm Plan
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary">Team Management</h1>
            <p className="text-muted-foreground mt-1">
              Invite and manage your team members
            </p>
          </div>
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-gold text-primary">
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Team Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join your firm's account.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@lawfirm.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin - Full access</SelectItem>
                      <SelectItem value="member">Member - Can manage cases</SelectItem>
                      <SelectItem value="viewer">Viewer - Read-only access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleInvite}
                  disabled={inviting || !inviteEmail.trim()}
                  className="gradient-gold text-primary"
                >
                  {inviting ? 'Sending...' : 'Send Invitation'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="shadow-legal">
          <CardHeader>
            <CardTitle className="font-display">Team Members</CardTitle>
            <CardDescription>
              {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''} in your team
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No team members yet</p>
                <Button onClick={() => setInviteOpen(true)} variant="outline">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Your First Team Member
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{member.invited_email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="flex items-center gap-1 text-sm text-muted-foreground capitalize">
                            {getRoleIcon(member.role)}
                            {member.role}
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">
                            Invited {format(new Date(member.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(member.status)}>
                        {member.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
