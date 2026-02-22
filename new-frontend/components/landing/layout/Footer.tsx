import Link from "next/link";
import { Mail, Twitter } from "lucide-react";

const productLinks = [
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Integrations", href: "/apps" },
];

const supportLinks = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
];

const socialLinks = [
  { icon: Twitter, href: "https://twitter.com/khanflow", label: "Twitter" },
  { icon: Mail, href: "mailto:support@khanflow.com", label: "Email" },
];

export default function Footer() {
  return (
    <footer className="bg-[#221F1F] border-t border-[#3a2d28] pt-16 pb-8">
      <div className="max-w-[90rem] mx-auto px-6 md:px-12 lg:px-20">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr] gap-12 lg:gap-16">
          {/* Brand column */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#E53E3E]" />
                <div className="w-3 h-3 rounded-full bg-[#F6C844]" />
                <div className="w-3 h-3 rounded-full bg-[#68D391]" />
              </div>
              <span className="font-semibold tracking-tight text-[#e0deda]">
                Khanflow
              </span>
            </div>

            <div>
              <p className="text-lg font-serif italic text-[#a3948e] leading-relaxed">
                Stop juggling apps.
              </p>
              <p className="text-lg font-serif font-semibold text-[#e0deda] leading-relaxed">
                Start hitting deadlines.
              </p>
            </div>

            <p className="text-sm text-[#5c4d47] leading-relaxed max-w-xs">
              AI-powered task management that syncs your calendar, to-dos, and
              workflow into one daily plan.
            </p>

            <div className="flex items-center gap-4 mt-2">
              {socialLinks.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  aria-label={social.label}
                  className="text-[#5c4d47] hover:text-[#cd826d] transition-colors"
                >
                  <social.icon className="w-5 h-5" />
                </Link>
              ))}
            </div>
          </div>

          {/* Product column */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#cd826d] mb-6">
              Product
            </h4>
            <ul className="flex flex-col gap-3">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#5c4d47] hover:text-[#cd826d] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support column */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#cd826d] mb-6">
              Support
            </h4>
            <ul className="flex flex-col gap-3">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#5c4d47] hover:text-[#cd826d] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#3a2d28] mt-14 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-[#5c4d47]">
              &copy; 2024 Khanflow. Built for the high-achieving student.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#5c4d47]">
              <span className="w-2 h-2 rounded-full bg-[#68D391] inline-block" />
              All systems operational
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
