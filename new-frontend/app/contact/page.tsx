import Navbar from "@/components/landing/layout/Navbar";
import Footer from "@/components/landing/layout/Footer";
import { Mail, MessageSquare, HelpCircle, Code } from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
    return (
        <div className="landing-theme min-h-screen bg-background text-foreground font-sans antialiased dark">
            <Navbar />

            <main className="relative z-[1] pt-32 pb-24">
                {/* Header Section */}
                <section className="max-w-4xl mx-auto px-6 mb-20">
                    <div className="flex flex-col items-start gap-4 max-w-2xl">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                            Get in touch
                        </h1>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            Have a question about Khanflow? As a solo developer building this platform,
                            I'm always ready to help you optimize your time or discuss new features.
                        </p>
                    </div>
                </section>

                {/* Contact Cards Grid */}
                <section className="max-w-4xl mx-auto px-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                        {/* Support Card */}
                        <a
                            href="mailto:support@khanflow.com"
                            className="group flex flex-col text-left h-full bg-background border border-border/40 hover:border-border rounded-xl p-6 transition-colors duration-200"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <HelpCircle className="size-5 text-primary" />
                                </div>
                                <h3 className="text-base font-semibold text-foreground">Support & Help</h3>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">
                                Need help with your account, finding a feature, or encountering a bug?
                                I directly review and respond to all support tickets.
                            </p>
                            <span className="inline-flex items-center text-sm font-medium text-foreground group-hover:text-primary transition-colors mt-auto">
                                support@khanflow.com
                                <span className="ml-[2px] group-hover:translate-x-1 transition-transform">→</span>
                            </span>
                        </a>

                        {/* Direct Contact Card */}
                        <a
                            href="mailto:mashiur@khanflow.com"
                            className="group flex flex-col text-left h-full bg-background border border-border/40 hover:border-border rounded-xl p-6 transition-colors duration-200"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <Code className="size-5 text-primary" />
                                </div>
                                <h3 className="text-base font-semibold text-foreground">Meet the Developer</h3>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">
                                Hi, I'm Mashiur, the solo developer behind Khanflow. If you have feedback,
                                feature ideas, or just want to chat about the product roadmap, reach out!
                            </p>
                            <span className="inline-flex items-center text-sm font-medium text-foreground group-hover:text-primary transition-colors mt-auto">
                                mashiur@khanflow.com
                                <span className="ml-[2px] group-hover:translate-x-1 transition-transform">→</span>
                            </span>
                        </a>

                        {/* Sales / General Card */}
                        <a
                            href="mailto:enterprise@khanflow.com"
                            className="group flex flex-col text-left h-full bg-background border border-border/40 hover:border-border rounded-xl p-6 transition-colors duration-200"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <MessageSquare className="size-5 text-primary" />
                                </div>
                                <h3 className="text-base font-semibold text-foreground">Sales & Inquiries</h3>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">
                                Curious about team deployments or upcoming enterprise plans? Let's discuss
                                how Khanflow can fit your organization.
                            </p>
                            <span className="inline-flex items-center text-sm font-medium text-foreground group-hover:text-primary transition-colors mt-auto">
                                enterprise@khanflow.com
                                <span className="ml-[2px] group-hover:translate-x-1 transition-transform">→</span>
                            </span>
                        </a>

                        {/* Legal Card */}
                        <a
                            href="mailto:legal@khanflow.com"
                            className="group flex flex-col text-left h-full bg-background border border-border/40 hover:border-border rounded-xl p-6 transition-colors duration-200"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <Mail className="size-5 text-primary" />
                                </div>
                                <h3 className="text-base font-semibold text-foreground">Legal & Privacy</h3>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">
                                For inquiries about our privacy policy, terms of service, or general legal
                                questions regarding data handling.
                            </p>
                            <span className="inline-flex items-center text-sm font-medium text-foreground group-hover:text-primary transition-colors mt-auto">
                                legal@khanflow.com
                                <span className="ml-[2px] group-hover:translate-x-1 transition-transform">→</span>
                            </span>
                        </a>

                    </div>
                </section>

                {/* Alternative CTA Section */}
                <section className="max-w-4xl mx-auto px-6 mt-32">
                    <div className="bg-card/50 border border-border/40 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                        <h2 className="text-2xl font-medium tracking-tight mb-3 text-foreground">
                            Schedule a call with me
                        </h2>
                        <p className="text-muted-foreground mb-8 max-w-md">
                            Want to discuss a custom implementation or just have a chat? Grab some time on my calendar.
                        </p>
                        <Link
                            href="https://khanflow.com/md.mashiurrahmankhan4a78/coffee-chat-w-mashiur-93ff"
                            target="_blank"
                            className="inline-flex items-center justify-center h-10 px-6 rounded-md bg-foreground text-background font-medium hover:opacity-90 transition-opacity text-sm gap-2"
                        >
                            Book a Coffee Chat
                        </Link>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
