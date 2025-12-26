"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  BookOpen,
  Scale,
  Calculator,
  Lightbulb,
  HelpCircle,
  FileQuestion,
  Plus,
  MessageSquare,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  Edit3,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  sendChatWithHistory,
  getConversations,
  getConversation,
  deleteConversation,
  updateConversationTitle,
  type ChatMessage,
  type ConversationSummary,
} from "@/lib/actions/aiChatActions";
import ReactMarkdown from "react-markdown";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const QUICK_ACTIONS = [
  {
    icon: Calculator,
    label: "Accounting",
    prompt: "Explain the difference between FIFO and LIFO inventory methods",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    icon: Scale,
    label: "Philippine Law",
    prompt:
      "What are the elements of a valid contract under Philippine Civil Code?",
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
  {
    icon: BookOpen,
    label: "Tax Law",
    prompt:
      "Explain the difference between income tax and VAT in the Philippines",
    color:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  {
    icon: FileQuestion,
    label: "Practice Question",
    prompt: "Give me a practice question about obligations and contracts",
    color:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
];

export default function AiAssistantContent() {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [suggestedFollowUps, setSuggestedFollowUps] = useState<string[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<
    number | null
  >(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingTitle, setEditingTitle] = useState<number | null>(null);
  const [editTitleValue, setEditTitleValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch conversations list
  const { data: conversations = [], isLoading: loadingConversations } =
    useQuery({
      queryKey: ["chatConversations"],
      queryFn: async () => {
        const result = await getConversations();
        if (!result.success) return [];
        return result.data || [];
      },
    });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    // We target the viewport element inside ScrollArea for manual scrolling if needed,
    // but typically ScrollArea handles overflow.
    // This targets the specific DOM node if using the shadcn ScrollArea component ref correctly.
    const viewport = scrollRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    );
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      return sendChatWithHistory(message, currentConversationId);
    },
    onSuccess: (result) => {
      if (result.success && result.data) {
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: result.data.response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setSuggestedFollowUps(result.data.suggestedFollowUps || []);

        if (result.data.conversationId !== currentConversationId) {
          setCurrentConversationId(result.data.conversationId);
        }

        queryClient.invalidateQueries({ queryKey: ["chatConversations"] });
      } else {
        toast.error(result.error || "Failed to get response");
      }
    },
    onError: () => {
      toast.error("Failed to send message");
    },
  });

  const handleSend = (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSuggestedFollowUps([]);
    chatMutation.mutate(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setSuggestedFollowUps([]);
    inputRef.current?.focus();
  };

  const handleSelectConversation = async (conv: ConversationSummary) => {
    setCurrentConversationId(conv.id);
    setSuggestedFollowUps([]);

    const result = await getConversation(conv.id);
    if (result.success && result.data) {
      setMessages(result.data.messages || []);
    } else {
      toast.error("Failed to load conversation");
    }
  };

  const handleDeleteConversation = async (
    e: React.MouseEvent,
    convId: number
  ) => {
    e.stopPropagation();
    const result = await deleteConversation(convId);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["chatConversations"] });
      if (currentConversationId === convId) {
        handleNewChat();
      }
      toast.success("Conversation deleted");
    } else {
      toast.error("Failed to delete conversation");
    }
  };

  const handleStartEditTitle = (
    e: React.MouseEvent,
    conv: ConversationSummary
  ) => {
    e.stopPropagation();
    setEditingTitle(conv.id);
    setEditTitleValue(conv.title);
  };

  const handleSaveTitle = async (e: React.MouseEvent, convId: number) => {
    e.stopPropagation();
    if (!editTitleValue.trim()) return;

    const result = await updateConversationTitle(convId, editTitleValue.trim());
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["chatConversations"] });
      setEditingTitle(null);
    } else {
      toast.error("Failed to update title");
    }
  };

  const handleCancelEditTitle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTitle(null);
    setEditTitleValue("");
  };

  return (
    // Outer Container: Fixed Height, hidden overflow
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <div
        className={cn(
          "flex flex-col border-r bg-white transition-all duration-300 dark:bg-slate-900/50",
          sidebarOpen ? "w-72" : "w-0 overflow-hidden"
        )}
      >
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">
            Chat History
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewChat}
            className="gap-1 text-xs"
          >
            <Plus className="size-4" />
            New
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-1 p-2">
            {loadingConversations ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="py-8 text-center">
                <MessageSquare className="mx-auto mb-2 size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  No conversations yet
                </p>
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={cn(
                    "group cursor-pointer rounded-lg p-3 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800",
                    currentConversationId === conv.id &&
                      "bg-slate-100 dark:bg-slate-800"
                  )}
                >
                  {editingTitle === conv.id ? (
                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Input
                        value={editTitleValue}
                        onChange={(e) => setEditTitleValue(e.target.value)}
                        className="h-7 text-sm"
                        autoFocus
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={(e) => handleSaveTitle(e, conv.id)}
                      >
                        <Check className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={handleCancelEditTitle}
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                          {conv.title}
                        </p>
                        <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={(e) => handleStartEditTitle(e, conv)}
                            className="p-1 hover:text-purple-600"
                          >
                            <Edit3 className="size-3 text-muted-foreground" />
                          </button>
                          <button
                            onClick={(e) =>
                              handleDeleteConversation(e, conv.id)
                            }
                            className="p-1 hover:text-red-500"
                          >
                            <Trash2 className="size-3 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{conv.messageCount} messages</span>
                        <span>•</span>
                        <span>
                          {formatDistanceToNow(new Date(conv.updatedAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area - Flex Column */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        {/* Header - Fixed Top with Glassmorphism */}
        <div className="z-10 flex shrink-0 items-center gap-4 border-b bg-white/70 p-4 backdrop-blur-md dark:bg-slate-900/70">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="shrink-0"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="size-5" />
            ) : (
              <PanelLeftOpen className="size-5" />
            )}
          </Button>

          <div className="rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 p-2 shadow-sm">
            <Bot className="size-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              AI Study Assistant
            </h1>
            <p className="text-xs text-muted-foreground">
              Accounting & Philippine Law • CPA & Bar Exam Prep
            </p>
          </div>
        </div>

        {/* Chat Scroll Area - Takes remaining height */}
        <ScrollArea ref={scrollRef} className="flex-1 p-4 overflow-y-auto">
          <div className="mx-auto max-w-3xl space-y-6 pb-4">
            {messages.length === 0 ? (
              <div className="py-12">
                <div className="mb-8 text-center">
                  <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg shadow-purple-500/25">
                    <Sparkles className="size-8 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                    Welcome to your AI Study Assistant
                  </h2>
                  <p className="mt-2 text-muted-foreground">
                    I specialize in Accounting, Philippine Law, and professional
                    exam preparation.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {QUICK_ACTIONS.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleSend(action.prompt)}
                      className="flex items-start gap-3 rounded-xl border bg-white p-4 text-left shadow-sm transition-all hover:border-purple-300 hover:shadow-md dark:bg-slate-800 dark:hover:border-purple-700"
                    >
                      <div className={`rounded-lg p-2 ${action.color}`}>
                        <action.icon className="size-5" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {action.label}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {action.prompt}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap justify-center gap-2">
                  {/* Feature badges kept same as before */}
                  <Badge variant="outline" className="bg-white/50">
                    Accounting Standards
                  </Badge>
                  <Badge variant="outline" className="bg-white/50">
                    Philippine Laws
                  </Badge>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-4 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <Avatar className="size-8 shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-600 text-white">
                          <Bot className="size-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div
                      className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-sm ${
                        message.role === "user"
                          ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                          : "bg-white border text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                      }`}
                    >
                      {message.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm">{message.content}</p>
                      )}
                    </div>
                  </div>
                ))}

                {chatMutation.isPending && (
                  <div className="flex gap-4">
                    <Avatar className="size-8 shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-600 text-white">
                        <Bot className="size-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="rounded-2xl bg-white px-4 py-3 shadow-sm border dark:bg-slate-800">
                      <div className="flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin text-purple-600" />
                        <span className="text-sm text-muted-foreground">
                          Thinking...
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {suggestedFollowUps.length > 0 && !chatMutation.isPending && (
                  <div className="flex flex-wrap gap-2 pl-12">
                    {suggestedFollowUps.map((followUp, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSend(followUp)}
                        className="bg-white/50 hover:bg-white text-xs dark:bg-slate-800/50"
                      >
                        {followUp}
                      </Button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        {/* Input Area - Fixed Bottom with Glassmorphism */}
        <div className="z-10 border-t bg-white/70 p-4 backdrop-blur-md dark:bg-slate-900/70">
          <div className="mx-auto max-w-3xl">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about accounting, Philippine law, or any study topic..."
                disabled={chatMutation.isPending}
                className="flex-1 bg-white/80 shadow-sm focus-visible:ring-purple-400 dark:bg-slate-800"
              />
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || chatMutation.isPending}
                className="bg-gradient-to-r from-pink-500 to-purple-600 shadow-md hover:from-pink-600 hover:to-purple-700"
              >
                {chatMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </Button>
            </div>
            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              AI responses are for educational purposes. Always verify with
              official sources.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
