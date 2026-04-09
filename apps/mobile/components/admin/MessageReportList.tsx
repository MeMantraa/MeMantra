import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import AppText from '../UI/textWrapper';
import { messageReportService, MessageReport } from '../../services/moderation.service';
import { storage } from '../../utils/storage';

interface MessageReportListProps {
  colors: any;
}

const statusColors: Record<string, string> = {
  pending: '#FFA500',
  accepted: '#4CAF50',
  denied: '#F44336',
  reviewed: '#2196F3',
};

export default function MessageReportList({ colors }: MessageReportListProps) {
  const [reports, setReports] = useState<MessageReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
  const [selectedReport, setSelectedReport] = useState<MessageReport | null>(null);
  const [statusChangeLoading, setStatusChangeLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [selectedStatus]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const userData = await storage.getUserData();
      const token = (userData?.token as string) || '';

      if (!token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      const response = await messageReportService.getAllReports(token, selectedStatus);
      setReports(response.data.reports || []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (reportId: number, newStatus: string) => {
    try {
      setStatusChangeLoading(true);
      const userData = await storage.getUserData();
      const token = (userData?.token as string) || '';

      if (!token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      await messageReportService.updateReportStatus(reportId, newStatus as any, token);
      Alert.alert('Success', 'Report status updated');
      setSelectedReport(null);
      fetchReports();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update report');
    } finally {
      setStatusChangeLoading(false);
    }
  };

  const handleDeleteReport = (reportId: number) => {
    Alert.alert('Delete Report', 'Are you sure you want to delete this report?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            const userData = await storage.getUserData();
            const token = (userData?.token as string) || '';

            if (!token) {
              Alert.alert('Error', 'Authentication required');
              return;
            }

            await messageReportService.deleteReport(reportId, token);
            Alert.alert('Success', 'Report deleted');
            fetchReports();
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete report');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color={colors.secondary} />
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Status Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 px-4">
        {['All', 'pending', 'accepted', 'denied', 'reviewed'].map((status) => (
          <TouchableOpacity
            key={status}
            className="mr-3 px-4 py-2 rounded-full"
            style={{
              backgroundColor:
                (status === 'All' && !selectedStatus) || selectedStatus === status
                  ? colors.secondary
                  : `${colors.primaryDark}55`,
            }}
            onPress={() => setSelectedStatus(status === 'All' ? undefined : status)}
          >
            <AppText
              className="font-semibold capitalize"
              style={{
                color:
                  (status === 'All' && !selectedStatus) || selectedStatus === status
                    ? colors.primaryDark
                    : colors.text,
              }}
            >
              {status}
            </AppText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Reports List */}
      {reports.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <AppText style={{ color: colors.text }}>No reports found</AppText>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.report_id.toString()}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="mb-3 p-4 rounded-lg"
              style={{ backgroundColor: `${colors.primaryDark}55` }}
              onPress={() => setSelectedReport(item)}
            >
              <View className="flex-row justify-between items-start mb-2">
                <AppText className="font-semibold flex-1" style={{ color: colors.text }}>
                  Report #{item.report_id}
                </AppText>
                <View
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: statusColors[item.status] || colors.secondary }}
                >
                  <AppText className="text-xs font-semibold text-white capitalize">
                    {item.status}
                  </AppText>
                </View>
              </View>

              <AppText className="text-sm mb-2" style={{ color: `${colors.text}88` }}>
                Reason: <AppText className="font-semibold">{item.reason}</AppText>
              </AppText>

              <AppText className="text-xs" style={{ color: `${colors.text}66` }}>
                {new Date(item.created_at).toLocaleDateString()}
              </AppText>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Detail Modal */}
      {selectedReport && (
        <View className="absolute inset-0 bg-black/50 flex justify-end" style={{ zIndex: 1000 }}>
          <View
            className="w-full rounded-t-2xl p-6"
            style={{ backgroundColor: colors.primary, maxHeight: '80%' }}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <AppText className="text-xl font-bold mb-4" style={{ color: colors.text }}>
                Report Details
              </AppText>

              <View className="mb-4">
                <AppText
                  className="text-sm font-semibold mb-1"
                  style={{ color: `${colors.text}88` }}
                >
                  Report ID
                </AppText>
                <AppText style={{ color: colors.text }}>#{selectedReport.report_id}</AppText>
              </View>

              <View className="mb-4">
                <AppText
                  className="text-sm font-semibold mb-1"
                  style={{ color: `${colors.text}88` }}
                >
                  Reason
                </AppText>
                <AppText style={{ color: colors.text }}>{selectedReport.reason}</AppText>
              </View>

              {selectedReport.description && (
                <View className="mb-4">
                  <AppText
                    className="text-sm font-semibold mb-1"
                    style={{ color: `${colors.text}88` }}
                  >
                    Description
                  </AppText>
                  <AppText style={{ color: colors.text }}>{selectedReport.description}</AppText>
                </View>
              )}

              <View className="mb-4">
                <AppText
                  className="text-sm font-semibold mb-1"
                  style={{ color: `${colors.text}88` }}
                >
                  Status
                </AppText>
                <AppText style={{ color: colors.text }} className="capitalize">
                  {selectedReport.status}
                </AppText>
              </View>

              <View className="mb-6 gap-2">
                <AppText className="text-sm font-semibold" style={{ color: `${colors.text}88` }}>
                  Change Status
                </AppText>
                {['pending', 'accepted', 'denied', 'reviewed'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    className="p-3 rounded-lg flex-row items-center justify-between"
                    style={{
                      backgroundColor:
                        selectedReport.status === status
                          ? colors.secondary
                          : `${colors.primaryDark}55`,
                    }}
                    onPress={() => handleStatusChange(selectedReport.report_id, status)}
                    disabled={statusChangeLoading}
                  >
                    <AppText
                      className="font-semibold capitalize"
                      style={{
                        color: selectedReport.status === status ? colors.primaryDark : colors.text,
                      }}
                    >
                      {status}
                    </AppText>
                    {statusChangeLoading && (
                      <ActivityIndicator
                        color={selectedReport.status === status ? colors.primaryDark : colors.text}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <View className="flex-row gap-2">
                <TouchableOpacity
                  className="flex-1 py-3 rounded-lg items-center"
                  style={{ backgroundColor: `${colors.primaryDark}55` }}
                  onPress={() => setSelectedReport(null)}
                >
                  <AppText className="font-semibold" style={{ color: colors.text }}>
                    Close
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-1 py-3 rounded-lg items-center"
                  style={{ backgroundColor: '#F44336' }}
                  onPress={() => {
                    setSelectedReport(null);
                    handleDeleteReport(selectedReport.report_id);
                  }}
                >
                  <AppText className="font-semibold text-white">Delete</AppText>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}
