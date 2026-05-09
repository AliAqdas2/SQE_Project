import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MessageCircle, Send, Loader2, Heart } from "lucide-react";
import { format } from "date-fns";

interface ChatMessage {
  id: string;
  donorName: string;
  message: string;
  isDonor: boolean;
  createdAt: string;
}

interface LivestreamChatProps {
  livestreamId: string;
}

export function LivestreamChat({ livestreamId }: LivestreamChatProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [senderName, setSenderName] = useState("");
  const [message, setMessage] = useState("");

  // Fetch chat messages
  const { data: messages = [], isLoading, error } = useQuery<ChatMessage[]>({
    queryKey: ['/api/livestreams', livestreamId, 'chat'],
    queryFn: async () => {
      console.log('[LivestreamChat] Fetching messages from:', `/api/livestreams/${livestreamId}/chat`);
      const res = await fetch(`/api/livestreams/${livestreamId}/chat`, {
        credentials: 'include',
      });
      console.log('[LivestreamChat] Fetch response status:', res.status);
      if (!res.ok) {
        throw new Error('Failed to fetch chat messages');
      }
      const data = await res.json();
      console.log('[LivestreamChat] Fetched data:', data, 'Length:', data?.length);
      return data;
    },
    refetchInterval: 5000, // Poll every 5 seconds for new messages
    staleTime: 0, // Always consider data stale so invalidation works
  });

  // Debug logging
  useEffect(() => {
    console.log('[LivestreamChat] Component mounted/updated', {
      livestreamId,
      queryKey: `/api/livestreams/${livestreamId}/chat`,
      messagesCount: messages?.length || 0,
      isLoading,
      error: error?.message,
      messages
    });
  }, [livestreamId, messages, isLoading, error]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { donorName: string; message: string }) => {
      return await apiRequest("POST", `/api/livestreams/${livestreamId}/chat`, data);
    },
    onSuccess: () => {
      setMessage("");
      // Refresh chat messages
      queryClient.invalidateQueries({ 
        queryKey: ['/api/livestreams', livestreamId, 'chat'] 
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Message Failed",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!senderName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name to chat",
        variant: "destructive",
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    sendMessageMutation.mutate({
      donorName: senderName.trim(),
      message: message.trim(),
    });
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Live Chat
        </CardTitle>
        <CardDescription>
          Join the conversation with other viewers
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4" ref={scrollRef as any}>
          <div className="space-y-3 pb-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  No messages yet. Start the conversation!
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className="p-3 rounded-lg border bg-card"
                  data-testid={`chat-message-${msg.id}`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium" data-testid={`chat-sender-${msg.id}`}>
                        {msg.donorName}
                      </span>
                      {msg.isDonor && (
                        <Badge variant="default" className="text-xs" data-testid={`chat-donor-badge-${msg.id}`}>
                          <Heart className="h-3 w-3 mr-1" />
                          Donor
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(msg.createdAt), "p")}
                    </span>
                  </div>
                  <p className="text-sm" data-testid={`chat-message-text-${msg.id}`}>
                    {msg.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="text"
              placeholder="Your name"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              disabled={sendMessageMutation.isPending}
              data-testid="input-chat-name"
            />
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={sendMessageMutation.isPending}
                data-testid="input-chat-message"
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={sendMessageMutation.isPending}
                data-testid="button-send-message"
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
