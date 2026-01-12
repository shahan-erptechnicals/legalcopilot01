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

const SYSTEM_PROMPT = `You are an AI assistant helping a LAWYER conduct a client intake. The lawyer is your user, not the client. The lawyer will input information they gather from their client (during a phone call, meeting, or video conference).

YOUR ROLE:
- Help the lawyer organize and capture all essential client and case information
- Prompt the lawyer for missing details they should ask their client
- Provide guidance on what information is typically needed for different case types
- Help identify potential legal issues or concerns based on the information provided

COMMUNICATION STYLE:
- Address the lawyer directly (use "you" to refer to the lawyer, "the client" or "your client" for the person they're representing)
- Be concise and professional - lawyers are busy
- Use bullet points and structured formats when helpful
- Suggest follow-up questions the lawyer should ask their client

INFORMATION TO HELP GATHER:

CLIENT DETAILS:
- Full legal name, DOB, contact info (phone, email, address)
- Preferred contact method and best times to reach

FOR PERSONAL INJURY CASES:
- Incident date, time, location, and description
- Injuries (physical/emotional), medical treatment, treating physicians
- Insurance info (client's and opposing party's)
- Police report number, witness info, evidence collected
- Lost wages/income impact

FOR FAMILY LAW CASES:
- Marriage date/location, children's names and DOBs
- Current living arrangements, spouse info
- Assets (homes, vehicles, accounts, retirement)
- Debts (mortgages, loans, credit cards)
- Prenuptial agreement status
- Urgency concerns (DV, immediate support needs)

FOR CRIMINAL DEFENSE:
- Charges filed/expected, offense date and location
- Arrest details, bail/bond status
- Next court date, arresting agency
- Prior criminal history, potential witnesses

Start by asking the lawyer: "What type of case is this, and what initial information do you have from the client?"`;

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
                  <CardTitle className="font-display">Intake Assistant</CardTitle>
                  <CardDescription>Record client information during intake meetings</CardDescription>
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
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0" title="You (Attorney)">
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
                    placeholder="Enter client information or ask for guidance..."
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
