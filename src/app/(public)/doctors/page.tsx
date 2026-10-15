import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Star, BookOpen, Users } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = {
  title: "Doctors",
  description: "Browse our verified medical doctors and their courses.",
};

export default async function DoctorsPage() {
  let doctors: Array<{
    id: string;
    slug: string;
    specialty: string;
    bio: string | null;
    rating: any;
    isVerified: boolean;
    avatarColor: string | null;
    user: { name: string };
  }> = [];

  try {
    doctors = await prisma.doctorProfile.findMany({
      where: { isVerified: true },
      include: {
        user: { select: { name: true } },
      },
      orderBy: { rating: "desc" },
    });
  } catch {
    // Database unavailable — render empty state
  }

  if (doctors.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-charcoal mb-2">Our Doctors</h1>
        <p className="text-charcoal-muted mb-8">
          Meet our verified medical professionals.
        </p>
        <EmptyState
          icon={Users}
          title="No doctors available"
          description="Verified doctors will appear here once the platform is fully configured."
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-charcoal mb-2">Our Doctors</h1>
      <p className="text-charcoal-muted mb-8">
        Meet our verified medical professionals.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.map((doc) => (
          <Card key={doc.id} className="overflow-hidden p-0">
            <div className={`h-20 ${doc.avatarColor || "bg-vena-500"} flex items-center justify-center`}>
              <Avatar
                name={doc.user.name}
                className="h-16 w-16 text-xl border-4 border-white"
              />
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-charcoal">
                  {doc.user.name}
                </h3>
                {doc.isVerified && (
                  <Badge variant="success">
                    <Star size={10} className="mr-1" /> Verified
                  </Badge>
                )}
              </div>
              <p className="text-sm text-vena-600 font-medium">
                {doc.specialty || "Medical Professional"}
              </p>
              {doc.bio && (
                <p className="text-sm text-charcoal-muted mt-2 line-clamp-2">
                  {doc.bio}
                </p>
              )}
              <div className="flex items-center gap-4 mt-3 text-xs text-charcoal-muted">
                {doc.rating && (
                  <span className="flex items-center gap-1">
                    <Star size={12} className="text-amber-500" />
                    {doc.rating.toNumber()}
                  </span>
                )}
              </div>
              <div className="mt-4">
                <Button
                  href={`/doctors/${doc.slug}`}
                  variant="secondary"
                  size="sm"
                  className="w-full"
                >
                  View Profile
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}