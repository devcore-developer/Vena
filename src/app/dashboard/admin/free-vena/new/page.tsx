import { prisma } from "@/lib/prisma";
import { FreeContentForm } from "@/components/admin/free/FreeContentForm";

export const metadata = { title: "Add Free Content" };

export default async function NewFreeContentPage() {
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
        <h1 className="text-2xl font-bold text-charcoal">Add Free Content</h1>
        <p className="text-charcoal-muted mt-1">
          Add a video (upload or YouTube) or a PDF document to Free VENA.
        </p>
      </div>

      <FreeContentForm mode="create" categories={categories} />
    </div>
  );
}