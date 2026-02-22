import Navbar from "@/components/landing/layout/Navbar";
import Footer from "@/components/landing/layout/Footer";
import { Link2, Zap, Layout, Brain } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
    return (
        <div className="landing-theme min-h-screen bg-background text-foreground font-sans antialiased dark">
            <Navbar />

            <main className="relative z-[1] pt-32 pb-24">
                {/* Header Section */}
                <section className="max-w-4xl mx-auto px-6 mb-20">
                    <div className="flex flex-col items-start gap-4 max-w-2xl">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                            About Khanflow
                        </h1>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            Stop context-switching. Khanflow is a unified command center designed for high-achievers who want to manage their time effortlessly.
                        </p>
                    </div>
                </section>

                <section className="max-w-4xl mx-auto px-6">
                    <div className="space-y-16">

                        {/* The Origin Story */}
                        <div>
                            <div className="mb-6 border-b border-border/40 pb-4">
                                <h2 className="text-xl font-medium tracking-tight text-foreground">
                                    The Origin
                                </h2>
                            </div>

                            {/* Founder Story Card */}
                            <div className="group flex flex-col md:flex-row gap-8 bg-background border border-border/40 hover:border-border rounded-xl p-8 transition-colors duration-200">

                                {/* Founder Image */}
                                <div className="shrink-0">
                                    <div className="w-32 h-32 md:w-48 md:h-48 rounded-2xl bg-primary/10 border border-primary/20 overflow-hidden relative flex items-center justify-center">
                                        {/* Replace src with actual image path when available */}
                                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent z-10"></div>
                                        <span className="text-primary/50 font-medium text-sm text-center px-4">Founder Image<br />(Add via next/image)</span>
                                    </div>
                                    <div className="mt-4 text-center md:text-left">
                                        <h3 className="text-lg font-semibold text-foreground">Mashiur</h3>
                                        <p className="text-sm text-primary">Founder & Developer</p>
                                    </div>
                                </div>

                                {/* Story Content */}
                                <div className="flex-1 space-y-5 text-muted-foreground leading-relaxed text-sm md:text-base border-t border-border/40 pt-6 md:border-t-0 md:pt-0 md:border-l md:pl-8">
                                    <p>
                                        The idea for Khanflow started with a surprisingly common frustration: scheduling conflicts. When my school switched from Google Workspace to Microsoft, I suddenly needed a single scheduling link. However, existing platforms like Calendly wouldn't let me seamlessly sync both my personal and work calendars together. <strong>So, I built my own scheduling platform.</strong>
                                    </p>
                                    <p>
                                        But the real wake-up call came managing my daily tasks. I religiously used a Kanban board to categorize my life. The psychology of checking things off is incredibly powerful. The problem? Entire boards dedicated to "Health & Fitness" or "Personal Development" collected dust while I hyperfocused on work.
                                    </p>
                                    <p>
                                        One day, a teammate pointed out, <em>"Mashiur, I've been asking you to do this since summer, and it still hasn't been done."</em> That hit hard. As someone managing ADHD, letting tasks slip through the cracks, or worse, losing touch with connections because I simply forgot to catch up with them, was unacceptable to me. My productivity systems were actually causing me to drop the ball.
                                    </p>
                                    <p>
                                        I realized I needed more than just another list. I needed an intelligent, comprehensive AI solution. Something that could read my tasks, dynamically prioritize them, analyze my calendar, and literally finding the exact space to schedule them <em>for</em> me.
                                    </p>
                                    <p className="font-medium text-foreground">
                                        I started building Khanflow as the fastest, most efficient way to bring all these integrated apps, voice AI, and intelligent scheduling under one unified command center.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Core Principles */}
                        <div>
                            <div className="mb-6 border-b border-border/40 pb-4">
                                <h2 className="text-xl font-medium tracking-tight text-foreground">
                                    Core Principles
                                </h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="group flex flex-col text-left h-full bg-background border border-border/40 hover:border-border rounded-xl p-6 transition-colors duration-200">
                                    <div className="flex items-center justify-between w-full h-10 mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 flex items-center justify-center shrink-0 text-foreground">
                                                <Zap className="size-[22px]" />
                                            </div>
                                            <h3 className="text-sm font-semibold text-foreground">Speed is a Feature</h3>
                                        </div>
                                    </div>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Interactions should be measured in milliseconds. We prioritize keyboard shortcuts and rapid rendering above all else.
                                    </p>
                                </div>

                                <div className="group flex flex-col text-left h-full bg-background border border-border/40 hover:border-border rounded-xl p-6 transition-colors duration-200">
                                    <div className="flex items-center justify-between w-full h-10 mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 flex items-center justify-center shrink-0 text-foreground">
                                                <Layout className="size-[22px]" />
                                            </div>
                                            <h3 className="text-sm font-semibold text-foreground">One Unified View</h3>
                                        </div>
                                    </div>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        If it's happening today, it should be on one screen. Eliminating the need to switch tabs to check your availability.
                                    </p>
                                </div>

                                <div className="group flex flex-col text-left h-full bg-background border border-border/40 hover:border-border rounded-xl p-6 transition-colors duration-200">
                                    <div className="flex items-center justify-between w-full h-10 mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 flex items-center justify-center shrink-0 text-foreground">
                                                <Brain className="size-[22px]" />
                                            </div>
                                            <h3 className="text-sm font-semibold text-foreground">AI as an Assistant</h3>
                                        </div>
                                    </div>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        The AI suggests the optimal schedule, but you always act as the boss. Complete drag-and-drop control remains in your hands.
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </section>

                {/* CTA Section */}
                <section className="max-w-4xl mx-auto px-6 mt-32">
                    <div className="bg-card/50 border border-border/40 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                        <h2 className="text-2xl font-medium tracking-tight mb-3 text-foreground">
                            Ready to take control of your time?
                        </h2>
                        <p className="text-muted-foreground mb-8 max-w-md">
                            Join the growing community of high-achievers who are streamlining their daily workflows.
                        </p>
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center justify-center h-10 px-6 rounded-md bg-foreground text-background font-medium hover:opacity-90 transition-opacity text-sm"
                        >
                            Start Free Trial
                        </Link>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
