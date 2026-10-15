"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Search, Send, ArrowLeft, MessageCircle } from "lucide-react";

interface Conversation {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseTitle: string | null;
  status: string;
  lastMessage: string;
  lastMessageAt: string;
  messageCount: number;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  body: string;
  createdAt: string;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function DoctorMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/doctor/conversations")
      .then(res => res.json())
      .then(data => { setConversations(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    fetch(`/api/doctor/conversations/${selectedId}/messages`)
      .then(res => res.json())
      .then(setMessages)
      .catch(() => setMessages([]));
  }, [selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedId) return;
    setSending(true);
    const res = await fetch(`/api/doctor/conversations/${selectedId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: newMessage }),
    });
    if (res.ok) {
      setNewMessage("");
      const msgRes = await fetch(`/api/doctor/conversations/${selectedId}/messages`);
      if (msgRes.ok) setMessages(await msgRes.json());
      const convRes = await fetch("/api/doctor/conversations");
      if (convRes.ok) setConversations(await convRes.json());
    }
    setSending(false);
  };

  const filteredConversations = conversations.filter(c =>
    c.studentName.toLowerCase().includes(search.toLowerCase()) ||
    c.studentEmail.toLowerCase().includes(search.toLowerCase())
  );

  const selectedConv = conversations.find(c => c.id === selectedId);

  if (loading) return <div className="animate-pulse h-64 bg-slate-100 rounded-xl" />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-charcoal">Messages</h1>
        <p className="text-charcoal-muted mt-1">Communicate with your students.</p>
      </div>

      {conversations.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="No conversations"
          description="When students message you, conversations will appear here."
        />
      ) : (
        <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[400px]">
          {/* Conversation List */}
          <div className={`${selectedId ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 lg:w-96 bg-white rounded-xl border border-slate-200 overflow-hidden`}>
            <div className="p-3 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-charcoal-muted" size={16} />
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-vena-500"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedId(conv.id)}
                  className={`w-full text-left p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${selectedId === conv.id ? "bg-vena-50" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={conv.studentName} className="h-10 w-10 text-sm flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-charcoal truncate">{conv.studentName}</p>
                        <span className="text-xs text-charcoal-muted flex-shrink-0">{formatTime(conv.lastMessageAt)}</span>
                      </div>
                      {conv.courseTitle && <p className="text-xs text-vena-600 truncate">{conv.courseTitle}</p>}
                      <p className="text-xs text-charcoal-muted truncate mt-0.5">{conv.lastMessage}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Message Panel */}
          {selectedId && selectedConv ? (
            <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                <button className="md:hidden text-charcoal-muted" onClick={() => setSelectedId(null)}>
                  <ArrowLeft size={20} />
                </button>
                <Avatar name={selectedConv.studentName} className="h-9 w-9 text-xs" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-charcoal">{selectedConv.studentName}</p>
                  <p className="text-xs text-charcoal-muted">{selectedConv.studentEmail}</p>
                </div>
                {selectedConv.status === "CLOSED" && <Badge variant="danger">Closed</Badge>}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                {messages.length === 0 ? (
                  <p className="text-center text-sm text-charcoal-muted py-8">No messages yet</p>
                ) : (
                  messages.map(msg => {
                    const isDoctor = msg.senderRole === "DOCTOR" || msg.senderRole === "SECRETARY";
                    return (
                      <div key={msg.id} className={`flex ${isDoctor ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] rounded-lg px-3 py-2 ${isDoctor ? "bg-vena-500 text-white" : "bg-white border border-slate-200 text-charcoal"}`}>
                          <p className="text-xs font-semibold mb-0.5 opacity-70">{isDoctor ? "You" : msg.senderName}</p>
                          <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                          <p className={`text-xs mt-1 ${isDoctor ? "text-vena-100" : "text-charcoal-muted"}`}>{formatTime(msg.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer */}
              {selectedConv.status === "CLOSED" ? (
                <div className="p-4 border-t border-slate-100 text-center text-sm text-charcoal-muted">
                  This conversation is closed.
                </div>
              ) : (
                <form onSubmit={handleSend} className="p-3 border-t border-slate-100 flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-vena-500"
                  />
                  <Button type="submit" size="md" disabled={!newMessage.trim()} isLoading={sending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              )}
            </div>
          ) : (
            <div className="hidden md:flex flex-1 items-center justify-center bg-white rounded-xl border border-slate-200">
              <p className="text-sm text-charcoal-muted">Select a conversation</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}