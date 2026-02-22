import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Icon } from "@iconify/react";
import Navbar from "@/components/landing/layout/Navbar";
import Footer from "@/components/landing/layout/Footer";
import { integrations, categories } from "../data";

interface PageProps {
    params: Promise<{
        slug: string;
    }>
}

// Generate static params so these pages are statically compiled at build time
export function generateStaticParams() {
    return integrations.map((app) => ({
        slug: app.id,
    }));
}

export default async function IntegrationDetailPage({ params }: PageProps) {
    const { slug } = await params;
    const app = integrations.find((i) => i.id === slug);

    if (!app) {
        notFound();
    }

    const category = categories.find((c) => c.id === app.category);

    return (
        <div className="landing-theme min-h-screen bg-background text-foreground font-sans antialiased dark">
            <Navbar />

            <main className="relative z-[1] pt-40 pb-24">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 items-start">
                        {/* Left Sidebar (Sticky) */}
                        <div className="w-full lg:w-1/3 lg:sticky lg:top-40 shrink-0 space-y-8">
                            {/* App Identity */}
                            <div>
                                <div className="size-20 bg-background border border-border/40 rounded-2xl flex items-center justify-center shadow-sm mb-6">
                                    {app.iconType === "iconify" ? (
                                        <Icon icon={app.icon} className="text-[40px]" />
                                    ) : app.iconType === "img" ? (
                                        <Image src={app.icon} alt={app.name} width={40} height={40} className="object-contain" unoptimized />
                                    ) : app.id === "linear" ? (
                                        <div className="size-10 bg-[#5E6AD2] rounded-xl flex items-center justify-center text-white text-lg font-bold">L</div>
                                    ) : null}
                                </div>

                                <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4 leading-tight">
                                    {app.name}
                                </h1>

                                <div className="space-y-1.5">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Category</p>
                                    {category && (
                                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-[13px] font-medium ${category.color}`}>
                                            {category.label}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="space-y-3 pt-6">
                                <Link
                                    href="/auth/signup"
                                    className="flex w-full items-center justify-center h-9 px-4 rounded-[6px] bg-white text-black font-medium hover:bg-gray-200 transition-colors text-sm shadow-sm"
                                >
                                    Try Khanflow for free
                                </Link>

                                <Link
                                    href="/apps"
                                    className="flex w-full items-center justify-center h-9 px-4 rounded-[6px] bg-[#1a1a1a] border border-white/10 text-[#ededed] font-medium hover:bg-[#2a2a2a] transition-colors gap-2 text-sm shadow-sm"
                                >
                                    <ArrowLeft className="size-4" />
                                    All Integrations
                                </Link>
                            </div>
                        </div>

                        {/* Right Content Area */}
                        <div className="flex-1 space-y-16 lg:mt-6">
                            {/* About Section */}
                            <section>
                                <h2 className="text-xl font-semibold text-foreground mb-4">
                                    About the {app.name} integration
                                </h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    {app.aboutText}
                                </p>
                            </section>

                            {/* Features Container */}
                            <div className="space-y-12">
                                {app.features.map((feature, idx) => (
                                    <section key={idx}>
                                        <h2 className="text-xl font-semibold text-foreground mb-4">
                                            {feature.title}
                                        </h2>
                                        <p className="text-muted-foreground leading-relaxed">
                                            {feature.description}
                                        </p>
                                    </section>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
