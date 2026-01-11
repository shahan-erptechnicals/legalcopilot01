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
import { Textarea } from '@/components/ui/textarea';
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
import { FileText, Plus, Edit, Trash2, Lock, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Template {
  id: string;
  name: string;
  description: string | null;
  template_type: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const TEMPLATE_TYPES = [
  { value: 'demand_letter', label: 'Demand Letter' },
  { value: 'notice', label: 'Notice' },
  { value: 'affidavit', label: 'Affidavit' },
  { value: 'contract', label: 'Contract' },
  { value: 'motion', label: 'Motion' },
  { value: 'pleading', label: 'Pleading' },
  { value: 'agreement', label: 'Agreement' },
  { value: 'other', label: 'Other' },
];

export default function CustomTemplates() {
  const { user } = useAuth();
  const { tier, limits } = useSubscription();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template_type: 'demand_letter',
    content: '',
  });

  useEffect(() => {
    if (user && limits.hasCustomTemplates) {
      fetchTemplates();
    } else {
      setLoading(false);
    }
  }, [user, limits]);

  const fetchTemplates = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('custom_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error) {
      setTemplates(data || []);
    }
    setLoading(false);
  };

  const openCreateDialog = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      description: '',
      template_type: 'demand_letter',
      content: '',
    });
    setDialogOpen(true);
  };

  const openEditDialog = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      template_type: template.template_type,
      content: template.content,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user || !formData.name.trim() || !formData.content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      if (editingTemplate) {
        // Update existing template
        const { error } = await supabase
          .from('custom_templates')
          .update({
            name: formData.name,
            description: formData.description || null,
            template_type: formData.template_type,
            content: formData.content,
          })
          .eq('id', editingTemplate.id);

        if (error) throw error;
        toast.success('Template updated');
      } else {
        // Create new template
        const { error } = await supabase.from('custom_templates').insert({
          user_id: user.id,
          name: formData.name,
          description: formData.description || null,
          template_type: formData.template_type,
          content: formData.content,
        });

        if (error) throw error;
        toast.success('Template created');
      }

      setDialogOpen(false);
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    const { error } = await supabase
      .from('custom_templates')
      .delete()
      .eq('id', templateId);

    if (!error) {
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      toast.success('Template deleted');
    } else {
      toast.error('Failed to delete template');
    }
  };

  const handleDuplicate = async (template: Template) => {
    if (!user) return;

    const { error } = await supabase.from('custom_templates').insert({
      user_id: user.id,
      name: `${template.name} (Copy)`,
      description: template.description,
      template_type: template.template_type,
      content: template.content,
    });

    if (!error) {
      toast.success('Template duplicated');
      fetchTemplates();
    } else {
      toast.error('Failed to duplicate template');
    }
  };

  // If not on Firm tier, show upgrade prompt
  if (!limits.hasCustomTemplates) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-legal-lg text-center py-12">
            <CardContent>
              <Lock className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
              <h2 className="font-display text-2xl font-bold mb-4">
                Custom Templates
              </h2>
              <p className="text-muted-foreground mb-6">
                Create and manage your own document templates with the Firm plan.
                Build a library of reusable templates customized for your practice.
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
            <h1 className="font-display text-3xl font-bold text-primary">Custom Templates</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage your document templates
            </p>
          </div>
          <Button onClick={openCreateDialog} className="gradient-gold text-primary">
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        </div>

        <Card className="shadow-legal">
          <CardHeader>
            <CardTitle className="font-display">Your Templates</CardTitle>
            <CardDescription>
              {templates.length} template{templates.length !== 1 ? 's' : ''} in your library
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No templates yet</p>
                <Button onClick={openCreateDialog} variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Template
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="p-4 rounded-lg border hover:shadow-legal transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{template.name}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {template.description || 'No description'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="capitalize">
                            {template.template_type.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Updated {format(new Date(template.updated_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(template)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDuplicate(template)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(template.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'Create Template'}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate
                ? 'Update your document template'
                : 'Create a reusable document template'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Standard Demand Letter"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Template Type</Label>
                <Select
                  value={formData.template_type}
                  onValueChange={(v) => setFormData({ ...formData, template_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Brief description of this template"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Template Content *</Label>
              <p className="text-xs text-muted-foreground">
                Use placeholders like {'{{CLIENT_NAME}}'}, {'{{CASE_NUMBER}}'}, {'{{DATE}}'} for dynamic content
              </p>
              <Textarea
                id="content"
                placeholder="Enter your template content here..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={12}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !formData.name.trim() || !formData.content.trim()}
              className="gradient-gold text-primary"
            >
              {saving ? 'Saving...' : editingTemplate ? 'Update Template' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
