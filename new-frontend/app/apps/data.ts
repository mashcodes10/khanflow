import { Calendar, Video, CheckSquare, Layers } from "lucide-react";

export type AppConfig = {
    id: string;
    name: string;
    description: string;
    category: string;
    iconType: "iconify" | "img" | "custom";
    icon: string;
    aboutText: string;
    features: { title: string; description: string }[];
};

export const categories = [
    { id: "calendar", label: "Calendars", icon: Calendar, color: "bg-[#242938] text-[#5b8cfa]" },
    { id: "video", label: "Video Conferencing", icon: Video, color: "bg-[#3f2131] text-[#f27b9b]" },
    { id: "tasks", label: "Task Management", icon: CheckSquare, color: "bg-[#1a3127] text-[#33d289]" },
    { id: "other", label: "Other Apps", icon: Layers, color: "bg-[#3f2f18] text-[#f3ad43]" },
];

export const integrations: AppConfig[] = [
    {
        id: "google-calendar",
        name: "Google Calendar",
        description: "Sync with Google Calendar and schedule events. Keep your schedule in sync across all devices.",
        iconType: "iconify",
        icon: "logos:google-calendar",
        category: "calendar",
        aboutText: "Make your schedule work better with Khanflow. Perfect app for time blocking with Google Calendar. Set aside time for tasks just like you do for meetings, and balance big projects and everyday work easily.",
        features: [
            {
                title: "Stay organized with the Google Calendar integration",
                description: "Automatically sync meetings, time blocks, and reminders from your Google Calendar directly into Khanflow. We ensure two-way sync so any changes you make in Khanflow instantly reflect on your Google Workspace."
            },
            {
                title: "Time block your tasks",
                description: "Drag and drop your Khanflow tasks directly onto your calendar to create dedicated focus blocks. Take back control of your day by treating your most important work like a non-negotiable meeting."
            }
        ]
    },
    {
        id: "outlook-calendar",
        name: "Outlook Calendar",
        description: "Outlook Calendar integration for scheduling and reminders. Works with Microsoft 365.",
        iconType: "img",
        icon: "/icons/outlook.svg",
        category: "calendar",
        aboutText: "Make your schedule work better with Khanflow. Perfect app for time blocking with Outlook Calendar. Set aside time for tasks just like you do for meetings, and balance big projects and everyday work easily.",
        features: [
            {
                title: "Stay organized with the Outlook Calendar integration",
                description: "Seamlessly integrate your Microsoft 365 Outlook Calendar with Khanflow. Pull in your enterprise meetings, secure appointments, and corporate events into one unified dashboard."
            },
            {
                title: "Enterprise-grade scheduling",
                description: "Khanflow respects your Outlook working hours and out-of-office statuses, ensuring you only block time for focused work when you are actually available."
            }
        ]
    },
    {
        id: "google-meet",
        name: "Google Meet",
        description: "Include Google Meet details in your events. Automatically generate meeting links.",
        iconType: "iconify",
        icon: "logos:google-meet",
        category: "video",
        aboutText: "Simplify your meeting preparation with the Google Meet integration. Automatically provision unique meeting links for every scheduled event directly from Khanflow.",
        features: [
            {
                title: "Instant meeting links",
                description: "Generate a secure, unique Google Meet conferencing link immediately upon scheduling an event in Khanflow. No need to open another app to organize your sync."
            },
            {
                title: "One-click join",
                description: "Never hunt for a link again. Join your upcoming video calls directly from your daily dashboard with a single click right as the meeting starts."
            }
        ]
    },
    {
        id: "zoom",
        name: "Zoom",
        description: "Include Zoom details in your Khanflow events. Create instant meeting links.",
        iconType: "img",
        icon: "/icons/zoom.svg",
        category: "video",
        aboutText: "Connect your Zoom account to automatically generate video conferencing details for your blocked events and shared calendar slots.",
        features: [
            {
                title: "Automated meeting creation",
                description: "When a new meeting block is created, Khanflow securely communicates with Zoom via OAuth to generate a unique meeting ID, password, and dial-in details."
            },
            {
                title: "Host controls",
                description: "Automatically set the host, enable waiting rooms, and configure recording settings directly from your Khanflow default preferences."
            }
        ]
    },
    {
        id: "microsoft-teams",
        name: "Microsoft Teams",
        description: "Microsoft Teams integration for video conferencing and collaboration.",
        iconType: "iconify",
        icon: "logos:microsoft-teams",
        category: "video",
        aboutText: "Unify your corporate communication with the Microsoft Teams integration. Provision secure, compliance-ready meeting links automatically.",
        features: [
            {
                title: "Seamless Teams integration",
                description: "Generate Microsoft Teams meeting details natively. Integrated perfectly with your existing Microsoft 365 corporate policy."
            }
        ]
    },
    {
        id: "google-tasks",
        name: "Google Tasks",
        description: "Manage your Google Tasks and track your to-do items. Sync tasks automatically.",
        iconType: "img",
        icon: "/icons/google-tasks.svg",
        category: "tasks",
        aboutText: "Centralize your task management by bringing your Google Tasks directly into your unified workflow. Keep track of simple lists without constantly switching contexts.",
        features: [
            {
                title: "Two-way task synchronization",
                description: "Complete a task in Khanflow, and it disappears from your Google Tasks sidebar. Add a quick item on your phone, and it instantly syncs back to your desktop."
            }
        ]
    },
    {
        id: "microsoft-todo",
        name: "Microsoft To Do",
        description: "Sync your Microsoft To Do lists and tasks. Access your tasks from anywhere.",
        iconType: "img",
        icon: "/icons/ms-todo.svg",
        category: "tasks",
        aboutText: "Import your structured lists and tasks from Microsoft To Do into your daily planning environment.",
        features: [
            {
                title: "Deep Microsoft 365 integration",
                description: "Your flagged emails from Outlook, tasks from Planner, and lists from Microsoft To Do all flow securely into your Khanflow inbox."
            }
        ]
    },
    {
        id: "notion",
        name: "Notion",
        description: "Connect Notion databases for task management. Keep your workspace in sync.",
        iconType: "iconify",
        icon: "logos:notion-icon",
        category: "other",
        aboutText: "Connect your deeply nested Notion databases and turn your rich project management pages into actionable tasks.",
        features: [
            {
                title: "Database matching",
                description: "Map properties from your Notion databases directly into Khanflow fields like due dates, priority labels, and statuses."
            },
            {
                title: "Rich text preserved",
                description: "When you import a Notion page as a task, all the context, checklists, and documentation are linked directly so you have everything you need to execute."
            }
        ]
    },
    {
        id: "slack",
        name: "Slack",
        description: "Get notifications and manage meetings from Slack. Stay connected with your team.",
        iconType: "iconify",
        icon: "logos:slack-icon",
        category: "other",
        aboutText: "Bridge the gap between your real-time chat and your focused task management. Turn chaotic Slack threads into organized action items.",
        features: [
            {
                title: "Save Slack messages as tasks",
                description: "Use an emoji reaction or a Slack shortcut command to instantly convert a critical message from a colleague into a tracked task in your Khanflow inbox."
            },
            {
                title: "Automated status updates",
                description: "When you enter a focused time block in Khanflow, automatically mute your Slack notifications and update your status to 'Deep Work' so your team knows not to interrupt."
            }
        ]
    },
    {
        id: "linear",
        name: "Linear",
        description: "Sync your Linear issues and projects. Streamline your workflow.",
        iconType: "custom",
        icon: "linear",
        category: "other",
        aboutText: "The perfect integration for engineering and product teams. Bring your Linear issues, cycles, and projects directly into your daily calendar.",
        features: [
            {
                title: "Streamlined issue tracking",
                description: "Automatically sync issues assigned to you. When you move an issue to 'In Progress' in Khanflow, it instantly updates across Linear for your entire engineering team."
            },
            {
                title: "Cycle planning",
                description: "Import deadlines and scope directly from Linear cycles to ensure your week is planned accurately."
            }
        ]
    },
    {
        id: "github",
        name: "GitHub",
        description: "Connect GitHub repositories. Track issues and pull requests.",
        iconType: "iconify",
        icon: "logos:github-icon",
        category: "other",
        aboutText: "Connect your version control systems. Track issues, pull requests, and review requests directly alongside your other daily tasks.",
        features: [
            {
                title: "Pull Request Tracking",
                description: "Never let a PR linger. Automatically create a high-priority task when you are requested as a reviewer on a GitHub Pull Request."
            }
        ]
    },
    {
        id: "todoist",
        name: "Todoist",
        description: "Sync your Todoist tasks and projects. Manage priorities efficiently.",
        iconType: "iconify",
        icon: "logos:todoist-icon",
        category: "tasks",
        aboutText: "Supercharge your existing Todoist setup by layering time blocking and advanced calendar syncing on top of your meticulously organized lists.",
        features: [
            {
                title: "Preserve project hierarchies",
                description: "Khanflow respects your Todoist projects, sub-tasks, labels, and priority flags, perfectly mirroring your organizational structure."
            }
        ]
    },
];
