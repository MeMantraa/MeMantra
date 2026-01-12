import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ChatInput from '../../../components/chat/ChatInput';
import { Message } from '../../../types/chat.types';

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

describe('ChatInput', () => {
  it('renders correctly', () => {
    const onSend = jest.fn();
    const { getByPlaceholderText } = render(<ChatInput onSend={onSend} />);

    expect(getByPlaceholderText('Type a message...')).toBeTruthy();
  });

  it('updates input value when typing', () => {
    const onSend = jest.fn();
    const { getByPlaceholderText } = render(<ChatInput onSend={onSend} />);

    const input = getByPlaceholderText('Type a message...');
    fireEvent.changeText(input, 'Hello World');

    expect(input.props.value).toBe('Hello World');
  });

  it('calls onSend with message when send button is pressed', () => {
    const onSend = jest.fn();
    const { getByPlaceholderText, getByTestId } = render(<ChatInput onSend={onSend} />);

    const input = getByPlaceholderText('Type a message...');
    fireEvent.changeText(input, 'Test message');

    const sendButton = getByTestId('send-button');
    fireEvent.press(sendButton);

    expect(onSend).toHaveBeenCalledWith('Test message');
  });

  it('clears input after sending message', () => {
    const onSend = jest.fn();
    const { getByPlaceholderText, getByTestId } = render(<ChatInput onSend={onSend} />);

    const input = getByPlaceholderText('Type a message...');
    fireEvent.changeText(input, 'Test message');

    const sendButton = getByTestId('send-button');
    fireEvent.press(sendButton);

    expect(input.props.value).toBe('');
  });

  it('trims whitespace from message before sending', () => {
    const onSend = jest.fn();
    const { getByPlaceholderText, getByTestId } = render(<ChatInput onSend={onSend} />);

    const input = getByPlaceholderText('Type a message...');
    fireEvent.changeText(input, '  Test message  ');

    const sendButton = getByTestId('send-button');
    fireEvent.press(sendButton);

    expect(onSend).toHaveBeenCalledWith('Test message');
  });

  it('does not send empty message', () => {
    const onSend = jest.fn();
    const { getByTestId } = render(<ChatInput onSend={onSend} />);

    const sendButton = getByTestId('send-button');
    fireEvent.press(sendButton);

    expect(onSend).not.toHaveBeenCalled();
  });

  it('does not send whitespace-only message', () => {
    const onSend = jest.fn();
    const { getByPlaceholderText, getByTestId } = render(<ChatInput onSend={onSend} />);

    const input = getByPlaceholderText('Type a message...');
    fireEvent.changeText(input, '   ');

    const sendButton = getByTestId('send-button');
    fireEvent.press(sendButton);

    expect(onSend).not.toHaveBeenCalled();
  });

  it('disables input when disabled prop is true', () => {
    const onSend = jest.fn();
    const { getByPlaceholderText } = render(<ChatInput onSend={onSend} disabled={true} />);

    const input = getByPlaceholderText('Type a message...');
    expect(input.props.editable).toBe(false);
  });

  describe('Reply functionality', () => {
    const replyToMessage: Message = {
      message_id: 1,
      conversation_id: 1,
      sender_id: 2,
      content: 'Original message',
      created_at: new Date().toISOString(),
      read: true,
    };

    it('shows reply preview for text message', () => {
      const onSend = jest.fn();
      const onCancelReply = jest.fn();
      const { getByText } = render(
        <ChatInput onSend={onSend} replyingTo={replyToMessage} onCancelReply={onCancelReply} />,
      );

      expect(getByText('Original message')).toBeTruthy();
    });

    it('shows reply preview for mantra share', () => {
      const mantraReply: Message = {
        ...replyToMessage,
        content: JSON.stringify({
          type: 'mantra_share',
          text: 'Peace begins with a smile',
          mantra_id: 123,
        }),
      };

      const onSend = jest.fn();
      const onCancelReply = jest.fn();
      const { getByText } = render(
        <ChatInput onSend={onSend} replyingTo={mantraReply} onCancelReply={onCancelReply} />,
      );

      expect(getByText('Mantra: Peace begins with a smile')).toBeTruthy();
    });

    it('handles mantra share without text', () => {
      const mantraReply: Message = {
        ...replyToMessage,
        content: JSON.stringify({
          type: 'mantra_share',
          mantra_id: 123,
        }),
      };

      const onSend = jest.fn();
      const onCancelReply = jest.fn();
      const { getByText } = render(
        <ChatInput onSend={onSend} replyingTo={mantraReply} onCancelReply={onCancelReply} />,
      );

      expect(getByText('Mantra: Shared mantra')).toBeTruthy();
    });

    it('calls onCancelReply when cancel button is pressed', () => {
      const onSend = jest.fn();
      const onCancelReply = jest.fn();
      const { getByTestId } = render(
        <ChatInput onSend={onSend} replyingTo={replyToMessage} onCancelReply={onCancelReply} />,
      );

      const cancelButton = getByTestId('cancel-reply-button');
      fireEvent.press(cancelButton);

      expect(onCancelReply).toHaveBeenCalled();
    });

    it('shows Replying to label in preview', () => {
      const onSend = jest.fn();
      const onCancelReply = jest.fn();
      const { getByText } = render(
        <ChatInput onSend={onSend} replyingTo={replyToMessage} onCancelReply={onCancelReply} />,
      );

      expect(getByText('Replying to:')).toBeTruthy();
    });
  });

  describe('Edge cases', () => {
    it('handles malformed JSON in reply preview', () => {
      const malformedReply: Message = {
        message_id: 1,
        conversation_id: 1,
        sender_id: 2,
        content: '{invalid json}',
        created_at: new Date().toISOString(),
        read: true,
      };

      const onSend = jest.fn();
      const onCancelReply = jest.fn();
      const { getByText } = render(
        <ChatInput onSend={onSend} replyingTo={malformedReply} onCancelReply={onCancelReply} />,
      );

      expect(getByText('{invalid json}')).toBeTruthy();
    });

    it('works without optional props', () => {
      const onSend = jest.fn();
      const { getByPlaceholderText } = render(<ChatInput onSend={onSend} />);

      expect(getByPlaceholderText('Type a message...')).toBeTruthy();
    });
  });
});
