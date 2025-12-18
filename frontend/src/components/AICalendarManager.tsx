import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar, Clock, AlertCircle, CheckCircle, Plus, Brain, Calendar as CalendarIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  due?: string;
  status: 'needsAction' | 'completed';
  priority: 'high' | 'normal' | 'low';
  updated: string;
}

interface TaskAnalysis {
  task: GoogleTask;
  priority: 'high' | 'medium' | 'low';
  estimatedDuration: number;
  suggestedTimeSlots: string[];
  reasoning: string;
}

interface CalendarBlock {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  taskId?: string;
  priority: 'high' | 'medium' | 'low';
  estimatedDuration: number;
}

interface TaskRecommendations {
  urgentTasks: GoogleTask[];
  highPriorityTasks: GoogleTask[];
  suggestedBlocks: CalendarBlock[];
  analysis: TaskAnalysis[];
  aiInsights?: {
    insights: string[];
    recommendations: string[];
    patterns: string[];
    productivityScore: number;
    strengths?: string[];
    improvements?: string[];
  };
}

const AICalendarManager: React.FC = () => {
  const [recommendations, setRecommendations] = useState<TaskRecommendations | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [autoSchedule, setAutoSchedule] = useState(false);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/ai-calendar/recommendations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      setRecommendations(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const createCalendarBlocks = async () => {
    if (selectedTasks.length === 0) {
      setError('Please select at least one task');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/ai-calendar/create-blocks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          taskIds: selectedTasks,
          autoSchedule
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create calendar blocks');
      }

      const data = await response.json();
      alert(`Successfully created ${data.data.totalBlocks} calendar blocks!`);
      
      // Refresh recommendations
      await fetchRecommendations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  if (loading && !recommendations) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading AI recommendations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <span className="text-red-800">{error}</span>
        </div>
        <Button onClick={fetchRecommendations} className="mt-2" variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (!recommendations) {
    return (
      <div className="text-center p-8">
        <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No AI Recommendations</h3>
        <p className="text-gray-500 mb-4">Connect your Google account to get AI-powered task recommendations.</p>
        <Button onClick={fetchRecommendations}>Get Recommendations</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Brain className="h-6 w-6 mr-2 text-blue-600" />
            AI Calendar Manager
          </h2>
          <p className="text-gray-600">Let AI help you prioritize and schedule your tasks</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={fetchRecommendations} variant="outline">
            Refresh
          </Button>
          <Button 
            onClick={createCalendarBlocks}
            disabled={selectedTasks.length === 0 || loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Creating...' : 'Create Calendar Blocks'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="urgent">Urgent Tasks</TabsTrigger>
          <TabsTrigger value="high-priority">High Priority</TabsTrigger>
          <TabsTrigger value="suggestions">AI Suggestions</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Urgent Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{recommendations.urgentTasks.length}</div>
                <p className="text-xs text-gray-500">Due today or overdue</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">High Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{recommendations.highPriorityTasks.length}</div>
                <p className="text-xs text-gray-500">Important tasks</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">AI Suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{recommendations.suggestedBlocks.length}</div>
                <p className="text-xs text-gray-500">Calendar blocks</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
            <input
              type="checkbox"
              id="auto-schedule"
              checked={autoSchedule}
              onChange={(e) => setAutoSchedule(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="auto-schedule" className="text-sm font-medium text-gray-700">
              Automatically schedule calendar blocks (otherwise just generate suggestions)
            </label>
          </div>
        </TabsContent>

        <TabsContent value="urgent" className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Urgent Tasks</h3>
          <div className="space-y-3">
            {recommendations.urgentTasks.map((task) => (
              <Card key={task.id} className="border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{task.title}</h4>
                      {task.notes && (
                        <p className="text-sm text-gray-600 mt-1">{task.notes}</p>
                      )}
                      {task.due && (
                        <p className="text-sm text-red-600 mt-1">
                          Due: {formatDate(task.due)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                      <input
                        type="checkbox"
                        checked={selectedTasks.includes(task.id)}
                        onChange={() => toggleTaskSelection(task.id)}
                        className="rounded"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="high-priority" className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">High Priority Tasks</h3>
          <div className="space-y-3">
            {recommendations.highPriorityTasks.map((task) => (
              <Card key={task.id} className="border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{task.title}</h4>
                      {task.notes && (
                        <p className="text-sm text-gray-600 mt-1">{task.notes}</p>
                      )}
                      {task.due && (
                        <p className="text-sm text-orange-600 mt-1">
                          Due: {formatDate(task.due)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                      <input
                        type="checkbox"
                        checked={selectedTasks.includes(task.id)}
                        onChange={() => toggleTaskSelection(task.id)}
                        className="rounded"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">AI-Generated Calendar Blocks</h3>
          <div className="space-y-3">
            {recommendations.suggestedBlocks.map((block, index) => (
              <Card key={index} className="border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2 text-blue-600" />
                        {block.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">{block.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatDuration(block.estimatedDuration)}
                        </span>
                        <span>
                          {formatDate(block.startTime)} - {formatDate(block.endTime)}
                        </span>
                      </div>
                    </div>
                    <Badge className={getPriorityColor(block.priority)}>
                      {block.priority}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">AI-Powered Productivity Insights</h3>
          {recommendations?.aiInsights ? (
            <div className="space-y-6">
              {/* Productivity Score */}
              <Card className="border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brain className="h-5 w-5 mr-2 text-blue-600" />
                    Productivity Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl font-bold text-blue-600">
                      {recommendations.aiInsights.productivityScore}/100
                    </div>
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${recommendations.aiInsights.productivityScore}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Insights */}
              <Card>
                <CardHeader>
                  <CardTitle>Key Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {recommendations.aiInsights.insights.map((insight, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-gray-700">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle>AI Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {recommendations.aiInsights.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-gray-700">{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Patterns */}
              <Card>
                <CardHeader>
                  <CardTitle>Identified Patterns</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {recommendations.aiInsights.patterns.map((pattern, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-gray-700">{pattern}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Strengths and Improvements */}
              {(recommendations.aiInsights.strengths || recommendations.aiInsights.improvements) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendations.aiInsights.strengths && (
                    <Card className="border-green-200">
                      <CardHeader>
                        <CardTitle className="text-green-800">Strengths</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1">
                          {recommendations.aiInsights.strengths.map((strength, index) => (
                            <li key={index} className="flex items-start">
                              <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-700">{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {recommendations.aiInsights.improvements && (
                    <Card className="border-orange-200">
                      <CardHeader>
                        <CardTitle className="text-orange-800">Areas for Improvement</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1">
                          {recommendations.aiInsights.improvements.map((improvement, index) => (
                            <li key={index} className="flex items-start">
                              <AlertCircle className="h-4 w-4 text-orange-600 mr-2 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-700">{improvement}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No AI Insights Available</h3>
                <p className="text-gray-500">
                  AI insights will appear here once you have some task data to analyze.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AICalendarManager;
