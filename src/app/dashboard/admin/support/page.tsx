"use client";

import { useState, useEffect, useRef } from "react";
import { Badge, getStatusVariant } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Search, ArrowLeft, MessageSquare, Send } from "lucide-react";
import { SupportStatus, SupportPriority } from "@/types";

interface AdminTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  subject: string;
  category: string;
  priority: SupportPriority;
  status: SupportStatus;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastActivity: string;
}

interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  body: string;
  createdAt: string;
}

function formatTime(d: string) {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SupportStatus | "ALL">("ALL");
  const endRef = useRef<HTMLDivElement>(null);

  const fetchTickets = async () => {
    const res = await fetch("/api/admin/support");
    if (res.ok) {
      const d = await res.json();
      setTickets(Array.isArray(d) ? d : d.data || []);
    }    setLoading(false);
  };

  useEffect(() => { fetchTickets(); }, []);

  useEffect(() => {
    if (!selectedId) return;
    fetch(`/api/admin/support/${selectedId}/messages`)
      .then(r => r.json())
      .then(setMessages)
      .catch(() => setMessages([]));
  }, [selectedId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !selectedId) return;
    setSending(true);
    const res = await fetch(`/api/admin/support/${selectedId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: reply }),
    });
    if (res.ok) {
      setReply("");
      const msgRes = await fetch(`/api/admin/support/${selectedId}/messages`);
      if (msgRes.ok) setMessages(await msgRes.json());
      await fetchTickets();
    }
    setSending(false);
  };

  const filtered = tickets.filter(t => {
    const ms = t.subject.toLowerCase().includes(search.toLowerCase()) || t.userName.toLowerCase().includes(search.toLowerCase());
    const mf = statusFilter === "ALL" || t.status === statusFilter;
    return ms && mf;
  });

  const selected = tickets.find(t => t.id === selectedId);

  if (loading) return <div className="animate-pulse h-64 bg-slate-100 rounded-xl" />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-charcoal">Support Inbox</h1>
        <p className="text-charcoal-muted mt-1">All support tickets across the platform.</p>
      </div>

      {tickets.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No support tickets" description="No tickets have been submitted yet." />
      ) : (
        <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[400px]">
          {/* Ticket List */}
          <div className={`${selectedId ? "hidden md:flex" : "flex"} flex-col w-full md:w-96 bg-white rounded-xl border border-slate-200 overflow-hidden`}>
            <div className="p-3 border-b border-slate-100 space-y-2">
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
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as SupportStatus | "ALL")}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-charcoal outline-none focus:ring-2 focus:ring-vena-500"
              >
                <option value="ALL">All Status</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="WAITING_FOR_USER">Waiting</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className={`w-full text-left p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${selectedId === t.id ? "bg-vena-50" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-charcoal truncate">{t.subject}</p>
                      <p className="text-xs text-charcoal-muted truncate">{t.userName} · {t.userRole}</p>
                    </div>
                    <Badge variant={getStatusVariant(t.status)}>{t.status.replace(/_/g, " ")}</Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={t.priority === "URGENT" ? "danger" : t.priority === "HIGH" ? "warning" : "default"}>{t.priority}</Badge>
                    <span className="text-xs text-charcoal-muted">{formatTime(t.lastActivity)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Detail */}
          {selectedId && selected ? (
            <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <button className="md:hidden text-charcoal-muted" onClick={() => setSelectedId(null)}>
                    <ArrowLeft size={20} />
                  </button>
                  <Avatar name={selected.userName} className="h-9 w-9 text-xs" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-charcoal">{selected.subject}</h3>
                    <p className="text-xs text-charcoal-muted">{selected.userName} · {selected.userEmail}</p>
                  </div>
                  <Badge variant={getStatusVariant(selected.status)}>{selected.status.replace(/_/g, " ")}</Badge>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                {messages.map(msg => {
                  const isAdmin = msg.senderRole === "SUPER_ADMIN";
                  return (
                    <div key={msg.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-lg px-3 py-2 ${isAdmin ? "bg-vena-500 text-white" : "bg-white border border-slate-200 text-charcoal"}`}>
                        <p className="text-xs font-semibold mb-0.5 opacity-70">{isAdmin ? "Admin" : msg.senderName}</p>
                        <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                        <p className={`text-xs mt-1 ${isAdmin ? "text-vena-100" : "text-charcoal-muted"}`}>{formatTime(msg.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>

              {selected.status === "CLOSED" ? (
                <div className="p-4 border-t border-slate-100 text-center text-sm text-charcoal-muted">This ticket is closed.</div>
              ) : (
                <form onSubmit={handleSend} className="p-3 border-t border-slate-100 flex gap-2">
                  <input
                    type="text"
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    placeholder="Type your reply..."
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-vena-500"
                  />
                  <Button type="submit" size="md" disabled={!reply.trim()} isLoading={sending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              )}
            </div>
          ) : (
            <div className="hidden md:flex flex-1 items-center justify-center bg-white rounded-xl border border-slate-200">
              <p className="text-sm text-charcoal-muted">Select a ticket</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}