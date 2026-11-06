"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Plus,
  Search,
  Video,
  Youtube,
  UploadCloud,
  Pencil,
  Trash2,
  Star,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FreeVideoItem {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isFeatured: boolean;
  thumbnail?: string | null;
  resourceUrl?: string | null;
  videoUrl?: string | null;
  categoryName?: string | null;
  source: "upload" | "youtube" | null;
  createdAt: string;
}

const STATUS_VARIANT: Record<string, any> = {
  DRAFT: "default",
  PUBLISHED: "success",
  ARCHIVED: "warning",
};

export default function AdminFreeListPage() {
  const router = useRouter();
  const [items, setItems] = useState<FreeVideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");
  const [deleteTarget, setDeleteTarget] = useState<FreeVideoItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/free-vena");
      if (!res.ok) throw new Error("Failed to load videos");
      const data = await res.json();
      setItems(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        !search ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        (item.description || "").toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "ALL" || item.status === statusFilter;
      const matchSource = sourceFilter === "ALL" || item.source === sourceFilter;
      return matchSearch && matchStatus && matchSource;
    });
  }, [items, search, statusFilter, sourceFilter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/free-vena/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse h-64 bg-slate-100 rounded-xl" />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Free VENA</h1>
          <p className="text-charcoal-muted mt-1">
            Manage free medical learning videos (uploads and YouTube embeds).
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/admin/free-vena/new")}>
          <Plus className="mr-2 h-4 w-4" /> Add Free Video
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 mb-4 flex items-start justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError("")}
            className="text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search
            className="absolute left-3 top-2.5 text-charcoal-muted"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-vena-500 focus:border-transparent outline-none text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-charcoal outline-none focus:ring-2 focus:ring-vena-500"
        >
          <option value="ALL">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-charcoal outline-none focus:ring-2 focus:ring-vena-500"
        >
          <option value="ALL">All Sources</option>
          <option value="upload">Direct Upload</option>
          <option value="youtube">YouTube</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Total"
          value={items.length}
          icon={Video}
          color="vena"
        />
        <StatCard
          label="Published"
          value={items.filter((i) => i.status === "PUBLISHED").length}
          icon={Video}
          color="emerald"
        />
        <StatCard
          label="Uploads"
          value={items.filter((i) => i.source === "upload").length}
          icon={UploadCloud}
          color="blue"
        />
        <StatCard
          label="YouTube"
          value={items.filter((i) => i.source === "youtube").length}
          icon={Youtube}
          color="red"
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Video}
          title="No free videos"
          description={
            search || statusFilter !== "ALL" || sourceFilter !== "ALL"
              ? "Try adjusting your filters."
              : "Add your first free video to get started."
          }
          actionLabel={
            !search && statusFilter === "ALL" && sourceFilter === "ALL"
              ? "Add Free Video"
              : undefined
          }
          onAction={() => router.push("/dashboard/admin/free-vena/new")}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <Card key={item.id} className="overflow-hidden p-0 flex flex-col">
              {/* Thumbnail */}
              <div
                className={cn(
                  "h-36 relative flex items-center justify-center",
                  item.thumbnail || "bg-vena-500"
                )}
              >
                {item.source === "youtube" ? (
                  <Youtube className="text-white/90" size={32} />
                ) : (
                  <UploadCloud className="text-white/90" size={32} />
                )}
                {item.isFeatured && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="warning">
                      <Star size={10} className="mr-1 fill-current" /> Featured
                    </Badge>
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant={STATUS_VARIANT[item.status] || "default"}>
                    {item.status}
                  </Badge>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="info">
                    {item.source === "youtube" ? (
                      <>
                        <Youtube size={10} className="mr-1" /> YouTube
                      </>
                    ) : (
                      <>
                        <UploadCloud size={10} className="mr-1" /> Upload
                      </>
                    )}
                  </Badge>
                  {item.categoryName && (
                    <span className="text-xs text-charcoal-muted">
                      {item.categoryName}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-semibold text-charcoal line-clamp-1">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-xs text-charcoal-muted mt-1 line-clamp-2">
                    {item.description}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-auto pt-3 border-t border-slate-100">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1"
                    onClick={() =>
                      router.push(`/dashboard/admin/free-vena/${item.id}/edit`)
                    }
                  >
                    <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                  </Button>
                  <a
                    href={`/free/${item.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-charcoal-muted hover:text-vena-600 border border-slate-200 rounded-md"
                    title="View"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <button
                    onClick={() => setDeleteTarget(item)}
                    className="p-2 text-charcoal-muted hover:text-red-500 border border-slate-200 rounded-md"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Free Video"
      >
        <div className="space-y-4">
          <p className="text-sm text-charcoal-muted">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-charcoal">
              &ldquo;{deleteTarget?.title}&rdquo;
            </span>
            ?
          </p>
          {deleteTarget?.source === "upload" && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
              This will also delete the uploaded video file from storage.
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-red-500 hover:bg-red-600"
              onClick={handleDelete}
              isLoading={deleting}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// --------------------------------------------------------
// Stat card sub-component
// --------------------------------------------------------
function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: typeof Video;
  color: "vena" | "emerald" | "blue" | "red";
}) {
  const colorClasses = {
    vena: "text-vena-600 bg-vena-50",
    emerald: "text-emerald-600 bg-emerald-50",
    blue: "text-blue-600 bg-blue-50",
    red: "text-red-600 bg-red-50",
  };
  return (
    <Card className="p-4 flex items-center gap-3">
      <div className={cn("p-2 rounded-lg", colorClasses[color])}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-xl font-bold text-charcoal leading-none">
          {value}
        </div>
        <div className="text-xs text-charcoal-muted mt-1">{label}</div>
      </div>
    </Card>
  );
}