"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { freeResourcesDB, previousExamsDB, categories } from "@/data/mock/database";
import { FreeResource, PreviousExam } from "@/types";
import { Search, FileText, BookOpen, Star } from "lucide-react";

export default function FreeVenaPage() {
  const [search, setSearch] = useState("");
  const [resources, setResources] = useState<FreeResource[]>([]);
  const [exams, setExams] = useState<PreviousExam[]>([]);

  useEffect(() => {
    setResources(freeResourcesDB.filter(r => r.status === "PUBLISHED"));
    setExams(previousExamsDB.filter(e => e.status === "PUBLISHED"));
  }, []);

  const filteredResources = resources.filter(r => 
    r.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <Badge variant="info" className="mb-4">Free VENA</Badge>
          <h1 className="text-4xl font-bold text-charcoal mb-3">Learn more. Practice more.</h1>
          <p className="text-charcoal-muted max-w-2xl mx-auto mb-8">
            Access free medical educational resources, previous exams, and practice materials.
          </p>
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-3 text-charcoal-muted" size={18} />
            <input
              type="text"
              placeholder="Search resources..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 outline-none shadow-sm"
            />
          </div>
        </div>
      </section>

      {/* Featured Resources */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-charcoal mb-6">Featured Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredResources.map(res => (
            <Card key={res.id} className="overflow-hidden p-0 hover:shadow-hover transition-shadow">
              <div className={`h-32 ${res.thumbnail} flex items-center justify-center`}>
                {res.type === "VIDEO" ? <BookOpen className="text-white" size={32} /> : <FileText className="text-white" size={32} />}
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-charcoal">{res.title}</h3>
                  {res.isFeatured && <Star size={16} className="text-amber-500 fill-amber-500" />}
                </div>
                <p className="text-sm text-charcoal-muted mb-4 line-clamp-2">{res.description}</p>
                <Link href={`/free/resources/${res.slug}`}>
                  <Button variant="secondary" size="sm" className="w-full">View Resource</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Previous Exams */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-white rounded-t-3xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-charcoal">Previous Exams</h2>
          <Link href="/free/previous-exams" className="text-vena-600 hover:underline text-sm">View all</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exams.map(exam => (
            <Card key={exam.id} className="flex items-center gap-4">
              <div className="p-3 bg-vena-50 rounded-lg">
                <FileText className="text-vena-600" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-charcoal text-sm">{exam.title}</h3>
                <p className="text-xs text-charcoal-muted">{exam.university} • {exam.year}</p>
              </div>
              <Link href={`/free/previous-exams/${exam.slug}`}>
                <Button size="sm" variant="ghost">Open</Button>
              </Link>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}