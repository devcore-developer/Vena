"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { supportTicketsDB } from "@/data/mock/database";
import { SupportTicket } from "@/types";
import { Plus, MessageSquare } from "lucide-react";

export default function StudentSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  useEffect(() => {
    // Mock fetch for user u4
    setTickets(supportTicketsDB.filter(t => t.userId === "u4"));
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-charcoal">Support Tickets</h1>
        <Link href="/dashboard/student/support/new">
          <Button><Plus size={16} className="mr-2" /> New Ticket</Button>
        </Link>
      </div>

      {tickets.length === 0 ? (
        <Card className="text-center py-12">
          <MessageSquare className="mx-auto h-12 w-12 text-charcoal-muted opacity-50 mb-4" />
          <h3 className="text-lg font-medium text-charcoal">No support tickets</h3>
          <p className="text-charcoal-muted mt-1">If you need help, create a new ticket.</p>
        </Card>
      ) : (
        <Card noPadding>
          <div className="divide-y divide-slate-100">
            {tickets.map(ticket => (
              <Link href={`/dashboard/student/support/${ticket.id}`} key={ticket.id} className="block p-4 hover:bg-slate-50">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-charcoal text-sm">{ticket.subject}</p>
                    <p className="text-xs text-charcoal-muted">{ticket.category} • {new Date(ticket.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Badge variant={ticket.status === "OPEN" ? "warning" : "success"}>{ticket.status}</Badge>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}