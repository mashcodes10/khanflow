import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ConversationManager,
  ConversationState,
  RecurrencePattern,
} from '../../src/services/conversation-manager.service';

describe('ConversationManager', () => {
  let conversationManager: ConversationManager;
  const testUserId = 'test-user-123';

  beforeEach(() => {
    conversationManager = new ConversationManager();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createConversation', () => {
    it('should create a new conversation', () => {
      const transcript = 'Add a task to buy groceries';
      const conversation = conversationManager.createConversation(testUserId, transcript);

      expect(conversation).toBeDefined();
      expect(conversation.id).toBeDefined();
      expect(conversation.userId).toBe(testUserId);
      expect(conversation.status).toBe('active');
      expect(conversation.currentStep).toBe('initial');
      expect(conversation.messages).toHaveLength(1);
      expect(conversation.messages[0].role).toBe('user');
      expect(conversation.messages[0].content).toBe(transcript);
    });

    it('should set conversation timeout', () => {
      const conversation = conversationManager.createConversation(testUserId, 'test');
      
      expect(conversation.timeoutAt).toBeDefined();
      const timeout = conversation.timeoutAt.getTime() - conversation.createdAt.getTime();
      expect(timeout).toBe(30 * 60 * 1000); // 30 minutes
    });
  });

  describe('getConversation', () => {
    it('should retrieve an existing conversation', () => {
      const conversation = conversationManager.createConversation(testUserId, 'test');
      const retrieved = conversationManager.getConversation(conversation.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(conversation.id);
    });

    it('should return null for non-existent conversation', () => {
      const retrieved = conversationManager.getConversation('non-existent-id');
      expect(retrieved).toBeNull();
    });

    it('should return null and mark as abandoned for expired conversation', () => {
      const conversation = conversationManager.createConversation(testUserId, 'test');
      
      // Fast forward time by 31 minutes
      vi.advanceTimersByTime(31 * 60 * 1000);

      const retrieved = conversationManager.getConversation(conversation.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('updateConversation', () => {
    it('should update conversation state', () => {
      const conversation = conversationManager.createConversation(testUserId, 'test');
      
      const updated = conversationManager.updateConversation(conversation.id, {
        currentStep: 'clarifying',
        extractedData: {
          taskTitle: 'Buy groceries',
        },
      });

      expect(updated).toBeDefined();
      expect(updated?.currentStep).toBe('clarifying');
      expect(updated?.extractedData.taskTitle).toBe('Buy groceries');
    });

    it('should extend timeout on update', () => {
      const conversation = conversationManager.createConversation(testUserId, 'test');
      const originalTimeout = conversation.timeoutAt;

      // Fast forward 10 minutes
      vi.advanceTimersByTime(10 * 60 * 1000);

      const updated = conversationManager.updateConversation(conversation.id, {
        status: 'active',
      });

      expect(updated?.timeoutAt.getTime()).toBeGreaterThan(originalTimeout.getTime());
    });
  });

  describe('addMessage', () => {
    it('should add a message to conversation', () => {
      const conversation = conversationManager.createConversation(testUserId, 'test');
      
      const message = conversationManager.addMessage(
        conversation.id,
        'assistant',
        'What would you like to add?'
      );

      expect(message).toBeDefined();
      expect(message?.role).toBe('assistant');
      expect(message?.content).toBe('What would you like to add?');

      const updated = conversationManager.getConversation(conversation.id);
      expect(updated?.messages).toHaveLength(2);
    });

    it('should return null for non-existent conversation', () => {
      const message = conversationManager.addMessage(
        'non-existent',
        'user',
        'test'
      );
      expect(message).toBeNull();
    });
  });

  describe('getContext', () => {
    it('should build conversation context string', () => {
      const conversation = conversationManager.createConversation(
        testUserId,
        'Add a task'
      );
      
      conversationManager.addMessage(
        conversation.id,
        'assistant',
        'What task would you like to add?'
      );
      
      conversationManager.updateConversation(conversation.id, {
        extractedData: {
          intent: 'create_task',
        },
      });

      const context = conversationManager.getContext(conversation.id);

      expect(context).toContain('User: Add a task');
      expect(context).toContain('Assistant: What task would you like to add?');
      expect(context).toContain('intent: "create_task"');
    });
  });

  describe('requiresClarification', () => {
    it('should return true when confidence is low', () => {
      const parsedAction = {
        intent: 'create_task',
        confidence: {
          is_confident: false,
          missing_fields: ['task title'],
        },
      };

      const result = conversationManager.requiresClarification(parsedAction);
      expect(result).toBe(true);
    });

    it('should return true when intent is clarification_required', () => {
      const parsedAction = {
        intent: 'clarification_required',
        confidence: {
          is_confident: false,
        },
      };

      const result = conversationManager.requiresClarification(parsedAction);
      expect(result).toBe(true);
    });

    it('should return false when confident', () => {
      const parsedAction = {
        intent: 'create_task',
        task: {
          title: 'Buy groceries',
        },
        confidence: {
          is_confident: true,
        },
      };

      const result = conversationManager.requiresClarification(parsedAction);
      expect(result).toBe(false);
    });

    it('should return true when task title is missing', () => {
      const parsedAction = {
        intent: 'create_task',
        task: {},
        confidence: {
          is_confident: true,
        },
      };

      const result = conversationManager.requiresClarification(parsedAction);
      expect(result).toBe(true);
    });
  });

  describe('generateClarificationQuestion', () => {
    it('should use AI-provided question if available', () => {
      const parsedAction = {
        confidence: {
          is_confident: false,
          clarification_question: 'What time works best?',
        },
      };
      const conversation = conversationManager.createConversation(testUserId, 'test');

      const question = conversationManager.generateClarificationQuestion(
        parsedAction,
        conversation
      );

      expect(question).toBe('What time works best?');
    });

    it('should generate question for missing task title', () => {
      const parsedAction = {
        confidence: {
          is_confident: false,
          missing_fields: ['task title'],
        },
      };
      const conversation = conversationManager.createConversation(testUserId, 'test');

      const question = conversationManager.generateClarificationQuestion(
        parsedAction,
        conversation
      );

      expect(question).toBe('What would you like to add?');
    });

    it('should generate question for missing date', () => {
      const parsedAction = {
        confidence: {
          is_confident: false,
          missing_fields: ['date'],
        },
      };
      const conversation = conversationManager.createConversation(testUserId, 'test');

      const question = conversationManager.generateClarificationQuestion(
        parsedAction,
        conversation
      );

      expect(question).toBe('When would you like to schedule this?');
    });
  });

  describe('completeConversation', () => {
    it('should mark conversation as completed', () => {
      const conversation = conversationManager.createConversation(testUserId, 'test');
      
      conversationManager.completeConversation(conversation.id, {
        actionType: 'task',
        createdTaskId: 'task-123',
        task: { title: 'Test task' },
      });

      const updated = conversationManager.getConversation(conversation.id);
      expect(updated?.status).toBe('completed');
      expect(updated?.currentStep).toBe('executing');
      expect(updated?.messages).toHaveLength(2); // Initial + success message
    });

    it('should auto-delete completed conversations after 5 minutes', async () => {
      const conversation = conversationManager.createConversation(testUserId, 'test');
      
      conversationManager.completeConversation(conversation.id);

      // Should still exist immediately
      expect(conversationManager.getConversation(conversation.id)).toBeDefined();

      // Fast forward 6 minutes
      vi.advanceTimersByTime(6 * 60 * 1000);
      await vi.runAllTimersAsync();

      // Should be deleted
      expect(conversationManager.getConversation(conversation.id)).toBeNull();
    });
  });

  describe('getUserConversations', () => {
    it('should return all active conversations for a user', () => {
      conversationManager.createConversation(testUserId, 'test 1');
      conversationManager.createConversation(testUserId, 'test 2');
      conversationManager.createConversation('other-user', 'test 3');

      const userConversations = conversationManager.getUserConversations(testUserId);

      expect(userConversations).toHaveLength(2);
      expect(userConversations.every(c => c.userId === testUserId)).toBe(true);
    });

    it('should exclude expired conversations', () => {
      const conv1 = conversationManager.createConversation(testUserId, 'test 1');
      conversationManager.createConversation(testUserId, 'test 2');

      // Expire first conversation
      vi.advanceTimersByTime(31 * 60 * 1000);

      const userConversations = conversationManager.getUserConversations(testUserId);

      expect(userConversations).toHaveLength(1);
      expect(userConversations[0].id).not.toBe(conv1.id);
    });
  });

  describe('getStats', () => {
    it('should return conversation statistics', () => {
      const conv1 = conversationManager.createConversation(testUserId, 'test 1');
      conversationManager.createConversation(testUserId, 'test 2');
      
      conversationManager.completeConversation(conv1.id);

      const stats = conversationManager.getStats();

      expect(stats.totalConversations).toBe(2);
      expect(stats.activeConversations).toBe(1);
      expect(stats.completedConversations).toBe(1);
    });
  });

  describe('mergeUserResponse', () => {
    it('should merge user response into conversation', () => {
      const conversation = conversationManager.createConversation(testUserId, 'test');
      
      const updated = conversationManager.mergeUserResponse(
        conversation.id,
        'Tomorrow at 2 PM',
        { date: '2024-01-16', time: '14:00:00' }
      );

      expect(updated).toBeDefined();
      expect(updated?.messages).toHaveLength(2);
      expect(updated?.extractedData.date).toBe('2024-01-16');
      expect(updated?.extractedData.time).toBe('14:00:00');
    });
  });

  describe('cleanupOldConversations', () => {
    it('should clean up expired conversations', () => {
      conversationManager.createConversation(testUserId, 'test 1');
      conversationManager.createConversation(testUserId, 'test 2');

      // Expire conversations
      vi.advanceTimersByTime(31 * 60 * 1000);

      const cleaned = conversationManager.cleanupOldConversations();

      expect(cleaned).toBe(2);
      expect(conversationManager.getUserConversations(testUserId)).toHaveLength(0);
    });
  });
});
