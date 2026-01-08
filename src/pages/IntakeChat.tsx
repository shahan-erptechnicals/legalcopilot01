import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageSquare,
  Send,
  Loader2,
  Sparkles,
  User,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { IntakeMessage, IntakeConversation } from '@/types/database';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `You are a professional legal intake assistant for a law firm. Your role is to gather information from potential clients about their legal matters in a conversational, empathetic manner.

Guidelines:
1. Be warm, professional, and reassuring
2. Ask one or two questions at a time to avoid overwhelming the client
3. Gather key information: client name, contact info, type of legal matter, brief description of the situation, timeline of events, and any urgent deadlines
4. For personal injury: ask about the incident, injuries, medical treatment, insurance information
5. For family law: ask about marriage details, children, property, urgency
6. For criminal: ask about charges, arrest details, court dates
7. Maintain attorney-client privilege awareness
8. At the end, summarize what you've learned and explain next steps

Start by warmly greeting the client and asking what legal matter brings them in today.`;

export default function IntakeChat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    startNewConversation();
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const startNewConversation = async () => {
    if (!user) return;

    // Create new conversation
    const { data: conversation, error } = await supabase
      .from('intake_conversations')
      .insert({
        user_id: user.id,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to start conversation');
      return;
    }

    setConversationId(conversation.id);

    // Get initial AI greeting
    await getAIResponse([], conversation.id);
  };

  const getAIResponse = async (currentMessages: Message[], convId: string) => {
    setLoading(true);

    try {
      const response = await supabase.functions.invoke('ai-chat', {
        body: {
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...currentMessages,
          ],
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const assistantMessage = response.data.content;

      // Save to database
      await supabase.from('intake_messages').insert({
        conversation_id: convId,
        role: 'assistant',
        content: assistantMessage,
      });

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: assistantMessage },
      ]);
    } catch (error) {
      console.error('AI response error:', error);
      toast.error('Failed to get response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading || !conversationId) return;

    const userMessage = input.trim();
    setInput('');

    // Add user message to state
    const newMessages: Message[] = [
      ...messages,
      { role: 'user', content: userMessage },
    ];
    setMessages(newMessages);

    // Save user message to database
    await supabase.from('intake_messages').insert({
      conversation_id: conversationId,
      role: 'user',
      content: userMessage,
    });

    // Get AI response
    await getAIResponse(newMessages, conversationId);

    inputRef.current?.focus();
  };

  const handleComplete = async () => {
    if (!conversationId) return;

    setLoading(true);

    try {
      // Generate summary
      const summaryResponse = await supabase.functions.invoke('ai-chat', {
        body: {
          messages: [
            {
              role: 'system',
              content: `Based on this intake conversation, create a concise case summary including:
1. Client Information (name, contact if provided)
2. Type of Legal Matter
3. Key Facts
4. Timeline of Events
5. Immediate Concerns/Deadlines
6. Recommended Next Steps

Format it professionally for attorney review.`,
            },
            ...messages,
            { role: 'user', content: 'Please provide a summary of this intake.' },
          ],
        },
      });

      if (summaryResponse.error) {
        throw new Error(summaryResponse.error.message);
      }

      // Update conversation with summary
      await supabase
        .from('intake_conversations')
        .update({
          status: 'completed',
          summary: summaryResponse.data.content,
        })
        .eq('id', conversationId);

      setIsComplete(true);
      toast.success('Intake completed! Summary generated.');
    } catch (error) {
      console.error('Complete intake error:', error);
      toast.error('Failed to complete intake');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCase = () => {
    navigate(`/dashboard/cases/new?conversation=${conversationId}`);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-legal-lg h-[calc(100vh-12rem)]">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full gradient-gold flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="font-display">Client Intake</CardTitle>
                  <CardDescription>AI-powered case intake assistant</CardDescription>
                </div>
              </div>
              {messages.length > 4 && !isComplete && (
                <Button
                  onClick={handleComplete}
                  disabled={loading}
                  className="gradient-gold text-primary"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Complete Intake
                </Button>
              )}
              {isComplete && (
                <Button onClick={handleCreateCase} className="gradient-gold text-primary">
                  <FileText className="mr-2 h-4 w-4" />
                  Create Case
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0 flex flex-col h-[calc(100%-5rem)]">
            {/* Messages */}
            <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
              <div className="space-y-6">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full gradient-gold flex items-center justify-center flex-shrink-0">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full gradient-gold flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            {!isComplete && (
              <div className="p-4 border-t">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex gap-3"
                >
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    disabled={loading}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="gradient-gold text-primary"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            )}

            {isComplete && (
              <div className="p-4 border-t bg-success/10">
                <div className="flex items-center gap-3 text-success">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Intake completed successfully!</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
