import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, TextInput, TouchableOpacity, View } from 'react-native';
import AppText from '../UI/textWrapper';

export interface FeatureFlagItem {
  key: string;
  label: string;
  description?: string;
}

export interface FeatureFlagUser {
  user_id: number;
  username: string | null;
  email: string | null;
  feature_flags?: string[];
}

interface FeatureFlagsPanelProps {
  colors: {
    primaryDark: string;
    secondary: string;
    text: string;
  };
  loading: boolean;
  submitting: boolean;
  flags: FeatureFlagItem[];
  selectedFlagKey: string;
  rolloutPercentage: string;
  userSearchQuery: string;
  users: FeatureFlagUser[];
  selectedUserIds: number[];
  onSelectFlag: (flagKey: string) => void;
  onChangeRolloutPercentage: (value: string) => void;
  onApplyRollout: (flagKey: string) => void;
  onApplyExactRollout: (flagKey: string) => void;
  onEnableAll: (flagKey: string) => void;
  onDisableAll: (flagKey: string) => void;
  onToggleUserFlag: (userId: number, flagKey: string, enabled: boolean) => void;
  onToggleUserSelection: (userId: number) => void;
  onSelectAllUsers: (userIds: number[]) => void;
  onClearUserSelection: () => void;
  onApplySelectedUsers: (flagKey: string, enabled: boolean) => void;
  onChangeUserSearchQuery: (value: string) => void;
}

const FeatureFlagsPanel: React.FC<FeatureFlagsPanelProps> = ({
  colors,
  loading,
  submitting,
  flags,
  selectedFlagKey,
  rolloutPercentage,
  userSearchQuery,
  users,
  selectedUserIds,
  onSelectFlag,
  onChangeRolloutPercentage,
  onApplyRollout,
  onApplyExactRollout,
  onEnableAll,
  onDisableAll,
  onToggleUserFlag,
  onToggleUserSelection,
  onSelectAllUsers,
  onClearUserSelection,
  onApplySelectedUsers,
  onChangeUserSearchQuery,
}) => {
  const [localRolloutPercentage, setLocalRolloutPercentage] = useState(rolloutPercentage);

  useEffect(() => {
    setLocalRolloutPercentage(rolloutPercentage);
  }, [rolloutPercentage]);

  const filteredUsers = users.filter((u) => {
    if (!userSearchQuery.trim()) return true;
    const q = userSearchQuery.toLowerCase();
    return (
      (u.username ?? '').toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q)
    );
  });

  if (loading) {
    return <ActivityIndicator size="large" color={colors.secondary} style={{ marginTop: 40 }} />;
  }

  const renderUserRow = ({ item: u }: { item: FeatureFlagUser }) => {
    const flagsForUser = u.feature_flags ?? [];
    const hasSelected = !!selectedFlagKey && flagsForUser.includes(selectedFlagKey);
    const isChecked = selectedUserIds.includes(u.user_id);

    return (
      <View className="rounded-xl p-3 mb-2" style={{ backgroundColor: `${colors.primaryDark}55` }}>
        <View className="flex-row items-center justify-between">
          <AppText className="text-white font-semibold">{u.username || 'Unknown user'}</AppText>
          <TouchableOpacity
            className="rounded-md px-2 py-1"
            style={{ backgroundColor: isChecked ? colors.secondary : `${colors.primaryDark}88` }}
            disabled={submitting}
            onPress={() => onToggleUserSelection(u.user_id)}
          >
            <AppText style={{ color: isChecked ? colors.primaryDark : colors.text }}>
              {isChecked ? 'Selected' : 'Select'}
            </AppText>
          </TouchableOpacity>
        </View>
        <AppText style={{ color: colors.text }}>{u.email || 'No email'}</AppText>
        <AppText className="text-xs mt-1" style={{ color: colors.text }}>
          Flags: {flagsForUser.length ? flagsForUser.join(', ') : 'None'}
        </AppText>

        {!!selectedFlagKey && (
          <TouchableOpacity
            className="mt-2 rounded-lg px-3 py-2 self-start"
            style={{
              backgroundColor: hasSelected ? `${colors.primaryDark}88` : colors.secondary,
            }}
            disabled={submitting}
            onPress={() => onToggleUserFlag(u.user_id, selectedFlagKey, !hasSelected)}
          >
            <AppText style={{ color: hasSelected ? colors.text : colors.primaryDark }}>
              {hasSelected ? 'Unassign Selected Flag' : 'Assign Selected Flag'}
            </AppText>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const listHeader = (
    <>
      <AppText className="text-white text-lg font-bold mb-3">Flag List</AppText>

      {flags.map((flag) => (
        <TouchableOpacity
          key={flag.key}
          className="rounded-xl p-3 mb-2"
          style={{
            backgroundColor:
              selectedFlagKey === flag.key ? colors.secondary : `${colors.primaryDark}55`,
          }}
          onPress={() => onSelectFlag(flag.key)}
        >
          <AppText
            style={{ color: selectedFlagKey === flag.key ? colors.primaryDark : colors.text }}
          >
            {flag.label}
          </AppText>
          {!!flag.description && (
            <AppText className="text-xs" style={{ color: colors.text }}>
              {flag.description}
            </AppText>
          )}
        </TouchableOpacity>
      ))}

      {!!selectedFlagKey && (
        <>
          <AppText className="text-white text-lg font-bold mt-4 mb-3">Global Actions</AppText>
          <View className="flex-row gap-3 mb-4">
            <TouchableOpacity
              className="flex-1 rounded-xl p-3 items-center"
              style={{ backgroundColor: colors.secondary }}
              disabled={submitting}
              onPress={() => onEnableAll(selectedFlagKey)}
            >
              <AppText style={{ color: colors.primaryDark }}>Enable All</AppText>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 rounded-xl p-3 items-center"
              style={{ backgroundColor: `${colors.primaryDark}88` }}
              disabled={submitting}
              onPress={() => onDisableAll(selectedFlagKey)}
            >
              <AppText style={{ color: colors.text }}>Disable All</AppText>
            </TouchableOpacity>
          </View>

          <AppText className="text-white text-lg font-bold mb-3">Percentage Rollout</AppText>
          <View className="flex-row items-center gap-3 mb-6">
            <TextInput
              className="bg-black/30 text-white p-3 rounded-xl"
              style={{ minWidth: 80 }}
              keyboardType="numeric"
              value={localRolloutPercentage}
              onChangeText={setLocalRolloutPercentage}
            />
            <TouchableOpacity
              className="rounded-xl px-4 py-3"
              style={{ backgroundColor: colors.secondary }}
              disabled={submitting}
              onPress={() => {
                onChangeRolloutPercentage(localRolloutPercentage);
                onApplyRollout(selectedFlagKey);
              }}
            >
              <AppText style={{ color: colors.primaryDark }}>Expand Rollout</AppText>
            </TouchableOpacity>
            <TouchableOpacity
              className="rounded-xl px-4 py-3"
              style={{ backgroundColor: `${colors.primaryDark}88` }}
              disabled={submitting}
              onPress={() => {
                onChangeRolloutPercentage(localRolloutPercentage);
                onApplyExactRollout(selectedFlagKey);
              }}
            >
              <AppText style={{ color: colors.text }}>Set Exact</AppText>
            </TouchableOpacity>
          </View>
          <AppText className="text-xs mb-6" style={{ color: colors.text }}>
            Expand Rollout only adds users. Set Exact may remove the flag from users outside the
            target cohort.
          </AppText>
        </>
      )}

      <AppText className="text-white text-lg font-bold mb-3">Users List (Current Flags)</AppText>
      <TextInput
        className="bg-black/30 text-white p-4 rounded-xl mb-4"
        placeholder="Search users here"
        placeholderTextColor="rgba(255, 255, 255, 0.5)"
        value={userSearchQuery}
        onChangeText={onChangeUserSearchQuery}
      />

      <View className="flex-row flex-wrap gap-2 mb-4">
        <TouchableOpacity
          className="rounded-lg px-3 py-2"
          style={{ backgroundColor: `${colors.primaryDark}88` }}
          disabled={submitting}
          onPress={() => onSelectAllUsers(filteredUsers.map((u) => u.user_id))}
        >
          <AppText style={{ color: colors.text }}>Select Filtered</AppText>
        </TouchableOpacity>
        <TouchableOpacity
          className="rounded-lg px-3 py-2"
          style={{ backgroundColor: `${colors.primaryDark}88` }}
          disabled={submitting}
          onPress={onClearUserSelection}
        >
          <AppText style={{ color: colors.text }}>Clear Selection</AppText>
        </TouchableOpacity>
      </View>

      {!!selectedFlagKey && selectedUserIds.length > 0 && (
        <View className="mb-4">
          <AppText className="text-xs mb-2" style={{ color: colors.text }}>
            Selected users: {selectedUserIds.length}
          </AppText>
          <View className="flex-row gap-2">
            <TouchableOpacity
              className="flex-1 rounded-lg px-3 py-2 items-center"
              style={{ backgroundColor: colors.secondary }}
              disabled={submitting}
              onPress={() => onApplySelectedUsers(selectedFlagKey, true)}
            >
              <AppText style={{ color: colors.primaryDark }}>Assign to Selected</AppText>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 rounded-lg px-3 py-2 items-center"
              style={{ backgroundColor: `${colors.primaryDark}88` }}
              disabled={submitting}
              onPress={() => onApplySelectedUsers(selectedFlagKey, false)}
            >
              <AppText style={{ color: colors.text }}>Unassign from Selected</AppText>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );

  return (
    <FlatList
      className="flex-1"
      data={filteredUsers}
      keyExtractor={(item) => String(item.user_id)}
      renderItem={renderUserRow}
      ListHeaderComponent={listHeader}
      showsVerticalScrollIndicator={false}
      decelerationRate="fast"
      disableIntervalMomentum
      bounces={false}
      overScrollMode="never"
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="none"
      contentContainerStyle={{ paddingBottom: 24 }}
    />
  );
};

export default FeatureFlagsPanel;
