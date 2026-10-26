"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Search, Send, ArrowLeft, MessageCircle } from "lucide-react";

interface Conversation {
  id: string; doctorId: string; doctorName: string; courseTitle: string | null;
  status: string; lastMessage: string; lastMessageAt: string;
}
interface Message {
  id: string; senderId: string; senderName: string; senderRole: string;
  body: string; createdAt: string;
}

function formatTime(d: string) {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function StudentMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/student/messages").then((r) => r.json()).then((d) => { setConversations(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    fetch(`/api/doctor/conversations/${selectedId}/messages`).then((r) => r.json()).then(setMessages).catch(() => setMessages([]));
  }, [selectedId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedId) return;
    setSending(true);
    const res = await fetch(`/api/doctor/conversations/${selectedId}/messages`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: newMessage }),
    });
    if (res.ok) {
      setNewMessage("");
      const msgRes = await fetch(`/api/doctor/conversations/${selectedId}/messages`);
      if (msgRes.ok) setMessages(await msgRes.json());
    }
    setSending(false);
  };

  const filtered = conversations.filter((c) => c.doctorName.toLowerCase().includes(search.toLowerCase()));
  const selected = conversations.find((c) => c.id === selectedId);

  if (loading) return <div className="animate-pulse h-64 bg-vena-50 rounded-xl" />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-charcoal">Messages</h1>
        <p className="text-charcoal-muted mt-1">Communicate with your doctors.</p>
      </div>

      {conversations.length === 0 ? (
        <EmptyState icon={MessageCircle} title="No conversations" description="When you message a doctor, conversations will appear here." />
      ) : (
        <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[400px]">
          <div className={`${selectedId ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 bg-white rounded-xl border border-vena-100 overflow-hidden`}>
            <div className="p-3 border-b border-vena-50">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-charcoal-muted" size={16} />
                <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-vena-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-vena-500" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.map((c) => (
                <button key={c.id} onClick={() => setSelectedId(c.id)}
                  className={`w-full text-left p-3 border-b border-vena-50 hover:bg-vena-50/50 ${selectedId === c.id ? "bg-vena-50" : ""}`}>
                  <div className="flex items-center gap-3">
                    <Avatar name={c.doctorName} className="h-10 w-10 text-sm flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium text-charcoal truncate">{c.doctorName}</p>
                        <span className="text-xs text-charcoal-muted">{formatTime(c.lastMessageAt)}</span>
                      </div>
                      {c.courseTitle && <p className="text-xs text-vena-600 truncate">{c.courseTitle}</p>}
                      <p className="text-xs text-charcoal-muted truncate">{c.lastMessage}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedId && selected ? (
            <div className="flex-1 flex flex-col bg-white rounded-xl border border-vena-100 overflow-hidden">
              <div className="p-4 border-b border-vena-50 flex items-center gap-3">
                <button className="md:hidden text-charcoal-muted" onClick={() => setSelectedId(null)}><ArrowLeft size={20} /></button>
                <Avatar name={selected.doctorName} className="h-9 w-9 text-xs" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-charcoal">{selected.doctorName}</p>
                  {selected.courseTitle && <p className="text-xs text-charcoal-muted">{selected.courseTitle}</p>}
                </div>
                {selected.status === "CLOSED" && <Badge variant="danger">Closed</Badge>}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-vena-50/30">
                {messages.map((m) => {
                  const isMe = m.senderRole === "STUDENT";
                  return (
                    <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-lg px-3 py-2 ${isMe ? "bg-vena-500 text-white" : "bg-white border border-vena-100 text-charcoal"}`}>
                        <p className="text-xs font-semibold mb-0.5 opacity-70">{isMe ? "You" : m.senderName}</p>
                        <p className="text-sm whitespace-pre-wrap">{m.body}</p>
                        <p className={`text-xs mt-1 ${isMe ? "text-vena-100" : "text-charcoal-muted"}`}>{formatTime(m.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
              {selected.status === "CLOSED" ? (
                <div className="p-4 border-t border-vena-50 text-center text-sm text-charcoal-muted">This conversation is closed.</div>
              ) : (
                <form onSubmit={handleSend} className="p-3 border-t border-vena-50 flex gap-2">
                  <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-vena-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-vena-500" />
                  <Button type="submit" size="md" disabled={!newMessage.trim()} isLoading={sending}><Send className="h-4 w-4" /></Button>
                </form>
              )}
            </div>
          ) : (
            <div className="hidden md:flex flex-1 items-center justify-center bg-white rounded-xl border border-vena-100">
              <p className="text-sm text-charcoal-muted">Select a conversation</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}