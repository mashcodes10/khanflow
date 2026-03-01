'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Modern, Minimalist Voice Assistant Layout Previews
 */

// Fake wave dots (no audio, just visual)
function DemoWaveDots({ size = 'md', active = true }: { size?: 'sm' | 'md' | 'lg', active?: boolean }) {
    const dots = [
        { color: '#E53E3E', delay: 0, maxH: size === 'lg' ? 48 : size === 'md' ? 24 : 16 },
        { color: '#E53E3E', delay: 0.08, maxH: size === 'lg' ? 36 : size === 'md' ? 20 : 12 },
        { color: '#F6C844', delay: 0.16, maxH: size === 'lg' ? 52 : size === 'md' ? 28 : 18 },
        { color: '#F6C844', delay: 0.24, maxH: size === 'lg' ? 40 : size === 'md' ? 22 : 14 },
        { color: '#68D391', delay: 0.32, maxH: size === 'lg' ? 50 : size === 'md' ? 26 : 16 },
        { color: '#68D391', delay: 0.4, maxH: size === 'lg' ? 38 : size === 'md' ? 20 : 12 },
        { color: '#CBD5E0', delay: 0.48, maxH: size === 'lg' ? 28 : size === 'md' ? 16 : 8, isPill: true },
    ]
    return (
        <div className="flex items-center justify-center gap-[4px]">
            {dots.map((dot, i) => (
                <div
                    key={i}
                    className="rounded-full"
                    style={{
                        width: dot.isPill ? (size === 'sm' ? 8 : 12) : (size === 'sm' ? 4 : 5),
                        height: size === 'sm' ? 4 : 5,
                        backgroundColor: active ? dot.color : '#444',
                        animation: active ? `waveBar 1.2s ease-in-out ${dot.delay + 0.3}s infinite` : 'none',
                        // @ts-expect-error css custom property
                        '--max-h': `${dot.maxH}px`,
                        opacity: active ? 1 : 0.5,
                    }}
                />
            ))}
        </div>
    )
}

// Ultra-minimalist modern message
function DemoMessage({ text, isUser }: { text: string; isUser: boolean }) {
    return (
        <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
            <div className={cn(
                'max-w-[80%] flex flex-col gap-1',
                isUser ? 'items-end' : 'items-start'
            )}>
                <div
                    className={cn(
                        'px-4 py-2.5 text-[14px] leading-relaxed',
                        isUser
                            ? 'bg-[#1a1a1a] text-[#ededed] rounded-2xl rounded-tr-sm shadow-sm border border-white/[0.03]'
                            : 'text-[#a1a1a1] px-1'
                    )}
                >
                    {text}
                </div>
                <div className="flex items-center gap-1.5 px-2">
                    <span className="text-[10px] text-[#666] font-medium uppercase tracking-wider">
                        {isUser ? 'You' : 'Aura AI'}
                    </span>
                </div>
            </div>
        </div>
    )
}

// Ultra-minimalist modern card
function DemoActionCard() {
    return (
        <div className="bg-[#141414] border border-white/[0.06] rounded-2xl p-5 max-w-sm w-full shadow-sm hover:border-white/[0.1] transition-colors">
            <div className="flex items-center gap-3 mb-5">
                <div className="size-8 rounded-full bg-[#3ecf8e]/10 flex items-center justify-center">
                    <span className="text-[#3ecf8e] text-xs">📅</span>
                </div>
                <div>
                    <p className="text-[14px] font-medium text-[#ededed]">Team Sync Meeting</p>
                    <p className="text-[12px] text-[#888]">Review details</p>
                </div>
            </div>

            <div className="flex flex-col gap-3 mb-6">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.04]">
                    <span className="text-[13px] text-[#888]">Date</span>
                    <span className="text-[13px] text-[#ededed] font-medium">Tomorrow</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.04]">
                    <span className="text-[13px] text-[#888]">Time</span>
                    <span className="text-[13px] text-[#ededed] font-medium">10:00 AM</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-[13px] text-[#888]">Duration</span>
                    <div className="flex gap-2">
                        <span className="px-2 py-1 rounded-md bg-[#222] text-[#ededed] text-[11px] border border-white/[0.05]">30m</span>
                        <span className="px-2 py-1 rounded-md bg-transparent text-[#888] text-[11px] border border-transparent">1h</span>
                    </div>
                </div>
            </div>

            <div className="flex gap-2">
                <button className="flex-1 py-2.5 rounded-xl bg-[#ededed] text-[#121212] text-[13px] font-medium hover:bg-white transition-colors">
                    Confirm
                </button>
                <button className="flex-1 py-2.5 rounded-xl bg-transparent border border-white/[0.08] text-[#ededed] text-[13px] font-medium hover:bg-white/[0.02] transition-colors">
                    Edit
                </button>
            </div>
        </div>
    )
}

// ─── OPTION 1: The "Floating Island" (Dynamic Island style) ───
// Centralized column, ultra-clean, wave lives in a floating pill at the bottom.
function Option1Island() {
    return (
        <div className="flex flex-col h-full bg-[#0a0a0a] rounded-xl overflow-hidden border border-white/[0.08] relative font-sans">
            {/* Scrollable area */}
            <div className="flex-1 overflow-y-auto pt-12 pb-32 px-6">
                <div className="max-w-2xl mx-auto space-y-8">
                    <DemoMessage text="Schedule a team sync for tomorrow at 10 AM" isUser />
                    <DemoMessage text="I can help with that. Here are the details for your meeting:" isUser={false} />
                    <div className="pl-1"><DemoActionCard /></div>
                </div>
            </div>

            {/* Floating Island Input */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none">
                <div className="pointer-events-auto flex items-center gap-4 bg-[#141414]/80 backdrop-blur-xl border border-white/[0.08] rounded-full p-2 pr-6 shadow-2xl">
                    {/* Recording state indicator / wave */}
                    <div className="bg-[#1a1a1a] rounded-full px-5 py-3 border border-white/[0.04] flex items-center gap-3">
                        <DemoWaveDots size="sm" active={true} />
                        <span className="text-[11px] text-[#3ecf8e] font-medium tracking-wider uppercase">Listening</span>
                    </div>

                    <input
                        type="text"
                        placeholder="Type manually..."
                        className="bg-transparent border-none outline-none text-[13px] text-[#ededed] placeholder:text-[#666] w-48"
                        disabled
                    />

                    <button className="size-8 rounded-full bg-white/[0.05] flex items-center justify-center text-[#888] hover:text-[#ededed] transition-colors ml-auto">
                        <span className="text-lg leading-none mb-1">↑</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── OPTION 2: "Linear/Notion" (Seamless Split) ───
// Left sidebar is just a clean list, right side is the active voice canvas. No harsh borders.
function Option2SeamlessSplit() {
    return (
        <div className="flex h-full bg-[#0a0a0a] rounded-xl overflow-hidden border border-white/[0.08] font-sans">
            {/* Left History (Subtle) */}
            <div className="w-[320px] bg-[#0f0f0f] flex flex-col pt-6 pb-4">
                <div className="px-6 pb-4">
                    <h3 className="text-[12px] font-medium text-[#888] uppercase tracking-wider">Conversation</h3>
                </div>
                <div className="flex-1 overflow-y-auto px-6 space-y-6">
                    <div className="space-y-2">
                        <p className="text-[13px] text-[#ededed]">Schedule a team sync...</p>
                        <DemoActionCard />
                    </div>
                </div>
                <div className="px-6 pt-4">
                    <input type="text" placeholder="Type a message..." className="w-full bg-[#1a1a1a] border border-white/[0.04] rounded-xl px-4 py-2.5 text-[13px] text-[#ededed] focus:outline-none" disabled />
                </div>
            </div>

            {/* Right Active Canvas (Clean) */}
            <div className="flex-1 flex flex-col items-center justify-center bg-[#0a0a0a] p-12 relative border-l border-white/[0.04]">
                <div className="absolute top-6 left-6 flex items-center gap-2">
                    <div className="size-2 rounded-full bg-[#3ecf8e] animate-pulse" />
                    <span className="text-[11px] text-[#888] uppercase tracking-wider font-medium">Active</span>
                </div>

                <div className="flex flex-col items-center max-w-lg text-center gap-12">
                    <h2 className="text-3xl font-light text-[#ededed] leading-snug">
                        &quot;Schedule a <span className="text-[#3ecf8e] font-normal">team sync</span> for <span className="text-[#3ecf8e] font-normal">tomorrow</span> at <span className="text-[#3ecf8e] font-normal">10 AM</span>&quot;
                    </h2>

                    <div className="mt-8 scale-150 origin-center">
                        <DemoWaveDots size="lg" active={true} />
                    </div>

                    <div className="flex items-center gap-4 mt-8">
                        <button className="size-12 rounded-full border border-white/[0.08] flex items-center justify-center text-[#888] hover:bg-white/[0.05] transition-colors">✕</button>
                        <button className="size-16 rounded-full bg-[#1a1a1a] border border-white/[0.08] flex items-center justify-center text-[#ededed] hover:bg-white/[0.1] transition-colors">⏸</button>
                        <button className="size-12 rounded-full border border-white/[0.08] flex items-center justify-center text-[#888] hover:bg-white/[0.05] transition-colors">✓</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── OPTION 3: "Immersive Backdrop" (Glassmorphism focus) ───
// Large wave in background. Content is centered directly over it with intense blur.
function Option3Immersive() {
    return (
        <div className="flex flex-col h-full bg-[#0a0a0a] rounded-xl overflow-hidden border border-white/[0.08] relative font-sans">
            {/* Background ambient wave */}
            <div className="absolute inset-0 flex items-center justify-center opacity-40 scale-150 pointer-events-none blur-[2px]">
                <DemoWaveDots size="lg" active={true} />
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent pointer-events-none" />

            {/* Content strictly centered */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
                <div className="max-w-md w-full flex flex-col items-center gap-8">

                    {/* Current transcription */}
                    <div className="bg-[#141414]/60 backdrop-blur-md border border-white/[0.08] rounded-2xl p-6 w-full text-center shadow-lg">
                        <p className="text-sm font-medium text-[#3ecf8e] uppercase tracking-wider mb-3">Hearing...</p>
                        <p className="text-xl font-light text-[#ededed]">Schedule a meeting...</p>
                    </div>

                    {/* Action Card popping up */}
                    <div className="w-full relative shadow-2xl">
                        <div className="absolute inset-0 bg-[#3ecf8e]/5 blur-2xl rounded-2xl" />
                        <div className="relative"><DemoActionCard /></div>
                    </div>
                </div>
            </div>

            {/* Very minimal bottom bar */}
            <div className="relative z-10 p-6 flex justify-center">
                <div className="w-full max-w-sm flex items-center gap-3">
                    <input type="text" placeholder="Or type here..." className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-[13px] text-[#ededed] focus:outline-none backdrop-blur-sm" disabled />
                    <button className="size-11 rounded-xl bg-[#ededed] flex items-center justify-center text-[#0a0a0a]">
                        ↑
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function VoicePreviewPage() {
    const [selected, setSelected] = useState<string | null>(null)

    const layouts = [
        {
            id: 'Island',
            title: 'Floating Island',
            desc: 'Centralized feed. The wave and controls live in a beautiful floating pill at the bottom. Highly minimalist.',
            Component: Option1Island
        },
        {
            id: 'Seamless',
            title: 'Minimalist Split',
            desc: 'A seamless left sidebar for history. The right side is a clean, massive canvas dedicated solely to the active voice interaction.',
            Component: Option2SeamlessSplit
        },
        {
            id: 'Immersive',
            title: 'Immersive Backdrop',
            desc: 'The wave becomes ambient background art. UI elements are glassmorphic cards centered over it.',
            Component: Option3Immersive
        },
    ]

    return (
        <div className="min-h-screen bg-black text-[#ededed] p-10 font-sans">
            <div className="max-w-[1400px] mx-auto">
                {/* Header */}
                <div className="mb-12 max-w-2xl">
                    <h1 className="text-3xl font-normal tracking-tight mb-3">Voice UI Redesign</h1>
                    <p className="text-[15px] text-[#888] leading-relaxed">
                        Here are three ultra-clean, minimalist approaches. They remove boxy borders, use modern typography, seamless spacing, and subtle glass/transparency effects.
                    </p>
                </div>

                {/* Grid of options (1 column so they are large and detailed) */}
                <div className="flex flex-col gap-16">
                    {layouts.map(({ id, title, desc, Component }) => (
                        <div key={id} className="flex flex-col gap-5">
                            {/* Label */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-xl font-medium text-[#ededed]">{title}</h3>
                                    <p className="text-[14px] text-[#888] mt-1 pr-4 max-w-3xl">{desc}</p>
                                </div>
                                <button
                                    onClick={() => setSelected(id)}
                                    className={cn(
                                        'px-6 py-2.5 rounded-full text-[13px] font-medium transition-all w-fit shadow-sm',
                                        selected === id
                                            ? 'bg-[#ededed] text-[#0a0a0a]'
                                            : 'bg-[#141414] border border-white/[0.08] text-[#ededed] hover:border-white/[0.2] hover:bg-white/[0.02]'
                                    )}
                                >
                                    {selected === id ? '✓ Selected' : 'Choose this layout'}
                                </button>
                            </div>

                            {/* Large Preview */}
                            <div
                                className={cn(
                                    'h-[600px] rounded-2xl transition-all shadow-2xl bg-[#0a0a0a]',
                                    selected === id ? 'ring-1 ring-[#3ecf8e] ring-offset-4 ring-offset-black' : 'ring-1 ring-white/[0.04]'
                                )}
                            >
                                <Component />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
