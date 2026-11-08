import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { normalizeYouTubeUrl } from "@/lib/youtube";
import {
  detectVideoSource,
  deleteFreeVideo,
} from "@/lib/free-video-storage";
import {
  deletePdfFromR2,
  objectKeyFromUrl,
} from "@/lib/pdf/storage";

// ============================================================
// GET /api/admin/free-vena/[id] — Get single free content (VIDEO or PDF)
// ============================================================
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const resource = await prisma.freeResource.findUnique({
      where: { id: params.id },
      include: {
        category: { select: { id: true, name: true } },
      },
    });

    if (!resource || !["VIDEO", "PDF"].includes(resource.type)) {
      return NextResponse.json(
        { error: "Free content not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: resource.id,
      title: resource.title,
      slug: resource.slug,
      description: resource.description,
      type: resource.type,
      content: resource.content,
      thumbnail: resource.thumbnail,
      resourceUrl: resource.resourceUrl,
      videoUrl: resource.videoUrl,
      streamvaultId: resource.streamvaultId,
      streamvaultIframe: resource.streamvaultIframe,
      streamvaultThumbnail: resource.streamvaultThumbnail,
      categoryId: resource.categoryId,
      categoryName: resource.category?.name || null,
      status: resource.status,
      isFeatured: resource.isFeatured,
      source:
        resource.type === "PDF"
          ? "upload"
          : detectVideoSource({
              resourceUrl: resource.resourceUrl,
              videoUrl: resource.videoUrl,
            }),
      createdAt: resource.createdAt.toISOString(),
      updatedAt: resource.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("[admin/free-vena/[id]] GET error:", error);
    return NextResponse.json(
      { error: "Failed to load free content" },
      { status: 500 }
    );
  }
}

// ============================================================
// PUT /api/admin/free-vena/[id] — Update free content (VIDEO or PDF)
// ============================================================
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const existing = await prisma.freeResource.findUnique({
      where: { id: params.id },
    });

    if (!existing || !["VIDEO", "PDF"].includes(existing.type)) {
      return NextResponse.json(
        { error: "Free content not found" },
        { status: 404 }
      );
    }

    const body = await req.json();

    if (!body.title?.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Determine the new content type (default to existing type if not provided)
    const newType: "VIDEO" | "PDF" = body.type === "PDF" ? "PDF" : "VIDEO";
    const oldType = existing.type as "VIDEO" | "PDF";

    let newResourceUrl: string | null = existing.resourceUrl;
    let newVideoUrl: string | null = existing.videoUrl;
    let newStreamvaultId: string | null = existing.streamvaultId;
    let newStreamvaultIframe: string | null = existing.streamvaultIframe;

    // --------------------------------------------------------
    // Handle resource URL changes (and cleanup old objects)
    // --------------------------------------------------------

    // VIDEO → PDF: clear video-specific fields, delete old video blob
    if (oldType === "VIDEO" && newType === "PDF") {
      if (existing.resourceUrl) {
        await deleteFreeVideo(existing.resourceUrl);
      }
      newVideoUrl = null;
      newStreamvaultId = null;
      newStreamvaultIframe = null;
    }

    // PDF → VIDEO: delete old PDF, clear PDF-specific fields
    if (oldType === "PDF" && newType === "VIDEO") {
      if (existing.resourceUrl) {
        const oldKey = objectKeyFromUrl(existing.resourceUrl);
        if (oldKey) await deletePdfFromR2(oldKey);
      }
    }

    if (newType === "VIDEO") {
      const source: string = body.source || "youtube";

      if (body.resourceUrl !== undefined) {
        if (body.resourceUrl && body.resourceUrl.trim()) {
          if (
            existing.resourceUrl &&
            existing.resourceUrl !== body.resourceUrl
          ) {
            await deleteFreeVideo(existing.resourceUrl);
          }
          newResourceUrl = body.resourceUrl.trim();
        } else if (body.resourceUrl === "") {
          if (existing.resourceUrl) {
            await deleteFreeVideo(existing.resourceUrl);
          }
          newResourceUrl = null;
        }
      }

      if (body.videoUrl !== undefined) {
        if (body.videoUrl && body.videoUrl.trim()) {
          const normalized = normalizeYouTubeUrl(body.videoUrl);
          if (!normalized) {
            return NextResponse.json(
              { error: "Invalid YouTube URL" },
              { status: 400 }
            );
          }
          newVideoUrl = normalized;
        } else {
          newVideoUrl = null;
        }
      }
    } else if (newType === "PDF") {
      // PDF update — handle resource URL changes
      if (body.resourceUrl !== undefined) {
        if (body.resourceUrl && body.resourceUrl.trim()) {
          if (
            existing.resourceUrl &&
            existing.resourceUrl !== body.resourceUrl
          ) {
            // Old was a PDF — delete from R2
            if (oldType === "PDF") {
              const oldKey = objectKeyFromUrl(existing.resourceUrl);
              if (oldKey) await deletePdfFromR2(oldKey);
            } else {
              // Old was a video — delete the video blob
              await deleteFreeVideo(existing.resourceUrl);
            }
          }
          newResourceUrl = body.resourceUrl.trim();
        } else if (body.resourceUrl === "") {
          if (existing.resourceUrl) {
            if (oldType === "PDF") {
              const oldKey = objectKeyFromUrl(existing.resourceUrl);
              if (oldKey) await deletePdfFromR2(oldKey);
            } else {
              await deleteFreeVideo(existing.resourceUrl);
            }
          }
          newResourceUrl = null;
        }
      }
      // PDFs don't have videoUrl / streamvault fields
      newVideoUrl = null;
      newStreamvaultId = null;
      newStreamvaultIframe = null;
    }

    // Slug update (optional)
    let newSlug = existing.slug;
    if (body.slug?.trim() && body.slug !== existing.slug) {
      newSlug = body.slug.trim();
      const slugConflict = await prisma.freeResource.findUnique({
        where: { slug: newSlug },
        select: { id: true },
      });
      if (slugConflict && slugConflict.id !== params.id) {
        return NextResponse.json(
          { error: "Slug already in use" },
          { status: 409 }
        );
      }
    }

    // --------------------------------------------------------
    // Update
    // --------------------------------------------------------
    const updated = await prisma.freeResource.update({
      where: { id: params.id },
      data: {
        title: body.title.trim(),
        slug: newSlug,
        description: body.description?.trim() || null,
        content: body.content?.trim() || null,
        thumbnail: body.thumbnail?.trim() || null,
        type: newType,
        resourceUrl: newResourceUrl,
        videoUrl: newVideoUrl,
        streamvaultId: newStreamvaultId,
        streamvaultIframe: newStreamvaultIframe,
        categoryId: body.categoryId || null,
        status: body.status || existing.status,
        isFeatured: body.isFeatured === true,
      },
      include: {
        category: { select: { id: true, name: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: auth.session.userId,
        action: "FREE_CONTENT_UPDATED",
        entityType: "FreeResource",
        entityId: updated.id,
        metadata: {
          oldType,
          newType,
          title: updated.title,
        },
      },
    });

    return NextResponse.json({
      id: updated.id,
      title: updated.title,
      slug: updated.slug,
      type: updated.type,
      status: updated.status,
      resourceUrl: updated.resourceUrl,
      videoUrl: updated.videoUrl,
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("[admin/free-vena/[id]] PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update free content" },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE /api/admin/free-vena/[id] — Delete free content + storage object
// ============================================================
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const existing = await prisma.freeResource.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Free content not found" },
        { status: 404 }
      );
    }

    // Delete the storage object based on type
    if (existing.resourceUrl) {
      if (existing.type === "PDF") {
        const objectKey = objectKeyFromUrl(existing.resourceUrl);
        if (objectKey) {
          await deletePdfFromR2(objectKey);
        }
      } else {
        await deleteFreeVideo(existing.resourceUrl);
      }
    }

    await prisma.freeResource.delete({
      where: { id: params.id },
    });

    await prisma.auditLog.create({
      data: {
        actorId: auth.session.userId,
        action: "FREE_CONTENT_DELETED",
        entityType: "FreeResource",
        entityId: params.id,
        metadata: {
          type: existing.type,
          title: existing.title,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin/free-vena/[id]] DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete free content" },
      { status: 500 }
    );
  }
}