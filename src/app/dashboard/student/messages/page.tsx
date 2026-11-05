"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Search, Send, ArrowLeft, MessageCircle, Plus } from "lucide-react";

interface Conversation {
  id: string;
  doctorId: string;
  doctorName: string;
  courseTitle: string | null;
  status: string;
  lastMessage: string;
  lastMessageAt: string;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  body: string;
  createdAt: string;
}

interface Course {
  id: string;
  title: string;
  doctorId: string;
  doctorName: string;
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
  const [showNewModal, setShowNewModal] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [modalMessage, setModalMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/student/messages")
      .then((res) => res.json())
      .then((data) => {
        setConversations(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    fetch(`/api/doctor/conversations/${selectedId}/messages`)
      .then((res) => res.json())
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
      const convRes = await fetch("/api/student/messages");
      if (convRes.ok) setConversations(await convRes.json());
    }
    setSending(false);
  };

  const handleNewMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !modalMessage.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/student/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: selectedCourse, body: modalMessage }),
      });
      if (res.ok) {
        setShowNewModal(false);
        setSelectedCourse("");
        setModalMessage("");
        const convRes = await fetch("/api/student/messages");
        if (convRes.ok) setConversations(await convRes.json());
      }
    } catch {}
    setSending(false);
  };

  const filteredConversations = conversations.filter((c) =>
    c.doctorName.toLowerCase().includes(search.toLowerCase())
  );

  const selectedConv = conversations.find((c) => c.id === selectedId);

  if (loading) return <div className="animate-pulse h-64 bg-vena-50 rounded-xl" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Messages</h1>
          <p className="text-charcoal-muted mt-1">Communicate with your doctors.</p>
        </div>
        <Button onClick={() => {
          setShowNewModal(true);
          // Fetch enrolled courses to select from
          fetch("/api/student/courses")
            .then((r) => r.json())
            .then((data) => {
              const arr = Array.isArray(data) ? data : data.data || [];
              setCourses(arr.map((c: any) => ({
                id: c.course?.id || c.id,
                title: c.course?.title || c.title,
                doctorId: c.course?.doctorId || c.doctorId,
                doctorName: c.course?.doctorName || c.doctorName,
              })));
            });
        }}>
          <Plus className="mr-2 h-4 w-4" /> New Message
        </Button>
      </div>

      {conversations.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="No conversations"
          description="Start a new conversation with your doctor."
          actionLabel="New Message"
          onAction={() => setShowNewModal(true)}
        />
      ) : (
        <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[400px]">
          <div className={`${selectedId ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 bg-white rounded-xl border border-vena-100 overflow-hidden`}>
            <div className="p-3 border-b border-vena-50">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-charcoal-muted" size={16} />
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-vena-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-vena-500"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedId(conv.id)}
                  className={`w-full text-left p-3 border-b border-vena-50 hover:bg-vena-50/50 ${selectedId === conv.id ? "bg-vena-50" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={conv.doctorName} className="h-10 w-10 text-sm flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium text-charcoal truncate">{conv.doctorName}</p>
                        <span className="text-xs text-charcoal-muted">{formatTime(conv.lastMessageAt)}</span>
                      </div>
                      {conv.courseTitle && <p className="text-xs text-vena-600 truncate">{conv.courseTitle}</p>}
                      <p className="text-xs text-charcoal-muted truncate">{conv.lastMessage}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedId && selectedConv ? (
            <div className="flex-1 flex flex-col bg-white rounded-xl border border-vena-100 overflow-hidden">
              <div className="p-4 border-b border-vena-50 flex items-center gap-3">
                <button className="md:hidden text-charcoal-muted" onClick={() => setSelectedId(null)}>
                  <ArrowLeft size={20} />
                </button>
                <Avatar name={selectedConv.doctorName} className="h-9 w-9 text-xs" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-charcoal">{selectedConv.doctorName}</p>
                  {selectedConv.courseTitle && <p className="text-xs text-charcoal-muted">{selectedConv.courseTitle}</p>}
                </div>
                {selectedConv.status === "CLOSED" && <Badge variant="danger">Closed</Badge>}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-vena-50/30">
                {messages.map((msg) => {
                  const isMe = msg.senderRole === "STUDENT";
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-lg px-3 py-2 ${isMe ? "bg-vena-500 text-white" : "bg-white border border-vena-100 text-charcoal"}`}>
                        <p className="text-xs font-semibold mb-0.5 opacity-70">{isMe ? "You" : msg.senderName}</p>
                        <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                        <p className={`text-xs mt-1 ${isMe ? "text-vena-100" : "text-charcoal-muted"}`}>{formatTime(msg.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {selectedConv.status === "CLOSED" ? (
                <div className="p-4 border-t border-vena-50 text-center text-sm text-charcoal-muted">This conversation is closed.</div>
              ) : (
                <form onSubmit={handleSend} className="p-3 border-t border-vena-50 flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-vena-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-vena-500"
                  />
                  <Button type="submit" size="md" disabled={!newMessage.trim()} isLoading={sending}>
                    <Send className="h-4 w-4" />
                  </Button>
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

      {/* New Message Modal */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="New Message">
        <form onSubmit={handleNewMessage} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Select Course / Doctor</label>
            <select
              required
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-4 py-2.5 border border-vena-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-vena-500"
            >
              <option value="">Select a course...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title} ({c.doctorName})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Message</label>
            <textarea
              rows={4}
              required
              value={modalMessage}
              onChange={(e) => setModalMessage(e.target.value)}
              className="w-full px-4 py-2.5 border border-vena-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-vena-500 resize-none"
              placeholder="Write your message..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowNewModal(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" isLoading={sending}>Send Message</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}