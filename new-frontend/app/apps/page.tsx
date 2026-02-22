import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Icon } from "@iconify/react";
import Navbar from "@/components/landing/layout/Navbar";
import Footer from "@/components/landing/layout/Footer";
import { integrations, categories } from "./data";

export default function AppsDirectoryPage() {
    return (
        <div className="landing-theme min-h-screen bg-background text-foreground font-sans antialiased dark">
            <Navbar />

            <main className="relative z-[1] pt-32 pb-24">
                {/* Header Section */}
                <section className="max-w-4xl mx-auto px-6 mb-20">
                    <div className="flex flex-col items-start gap-4 max-w-2xl">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                            Integrations
                        </h1>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            Supercharge your workflow by connecting Khanflow with the tools your team already uses every day.
                        </p>
                    </div>
                </section>

                {/* Integration Grid */}
                <section className="max-w-4xl mx-auto px-6">
                    <div className="space-y-16">
                        {categories.map((category) => {
                            const categoryApps = integrations.filter((app) => app.category === category.id);
                            if (categoryApps.length === 0) return null;

                            return (
                                <div key={category.id}>
                                    {/* Category Header */}
                                    <div className="mb-6 border-b border-border/40 pb-4">
                                        <h2 className="text-xl font-medium tracking-tight text-foreground">
                                            {category.label}
                                        </h2>
                                    </div>

                                    {/* Minimalist Cards Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {categoryApps.map((app) => (
                                            <Link
                                                key={app.id}
                                                href={`/apps/${app.id}`}
                                                className="group flex flex-col text-left h-full bg-background border border-border/40 hover:border-border rounded-xl p-5 transition-colors duration-200"
                                            >
                                                {/* Top Always-Visible Bar */}
                                                <div className="flex items-center justify-between w-full h-10">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-8 flex items-center justify-center shrink-0">
                                                            {app.iconType === "iconify" ? (
                                                                <Icon icon={app.icon} className="text-[28px]" />
                                                            ) : app.iconType === "img" ? (
                                                                <Image src={app.icon} alt={app.name} width={28} height={28} className="object-contain" unoptimized />
                                                            ) : app.id === "linear" ? (
                                                                <div className="size-6 bg-[#5E6AD2] rounded-sm flex items-center justify-center text-white text-xs font-bold">L</div>
                                                            ) : null}
                                                        </div>
                                                        <h3 className="text-sm font-semibold text-foreground">{app.name}</h3>
                                                    </div>
                                                </div>
                                                {/* Description snippet */}
                                                <p className="mt-4 text-sm text-muted-foreground line-clamp-2">
                                                    {app.description}
                                                </p>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* CTA Section */}
                <section className="max-w-4xl mx-auto px-6 mt-32">
                    <div className="bg-card/50 border border-border/40 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                        <h2 className="text-2xl font-medium tracking-tight mb-3 text-foreground">
                            Don't see your tool?
                        </h2>
                        <p className="text-muted-foreground mb-8 max-w-md">
                            We're constantly adding new integrations. Let us know what you'd like to see next.
                        </p>
                        <Link
                            href="/auth/signup"
                            className="inline-flex items-center justify-center h-10 px-6 rounded-md bg-foreground text-background font-medium hover:opacity-90 transition-opacity text-sm"
                        >
                            Request Integration
                        </Link>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
