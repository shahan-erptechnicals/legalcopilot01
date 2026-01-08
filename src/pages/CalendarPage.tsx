import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { CaseReminder, Case } from '@/types/database';
import { format, isSameDay } from 'date-fns';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';

export default function CalendarPage() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<(CaseReminder & { case?: Case })[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchReminders();
    }
  }, [user]);

  const fetchReminders = async () => {
    try {
      const { data, error } = await supabase
        .from('case_reminders')
        .select('*, case:cases(*)')
        .eq('user_id', user!.id)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setReminders(data || []);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedDateReminders = reminders.filter((r) =>
    selectedDate ? isSameDay(new Date(r.due_date), selectedDate) : false
  );

  const datesWithReminders = reminders.map((r) => new Date(r.due_date));

  const getReminderTypeColor = (type: string) => {
    switch (type) {
      case 'deadline':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'hearing':
        return 'bg-info/10 text-info border-info/20';
      case 'filing':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'meeting':
        return 'bg-success/10 text-success border-success/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">Calendar</h1>
          <p className="text-muted-foreground mt-1">View and manage your deadlines and reminders</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="shadow-legal lg:col-span-1">
            <CardContent className="p-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                modifiers={{
                  hasReminder: datesWithReminders,
                }}
                modifiersStyles={{
                  hasReminder: {
                    backgroundColor: 'hsl(var(--secondary) / 0.2)',
                    borderRadius: '50%',
                  },
                }}
                className="rounded-md"
              />
            </CardContent>
          </Card>

          {/* Selected Date Reminders */}
          <Card className="shadow-legal lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-display">
                {selectedDate
                  ? format(selectedDate, 'EEEE, MMMM d, yyyy')
                  : 'Select a date'}
              </CardTitle>
              <CardDescription>
                {selectedDateReminders.length} reminder(s) on this date
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : selectedDateReminders.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No reminders on this date</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedDateReminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className={`p-4 rounded-lg border ${
                        reminder.is_completed ? 'bg-muted/50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {reminder.is_completed ? (
                          <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4
                              className={`font-medium ${
                                reminder.is_completed ? 'line-through text-muted-foreground' : ''
                              }`}
                            >
                              {reminder.title}
                            </h4>
                            <Badge
                              className={getReminderTypeColor(reminder.reminder_type)}
                              variant="outline"
                            >
                              {reminder.reminder_type}
                            </Badge>
                          </div>
                          {reminder.case && (
                            <p className="text-sm text-muted-foreground">
                              Case: {reminder.case.title}
                            </p>
                          )}
                          {reminder.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {reminder.description}
                            </p>
                          )}
                          <p className="text-sm font-medium mt-2">
                            {format(new Date(reminder.due_date), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Reminders */}
        <Card className="shadow-legal">
          <CardHeader>
            <CardTitle className="font-display">All Upcoming Reminders</CardTitle>
            <CardDescription>Your complete list of upcoming deadlines</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : reminders.filter((r) => !r.is_completed).length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                <p className="text-muted-foreground">All caught up! No pending reminders.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reminders
                  .filter((r) => !r.is_completed)
                  .slice(0, 10)
                  .map((reminder) => (
                    <div
                      key={reminder.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:shadow-legal transition-shadow"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[60px]">
                          <div className="text-2xl font-bold text-primary">
                            {format(new Date(reminder.due_date), 'd')}
                          </div>
                          <div className="text-xs text-muted-foreground uppercase">
                            {format(new Date(reminder.due_date), 'MMM')}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium">{reminder.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {reminder.case?.title || 'No case linked'}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={getReminderTypeColor(reminder.reminder_type)}
                        variant="outline"
                      >
                        {reminder.reminder_type}
                      </Badge>
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
