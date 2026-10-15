"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { doctorConversationsDB, usersDB, coursesDB } from "@/data/mock/database";
import { DoctorConversation } from "@/types";
import { MessageCircle } from "lucide-react";

export default function StudentMessagesPage() {
  const [conversations, setConversations] = useState<DoctorConversation[]>([]);

  useEffect(() => {
    // Mock fetch for student u4
    setConversations(doctorConversationsDB.filter(c => c.studentId === "u4"));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-charcoal mb-6">Messages</h1>

      {conversations.length === 0 ? (
        <Card className="text-center py-12">
          <MessageCircle className="mx-auto h-12 w-12 text-charcoal-muted opacity-50 mb-4" />
          <h3 className="text-lg font-medium text-charcoal">No conversations</h3>
          <p className="text-charcoal-muted mt-1">You can contact your doctor from the course page.</p>
        </Card>
      ) : (
        <Card noPadding>
          <div className="divide-y divide-slate-100">
            {conversations.map(convo => {
              const doctor = usersDB.find(u => u.id === convo.doctorId);
              const course = coursesDB.find(c => c.id === convo.courseId);
              return (
                <Link href={`/dashboard/student/messages/${convo.id}`} key={convo.id} className="block p-4 hover:bg-slate-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-charcoal text-sm">{doctor?.name}</p>
                      <p className="text-xs text-charcoal-muted">{course?.title}</p>
                    </div>
                    <Badge variant={convo.status === "OPEN" ? "success" : "default"}>{convo.status}</Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}