import React, { useState } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import AppText from '../UI/textWrapper';
import { messageReportService } from '../../services/moderation.service';
import { storage } from '../../utils/storage';

interface MessageReportModalProps {
  visible: boolean;
  messageId: number;
  conversationId: number;
  onClose: () => void;
  onSuccess?: () => void;
}

const REPORT_REASONS = [
  { id: 'inappropriate_language', label: 'Inappropriate Language' },
  { id: 'harassment', label: 'Harassment or Bullying' },
  { id: 'spam', label: 'Spam' },
  { id: 'offensive_content', label: 'Offensive Content' },
  { id: 'misinformation', label: 'Misinformation' },
  { id: 'other', label: 'Other' },
];

export default function MessageReportModal({
  visible,
  messageId,
  conversationId,
  onClose,
  onSuccess,
}: MessageReportModalProps) {
  const { colors } = useTheme();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitReport = async () => {
    if (!selectedReason) {
      Alert.alert('Error', 'Please select a reason for reporting');
      return;
    }

    setLoading(true);
    try {
      const userData = await storage.getUserData();
      const token = (userData?.token as string) || '';

      if (!token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      await messageReportService.reportMessage(
        {
          message_id: messageId,
          conversation_id: conversationId,
          reason: selectedReason as any,
          description: description || undefined,
        },
        token,
      );

      Alert.alert('Success', 'Report submitted successfully. Our team will review it.');
      setSelectedReason(null);
      setDescription('');
      onClose();
      onSuccess?.();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1" style={{ backgroundColor: colors.primary }}>
        {/* Header */}
        <View
          className="pt-12 pb-6 px-6 border-b"
          style={{ borderBottomColor: colors.primaryDark }}
        >
          <View className="flex-row justify-between items-center">
            <AppText className="text-xl font-bold" style={{ color: colors.text }}>
              Report Message
            </AppText>
            <TouchableOpacity onPress={onClose}>
              <AppText className="text-2xl" style={{ color: colors.text }}>
                ✕
              </AppText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <ScrollView className="flex-1 px-6 py-6" showsVerticalScrollIndicator={false}>
          {/* Reason Selection */}
          <AppText className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
            Why are you reporting this message?
          </AppText>

          {REPORT_REASONS.map((reason) => (
            <TouchableOpacity
              key={reason.id}
              className="mb-3 p-4 rounded-lg flex-row items-center"
              style={{
                backgroundColor:
                  selectedReason === reason.id ? colors.secondary : `${colors.primaryDark}55`,
              }}
              onPress={() => setSelectedReason(reason.id)}
            >
              <View
                className="w-6 h-6 rounded-full border-2 mr-3 items-center justify-center"
                style={{
                  borderColor: selectedReason === reason.id ? colors.primaryDark : colors.text,
                  backgroundColor: selectedReason === reason.id ? colors.secondary : 'transparent',
                }}
              >
                {selectedReason === reason.id && (
                  <AppText className="text-sm font-bold" style={{ color: colors.primaryDark }}>
                    ✓
                  </AppText>
                )}
              </View>
              <AppText
                className="flex-1 text-base"
                style={{ color: selectedReason === reason.id ? colors.primaryDark : colors.text }}
              >
                {reason.label}
              </AppText>
            </TouchableOpacity>
          ))}

          {/* Optional Description */}
          <AppText className="text-lg font-semibold mt-8 mb-3" style={{ color: colors.text }}>
            Additional Details (Optional)
          </AppText>

          <TextInput
            className="p-4 rounded-lg text-base"
            style={{
              borderColor: `${colors.text}33`,
              borderWidth: 2,
              color: colors.text,
            }}
            multiline
            numberOfLines={4}
            placeholder="Please provide any additional information..."
            placeholderTextColor={`${colors.text}66`}
            value={description}
            onChangeText={setDescription}
          />

          {/* Info Text */}
          <AppText className="text-xs mt-6 text-center" style={{ color: `${colors.text}88` }}>
            Reports are reviewed by our moderation team within 24 hours. False reports may result in
            account restrictions.
          </AppText>
        </ScrollView>

        {/* Footer Buttons */}
        <View
          className="flex-row gap-3 p-6 border-t"
          style={{ borderTopColor: colors.primaryDark }}
        >
          <TouchableOpacity
            className="flex-1 py-3 rounded-lg items-center"
            style={{ backgroundColor: `${colors.primaryDark}55` }}
            onPress={onClose}
            disabled={loading}
          >
            <AppText className="font-semibold" style={{ color: colors.text }}>
              Cancel
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 py-3 rounded-lg items-center flex-row justify-center gap-2"
            style={{ backgroundColor: colors.secondary }}
            onPress={handleSubmitReport}
            disabled={loading || !selectedReason}
          >
            {loading && <ActivityIndicator color={colors.primaryDark} />}
            <AppText className="font-semibold" style={{ color: colors.primaryDark }}>
              Submit Report
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
