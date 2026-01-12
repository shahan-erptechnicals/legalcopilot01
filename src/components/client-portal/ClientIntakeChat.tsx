import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, Sparkles, User, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ClientIntakeChatProps {
  clientId: string;
  lawyerId: string;
  accessToken: string;
  onComplete: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const CLIENT_SYSTEM_PROMPT = `You are a friendly and professional intake assistant helping a potential client provide information about their legal matter. The client is filling out an intake for their attorney.

YOUR ROLE:
- Help the client feel comfortable sharing details about their situation
- Ask clear, simple questions one at a time
- Be empathetic and reassuring - many people are stressed when seeking legal help
- Gather comprehensive information for the attorney

INFORMATION TO COLLECT:
1. Personal details: Full name, date of birth, contact info (phone, email, address)
2. Type of legal matter (personal injury, family law, criminal, etc.)
3. Key facts: What happened, when, where
4. Any relevant dates, deadlines, or upcoming court dates
5. Other parties involved (names, contact info if known)
6. Injuries, damages, or impacts experienced
7. Any documentation they have (photos, reports, contracts, etc.)
8. Witnesses or other relevant contacts
9. Insurance information if applicable
10. What outcome they're hoping for

COMMUNICATION STYLE:
- Use simple, non-legal language
- Be warm and understanding
- Validate their concerns
- Assure them their information is confidential and protected by attorney-client privilege
- After gathering sufficient information, let them know their attorney will review everything and contact them

Start by warmly greeting them and asking what brings them in today.`;

export default function ClientIntakeChat({
  clientId,
  lawyerId,
  accessToken,
  onComplete,
}: ClientIntakeChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    startConversation();
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const startConversation = async () => {
    try {
      // Create conversation
      const { data: conversation, error } = await supabase
        .from('intake_conversations')
        .insert({
          user_id: lawyerId,
          client_id: clientId,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      setConversationId(conversation.id);

      // Get initial greeting
      await getAIResponse([], conversation.id);
    } catch (error) {
      console.error('Failed to start conversation:', error);
      toast.error('Failed to start chat. Please refresh and try again.');
    }
  };

  const getAIResponse = async (currentMessages: Message[], convId: string) => {
    setLoading(true);

    try {
      const response = await supabase.functions.invoke('ai-chat', {
        body: {
          messages: [
            { role: 'system', content: CLIENT_SYSTEM_PROMPT },
            ...currentMessages,
          ],
        },
      });

      if (response.error) {
        // Handle rate limit errors
        if (response.error.message?.includes('429')) {
          toast.error('Please wait a moment before sending another message.');
          return;
        }
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
      toast.error('Connection issue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading || !conversationId) return;

    const userMessage = input.trim();
    setInput('');

    const newMessages: Message[] = [
      ...messages,
      { role: 'user', content: userMessage },
    ];
    setMessages(newMessages);

    // Save user message
    await supabase.from('intake_messages').insert({
      conversation_id: conversationId,
      role: 'user',
      content: userMessage,
    });

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
              content: `Based on this intake conversation with a client, create a comprehensive summary for attorney review including:
1. Client Information (name, contact details)
2. Type of Legal Matter
3. Key Facts & Timeline
4. Injuries/Damages
5. Other Parties Involved
6. Evidence/Documentation Mentioned
7. Urgency/Deadlines
8. Client's Goals

Format professionally. Extract all concrete details provided.`,
            },
            ...messages,
            { role: 'user', content: 'Please summarize this intake conversation.' },
          ],
        },
      });

      if (summaryResponse.error) throw new Error(summaryResponse.error.message);

      // Update conversation
      await supabase
        .from('intake_conversations')
        .update({
          status: 'completed',
          summary: summaryResponse.data.content,
        })
        .eq('id', conversationId);

      setIsComplete(true);
      setTimeout(() => onComplete(), 2000);
    } catch (error) {
      console.error('Complete intake error:', error);
      toast.error('Failed to complete. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isComplete) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center py-12">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Thank You!</h2>
          <p className="text-muted-foreground">
            Your information has been submitted. Your attorney will review it shortly.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages */}
        <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
          <div className="space-y-4">
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
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-secondary-foreground" />
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
        <div className="p-4 border-t space-y-3">
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
              placeholder="Type your response..."
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

          {messages.length > 6 && (
            <Button
              variant="outline"
              onClick={handleComplete}
              disabled={loading}
              className="w-full"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              I've Provided All Information
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}