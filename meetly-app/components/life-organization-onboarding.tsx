"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { lifeOrganizationAPI, type OnboardingQuestion, type OnboardingAnswer } from "@/lib/api"
import { toast } from "sonner"
import { Loader } from "@/components/ui/loader"
import { ChevronRight, ChevronLeft } from "lucide-react"

interface LifeOrganizationOnboardingProps {
  onComplete: () => void
}

export function LifeOrganizationOnboarding({ onComplete }: LifeOrganizationOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [questions, setQuestions] = useState<OnboardingQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load questions on mount
  useEffect(() => {
    loadQuestions()
  }, [])

  const loadQuestions = async () => {
    try {
      const response = await lifeOrganizationAPI.getOnboardingQuestions()
      setQuestions(response.data || [])
    } catch (error: any) {
      console.error("Failed to load questions:", error)
      toast.error("Failed to load onboarding questions")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswer = (questionId: string, answer: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const answerArray: OnboardingAnswer[] = questions.map((q) => ({
        questionId: q.id,
        answer: answers[q.id] || (q.type === "multiple" ? [] : ""),
      }))

      await lifeOrganizationAPI.completeOnboarding(answerArray)
      toast.success("Life organization setup complete!")
      onComplete()
    } catch (error: any) {
      console.error("Failed to complete onboarding:", error)
      toast.error(error.response?.data?.message || "Failed to complete onboarding")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size="lg" />
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No onboarding questions available
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentQuestion = questions[currentStep]
  const currentAnswer = answers[currentQuestion.id]
  const canProceed = currentAnswer && (
    Array.isArray(currentAnswer) ? currentAnswer.length > 0 : currentAnswer !== ""
  )
  const isLastStep = currentStep === questions.length - 1

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Set Up Your Life Organization</CardTitle>
              <CardDescription>
                Help us understand what matters to you (Step {currentStep + 1} of {questions.length})
              </CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              {currentStep + 1} / {questions.length}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Question */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{currentQuestion.question}</h3>

            {/* Multiple choice */}
            {currentQuestion.type === "multiple" && currentQuestion.options && (
              <div className="space-y-3">
                {currentQuestion.options.map((option) => {
                  const isSelected = Array.isArray(currentAnswer) && currentAnswer.includes(option)
                  return (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={option}
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          const current = Array.isArray(currentAnswer) ? currentAnswer : []
                          if (checked) {
                            handleAnswer(currentQuestion.id, [...current, option])
                          } else {
                            handleAnswer(
                              currentQuestion.id,
                              current.filter((a) => a !== option)
                            )
                          }
                        }}
                      />
                      <Label
                        htmlFor={option}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {option}
                      </Label>
                    </div>
                  )
                })}
                {currentQuestion.id === "priorities" && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Select 4-6 options that matter most to you
                  </p>
                )}
              </div>
            )}

            {/* Single choice */}
            {currentQuestion.type === "single" && currentQuestion.options && (
              <RadioGroup
                value={typeof currentAnswer === "string" ? currentAnswer : undefined}
                onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
              >
                {currentQuestion.options.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={option} />
                    <Label htmlFor={option} className="text-sm font-normal cursor-pointer flex-1">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {isLastStep ? (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader size="sm" className="mr-2" />
                    Setting Up...
                  </>
                ) : (
                  "Complete Setup"
                )}
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={!canProceed}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


