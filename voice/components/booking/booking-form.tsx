'use client'

import React from "react"

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Check } from 'lucide-react'

interface BookingFormProps {
  onSubmit: (data: BookingFormData) => void | Promise<void>
  isSubmitting?: boolean
  isComplete?: boolean
  className?: string
}

export interface BookingFormData {
  name: string
  email: string
  notes?: string
}

export function BookingForm({
  onSubmit,
  isSubmitting = false,
  isComplete = false,
  className,
}: BookingFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({})

  const validate = () => {
    const newErrors: { name?: string; email?: string } = {}
    
    if (!name.trim()) {
      newErrors.name = 'Name is required'
    }
    
    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onSubmit({ name: name.trim(), email: email.trim(), notes: notes.trim() || undefined })
    }
  }

  if (isComplete) {
    return (
      <div className={cn('text-center py-8', className)}>
        <div className="size-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
          <Check className="size-6 text-accent" strokeWidth={2} />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Booking Confirmed!</h3>
        <p className="text-sm text-muted-foreground">
          A calendar invitation has been sent to your email.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      {/* Name Field */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium text-foreground">
          Your Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSubmitting}
          className={cn(
            'rounded-lg bg-card border-border',
            'focus:border-accent focus:ring-accent',
            errors.name && 'border-destructive focus:border-destructive focus:ring-destructive'
          )}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name}</p>
        )}
      </div>

      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-foreground">
          Your Email <span className="text-destructive">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="john@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
          className={cn(
            'rounded-lg bg-card border-border',
            'focus:border-accent focus:ring-accent',
            errors.email && 'border-destructive focus:border-destructive focus:ring-destructive'
          )}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email}</p>
        )}
      </div>

      {/* Notes Field */}
      <div className="space-y-2">
        <Label htmlFor="notes" className="text-sm font-medium text-foreground">
          Additional Notes <span className="text-muted-foreground">(Optional)</span>
        </Label>
        <Textarea
          id="notes"
          placeholder="Any additional details you'd like to share..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isSubmitting}
          rows={3}
          className="rounded-lg bg-card border-border resize-none focus:border-accent focus:ring-accent"
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground font-medium py-2.5"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 mr-2 animate-spin" />
            Booking...
          </>
        ) : (
          'Confirm Booking'
        )}
      </Button>
    </form>
  )
}
