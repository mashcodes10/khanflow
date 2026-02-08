"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Clock, Calendar } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

export interface TimeSlot {
  id: string;
  startTime: Date;
  endTime: Date;
  score: number;
  reason?: string;
}

export interface ConflictingEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  isFlexible: boolean;
  attendeeCount?: number;
  provider: string;
}

export interface ConflictInfo {
  id: string;
  type: string;
  severity: "high" | "medium" | "low";
  requestedEvent: {
    title: string;
    startTime: Date;
    endTime: Date;
  };
  conflictingEvents: ConflictingEvent[];
  suggestions: TimeSlot[];
}

export interface ConflictResolverProps {
  open: boolean;
  conflict: ConflictInfo | null;
  onResolve: (conflictId: string, selectedSlotId: string) => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export function ConflictResolver({
  open,
  conflict,
  onResolve,
  onCancel,
  isProcessing = false,
}: ConflictResolverProps) {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const handleResolve = () => {
    if (conflict && selectedSlot) {
      onResolve(conflict.id, selectedSlot);
      setSelectedSlot(null);
    }
  };

  const handleCancel = () => {
    setSelectedSlot(null);
    onCancel();
  };

  if (!conflict) return null;

  const severityColor = {
    high: "destructive",
    medium: "warning",
    low: "secondary",
  }[conflict.severity] as "destructive" | "warning" | "secondary";

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Calendar Conflict Detected
          </DialogTitle>
          <DialogDescription>
            Your requested time conflicts with existing events. Please choose an alternative.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 py-4">
            {/* Requested Event */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground">Requested Event</h4>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-medium">{conflict.requestedEvent.title}</h5>
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(conflict.requestedEvent.startTime), "PPP")}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {format(new Date(conflict.requestedEvent.startTime), "p")} -{" "}
                          {format(new Date(conflict.requestedEvent.endTime), "p")}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Conflicting Events */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground">Conflicts With</h4>
              {conflict.conflictingEvents.map((event) => (
                <Card key={event.id} className="border-yellow-200 bg-yellow-50/50">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium">{event.title}</h5>
                          <Badge variant={severityColor} className="text-xs">
                            {conflict.severity}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>
                            {format(new Date(event.startTime), "p")} -{" "}
                            {format(new Date(event.endTime), "p")}
                          </span>
                        </div>
                        {event.attendeeCount !== undefined && event.attendeeCount > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            📅 {event.attendeeCount} attendee{event.attendeeCount > 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Alternative Time Slots */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground">
                Suggested Alternatives
              </h4>
              <div className="space-y-2">
                {conflict.suggestions.map((slot, index) => (
                  <Card
                    key={slot.id}
                    className={`cursor-pointer transition-all ${
                      selectedSlot === slot.id
                        ? "border-primary bg-primary/5 ring-2 ring-primary"
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedSlot(slot.id)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Option {index + 1}</span>
                            {index === 0 && (
                              <Badge variant="secondary" className="text-xs">
                                Best match
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{format(new Date(slot.startTime), "PPP")}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {format(new Date(slot.startTime), "p")} -{" "}
                              {format(new Date(slot.endTime), "p")}
                            </span>
                          </div>
                          {slot.reason && (
                            <p className="text-xs text-muted-foreground mt-2">{slot.reason}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleResolve}
            disabled={!selectedSlot || isProcessing}
          >
            {isProcessing ? "Scheduling..." : "Schedule at Selected Time"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
