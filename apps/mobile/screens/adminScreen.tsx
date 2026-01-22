import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Mantra, mantraService } from '../services/mantra.service';
import { User, userService } from '../services/user.service';
import { storage } from '../utils/storage';
import MantraForm from '../components/admin/MantraForm';
import MantraList from '../components/admin/MantraList';
import UserForm from '../components/admin/UserForm';
import UserList from '../components/admin/UserList';
import AppText from '../components/UI/textWrapper';

type AdminMode = 'mantras' | 'users';
type ActionMode = 'add' | 'manage';

const AdminScreen: React.FC = () => {
  const { colors } = useTheme();
  const [mode, setMode] = useState<AdminMode>('mantras');
  const [action, setAction] = useState<ActionMode>('add');

  const [mantras, setMantras] = useState<Mantra[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingMantra, setEditingMantra] = useState<Mantra | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [mantraForm, setMantraForm] = useState({
    title: '',
    key_takeaway: '',
    background_author: '',
    background_description: '',
    jamie_take: '',
    when_where: '',
    negative_thoughts: '',
    cbt_principles: '',
    references: '',
  });

  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    loadData();
  }, [mode]);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = (await storage.getToken()) || 'mock-token';

      if (mode === 'mantras') {
        const response = await mantraService.getFeedMantras(token);
        if (response.status === 'success') {
          setMantras(response.data);
        }
      } else {
        const response = await userService.getAllUsers(token);
        if (response.status === 'success') {
          setUsers(response.data.users);
        }
      }
    } catch (error) {
      console.error('Failed to load ' + mode + ':', error);
      Alert.alert('Error', `Failed to load ${mode}`);
    } finally {
      setLoading(false);
    }
  };

  const resetMantraForm = () => {
    setMantraForm({
      title: '',
      key_takeaway: '',
      background_author: '',
      background_description: '',
      jamie_take: '',
      when_where: '',
      negative_thoughts: '',
      cbt_principles: '',
      references: '',
    });
    setEditingMantra(null);
  };

  const resetUserForm = () => {
    setUserForm({ username: '', email: '', password: '' });
    setEditingUser(null);
  };

  const handleMantraFormChange = (field: string, value: string) => {
    setMantraForm({ ...mantraForm, [field]: value });
  };

  const handleUserFormChange = (field: string, value: string) => {
    setUserForm({ ...userForm, [field]: value });
  };

  const handleCreateMantra = async () => {
    if (!mantraForm.title.trim() || !mantraForm.key_takeaway.trim()) {
      Alert.alert('Error', 'Title and key takeaway are required');
      return;
    }

    setSubmitting(true);
    try {
      const token = (await storage.getToken()) || 'mock-token';
      const response = await mantraService.createMantra(mantraForm, token);

      if (response.status === 'success') {
        setMantras([response.data.mantra, ...mantras]);
        resetMantraForm();
        Alert.alert('Success', 'Mantra created successfully');
      }
    } catch (error) {
      console.error('Failed to create mantra:', error);
      Alert.alert('Error', 'Failed to create mantra');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateMantra = async () => {
    if (!editingMantra) return;

    setSubmitting(true);
    try {
      const token = (await storage.getToken()) || 'mock-token';
      const response = await mantraService.updateMantra(editingMantra.mantra_id, mantraForm, token);

      if (response.status === 'success') {
        setMantras(
          mantras.map((m) => (m.mantra_id === editingMantra.mantra_id ? response.data.mantra : m)),
        );
        resetMantraForm();
        setEditModalVisible(false);
        Alert.alert('Success', 'Mantra updated successfully');
      }
    } catch (error) {
      console.error('Failed to update mantra:', error);
      Alert.alert('Error', 'Failed to update mantra');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMantra = async (mantraId: number) => {
    setDeletingId(mantraId);
    try {
      const token = (await storage.getToken()) || 'mock-token';
      await mantraService.deleteMantra(mantraId, token);
      setMantras(mantras.filter((m) => m.mantra_id !== mantraId));
      Alert.alert('Success', 'Mantra deleted');
    } catch (error) {
      console.error('Failed to delete mantra:', error);
      Alert.alert('Error', 'Failed to delete mantra');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateUser = async () => {
    if (!userForm.username.trim() || !userForm.email.trim() || !userForm.password.trim()) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    setSubmitting(true);
    try {
      const token = (await storage.getToken()) || 'mock-token';
      const response = await userService.createUser(userForm, token);

      if (response.status === 'success') {
        setUsers([response.data.user, ...users]);
        resetUserForm();
        Alert.alert('Success', 'User created successfully');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    setSubmitting(true);
    try {
      const token = (await storage.getToken()) || 'mock-token';
      const payload: any = { username: userForm.username, email: userForm.email };
      if (userForm.password) payload.password = userForm.password;

      const response = await userService.updateUser(editingUser.user_id, payload, token);

      if (response.status === 'success') {
        setUsers(users.map((u) => (u.user_id === editingUser.user_id ? response.data.user : u)));
        resetUserForm();
        setEditModalVisible(false);
        Alert.alert('Success', 'User updated successfully');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    setDeletingId(userId);
    try {
      const token = (await storage.getToken()) || 'mock-token';
      await userService.deleteUser(userId, token);
      setUsers(users.filter((u) => u.user_id !== userId));
      Alert.alert('Success', 'User deleted');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeletingId(null);
    }
  };

  const openEditMantra = (mantra: Mantra) => {
    setEditingMantra(mantra);
    setMantraForm({
      title: mantra.title,
      key_takeaway: mantra.key_takeaway,
      background_author: mantra.background_author || '',
      background_description: mantra.background_description || '',
      jamie_take: mantra.jamie_take || '',
      when_where: mantra.when_where || '',
      negative_thoughts: mantra.negative_thoughts || '',
      cbt_principles: mantra.cbt_principles || '',
      references: mantra.references || '',
    });
    setEditModalVisible(true);
  };

  const openEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      username: user.username || '',
      email: user.email || '',
      password: '',
    });
    setEditModalVisible(true);
  };

  const confirmDeleteMantra = (mantraId: number, title: string) => {
    Alert.alert('Delete Mantra', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void handleDeleteMantra(mantraId);
        },
      },
    ]);
  };

  const confirmDeleteUser = (userId: number, username: string) => {
    Alert.alert('Delete User', `Delete "${username}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void handleDeleteUser(userId);
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <View className="flex-1 px-6 pt-16 pb-6" style={{ backgroundColor: colors.primary }}>
        <AppText className="text-white text-3xl font-bold mb-4">Admin Controls</AppText>

        {/* Mode Toggle: Mantras vs Users */}
        <View
          className="flex-row p-1 rounded-full mb-4"
          style={{ backgroundColor: `${colors.primaryDark}55` }}
        >
          <TouchableOpacity
            className="flex-1 rounded-full px-4 py-3"
            onPress={() => {
              setMode('mantras');
              setAction('add');
              resetMantraForm();
              resetUserForm();
            }}
            style={{ backgroundColor: mode === 'mantras' ? colors.secondary : 'transparent' }}
          >
            <AppText
              className="text-center font-semibold"
              style={{ color: mode === 'mantras' ? colors.primaryDark : colors.text }}
            >
              Mantras
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 rounded-full px-4 py-3"
            onPress={() => {
              setMode('users');
              setAction('add');
              resetMantraForm();
              resetUserForm();
            }}
            style={{ backgroundColor: mode === 'users' ? colors.secondary : 'transparent' }}
          >
            <AppText
              className="text-center font-semibold"
              style={{ color: mode === 'users' ? colors.primaryDark : colors.text }}
            >
              Users
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Action Toggle: Add vs Manage */}
        <View
          className="flex-row p-1 rounded-full mb-6"
          style={{ backgroundColor: `${colors.primaryDark}33` }}
        >
          <TouchableOpacity
            className="flex-1 rounded-full px-4 py-2"
            onPress={() => setAction('add')}
            style={{ backgroundColor: action === 'add' ? colors.secondary : 'transparent' }}
          >
            <AppText
              className="text-center font-semibold text-sm"
              style={{ color: action === 'add' ? colors.primaryDark : colors.text }}
            >
              Add
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 rounded-full px-4 py-2"
            onPress={() => setAction('manage')}
            style={{ backgroundColor: action === 'manage' ? colors.secondary : 'transparent' }}
          >
            <AppText
              className="text-center font-semibold text-sm"
              style={{ color: action === 'manage' ? colors.primaryDark : colors.text }}
            >
              Manage
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {mode === 'mantras' && action === 'add' && (
          <MantraForm
            formData={mantraForm}
            onFormChange={handleMantraFormChange}
            onSubmit={handleCreateMantra}
            submitting={submitting}
          />
        )}

        {mode === 'mantras' && action === 'manage' && (
          <MantraList
            mantras={mantras}
            loading={loading}
            deletingId={deletingId}
            onEdit={openEditMantra}
            onDelete={confirmDeleteMantra}
          />
        )}

        {mode === 'users' && action === 'add' && (
          <UserForm
            formData={userForm}
            onFormChange={handleUserFormChange}
            onSubmit={handleCreateUser}
            submitting={submitting}
          />
        )}

        {mode === 'users' && action === 'manage' && (
          <UserList
            users={users}
            loading={loading}
            deletingId={deletingId}
            onEdit={openEditUser}
            onDelete={confirmDeleteUser}
          />
        )}

        {/* Edit Modal */}
        <Modal
          visible={editModalVisible}
          animationType="slide"
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View className="flex-1 px-6 pt-16 pb-6" style={{ backgroundColor: colors.primary }}>
            <View className="flex-row justify-between items-center mb-6">
              <AppText className="text-white text-2xl font-bold">
                Edit {mode === 'mantras' ? 'Mantra' : 'User'}
              </AppText>
              <TouchableOpacity
                onPress={() => {
                  setEditModalVisible(false);
                  resetMantraForm();
                  resetUserForm();
                }}
              >
                <AppText className="text-white text-2xl">✕</AppText>
              </TouchableOpacity>
            </View>

            {mode === 'mantras' ? (
              <MantraForm
                formData={mantraForm}
                onFormChange={handleMantraFormChange}
                onSubmit={handleUpdateMantra}
                submitting={submitting}
                isEdit
              />
            ) : (
              <UserForm
                formData={userForm}
                onFormChange={handleUserFormChange}
                onSubmit={handleUpdateUser}
                submitting={submitting}
                isEdit
              />
            )}
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
};

export default AdminScreen;
