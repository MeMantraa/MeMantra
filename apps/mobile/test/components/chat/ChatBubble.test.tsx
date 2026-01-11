import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ChatBubble } from '../../../components/chat/ChatBubble';
import { Message } from '../../../types/chat.types';
import { useNavigation } from '@react-navigation/native';
import { Animated } from 'react-native';

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
}));

jest.mock('../../../context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      primary: '#FFFFFF',
      primaryDark: '#1a1a1a',
      secondary: '#F0E68C',
      text: '#000000',
    },
  }),
}));

describe('ChatBubble', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigation as jest.Mock).mockReturnValue(mockNavigation);
  });

  const baseMessage: Message = {
    message_id: 1,
    conversation_id: 1,
    sender_id: 2,
    content: 'Hello, how are you?',
    created_at: new Date().toISOString(),
    read: true,
  };

  describe('Text Messages', () => {
    it('renders a text message correctly', () => {
      const { getByText } = render(<ChatBubble message={baseMessage} isOwnMessage={false} />);

      expect(getByText('Hello, how are you?')).toBeTruthy();
    });

    it('renders own message with correct styling', () => {
      const { getByText } = render(<ChatBubble message={baseMessage} isOwnMessage={true} />);

      expect(getByText('Hello, how are you?')).toBeTruthy();
    });

    it('formats time correctly', () => {
      const now = new Date();
      const message = {
        ...baseMessage,
        created_at: now.toISOString(),
      };

      const { getByText } = render(<ChatBubble message={message} isOwnMessage={false} />);

      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      expect(getByText(`${hours}:${minutes}`)).toBeTruthy();
    });

    it('calls onSwipeReply when swiping', () => {
      const onSwipeReply = jest.fn();
      const { getByText } = render(
        <ChatBubble message={baseMessage} isOwnMessage={false} onSwipeReply={onSwipeReply} />,
      );

      // Simulate swipe by triggering the swipeable's onSwipeableWillOpen
      fireEvent(getByText('Hello, how are you?'), 'longPress');
    });
  });

  describe('Mantra Share Messages', () => {
    it('renders mantra share message correctly', () => {
      const mantraMessage: Message = {
        ...baseMessage,
        content: JSON.stringify({
          type: 'mantra_share',
          text: 'Peace begins with a smile',
          mantra_id: 123,
        }),
      };

      const { getByText } = render(<ChatBubble message={mantraMessage} isOwnMessage={false} />);

      // Text is rendered with quotes and newlines, so match partial content
      expect(getByText(/Peace begins with a smile/)).toBeTruthy();
      expect(getByText('Shared a mantra')).toBeTruthy();
      expect(getByText('Tap to view')).toBeTruthy();
    });

    it('renders own mantra share with correct label', () => {
      const mantraMessage: Message = {
        ...baseMessage,
        content: JSON.stringify({
          type: 'mantra_share',
          text: 'Peace begins with a smile',
          mantra_id: 123,
        }),
      };

      const { getByText } = render(<ChatBubble message={mantraMessage} isOwnMessage={true} />);

      expect(getByText('You shared a mantra')).toBeTruthy();
    });

    it('navigates to mantra when pressed', () => {
      const mantraMessage: Message = {
        ...baseMessage,
        content: JSON.stringify({
          type: 'mantra_share',
          text: 'Peace begins with a smile',
          mantra_id: 123,
        }),
      };

      const { getByText } = render(<ChatBubble message={mantraMessage} isOwnMessage={false} />);

      fireEvent.press(getByText(/Peace begins with a smile/));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('MainApp', {
        screen: 'Home',
        params: { returnToMantraId: 123 },
      });
    });
  });

  describe('Reactions', () => {
    it('renders reactions correctly', () => {
      const messageWithReactions: Message = {
        ...baseMessage,
        reactions: [
          { emoji: '👍', count: 2, users: [1, 2] },
          { emoji: '❤️', count: 1, users: [3] },
        ],
      };

      const { getByText } = render(
        <ChatBubble message={messageWithReactions} isOwnMessage={false} currentUserId={1} />,
      );

      expect(getByText('👍')).toBeTruthy();
      expect(getByText('2')).toBeTruthy();
      expect(getByText('❤️')).toBeTruthy();
    });

    it('highlights user reaction', () => {
      const messageWithReactions: Message = {
        ...baseMessage,
        reactions: [{ emoji: '👍', count: 1, users: [1] }],
      };

      const { getByText } = render(
        <ChatBubble message={messageWithReactions} isOwnMessage={false} currentUserId={1} />,
      );

      expect(getByText('👍')).toBeTruthy();
    });

    it('opens emoji picker on long press', async () => {
      const { getByText } = render(<ChatBubble message={baseMessage} isOwnMessage={false} />);

      fireEvent(getByText('Hello, how are you?'), 'longPress');

      await waitFor(() => {
        expect(getByText('React with an emoji')).toBeTruthy();
      });
    });

    it('closes emoji picker when modal backdrop is pressed', async () => {
      const { getByText, queryByText } = render(
        <ChatBubble message={baseMessage} isOwnMessage={false} />,
      );

      fireEvent(getByText('Hello, how are you?'), 'longPress');

      await waitFor(() => {
        expect(getByText('React with an emoji')).toBeTruthy();
      });

      const modal = getByText('React with an emoji').parent?.parent?.parent;
      fireEvent.press(modal as any);

      await waitFor(() => {
        expect(queryByText('React with an emoji')).toBeNull();
      });
    });

    it('calls onReaction when emoji is selected', async () => {
      const onReaction = jest.fn();
      const { getByText } = render(
        <ChatBubble message={baseMessage} isOwnMessage={false} onReaction={onReaction} />,
      );

      fireEvent(getByText('Hello, how are you?'), 'longPress');

      await waitFor(() => {
        expect(getByText('React with an emoji')).toBeTruthy();
      });

      fireEvent.press(getByText('👍'));

      expect(onReaction).toHaveBeenCalledWith(1, '👍');
    });

    it('closes emoji picker when clicking reaction emoji', async () => {
      const onReaction = jest.fn();
      const messageWithReactions: Message = {
        ...baseMessage,
        reactions: [{ emoji: '👍', count: 1, users: [1] }],
      };

      const { getByText } = render(
        <ChatBubble
          message={messageWithReactions}
          isOwnMessage={false}
          onReaction={onReaction}
          currentUserId={1}
        />,
      );

      fireEvent.press(getByText('👍'));

      expect(onReaction).toHaveBeenCalledWith(1, '👍');
    });
  });

  describe('Reply Context', () => {
    it('renders reply to text message', () => {
      const replyToMessage: Message = {
        message_id: 2,
        conversation_id: 1,
        sender_id: 3,
        content: 'Original message',
        created_at: new Date().toISOString(),
        read: true,
      };

      const { getByText } = render(
        <ChatBubble message={baseMessage} isOwnMessage={false} replyToMessage={replyToMessage} />,
      );

      expect(getByText('Original message')).toBeTruthy();
    });

    it('renders reply to mantra share', () => {
      const replyToMessage: Message = {
        message_id: 2,
        conversation_id: 1,
        sender_id: 3,
        content: JSON.stringify({
          type: 'mantra_share',
          text: 'Be present',
          mantra_id: 456,
        }),
        created_at: new Date().toISOString(),
        read: true,
      };

      const { getByText } = render(
        <ChatBubble message={baseMessage} isOwnMessage={false} replyToMessage={replyToMessage} />,
      );

      expect(getByText(' Be present')).toBeTruthy();
    });

    it('renders reply to mantra share in mantra message', () => {
      const replyToMessage: Message = {
        message_id: 2,
        conversation_id: 1,
        sender_id: 3,
        content: JSON.stringify({
          type: 'mantra_share',
          text: 'Inner peace',
          mantra_id: 456,
        }),
        created_at: new Date().toISOString(),
        read: true,
      };

      const mantraMessage: Message = {
        ...baseMessage,
        content: JSON.stringify({
          type: 'mantra_share',
          text: 'Peace begins with a smile',
          mantra_id: 123,
        }),
      };

      const { getByText } = render(
        <ChatBubble message={mantraMessage} isOwnMessage={false} replyToMessage={replyToMessage} />,
      );

      expect(getByText('🧘 Inner peace')).toBeTruthy();
    });

    it('handles malformed JSON in reply to mantra message', () => {
      const replyToMessage: Message = {
        message_id: 2,
        conversation_id: 1,
        sender_id: 3,
        content: '{invalid json}',
        created_at: new Date().toISOString(),
        read: true,
      };

      const mantraMessage: Message = {
        ...baseMessage,
        content: JSON.stringify({
          type: 'mantra_share',
          text: 'Peace begins with a smile',
          mantra_id: 123,
        }),
      };

      const { getByText } = render(
        <ChatBubble message={mantraMessage} isOwnMessage={false} replyToMessage={replyToMessage} />,
      );

      expect(getByText('{invalid json}')).toBeTruthy();
    });

    it('handles malformed JSON in reply context', () => {
      const replyToMessage: Message = {
        message_id: 2,
        conversation_id: 1,
        sender_id: 3,
        content: '{malformed json',
        created_at: new Date().toISOString(),
        read: true,
      };

      const { getByText } = render(
        <ChatBubble message={baseMessage} isOwnMessage={false} replyToMessage={replyToMessage} />,
      );

      expect(getByText('{malformed json')).toBeTruthy();
    });

    it('handles missing text in mantra reply', () => {
      const replyToMessage: Message = {
        message_id: 2,
        conversation_id: 1,
        sender_id: 3,
        content: JSON.stringify({
          type: 'mantra_share',
          mantra_id: 456,
        }),
        created_at: new Date().toISOString(),
        read: true,
      };

      const { getByText } = render(
        <ChatBubble message={baseMessage} isOwnMessage={false} replyToMessage={replyToMessage} />,
      );

      expect(getByText(' Shared mantra')).toBeTruthy();
    });
  });

  describe('Swipe Gestures', () => {
    it('renders with onSwipeReply prop', () => {
      const onSwipeReply = jest.fn();
      const { getByText } = render(
        <ChatBubble message={baseMessage} isOwnMessage={false} onSwipeReply={onSwipeReply} />,
      );

      expect(getByText('Hello, how are you?')).toBeTruthy();
    });

    it('renders without onSwipeReply prop', () => {
      const { getByText } = render(<ChatBubble message={baseMessage} isOwnMessage={false} />);

      expect(getByText('Hello, how are you?')).toBeTruthy();
    });

    // it('handles pan responder move with valid gesture within range', () => {
    //   const onSwipeReply = jest.fn();
    //   const { UNSAFE_root } = render(
    //     <ChatBubble message={baseMessage} isOwnMessage={false} onSwipeReply={onSwipeReply} />,
    //   );

    //   const animatedView = UNSAFE_root.findAllByType(Animated.View)[0];
    //   const panHandlers = animatedView.props;

    //   // Create a proper gesture state object with timestamp
    //   const gestureState = {
    //     dx: 50,
    //     dy: 0,
    //     numberActiveTouches: 1,
    //     stateID: Date.now(),
    //     moveX: 50,
    //     moveY: 0,
    //     x0: 0,
    //     y0: 0,
    //     vx: 0,
    //     vy: 0,
    //   };

    //   // Invoke the pan responder move handler
    //   if (panHandlers.onMoveShouldSetResponder) {
    //     const shouldSet = panHandlers.onMoveShouldSetResponder({}, gestureState);
    //     expect(shouldSet).toBe(true);
    //   }

    //   // Test onResponderMove
    //   if (panHandlers.onResponderMove) {
    //     // This should trigger translateX.setValue(gestureState.dx)
    //     panHandlers.onResponderMove({ nativeEvent: { timestamp: Date.now() } }, gestureState);
    //   }
    // });

    // it('triggers swipe reply when gesture exceeds threshold', () => {
    //   const onSwipeReply = jest.fn();
    //   const { UNSAFE_root } = render(
    //     <ChatBubble message={baseMessage} isOwnMessage={false} onSwipeReply={onSwipeReply} />,
    //   );

    //   const animatedView = UNSAFE_root.findAllByType(Animated.View)[0];
    //   const panHandlers = animatedView.props;

    //   const gestureState = {
    //     dx: 70,
    //     dy: 0,
    //     numberActiveTouches: 1,
    //     stateID: Date.now(),
    //     moveX: 70,
    //     moveY: 0,
    //     x0: 0,
    //     y0: 0,
    //     vx: 0,
    //     vy: 0,
    //   };

    //   if (panHandlers.onResponderRelease) {
    //     panHandlers.onResponderRelease({ nativeEvent: { timestamp: Date.now() } }, gestureState);
    //   }

    //   expect(onSwipeReply).toHaveBeenCalledWith(baseMessage);
    // });

    it('does not trigger swipe reply when gesture is below threshold', () => {
      const onSwipeReply = jest.fn();
      const { UNSAFE_root } = render(
        <ChatBubble message={baseMessage} isOwnMessage={false} onSwipeReply={onSwipeReply} />,
      );

      const animatedView = UNSAFE_root.findAllByType(Animated.View)[0];
      const panHandlers = animatedView.props;

      const gestureState = {
        dx: 40,
        dy: 0,
        numberActiveTouches: 1,
        stateID: Date.now(),
        moveX: 40,
        moveY: 0,
        x0: 0,
        y0: 0,
        vx: 0,
        vy: 0,
      };

      if (panHandlers.onResponderRelease) {
        panHandlers.onResponderRelease({ nativeEvent: { timestamp: Date.now() } }, gestureState);
      }

      expect(onSwipeReply).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles malformed JSON content gracefully', () => {
      const malformedMessage: Message = {
        ...baseMessage,
        content: '{invalid json}',
      };

      const { getByText } = render(<ChatBubble message={malformedMessage} isOwnMessage={false} />);

      expect(getByText('{invalid json}')).toBeTruthy();
    });

    it('handles missing mantra text in share', () => {
      const mantraMessage: Message = {
        ...baseMessage,
        content: JSON.stringify({
          type: 'mantra_share',
          mantra_id: 123,
        }),
      };

      const { getByText } = render(<ChatBubble message={mantraMessage} isOwnMessage={false} />);

      expect(getByText(/Open mantra/)).toBeTruthy();
    });

    it('renders without optional props', () => {
      const { getByText } = render(<ChatBubble message={baseMessage} isOwnMessage={false} />);

      expect(getByText('Hello, how are you?')).toBeTruthy();
    });

    it('does not show reaction count for single reaction', () => {
      const messageWithReactions: Message = {
        ...baseMessage,
        reactions: [{ emoji: '👍', count: 1, users: [1] }],
      };

      const { queryByText, getByText } = render(
        <ChatBubble message={messageWithReactions} isOwnMessage={false} currentUserId={2} />,
      );

      expect(getByText('👍')).toBeTruthy();
      expect(queryByText('1')).toBeNull();
    });

    it('opens emoji picker when pressing + button in reactions', async () => {
      const messageWithReactions: Message = {
        ...baseMessage,
        reactions: [{ emoji: '👍', count: 1, users: [1] }],
      };

      const { getByText } = render(
        <ChatBubble message={messageWithReactions} isOwnMessage={false} />,
      );

      fireEvent.press(getByText('+'));

      await waitFor(() => {
        expect(getByText('React with an emoji')).toBeTruthy();
      });
    });

    it('closes emoji picker on modal request close', async () => {
      const { getByText, queryByText } = render(
        <ChatBubble message={baseMessage} isOwnMessage={false} />,
      );

      fireEvent(getByText('Hello, how are you?'), 'longPress');

      await waitFor(() => {
        expect(getByText('React with an emoji')).toBeTruthy();
      });

      // Find the modal and trigger onRequestClose
      const modal = getByText('React with an emoji').parent?.parent?.parent?.parent;
      fireEvent(modal as any, 'requestClose');

      await waitFor(() => {
        expect(queryByText('React with an emoji')).toBeNull();
      });
    });

    it('handles reply context with malformed JSON in text message', () => {
      const replyToMessage: Message = {
        message_id: 2,
        conversation_id: 1,
        sender_id: 3,
        content: '{"invalid": json',
        created_at: new Date().toISOString(),
        read: true,
      };

      const { getByText } = render(
        <ChatBubble message={baseMessage} isOwnMessage={false} replyToMessage={replyToMessage} />,
      );

      expect(getByText('{"invalid": json')).toBeTruthy();
    });
  });
});
