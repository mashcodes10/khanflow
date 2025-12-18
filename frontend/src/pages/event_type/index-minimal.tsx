import { geteventListQueryFn } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Loader } from "@/components/loader";
import { ErrorAlert } from "@/components/ErrorAlert";
import { Button } from "@/components/ui/button";
import { Plus, Calendar } from "lucide-react";
import { useState } from "react";
import MinimalEventCard from "./_components/minimal-event-card";
import NewEventDialog from "./_components/new-event-dialog";

const EventTypeMinimal = () => {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["event_list"],
    queryFn: geteventListQueryFn,
  });

  const events = data?.data.events || [];
  const username = data?.data.username ?? "";

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader size="lg" color="black" />
      </div>
    );
  }

  if (isError) {
    return <ErrorAlert isError={isError} error={error} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Minimal Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo */}
            <div className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-gray-900" />
              <span className="text-lg font-medium text-gray-900">Calendar</span>
            </div>

            {/* Center: Navigation (Hidden on mobile, shown on desktop) */}
            <nav className="hidden md:flex items-center gap-8">
              <span className="text-gray-900 font-medium cursor-pointer">Events</span>
              <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors">
                Schedule
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors">
                Connect Apps
              </a>
            </nav>

            {/* Right: User Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 cursor-pointer" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Events</h1>
          <NewEventDialog btnVariant="default" />
        </div>

        {/* Empty State */}
        {events.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No events yet
            </h3>
            <p className="text-gray-500 mb-6">
              Get started by creating your first event
            </p>
            <NewEventDialog btnVariant="default" />
          </div>
        ) : (
          /* Events Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <MinimalEventCard
                key={event.id}
                id={event.id}
                title={event.title}
                slug={event.slug}
                duration={event.duration}
                username={username}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default EventTypeMinimal;

