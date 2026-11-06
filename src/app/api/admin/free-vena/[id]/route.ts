import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { normalizeYouTubeUrl } from "@/lib/youtube";
import {
  detectVideoSource,
  deleteFreeVideo,
} from "@/lib/free-video-storage";

// ============================================================
// GET /api/admin/free/[id] — Get a single free video for editing
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

    if (!resource || resource.type !== "VIDEO") {
      return NextResponse.json(
        { error: "Free video not found" },
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
      categoryId: resource.categoryId,
      categoryName: resource.category?.name || null,
      status: resource.status,
      isFeatured: resource.isFeatured,
      source: detectVideoSource({
        resourceUrl: resource.resourceUrl,
        videoUrl: resource.videoUrl,
      }),
      createdAt: resource.createdAt.toISOString(),
      updatedAt: resource.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("[admin/free/[id]] GET error:", error);
    return NextResponse.json(
      { error: "Failed to load free video" },
      { status: 500 }
    );
  }
}

// ============================================================
// PUT /api/admin/free/[id] — Update a free video
//
// IMPORTANT: When the admin changes the source type, we:
//   - If switching from upload → youtube: delete the old uploaded blob
//   - If switching from youtube → upload: clear the YouTube URL
//   - If keeping the same source: update only the URL
// ============================================================
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    // Fetch existing record (we need it to detect source changes)
    const existing = await prisma.freeResource.findUnique({
      where: { id: params.id },
    });

    if (!existing || existing.type !== "VIDEO") {
      return NextResponse.json(
        { error: "Free video not found" },
        { status: 404 }
      );
    }

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

    const source: string = body.source || "youtube";
    const oldSource = detectVideoSource({
      resourceUrl: existing.resourceUrl,
      videoUrl: existing.videoUrl,
    });

    let newResourceUrl: string | null = existing.resourceUrl;
    let newVideoUrl: string | null = existing.videoUrl;

    // --------------------------------------------------------
    // Source switching logic
    // --------------------------------------------------------
    if (source === "upload") {
      // Upload mode
      if (body.resourceUrl !== undefined) {
        // New upload URL provided
        if (body.resourceUrl && body.resourceUrl.trim()) {
          // If there was an old uploaded video, delete it (only if URL changed)
          if (
            existing.resourceUrl &&
            existing.resourceUrl !== body.resourceUrl
          ) {
            await deleteFreeVideo(existing.resourceUrl);
          }
          newResourceUrl = body.resourceUrl.trim();
        } else if (body.resourceUrl === "") {
          // Explicitly cleared — delete the old blob
          if (existing.resourceUrl) {
            await deleteFreeVideo(existing.resourceUrl);
          }
          newResourceUrl = null;
        }
      }

      // Clear YouTube URL when switching to upload (unless explicitly kept)
      if (oldSource === "youtube" && source === "upload") {
        newVideoUrl = null;
      }
    }

    if (source === "youtube") {
      // YouTube mode
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

      // If switching from upload → youtube, delete the old blob
      if (oldSource === "upload" && source === "youtube") {
        if (existing.resourceUrl) {
          await deleteFreeVideo(existing.resourceUrl);
        }
        newResourceUrl = null;
      }
    }

    // --------------------------------------------------------
    // Slug update (optional)
    // --------------------------------------------------------
    let newSlug = existing.slug;
    if (body.slug?.trim() && body.slug !== existing.slug) {
      newSlug = body.slug.trim();
      // Check uniqueness
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
        resourceUrl: newResourceUrl,
        videoUrl: newVideoUrl,
        categoryId: body.categoryId || null,
        status: body.status || existing.status,
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
        action: "FREE_VIDEO_UPDATED",
        entityType: "FreeResource",
        entityId: updated.id,
        metadata: {
          oldSource,
          newSource: source,
          title: updated.title,
        },
      },
    });

    return NextResponse.json({
      id: updated.id,
      title: updated.title,
      slug: updated.slug,
      status: updated.status,
      source: detectVideoSource({
        resourceUrl: updated.resourceUrl,
        videoUrl: updated.videoUrl,
      }),
      resourceUrl: updated.resourceUrl,
      videoUrl: updated.videoUrl,
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("[admin/free/[id]] PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update free video" },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE /api/admin/free/[id] — Delete a free video
// (also deletes the uploaded blob if it was a direct upload)
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
        { error: "Free video not found" },
        { status: 404 }
      );
    }

    // Delete the uploaded blob if it was a direct upload
    if (existing.resourceUrl) {
      await deleteFreeVideo(existing.resourceUrl);
    }

    await prisma.freeResource.delete({
      where: { id: params.id },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: auth.session.userId,
        action: "FREE_VIDEO_DELETED",
        entityType: "FreeResource",
        entityId: params.id,
        metadata: { title: existing.title },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin/free/[id]] DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete free video" },
      { status: 500 }
    );
  }
}