'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle } from 'lucide-react'
import { integrationsAPI } from '@/lib/api'
import { DestinationOption } from '@/types/voice'

interface DestinationSelectorProps {
  value: 'google' | 'microsoft' | 'local'
  onValueChange: (value: 'google' | 'microsoft' | 'local') => void
  className?: string
}

export function DestinationSelector({ value, onValueChange, className }: DestinationSelectorProps) {
  const [destinations, setDestinations] = useState<DestinationOption[]>([
    { value: 'local', label: 'Local only', available: true }
  ])

  // Fetch integrations to determine available destinations
  const { data: integrationsData } = useQuery({
    queryKey: ['integrations'],
    queryFn: integrationsAPI.getAll,
  })

  useEffect(() => {
    if (integrationsData?.integrations) {
      const googleConnected = integrationsData.integrations.some(
        (integration: any) => integration.app_type === 'GOOGLE_TASKS' && integration.isConnected
      )
      const microsoftConnected = integrationsData.integrations.some(
        (integration: any) => integration.app_type === 'MICROSOFT_TODO' && integration.isConnected
      )

      const newDestinations: DestinationOption[] = [
        { value: 'local', label: 'Local only', available: true }
      ]

      if (googleConnected) {
        newDestinations.unshift({ value: 'google', label: 'Google Tasks', available: true })
      }

      if (microsoftConnected) {
        newDestinations.splice(googleConnected ? 1 : 0, 0, { 
          value: 'microsoft', 
          label: 'Microsoft To Do', 
          available: true 
        })
      }

      setDestinations(newDestinations)

      // Set default destination based on availability (only if current value is not available)
      const currentDestination = destinations.find(d => d.value === value)
      if (!currentDestination?.available) {
        if (googleConnected) {
          onValueChange('google')
        } else if (microsoftConnected) {
          onValueChange('microsoft')
        } else {
          onValueChange('local')
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [integrationsData]) // Only depend on integrationsData

  // Load saved destination from localStorage (only once on mount)
  useEffect(() => {
    const savedDestination = localStorage.getItem('khanflow-voice-destination') as 'google' | 'microsoft' | 'local' | null
    if (savedDestination && ['google', 'microsoft', 'local'].includes(savedDestination)) {
      // Only set if not already set and destination is available
      if (value === 'local' && destinations.some(d => d.value === savedDestination && d.available)) {
        onValueChange(savedDestination)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  // Save destination to localStorage when changed
  const handleValueChange = (newValue: string) => {
    const typedValue = newValue as 'google' | 'microsoft' | 'local'
    onValueChange(typedValue)
    localStorage.setItem('khanflow-voice-destination', typedValue)
  }

  return (
    <div className={className}>
      <label className="text-sm font-medium mb-2 block">Also create in:</label>
      <Select value={value} onValueChange={handleValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select destination" />
        </SelectTrigger>
        <SelectContent>
          {destinations.map((destination) => (
            <SelectItem 
              key={destination.value} 
              value={destination.value}
              disabled={!destination.available}
            >
              <div className="flex items-center justify-between w-full">
                <span>{destination.label}</span>
                {destination.available ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 ml-2" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground ml-2" />
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {value !== 'local' && (
        <div className="mt-2">
          <Badge variant="secondary" className="text-xs">
            {destinations.find(d => d.value === value)?.label} connected
          </Badge>
        </div>
      )}
    </div>
  )
}