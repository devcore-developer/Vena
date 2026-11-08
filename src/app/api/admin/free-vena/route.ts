import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { normalizeYouTubeUrl } from "@/lib/youtube";
import { detectVideoSource } from "@/lib/free-video-storage";

// ============================================================
// GET /api/admin/free-vena — List all free content (VIDEO + PDF)
//
// Query params:
//   search  — title contains
//   status  — DRAFT | PUBLISHED | ARCHIVED | ALL
//   type    — VIDEO | PDF | ALL  (NEW)
// ============================================================
export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status");
    const typeFilter = url.searchParams.get("type"); // VIDEO | PDF | ALL

    const where: any = {
      // Include both VIDEO and PDF types
      type: typeFilter && typeFilter !== "ALL"
        ? typeFilter as "VIDEO" | "PDF"
        : { in: ["VIDEO", "PDF"] },
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

    const data = resources.map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      description: r.description,
      type: r.type, // "VIDEO" | "PDF"
      status: r.status,
      isFeatured: r.isFeatured,
      thumbnail: r.thumbnail,
      content: r.content,
      resourceUrl: r.resourceUrl,
      videoUrl: r.videoUrl,
      streamvaultId: r.streamvaultId,
      streamvaultIframe: r.streamvaultIframe,
      streamvaultThumbnail: r.streamvaultThumbnail,
      categoryId: r.categoryId,
      categoryName: r.category?.name || null,
      // For VIDEO: detect source; for PDF: always "upload"
      source:
        r.type === "PDF"
          ? "upload"
          : detectVideoSource({ resourceUrl: r.resourceUrl, videoUrl: r.videoUrl }),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    return NextResponse.json({ data, total: data.length });
  } catch (error) {
    console.error("[admin/free-vena] GET error:", error);
    return NextResponse.json(
      { error: "Failed to load free content" },
      { status: 500 }
    );
  }
}

// ============================================================
// POST /api/admin/free-vena — Create new free content (VIDEO or PDF)
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

    const contentType: "VIDEO" | "PDF" = body.type === "PDF" ? "PDF" : "VIDEO";

    let resourceUrl: string | null = null;
    let videoUrl: string | null = null;

    if (contentType === "VIDEO") {
      const source: string = body.source || "youtube";

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
            { error: "Invalid YouTube URL" },
            { status: 400 }
          );
        }
        videoUrl = normalized;
      }

      if (body.resourceUrl?.trim() && source === "youtube") {
        resourceUrl = body.resourceUrl.trim();
      }
      if (body.videoUrl?.trim() && source === "upload") {
        const normalized = normalizeYouTubeUrl(body.videoUrl);
        if (normalized) videoUrl = normalized;
      }
    } else if (contentType === "PDF") {
      if (!body.resourceUrl?.trim()) {
        return NextResponse.json(
          {
            error: "PDF document URL is required for PDF content",
            messageAr: "يجب رفع ملف PDF قبل الحفظ",
          },
          { status: 400 }
        );
      }
      resourceUrl = body.resourceUrl.trim();
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
        type: contentType, // VIDEO or PDF
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

    await prisma.auditLog.create({
      data: {
        actorId: auth.session.userId,
        action: "FREE_CONTENT_CREATED",
        entityType: "FreeResource",
        entityId: resource.id,
        metadata: { type: contentType, title: resource.title },
      },
    });

    return NextResponse.json({
      id: resource.id,
      title: resource.title,
      slug: resource.slug,
      type: resource.type,
      status: resource.status,
      resourceUrl: resource.resourceUrl,
      videoUrl: resource.videoUrl,
      createdAt: resource.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("[admin/free-vena] POST error:", error);
    return NextResponse.json(
      { error: "Failed to create free content" },
      { status: 500 }
    );
  }
}