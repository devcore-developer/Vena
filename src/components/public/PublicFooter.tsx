import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function PublicFooter() {
  return (
    <footer className="bg-vena-900 text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <Logo size="md" variant="light" className="mb-4" />
          <p className="text-sm text-vena-200">
            Premium educational platform for medical students and
            professionals.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-vena-100 mb-3">
            Platform
          </h3>
          <ul className="space-y-2 text-sm text-vena-200">
            <li>
              <Link href="/courses" className="hover:text-white">
                Courses
              </Link>
            </li>
            <li>
              <Link href="/doctors" className="hover:text-white">
                Doctors
              </Link>
            </li>
            <li>
              <Link href="/free" className="hover:text-white">
                Free VENA
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-vena-100 mb-3">Legal</h3>
          <ul className="space-y-2 text-sm text-vena-200">
            <li>
              <Link href="/terms" className="hover:text-white">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-white">
                Privacy Policy
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-vena-100 mb-3">Contact</h3>
          <p className="text-sm text-vena-200">support@vena.com</p>
        </div>
      </div>
      <div className="border-t border-vena-800 py-6 text-center text-xs text-vena-300">
        © {new Date().getFullYear()} VENA — Medical Learning Platform. All
        rights reserved.
      </div>
    </footer>
  );
}