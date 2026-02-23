import Link from "next/link";

export default function WarmFooter() {
  return (
    <footer className="py-12 border-t border-[oklch(0.35_0.01_50)]">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-[oklch(0.58_0.015_50)] text-sm">
        <div>&copy; 2023 Unified Inc. All rights reserved.</div>
        <div className="flex gap-6 mt-4 md:mt-0">
          <Link
            href="#"
            className="hover:text-[oklch(0.82_0.008_75)] transition-colors"
          >
            Privacy
          </Link>
          <Link
            href="#"
            className="hover:text-[oklch(0.82_0.008_75)] transition-colors"
          >
            Terms
          </Link>
          <Link
            href="#"
            className="hover:text-[oklch(0.82_0.008_75)] transition-colors"
          >
            Twitter
          </Link>
        </div>
      </div>
    </footer>
  );
}
