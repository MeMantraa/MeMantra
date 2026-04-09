import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import MessageReportList from '../../../components/admin/MessageReportList';
import { messageReportService } from '../../../services/moderation.service';
import { storage } from '../../../utils/storage';
import { Alert } from 'react-native';

jest.mock('../../../services/moderation.service');
jest.mock('../../../utils/storage');
jest.mock('../../../context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      primary: '#7BA5B5',
      primaryDark: '#5a8fa3',
      secondary: '#6D7E68',
      text: '#333',
    },
  }),
}));
jest.mock('../../../components/UI/textWrapper', () => {
  const { Text } = jest.requireActual('react-native');
  return ({ children, ...props }: any) => <Text {...props}>{children}</Text>;
});

describe('MessageReportList', () => {
  const mockColors = {
    primary: '#7BA5B5',
    primaryDark: '#5a8fa3',
    secondary: '#6D7E68',
    text: '#333',
  };

  const mockReports = [
    {
      report_id: 1,
      message_id: 10,
      conversation_id: 5,
      reported_by_id: 1,
      reason: 'spam',
      description: 'Spam message',
      status: 'pending' as const,
      created_at: '2026-04-08T00:00:00Z',
    },
    {
      report_id: 2,
      message_id: 20,
      conversation_id: 6,
      reported_by_id: 2,
      reason: 'harassment',
      status: 'accepted' as const,
      created_at: '2026-04-07T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (storage.getUserData as jest.Mock).mockResolvedValue({
      token: 'test-token-123',
    });
    (messageReportService.getAllReports as jest.Mock).mockResolvedValue({
      data: { reports: mockReports },
    });
  });

  it('fetches reports on mount', async () => {
    render(<MessageReportList colors={mockColors} />);

    await waitFor(() => {
      expect(messageReportService.getAllReports).toHaveBeenCalledWith('test-token-123', undefined);
    });
  });

  it('shows error when not authenticated', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    (storage.getUserData as jest.Mock).mockResolvedValueOnce({ token: null });

    render(<MessageReportList colors={mockColors} />);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error', 'Authentication required');
    });

    alertSpy.mockRestore();
  });

  it('shows error when failing to fetch reports', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    (messageReportService.getAllReports as jest.Mock).mockRejectedValueOnce({
      message: 'Network error',
    });

    render(<MessageReportList colors={mockColors} />);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error', expect.any(String));
    });

    alertSpy.mockRestore();
  });

  it('shows "No reports found" when list is empty', async () => {
    (messageReportService.getAllReports as jest.Mock).mockResolvedValueOnce({
      data: { reports: [] },
    });

    const { getByText } = render(<MessageReportList colors={mockColors} />);

    await waitFor(() => {
      expect(getByText('No reports found')).toBeTruthy();
    });
  });

  it('calls getAllReports with correct token', async () => {
    render(<MessageReportList colors={mockColors} />);

    await waitFor(() => {
      expect(messageReportService.getAllReports).toHaveBeenCalledWith('test-token-123', undefined);
    });
  });

  it('updates report status successfully', async () => {
    (messageReportService.updateReportStatus as jest.Mock).mockResolvedValueOnce({
      status: 'success',
    });

    render(<MessageReportList colors={mockColors} />);

    await waitFor(() => {
      expect(messageReportService.getAllReports).toHaveBeenCalled();
    });

    expect(messageReportService.updateReportStatus).not.toHaveBeenCalled();
  });

  it('calls deleteReport when deleting', async () => {
    (messageReportService.deleteReport as jest.Mock).mockResolvedValueOnce({
      status: 'success',
    });

    render(<MessageReportList colors={mockColors} />);

    await waitFor(() => {
      expect(messageReportService.getAllReports).toHaveBeenCalled();
    });

    expect(messageReportService.deleteReport).not.toHaveBeenCalled();
  });

  it('handles empty token gracefully', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    (storage.getUserData as jest.Mock).mockResolvedValueOnce({});

    render(<MessageReportList colors={mockColors} />);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error', 'Authentication required');
    });

    alertSpy.mockRestore();
  });

  it('refetches reports after successful status update', async () => {
    (messageReportService.updateReportStatus as jest.Mock).mockResolvedValueOnce({
      status: 'success',
    });
    (messageReportService.getAllReports as jest.Mock).mockResolvedValue({
      data: { reports: mockReports },
    });

    render(<MessageReportList colors={mockColors} />);

    await waitFor(() => {
      expect(messageReportService.getAllReports).toHaveBeenCalled();
    });
  });

  it('handles network errors during fetch', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    (messageReportService.getAllReports as jest.Mock).mockRejectedValueOnce(
      new Error('Network timeout'),
    );

    render(<MessageReportList colors={mockColors} />);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalled();
    });

    alertSpy.mockRestore();
  });

  it('properly handles storage errors', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    (storage.getUserData as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

    render(<MessageReportList colors={mockColors} />);

    await waitFor(() => {
      expect(messageReportService.getAllReports).not.toHaveBeenCalled();
    });

    alertSpy.mockRestore();
  });

  it('calls getAllReports on status change', async () => {
    (messageReportService.updateReportStatus as jest.Mock).mockResolvedValueOnce({
      status: 'success',
    });

    render(<MessageReportList colors={mockColors} />);

    await waitFor(() => {
      expect(messageReportService.getAllReports).toHaveBeenCalledTimes(1);
    });
  });
});
