import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Calendar, Video, CheckSquare, Sparkles, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Calendar className="size-6 text-primary" />
            <h1 className="text-xl font-bold">Khanflow</h1>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground">
              Login
            </Link>
            <Button asChild size="sm">
              <Link href="/auth/signup">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Smart Calendar & Meeting Management
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Khanflow helps you organize your life with intelligent calendar management, 
            seamless meeting scheduling, and task integration. Connect all your productivity 
            tools in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/auth/signup">
                Start Free
                <ArrowRight className="ml-2 size-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8">
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="max-w-5xl mx-auto mt-24 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-4">
              <Calendar className="size-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Calendar Integration</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Connect Google Calendar and Microsoft Outlook in one unified view
            </p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mb-4">
              <Video className="size-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Zoom Meetings</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Create and manage Zoom meetings directly from your calendar
            </p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-4">
              <CheckSquare className="size-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Task Management</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Sync tasks from Google Tasks and Microsoft To-Do seamlessly
            </p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 mb-4">
              <Sparkles className="size-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Smart Suggestions</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              AI-powered scheduling suggestions based on your availability
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-3xl mx-auto mt-24 text-center bg-gray-100 dark:bg-gray-800/50 rounded-2xl p-8 sm:p-12">
          <h3 className="text-2xl sm:text-3xl font-bold mb-4">
            Ready to streamline your workflow?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Join users who are already managing their calendars, meetings, and tasks more efficiently with Khanflow.
          </p>
          <Button asChild size="lg" className="text-lg px-8">
            <Link href="/auth/signup">
              Get Started Now
              <ArrowRight className="ml-2 size-5" />
            </Link>
          </Button>
        </div>

        {/* Privacy & Security */}
        <div className="max-w-2xl mx-auto mt-16 text-center text-sm text-gray-600 dark:text-gray-400">
          <p className="mb-2">
            🔒 Your data is encrypted and secure. We never sell your information.
          </p>
          <p>
            Read our{' '}
            <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">
              Terms of Service
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
