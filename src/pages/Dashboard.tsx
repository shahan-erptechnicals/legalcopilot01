import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Briefcase,
  Users,
  FileText,
  Calendar,
  MessageSquare,
  Plus,
  ArrowRight,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Case, CaseReminder, Client } from '@/types/database';
import { format, isAfter, isBefore, addDays } from 'date-fns';

interface DashboardStats {
  totalCases: number;
  activeCases: number;
  totalClients: number;
  upcomingReminders: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalCases: 0,
    activeCases: 0,
    totalClients: 0,
    upcomingReminders: 0,
  });
  const [recentCases, setRecentCases] = useState<Case[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<(CaseReminder & { case?: Case })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch cases count
      const { count: totalCases } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id);

      const { count: activeCases } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .in('status', ['intake', 'active', 'pending']);

      // Fetch clients count
      const { count: totalClients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id);

      // Fetch upcoming reminders count
      const { count: reminderCount } = await supabase
        .from('case_reminders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('is_completed', false)
        .gte('due_date', new Date().toISOString());

      setStats({
        totalCases: totalCases || 0,
        activeCases: activeCases || 0,
        totalClients: totalClients || 0,
        upcomingReminders: reminderCount || 0,
      });

      // Fetch recent cases
      const { data: cases } = await supabase
        .from('cases')
        .select('*, client:clients(*)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentCases(cases || []);

      // Fetch upcoming reminders with case info
      const { data: reminders } = await supabase
        .from('case_reminders')
        .select('*, case:cases(*)')
        .eq('user_id', user!.id)
        .eq('is_completed', false)
        .gte('due_date', new Date().toISOString())
        .order('due_date', { ascending: true })
        .limit(5);

      setUpcomingReminders(reminders || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'intake':
        return 'bg-info/10 text-info';
      case 'active':
        return 'bg-success/10 text-success';
      case 'pending':
        return 'bg-warning/10 text-warning';
      case 'closed':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-destructive/10 text-destructive';
      case 'high':
        return 'bg-warning/10 text-warning';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const isReminderUrgent = (dueDate: string) => {
    return isBefore(new Date(dueDate), addDays(new Date(), 2));
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary">
              Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name.split(' ')[0]}` : ''}
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening with your practice today.
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/dashboard/intake">
              <Button className="gradient-gold text-primary">
                <MessageSquare className="mr-2 h-4 w-4" />
                New Intake
              </Button>
            </Link>
            <Link to="/dashboard/cases/new">
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Case
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-legal">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg gradient-navy flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeCases}</p>
                  <p className="text-sm text-muted-foreground">Active Cases</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-legal">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg gradient-gold flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalClients}</p>
                  <p className="text-sm text-muted-foreground">Clients</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-legal">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-info/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalCases}</p>
                  <p className="text-sm text-muted-foreground">Total Cases</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-legal">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.upcomingReminders}</p>
                  <p className="text-sm text-muted-foreground">Upcoming</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Cases */}
          <Card className="shadow-legal">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-display">Recent Cases</CardTitle>
                <CardDescription>Your latest case activity</CardDescription>
              </div>
              <Link to="/dashboard/cases">
                <Button variant="ghost" size="sm">
                  View all
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : recentCases.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No cases yet</p>
                  <Link to="/dashboard/intake">
                    <Button className="gradient-gold text-primary">
                      Start Client Intake
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentCases.map((caseItem) => (
                    <Link
                      key={caseItem.id}
                      to={`/dashboard/cases/${caseItem.id}`}
                      className="block p-4 rounded-lg border hover:shadow-legal transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{caseItem.title}</h4>
                          <p className="text-sm text-muted-foreground truncate">
                            {caseItem.client?.full_name || 'No client assigned'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(caseItem.status)}>
                            {caseItem.status}
                          </Badge>
                          {caseItem.priority !== 'medium' && (
                            <Badge className={getPriorityColor(caseItem.priority)}>
                              {caseItem.priority}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Reminders */}
          <Card className="shadow-legal">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-display">Upcoming Deadlines</CardTitle>
                <CardDescription>Don't miss these important dates</CardDescription>
              </div>
              <Link to="/dashboard/calendar">
                <Button variant="ghost" size="sm">
                  View calendar
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : upcomingReminders.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No upcoming deadlines</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingReminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className={`p-4 rounded-lg border ${
                        isReminderUrgent(reminder.due_date)
                          ? 'border-destructive/50 bg-destructive/5'
                          : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {isReminderUrgent(reminder.due_date) ? (
                          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                        ) : (
                          <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium">{reminder.title}</h4>
                          <p className="text-sm text-muted-foreground truncate">
                            {reminder.case?.title || 'General reminder'}
                          </p>
                          <p className="text-sm font-medium mt-1">
                            {format(new Date(reminder.due_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {reminder.reminder_type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="shadow-legal">
          <CardHeader>
            <CardTitle className="font-display">Quick Actions</CardTitle>
            <CardDescription>Common tasks at your fingertips</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link to="/dashboard/intake">
                <Button variant="outline" className="w-full h-auto py-6 flex-col gap-2">
                  <MessageSquare className="h-6 w-6 text-secondary" />
                  <span>New Intake</span>
                </Button>
              </Link>
              <Link to="/dashboard/cases/new">
                <Button variant="outline" className="w-full h-auto py-6 flex-col gap-2">
                  <Briefcase className="h-6 w-6 text-secondary" />
                  <span>Add Case</span>
                </Button>
              </Link>
              <Link to="/dashboard/clients/new">
                <Button variant="outline" className="w-full h-auto py-6 flex-col gap-2">
                  <Users className="h-6 w-6 text-secondary" />
                  <span>Add Client</span>
                </Button>
              </Link>
              <Link to="/dashboard/documents">
                <Button variant="outline" className="w-full h-auto py-6 flex-col gap-2">
                  <FileText className="h-6 w-6 text-secondary" />
                  <span>Draft Document</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
