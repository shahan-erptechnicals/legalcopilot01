import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AddReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
  userId: string;
  onReminderAdded: () => void;
}

export default function AddReminderDialog({
  open,
  onOpenChange,
  caseId,
  userId,
  onReminderAdded,
}: AddReminderDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    due_time: '09:00',
    reminder_type: 'deadline',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.due_date) return;

    setLoading(true);
    try {
      const dueDateTime = `${formData.due_date}T${formData.due_time}:00`;

      const { error } = await supabase.from('case_reminders').insert({
        case_id: caseId,
        user_id: userId,
        title: formData.title,
        description: formData.description || null,
        due_date: dueDateTime,
        reminder_type: formData.reminder_type,
        is_completed: false,
      });

      if (error) throw error;

      toast.success('Reminder added successfully');
      setFormData({
        title: '',
        description: '',
        due_date: '',
        due_time: '09:00',
        reminder_type: 'deadline',
      });
      onOpenChange(false);
      onReminderAdded();
    } catch (error: any) {
      console.error('Error adding reminder:', error);
      toast.error(error.message || 'Failed to add reminder');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-secondary" />
            Add Reminder
          </DialogTitle>
          <DialogDescription>
            Set a reminder or deadline for this case
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reminder-title">Title *</Label>
            <Input
              id="reminder-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., File motion by deadline"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reminder-description">Description</Label>
            <Textarea
              id="reminder-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Additional details..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="due-date">Due Date *</Label>
              <Input
                id="due-date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due-time">Time</Label>
              <Input
                id="due-time"
                type="time"
                value={formData.due_time}
                onChange={(e) => setFormData({ ...formData, due_time: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reminder-type">Type</Label>
            <Select
              value={formData.reminder_type}
              onValueChange={(value) => setFormData({ ...formData, reminder_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deadline">Deadline</SelectItem>
                <SelectItem value="hearing">Court Hearing</SelectItem>
                <SelectItem value="meeting">Client Meeting</SelectItem>
                <SelectItem value="filing">Filing Due</SelectItem>
                <SelectItem value="follow_up">Follow Up</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={loading || !formData.title || !formData.due_date}
              className="flex-1 gradient-gold text-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Reminder'
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
