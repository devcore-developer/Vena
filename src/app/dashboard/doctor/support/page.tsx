"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Badge, getStatusVariant } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Search, Plus, ArrowLeft, MessageSquare, Send } from "lucide-react";
import { SupportPriority, SupportStatus } from "@/types";

interface Ticket {
  id: string;
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return formatDate(dateStr);
}

export default function DoctorSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SupportStatus | "ALL">("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ subject: "", category: "GENERAL", priority: "MEDIUM", body: "" });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchTickets = async () => {
    const res = await fetch("/api/doctor/support");
    if (res.ok) setTickets(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchTickets(); }, []);

  useEffect(() => {
    if (!selectedId) return;
    fetch(`/api/doctor/support/${selectedId}/messages`)
      .then(res => res.json())
      .then(setMessages)
      .catch(() => setMessages([]));
  }, [selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !selectedId) return;
    setSending(true);
    const res = await fetch(`/api/doctor/support/${selectedId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: reply }),
    });
    if (res.ok) {
      setReply("");
      const msgRes = await fetch(`/api/doctor/support/${selectedId}/messages`);
      if (msgRes.ok) setMessages(await msgRes.json());
      await fetchTickets();
    }
    setSending(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const res = await fetch("/api/doctor/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm),
    });
    if (res.ok) {
      setShowCreate(false);
      setCreateForm({ subject: "", category: "GENERAL", priority: "MEDIUM", body: "" });
      await fetchTickets();
    }
    setCreating(false);
  };

  const filtered = tickets.filter(t => {
    const matchSearch = t.subject.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const selectedTicket = tickets.find(t => t.id === selectedId);

  if (loading) return <div className="animate-pulse h-64 bg-slate-100 rounded-xl" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Support</h1>
          <p className="text-charcoal-muted mt-1">Get help from the VENA team.</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Ticket
        </Button>
      </div>

      {tickets.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No support tickets"
          description="Need help? Create a support ticket and our team will assist you."
          actionLabel="Create Ticket"
          onAction={() => setShowCreate(true)}
        />
      ) : (
        <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[400px]">
          {/* Ticket List */}
          <div className={`${selectedId ? "hidden md:flex" : "flex"} flex-col w-full md:w-96 bg-white rounded-xl border border-slate-200 overflow-hidden`}>
            <div className="p-3 border-b border-slate-100 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-charcoal-muted" size={16} />
                <input
                  type="text"
                  placeholder="Search tickets..."
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
                    <p className="text-sm font-medium text-charcoal flex-1">{t.subject}</p>
                    <Badge variant={getStatusVariant(t.status)}>{t.status.replace(/_/g, " ")}</Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={t.priority === "URGENT" ? "danger" : t.priority === "HIGH" ? "warning" : "default"}>{t.priority}</Badge>
                    <span className="text-xs text-charcoal-muted">{t.category.replace(/_/g, " ")}</span>
                  </div>
                  <p className="text-xs text-charcoal-muted mt-1">Last activity: {formatTime(t.lastActivity)}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Detail Panel */}
          {selectedId && selectedTicket ? (
            <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <button className="md:hidden text-charcoal-muted" onClick={() => setSelectedId(null)}>
                    <ArrowLeft size={20} />
                  </button>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-charcoal">{selectedTicket.subject}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={getStatusVariant(selectedTicket.status)}>{selectedTicket.status.replace(/_/g, " ")}</Badge>
                      <Badge variant={selectedTicket.priority === "URGENT" ? "danger" : selectedTicket.priority === "HIGH" ? "warning" : "default"}>{selectedTicket.priority}</Badge>
                      <span className="text-xs text-charcoal-muted">{selectedTicket.category.replace(/_/g, " ")}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                {messages.map(msg => {
                  const isMe = msg.senderRole === "DOCTOR" || msg.senderRole === "SECRETARY";
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-lg px-3 py-2 ${isMe ? "bg-vena-500 text-white" : "bg-white border border-slate-200 text-charcoal"}`}>
                        <p className="text-xs font-semibold mb-0.5 opacity-70">{isMe ? "You" : msg.senderName}</p>
                        <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                        <p className={`text-xs mt-1 ${isMe ? "text-vena-100" : "text-charcoal-muted"}`}>{formatTime(msg.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {selectedTicket.status === "CLOSED" || selectedTicket.status === "RESOLVED" ? (
                <div className="p-4 border-t border-slate-100 text-center text-sm text-charcoal-muted">
                  This ticket is {selectedTicket.status.toLowerCase()}.
                </div>
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

      {/* Create Ticket Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Support Ticket">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Subject</label>
            <input
              type="text"
              required
              value={createForm.subject}
              onChange={e => setCreateForm({ ...createForm, subject: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 focus:border-transparent outline-none text-sm"
              placeholder="Brief description of the issue"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Category</label>
              <select
                value={createForm.category}
                onChange={e => setCreateForm({ ...createForm, category: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-charcoal outline-none focus:ring-2 focus:ring-vena-500"
              >
                <option value="GENERAL">General</option>
                <option value="COURSE_ACCESS">Course Access</option>
                <option value="PAYMENT">Payment</option>
                <option value="TECHNICAL">Technical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Priority</label>
              <select
                value={createForm.priority}
                onChange={e => setCreateForm({ ...createForm, priority: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-charcoal outline-none focus:ring-2 focus:ring-vena-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Message</label>
            <textarea
              rows={4}
              required
              value={createForm.body}
              onChange={e => setCreateForm({ ...createForm, body: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 focus:border-transparent outline-none text-sm resize-none"
              placeholder="Describe your issue in detail"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" isLoading={creating}>Submit Ticket</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}