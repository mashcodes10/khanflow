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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MessageCircleQuestion } from "lucide-react";

export interface ClarificationOption {
  id: string;
  label: string;
  value: any;
  description?: string;
}

export interface ClarificationRequest {
  question: string;
  options?: ClarificationOption[];
  fieldName: string;
  conversationId: string;
}

export interface ClarificationDialogProps {
  open: boolean;
  clarification: ClarificationRequest | null;
  onResponse: (response: string, selectedOptionValue?: any) => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export function ClarificationDialog({
  open,
  clarification,
  onResponse,
  onCancel,
  isProcessing = false,
}: ClarificationDialogProps) {
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [freeTextResponse, setFreeTextResponse] = useState("");

  const hasOptions = clarification?.options && clarification.options.length > 0;

  const handleSubmit = () => {
    if (hasOptions && selectedOption) {
      const option = clarification!.options!.find((opt) => opt.id === selectedOption);
      if (option) {
        onResponse(option.label, option.value);
      }
    } else if (freeTextResponse.trim()) {
      onResponse(freeTextResponse.trim());
    }

    // Reset state
    setSelectedOption("");
    setFreeTextResponse("");
  };

  const handleCancel = () => {
    setSelectedOption("");
    setFreeTextResponse("");
    onCancel();
  };

  const canSubmit = hasOptions ? !!selectedOption : !!freeTextResponse.trim();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircleQuestion className="h-5 w-5" />
            Clarification Needed
          </DialogTitle>
          <DialogDescription>
            {clarification?.question || "Please provide more information"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {hasOptions ? (
            <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
              <div className="space-y-3">
                {clarification!.options!.map((option) => (
                  <div key={option.id} className="flex items-start space-x-3">
                    <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                    <Label
                      htmlFor={option.id}
                      className="flex-1 cursor-pointer font-normal"
                    >
                      <div>
                        <div className="font-medium">{option.label}</div>
                        {option.description && (
                          <div className="text-sm text-muted-foreground mt-0.5">
                            {option.description}
                          </div>
                        )}
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="response">Your response</Label>
              <Textarea
                id="response"
                placeholder="Type your answer here..."
                value={freeTextResponse}
                onChange={(e) => setFreeTextResponse(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isProcessing}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!canSubmit || isProcessing}>
            {isProcessing ? "Processing..." : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
