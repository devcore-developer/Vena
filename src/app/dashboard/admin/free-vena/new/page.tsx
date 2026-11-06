import { prisma } from "@/lib/prisma";
import { FreeVideoForm } from "@/components/admin/free/FreeVideoForm";

export const metadata = { title: "Add Free Video" };

export default async function NewFreeVideoPage() {
  // Fetch categories on the server
  let categories: { id: string; name: string }[] = [];

  try {
    categories = await prisma.courseCategory.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
  } catch {
    // DB unavailable
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-charcoal">Add Free Video</h1>
        <p className="text-charcoal-muted mt-1">
          Upload a video file or embed a YouTube link.
        </p>
      </div>

      <FreeVideoForm mode="create" categories={categories} />
    </div>
  );
}