import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
// Using div with overflow instead of ScrollArea
// Separator not used in this component
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  Circle, 
  AlertCircle, 
  Brain, 
  Plus,
  RefreshCw,
  Settings,
  BarChart3,
  Zap,
  TrendingUp,
  Calendar as CalendarIcon,
  ListTodo,
  Star
} from 'lucide-react';

// Types
interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
  priority: 'high' | 'normal' | 'low';
  updated: string;
  position: string;
  parent?: string;
  links?: Array<{
    type: string;
    link: string;
  }>;
}

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus: string;
  }>;
  status: string;
  htmlLink: string;
}

interface TaskAnalysis {
  task: GoogleTask;
  priority: 'high' | 'medium' | 'low';
  estimatedDuration: number;
  suggestedTimeSlots: Date[];
  reasoning: string;
  confidence?: number;
  category?: string;
  urgency?: 'critical' | 'urgent' | 'normal' | 'low';
  complexity?: 'simple' | 'moderate' | 'complex';
  dependencies?: string[];
  suggestedActions?: string[];
}

interface CalendarBlock {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  taskId?: string;
  priority: 'high' | 'medium' | 'low';
  estimatedDuration: number;
  category?: string;
  urgency?: 'critical' | 'urgent' | 'normal' | 'low';
  aiReasoning?: string;
}

interface AIInsights {
  insights: string[];
  recommendations: string[];
  patterns: string[];
  productivityScore: number;
  strengths?: string[];
  improvements?: string[];
}

interface TaskRecommendations {
  urgentTasks: GoogleTask[];
  highPriorityTasks: GoogleTask[];
  suggestedBlocks: CalendarBlock[];
  analysis: TaskAnalysis[];
  aiInsights?: AIInsights;
}

const MainDashboard: React.FC = () => {
  const [recommendations, setRecommendations] = useState<TaskRecommendations | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<GoogleTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // For testing purposes, create mock data if API calls fail
      const mockRecommendations = {
        urgentTasks: [],
        highPriorityTasks: [],
        suggestedBlocks: [],
        analysis: [],
        aiInsights: {
          insights: ['This is a demo dashboard. Connect your Google account to see real data.'],
          recommendations: ['Set up Google Calendar and Tasks integration to get started.'],
          patterns: ['No patterns detected yet. Add some tasks to see AI analysis.'],
          productivityScore: 75
        }
      };

      const mockCalendarEvents = [
        {
          id: '1',
          summary: 'Demo Meeting',
          description: 'This is a demo calendar event',
          start: { dateTime: new Date().toISOString() },
          end: { dateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString() },
          status: 'confirmed'
        }
      ];

      const mockTasks = [
        {
          id: '1',
          title: 'Demo Task',
          notes: 'This is a demo task',
          status: 'needsAction',
          priority: 'high',
          due: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          updated: new Date().toISOString(),
          position: '1'
        }
      ];

      // Try to fetch real data, fallback to mock data
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
        
        if (token) {
          // Fetch AI recommendations
          const recommendationsResponse = await fetch('http://localhost:8000/api/ai-calendar/recommendations', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (recommendationsResponse.ok) {
            const recommendationsData = await recommendationsResponse.json();
            setRecommendations(recommendationsData.data);
          } else {
            setRecommendations(mockRecommendations);
          }

          // Fetch calendar events
          const calendarResponse = await fetch('http://localhost:8000/api/calendar/events', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (calendarResponse.ok) {
            const calendarData = await calendarResponse.json();
            setCalendarEvents(calendarData.data || []);
          } else {
            setCalendarEvents(mockCalendarEvents);
          }

          // Fetch tasks
          const tasksResponse = await fetch('http://localhost:8000/api/ai-calendar/tasks', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (tasksResponse.ok) {
            const tasksData = await tasksResponse.json();
            setTasks(tasksData.data || []);
          } else {
            setTasks(mockTasks);
          }
        } else {
          // No token, use mock data
          setRecommendations(mockRecommendations);
          setCalendarEvents(mockCalendarEvents);
          setTasks(mockTasks);
        }
      } catch (apiError) {
        console.warn('API calls failed, using mock data:', apiError);
        setRecommendations(mockRecommendations);
        setCalendarEvents(mockCalendarEvents);
        setTasks(mockTasks);
      }
    } catch (err) {
      setError('Failed to fetch data. Please try again.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'urgent': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTaskStatusIcon = (status: string) => {
    return status === 'completed' ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <Circle className="h-4 w-4 text-gray-400" />
    );
  };

  const getUpcomingEvents = () => {
    const now = new Date();
    return calendarEvents
      .filter(event => {
        const eventStart = new Date(event.start.dateTime || event.start.date || '');
        return eventStart >= now;
      })
      .sort((a, b) => {
        const aStart = new Date(a.start.dateTime || a.start.date || '');
        const bStart = new Date(b.start.dateTime || b.start.date || '');
        return aStart.getTime() - bStart.getTime();
      })
      .slice(0, 5);
  };

  const getTodaysTasks = () => {
    const today = new Date().toDateString();
    return tasks.filter(task => {
      if (task.due) {
        const dueDate = new Date(task.due).toDateString();
        return dueDate === today;
      }
      return false;
    });
  };

  const getOverdueTasks = () => {
    const now = new Date();
    return tasks.filter(task => {
      if (task.due && task.status !== 'completed') {
        const dueDate = new Date(task.due);
        return dueDate < now;
      }
      return false;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Tasks & AI</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAllData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Task Lists */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-6">
            {/* Overdue Tasks */}
            {getOverdueTasks().length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <h3 className="font-medium text-red-900">Overdue Tasks</h3>
                  <Badge variant="destructive" className="text-xs">
                    {getOverdueTasks().length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {getOverdueTasks().map((task) => (
                    <Card key={task.id} className="border-red-200 bg-red-50">
                      <CardContent className="p-3">
                        <div className="flex items-start space-x-2">
                          {getTaskStatusIcon(task.status)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-red-900 truncate">
                              {task.title}
                            </p>
                            <p className="text-xs text-red-600">
                              Due: {formatDate(task.due!)}
                            </p>
                          </div>
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Today's Tasks */}
            {getTodaysTasks().length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <h3 className="font-medium text-blue-900">Today's Tasks</h3>
                  <Badge className="bg-blue-100 text-blue-800">
                    {getTodaysTasks().length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {getTodaysTasks().map((task) => (
                    <Card key={task.id} className="border-blue-200 bg-blue-50">
                      <CardContent className="p-3">
                        <div className="flex items-start space-x-2">
                          {getTaskStatusIcon(task.status)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-blue-900 truncate">
                              {task.title}
                            </p>
                            <p className="text-xs text-blue-600">
                              Due: {formatTime(task.due!)}
                            </p>
                          </div>
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* High Priority Tasks */}
            {recommendations?.highPriorityTasks && recommendations.highPriorityTasks.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Star className="h-4 w-4 text-yellow-600" />
                  <h3 className="font-medium text-yellow-900">High Priority</h3>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    {recommendations.highPriorityTasks.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {recommendations.highPriorityTasks.map((task) => (
                    <Card key={task.id} className="border-yellow-200 bg-yellow-50">
                      <CardContent className="p-3">
                        <div className="flex items-start space-x-2">
                          {getTaskStatusIcon(task.status)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-yellow-900 truncate">
                              {task.title}
                            </p>
                            {task.notes && (
                              <p className="text-xs text-yellow-700 mt-1 line-clamp-2">
                                {task.notes}
                              </p>
                            )}
                          </div>
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* All Tasks */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <ListTodo className="h-4 w-4 text-gray-600" />
                  <h3 className="font-medium text-gray-900">All Tasks</h3>
                  <Badge variant="outline">
                    {tasks.length}
                  </Badge>
                </div>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {tasks.slice(0, 10).map((task) => (
                  <Card key={task.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-3">
                      <div className="flex items-start space-x-2">
                        {getTaskStatusIcon(task.status)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {task.title}
                          </p>
                          {task.due && (
                            <p className="text-xs text-gray-500">
                              Due: {formatDate(task.due)}
                            </p>
                          )}
                        </div>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI-Powered Dashboard</h1>
              <p className="text-gray-600">Intelligent task management and calendar optimization</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button onClick={fetchAllData} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="flex-1 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* AI Insights Summary */}
                {recommendations?.aiInsights && (
                  <Card className="border-blue-200">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Brain className="h-5 w-5 mr-2 text-blue-600" />
                        AI Productivity Score
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
                      <div className="mt-4 space-y-2">
                        <h4 className="font-medium text-gray-900">Top Insights</h4>
                        <ul className="space-y-1">
                          {recommendations.aiInsights.insights.slice(0, 3).map((insight, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start">
                              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                              {insight}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Upcoming Events */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CalendarIcon className="h-5 w-5 mr-2 text-green-600" />
                      Upcoming Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {getUpcomingEvents().length > 0 ? (
                        getUpcomingEvents().map((event) => (
                          <div key={event.id} className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50">
                            <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {event.summary}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatTime(event.start.dateTime || event.start.date || '')} - {formatTime(event.end.dateTime || event.end.date || '')}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No upcoming events
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* AI Suggestions */}
              {recommendations?.suggestedBlocks && recommendations.suggestedBlocks.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Zap className="h-5 w-5 mr-2 text-purple-600" />
                      AI-Suggested Calendar Blocks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {recommendations.suggestedBlocks.slice(0, 6).map((block, index) => (
                        <Card key={index} className="border-purple-200 bg-purple-50">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-purple-900 text-sm">
                                {block.title}
                              </h4>
                              <Badge className={getPriorityColor(block.priority)}>
                                {block.priority}
                              </Badge>
                            </div>
                            <p className="text-xs text-purple-700 mb-2">
                              {formatTime(block.startTime)} - {formatTime(block.endTime)}
                            </p>
                            <p className="text-xs text-purple-600">
                              Duration: {formatDuration(block.estimatedDuration)}
                            </p>
                            {block.aiReasoning && (
                              <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                                {block.aiReasoning}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Calendar Tab */}
            <TabsContent value="calendar" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Calendar Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {calendarEvents.length > 0 ? (
                      calendarEvents.map((event) => (
                        <div key={event.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">{event.summary}</h3>
                              {event.description && (
                                <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                              )}
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                <span className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  {formatTime(event.start.dateTime || event.start.date || '')} - {formatTime(event.end.dateTime || event.end.date || '')}
                                </span>
                                <span>{formatDate(event.start.dateTime || event.start.date || '')}</span>
                                {event.location && (
                                  <span className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    {event.location}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Badge variant="outline">
                              {event.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Calendar Events</h3>
                        <p className="text-gray-500">Connect your calendar to see events here.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Analysis Tab */}
            <TabsContent value="ai-analysis" className="space-y-4">
              {recommendations?.analysis && recommendations.analysis.length > 0 ? (
                <div className="space-y-4">
                  {recommendations.analysis.map((analysis, index) => (
                    <Card key={index} className="border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{analysis.task.title}</h3>
                            {analysis.task.notes && (
                              <p className="text-sm text-gray-600 mt-1">{analysis.task.notes}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getPriorityColor(analysis.priority)}>
                              {analysis.priority}
                            </Badge>
                            {analysis.urgency && (
                              <Badge className={getUrgencyColor(analysis.urgency)}>
                                {analysis.urgency}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Estimated Duration:</span>
                            <p className="text-gray-600">{formatDuration(analysis.estimatedDuration)}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Category:</span>
                            <p className="text-gray-600">{analysis.category || 'Work'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Confidence:</span>
                            <p className="text-gray-600">{Math.round((analysis.confidence || 0.8) * 100)}%</p>
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <span className="font-medium text-gray-700">AI Reasoning:</span>
                          <p className="text-sm text-gray-600 mt-1">{analysis.reasoning}</p>
                        </div>
                        
                        {analysis.suggestedActions && analysis.suggestedActions.length > 0 && (
                          <div className="mt-3">
                            <span className="font-medium text-gray-700">Suggested Actions:</span>
                            <ul className="mt-1 space-y-1">
                              {analysis.suggestedActions.map((action, actionIndex) => (
                                <li key={actionIndex} className="text-sm text-gray-600 flex items-start">
                                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No AI Analysis Available</h3>
                    <p className="text-gray-500">AI analysis will appear here once you have tasks to analyze.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Insights Tab */}
            <TabsContent value="insights" className="space-y-4">
              {recommendations?.aiInsights ? (
                <div className="space-y-6">
                  {/* Productivity Score */}
                  <Card className="border-blue-200">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                        Productivity Score
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-4">
                        <div className="text-4xl font-bold text-blue-600">
                          {recommendations.aiInsights.productivityScore}/100
                        </div>
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                              style={{ width: `${recommendations.aiInsights.productivityScore}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Insights and Recommendations */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                    <Card>
                      <CardHeader>
                        <CardTitle>Recommendations</CardTitle>
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
                  </div>

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
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Insights Available</h3>
                    <p className="text-gray-500">AI insights will appear here once you have some data to analyze.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default MainDashboard;
