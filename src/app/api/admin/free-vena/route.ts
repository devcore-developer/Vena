import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { normalizeYouTubeUrl } from "@/lib/youtube";
import { detectVideoSource } from "@/lib/free-video-storage";

// ============================================================
// GET /api/admin/free — List all free videos (any status)
// ============================================================
export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status"); // DRAFT | PUBLISHED | ARCHIVED
    const source = url.searchParams.get("source"); // upload | youtube

    const where = {
      type: "VIDEO" as const,
      ...(search
        ? { title: { contains: search, mode: "insensitive" as const } }
        : {}),
      ...(status && status !== "ALL" ? { status: status as any } : {}),
    };

    const resources = await prisma.freeResource.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Decorate with detected source for the UI
    const data = resources.map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      description: r.description,
      type: r.type,
      status: r.status,
      isFeatured: r.isFeatured,
      thumbnail: r.thumbnail,
      content: r.content,
      resourceUrl: r.resourceUrl,
      videoUrl: r.videoUrl,
      categoryId: r.categoryId,
      categoryName: r.category?.name || null,
      source: detectVideoSource({ resourceUrl: r.resourceUrl, videoUrl: r.videoUrl }),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    // Optional client-side source filter (since it's derived, not stored)
    const filtered = source && source !== "ALL"
      ? data.filter((d) => d.source === source)
      : data;

    return NextResponse.json({ data: filtered, total: filtered.length });
  } catch (error) {
    console.error("[admin/free] GET error:", error);
    return NextResponse.json(
      { error: "Failed to load free videos" },
      { status: 500 }
    );
  }
}

// ============================================================
// POST /api/admin/free — Create a new free video
// ============================================================
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();

    // --------------------------------------------------------
    // Validation
    // --------------------------------------------------------
    if (!body.title?.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Source = 'upload' or 'youtube' (or both, if admin provides both)
    const source: string = body.source || "youtube";

    let resourceUrl: string | null = null;
    let videoUrl: string | null = null;

    if (source === "upload") {
      if (!body.resourceUrl?.trim()) {
        return NextResponse.json(
          { error: "Uploaded video URL is required when source is 'upload'" },
          { status: 400 }
        );
      }
      resourceUrl = body.resourceUrl.trim();
    }

    if (source === "youtube") {
      if (!body.videoUrl?.trim()) {
        return NextResponse.json(
          { error: "YouTube URL is required when source is 'youtube'" },
          { status: 400 }
        );
      }

      const normalized = normalizeYouTubeUrl(body.videoUrl);
      if (!normalized) {
        return NextResponse.json(
          { error: "Invalid YouTube URL. Please provide a valid YouTube link." },
          { status: 400 }
        );
      }
      videoUrl = normalized;
    }

    // Also accept direct values (in case frontend sent both)
    if (body.resourceUrl?.trim() && source === "youtube") {
      resourceUrl = body.resourceUrl.trim();
    }
    if (body.videoUrl?.trim() && source === "upload") {
      const normalized = normalizeYouTubeUrl(body.videoUrl);
      if (normalized) videoUrl = normalized;
    }

    // Generate slug
    const baseSlug = (body.slug || body.title)
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    // Verify slug uniqueness
    const existing = await prisma.freeResource.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Slug already exists. Try a different title." },
        { status: 409 }
      );
    }

    // --------------------------------------------------------
    // Create record
    // --------------------------------------------------------
    const resource = await prisma.freeResource.create({
      data: {
        title: body.title.trim(),
        slug,
        description: body.description?.trim() || null,
        type: "VIDEO",
        content: body.content?.trim() || null,
        thumbnail: body.thumbnail?.trim() || null,
        resourceUrl,
        videoUrl,
        categoryId: body.categoryId || null,
        status: body.status || "DRAFT",
        isFeatured: body.isFeatured === true,
      },
      include: {
        category: { select: { id: true, name: true } },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: auth.session.userId,
        action: "FREE_VIDEO_CREATED",
        entityType: "FreeResource",
        entityId: resource.id,
        metadata: { source, title: resource.title },
      },
    });

    return NextResponse.json({
      id: resource.id,
      title: resource.title,
      slug: resource.slug,
      status: resource.status,
      source: detectVideoSource({
        resourceUrl: resource.resourceUrl,
        videoUrl: resource.videoUrl,
      }),
      resourceUrl: resource.resourceUrl,
      videoUrl: resource.videoUrl,
      createdAt: resource.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("[admin/free] POST error:", error);
    return NextResponse.json(
      { error: "Failed to create free video" },
      { status: 500 }
    );
  }
}