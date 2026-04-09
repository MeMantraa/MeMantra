import React, { useEffect, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Mantra, mantraService } from '../services/mantra.service';
import { User, userService } from '../services/user.service';
import { Category, categoryService } from '../services/category.service';
import { storage } from '../utils/storage';
import MantraForm from '../components/admin/MantraForm';
import MantraList from '../components/admin/MantraList';
import UserForm from '../components/admin/UserForm';
import UserList from '../components/admin/UserList';
import CategoryForm from '../components/admin/CategoryForm';
import CategoryList from '../components/admin/CategoryList';
import AppText from '../components/UI/textWrapper';
import { EngagementAnalytics, engagementService } from '../services/engagement.service';
import FeatureFlagsPanel from '../components/admin/FeatureFlagsPanel';
import { PerformanceSummary, performanceService } from '../services/performance.service';
import MessageReportList from '../components/admin/MessageReportList';

type AdminMode = 'mantras' | 'users' | 'categories' | 'analytics' | 'features' | 'reports';
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

  const [categories, setCategories] = useState<Category[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingMantra, setEditingMantra] = useState<Mantra | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [featureFlags, setFeatureFlags] = useState<
    Array<{ key: string; label: string; description?: string }>
  >([]);
  const [usersWithFlags, setUsersWithFlags] = useState<User[]>([]);
  const [featuresLoading, setFeaturesLoading] = useState(false);
  const [featureSubmitting, setFeatureSubmitting] = useState(false);
  const [selectedFlagKey, setSelectedFlagKey] = useState<string>('');
  const [selectedFeatureUserIds, setSelectedFeatureUserIds] = useState<number[]>([]);
  const [featureUserSearchQuery, setFeatureUserSearchQuery] = useState('');
  const [rolloutPercentage, setRolloutPercentage] = useState('10');

  // Category IDs selected for the current mantra being created/edited
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);

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
    confirmPassword: '',
  });
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    category_type: '',
  });

  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [viewAllUsers, setViewAllUsers] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');

  const [analytics, setAnalytics] = useState<EngagementAnalytics | null>(null);
  const [analyticsDays, setAnalyticsDays] = useState<7 | 30 | 90>(30);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [performanceSummary, setPerformanceSummary] = useState<PerformanceSummary | null>(null);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [performanceSnapshots, setPerformanceSnapshots] = useState<
    Array<{
      at: string;
      p95: number;
      errorRate: number;
      slowEvents: number;
    }>
  >([]);

  useEffect(() => {
    if (mode === 'analytics') {
      loadAnalytics();
      return;
    }
    if (mode === 'features') {
      loadFeatureFlagsData();
      return;
    }
    loadData();
  }, [mode]);

  useEffect(() => {
    if (mode === 'analytics') loadAnalytics();
  }, [analyticsDays]);

  useEffect(() => {
    if (mode !== 'analytics') return;

    void loadPerformanceSummary(true);

    const interval = setInterval(() => {
      void loadPerformanceSummary(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [mode]);

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const token = (await storage.getToken()) || 'mock-token';
      const response = await engagementService.getAnalytics(token, analyticsDays);
      if (response.status === 'success') setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      Alert.alert('Error', 'Failed to load analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const loadPerformanceSummary = async (showLoading = false) => {
    if (showLoading) setPerformanceLoading(true);

    try {
      const token = (await storage.getToken()) || 'mock-token';
      const response = await performanceService.getSummary(token);
      if (response.status !== 'success') return;

      setPerformanceSummary(response.data);

      const totalCount = response.data.by_metric.reduce((sum, metric) => sum + metric.count, 0);
      const totalErrors = response.data.by_metric.reduce(
        (sum, metric) => sum + metric.error_count,
        0,
      );
      const totalSlow = response.data.by_metric.reduce((sum, metric) => sum + metric.slow_count, 0);

      const snapshot = {
        at: new Date().toISOString(),
        p95: response.data.recent_stats.p95_ms,
        errorRate: totalCount > 0 ? (totalErrors / totalCount) * 100 : 0,
        slowEvents: totalSlow,
      };

      setPerformanceSnapshots((prev) => [...prev, snapshot].slice(-20));
    } catch (error) {
      console.error('Failed to load performance summary:', error);
      if (showLoading) {
        Alert.alert('Error', 'Failed to load performance summary');
      }
    } finally {
      if (showLoading) setPerformanceLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const token = (await storage.getToken()) || 'mock-token';

      if (mode === 'mantras') {
        const response = await mantraService.getAllMantras(token);
        if (response.status === 'success') {
          setMantras(response.data);
        }
        // Also load categories for the category picker in MantraForm
        const catResponse = await categoryService.getAllCategories(token);
        if (catResponse.status === 'success') {
          setCategories(catResponse.data.categories);
        }
      } else if (mode === 'categories') {
        const response = await categoryService.getAllCategories(token);
        if (response.status === 'success') {
          setCategories(response.data.categories);
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
    setSelectedCategoryIds([]);
    setEditingMantra(null);
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      description: '',
      category_type: '',
    });
    setEditingCategory(null);
  };

  const resetUserForm = () => {
    setUserForm({ username: '', email: '', password: '', confirmPassword: '' });
    setEditingUser(null);
    setUserSearchQuery('');
    setViewAllUsers(false);
  };

  const runWithSubmitting = async (action: () => Promise<void>) => {
    setSubmitting(true);
    try {
      await action();
    } finally {
      setSubmitting(false);
    }
  };

  const handleMantraFormChange = (field: string, value: string) => {
    setMantraForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCategoryFormChange = (field: string, value: string) => {
    setCategoryForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleCategory = (categoryId: number) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    );
  };

  const handleUserFormChange = (field: string, value: string) => {
    setUserForm((prev) => ({ ...prev, [field]: value }));
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
        const newMantra = response.data.mantra;
        // Link selected categories to the new mantra
        for (const categoryId of selectedCategoryIds) {
          await categoryService.addMantraToCategory(categoryId, newMantra.mantra_id, token);
        }
        setMantras([newMantra, ...mantras]);
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
        // Sync categories: get current, compute diff, add/remove
        const currentCatsRes = await categoryService.getCategoriesForMantra(
          editingMantra.mantra_id,
          token,
        );
        const currentCatIds =
          currentCatsRes.status === 'success'
            ? currentCatsRes.data.categories.map((c) => c.category_id)
            : [];

        const toAdd = selectedCategoryIds.filter((id) => !currentCatIds.includes(id));
        const toRemove = currentCatIds.filter((id) => !selectedCategoryIds.includes(id));

        for (const catId of toAdd) {
          await categoryService.addMantraToCategory(catId, editingMantra.mantra_id, token);
        }
        for (const catId of toRemove) {
          await categoryService.removeMantraFromCategory(catId, editingMantra.mantra_id, token);
        }

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

    if (userForm.password !== userForm.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    await runWithSubmitting(async () => {
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
      }
    });
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    await runWithSubmitting(async () => {
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
      }
    });
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

  const openEditMantra = async (mantra: Mantra) => {
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
    // Load existing categories for this mantra
    try {
      const token = (await storage.getToken()) || 'mock-token';
      const catRes = await categoryService.getCategoriesForMantra(mantra.mantra_id, token);
      if (catRes.status === 'success') {
        setSelectedCategoryIds(catRes.data.categories.map((c) => c.category_id));
      }
      // Also ensure all categories are loaded for the picker
      const allCatsRes = await categoryService.getAllCategories(token);
      if (allCatsRes.status === 'success') {
        setCategories(allCatsRes.data.categories);
      }
    } catch {
      setSelectedCategoryIds([]);
    }
    setEditModalVisible(true);
  };

  const openEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      username: user.username || '',
      email: user.email || '',
      password: '',
      confirmPassword: '',
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

  // ── Category Handlers ──

  const handleCreateCategory = async () => {
    if (!categoryForm.name.trim()) {
      Alert.alert('Error', 'Category name is required');
      return;
    }
    if (!categoryForm.category_type) {
      Alert.alert('Error', 'Please select a category layer');
      return;
    }

    setSubmitting(true);
    try {
      const token = (await storage.getToken()) || 'mock-token';
      const payload: any = { name: categoryForm.name };
      if (categoryForm.description) payload.description = categoryForm.description;
      if (categoryForm.category_type) payload.category_type = categoryForm.category_type;

      const response = await categoryService.createCategory(payload, token);

      if (response.status === 'success') {
        setCategories([response.data.category, ...categories]);
        resetCategoryForm();
        Alert.alert('Success', 'Category created successfully');
      }
    } catch (error) {
      console.error('Failed to create category:', error);
      Alert.alert('Error', 'Failed to create category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;

    setSubmitting(true);
    try {
      const token = (await storage.getToken()) || 'mock-token';
      const payload: any = {};
      if (categoryForm.name) payload.name = categoryForm.name;
      if (categoryForm.description) payload.description = categoryForm.description;
      if (categoryForm.category_type) payload.category_type = categoryForm.category_type;

      const response = await categoryService.updateCategory(
        editingCategory.category_id,
        payload,
        token,
      );

      if (response.status === 'success') {
        setCategories(
          categories.map((c) =>
            c.category_id === editingCategory.category_id ? response.data.category : c,
          ),
        );
        resetCategoryForm();
        setEditModalVisible(false);
        Alert.alert('Success', 'Category updated successfully');
      }
    } catch (error) {
      console.error('Failed to update category:', error);
      Alert.alert('Error', 'Failed to update category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    setDeletingId(categoryId);
    try {
      const token = (await storage.getToken()) || 'mock-token';
      await categoryService.deleteCategory(categoryId, token);
      setCategories(categories.filter((c) => c.category_id !== categoryId));
      Alert.alert('Success', 'Category deleted');
    } catch (error) {
      console.error('Failed to delete category:', error);
      Alert.alert('Error', 'Failed to delete category');
    } finally {
      setDeletingId(null);
    }
  };

  const openEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name || '',
      description: category.description || '',
      category_type: category.category_type || '',
    });
    setEditModalVisible(true);
  };

  const confirmDeleteCategory = (categoryId: number, name: string) => {
    Alert.alert('Delete Category', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void handleDeleteCategory(categoryId);
        },
      },
    ]);
  };

  /*
    // ── Feature Flag Handlers ──
  */

  const loadFeatureFlagsData = async () => {
    setFeaturesLoading(true);
    try {
      const token = (await storage.getToken()) || 'mock-token';
      const [flagsRes, usersRes] = await Promise.all([
        userService.listFeatureFlags(token),
        userService.getUsersWithFlags(token),
      ]);
      if (flagsRes.status === 'success') {
        setFeatureFlags(flagsRes.data.flags);
        if (!selectedFlagKey && flagsRes.data.flags.length > 0) {
          setSelectedFlagKey(flagsRes.data.flags[0].key);
        }
      }
      if (usersRes.status === 'success') {
        setUsersWithFlags(usersRes.data.users);
        setSelectedFeatureUserIds((prev) => {
          const validIds = new Set(usersRes.data.users.map((u) => u.user_id));
          return prev.filter((id) => validIds.has(id));
        });
      }
    } catch (error) {
      console.error('Failed to load feature flags data:', error);
      Alert.alert('Error', 'Failed to load feature flags data');
    } finally {
      setFeaturesLoading(false);
    }
  };

  const handleSetUserFlag = async (userId: number, flag: string, enabled: boolean) => {
    setFeatureSubmitting(true);
    try {
      const token = (await storage.getToken()) || 'mock-token';
      await userService.setUserFeatureFlag(userId, flag, enabled, token);
      await loadFeatureFlagsData();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to update user feature flag');
    } finally {
      setFeatureSubmitting(false);
    }
  };

  const handleToggleFeatureUserSelection = (userId: number) => {
    setSelectedFeatureUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const handleSelectAllFeatureUsers = (userIds: number[]) => {
    setSelectedFeatureUserIds(userIds);
  };

  const handleApplyFlagToSelectedUsers = async (flag: string, enabled: boolean) => {
    if (selectedFeatureUserIds.length === 0) {
      Alert.alert('No users selected', 'Select at least one user first.');
      return;
    }

    setFeatureSubmitting(true);
    try {
      const token = (await storage.getToken()) || 'mock-token';
      const results = await Promise.allSettled(
        selectedFeatureUserIds.map((userId) =>
          userService.setUserFeatureFlag(userId, flag, enabled, token),
        ),
      );

      const failedCount = results.filter((result) => result.status === 'rejected').length;
      await loadFeatureFlagsData();

      if (failedCount > 0) {
        Alert.alert('Partial success', `${failedCount} user update(s) failed.`);
      } else {
        Alert.alert('Success', `Updated ${selectedFeatureUserIds.length} selected user(s).`);
      }
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to update selected users');
    } finally {
      setFeatureSubmitting(false);
    }
  };

  const handleSetFlagForAllUsers = async (flag: string, enabled: boolean) => {
    Alert.alert(
      enabled ? 'Enable for all users?' : 'Disable for all users?',
      `This will ${enabled ? 'enable' : 'disable'} ${flag} for all users.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: enabled ? 'Enable All' : 'Disable All',
          style: enabled ? 'default' : 'destructive',
          onPress: () => {
            void (async () => {
              setFeatureSubmitting(true);
              try {
                const token = (await storage.getToken()) || 'mock-token';
                await userService.setFeatureFlagForAllUsers(flag, enabled, token);
                await loadFeatureFlagsData();
              } catch (error: any) {
                Alert.alert('Error', error?.response?.data?.message || 'Failed bulk update');
              } finally {
                setFeatureSubmitting(false);
              }
            })();
          },
        },
      ],
    );
  };

  const handleRollout = async (flag: string) => {
    const pct = Number(rolloutPercentage);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      Alert.alert('Error', 'Rollout percentage must be a number between 0 and 100');
      return;
    }
    setFeatureSubmitting(true);
    try {
      const token = (await storage.getToken()) || 'mock-token';
      await userService.rolloutFeatureFlagToPercentage(flag, pct, token);
      await loadFeatureFlagsData();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed rollout');
    } finally {
      setFeatureSubmitting(false);
    }
  };

  const handleExactRollout = async (flag: string) => {
    const pct = Number(rolloutPercentage);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      Alert.alert('Error', 'Rollout percentage must be a number between 0 and 100');
      return;
    }

    Alert.alert(
      'Set exact rollout?',
      `This may remove ${flag} from users outside the ${pct}% cohort.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Set Exact',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setFeatureSubmitting(true);
              try {
                const token = (await storage.getToken()) || 'mock-token';
                await userService.setExactFeatureFlagRolloutToPercentage(flag, pct, token);
                await loadFeatureFlagsData();
              } catch (error: any) {
                Alert.alert('Error', error?.response?.data?.message || 'Failed exact rollout');
              } finally {
                setFeatureSubmitting(false);
              }
            })();
          },
        },
      ],
    );
  };

  const formatPercentage = (value: number | null) =>
    typeof value === 'number' ? `${value.toFixed(1)}%` : 'N/A';

  const formatRate = (value: number) => `${value.toFixed(1)}%`;

  const formatMs = (value: number) => `${value.toFixed(1)} ms`;

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const getEditModalTitle = () => {
    if (mode === 'mantras') return 'Mantra';
    if (mode === 'categories') return 'Category';
    return 'User';
  };

  const renderEditForm = () => {
    if (mode === 'mantras') {
      return (
        <MantraForm
          formData={mantraForm}
          onFormChange={handleMantraFormChange}
          onSubmit={handleUpdateMantra}
          submitting={submitting}
          isEdit
          categories={categories}
          selectedCategoryIds={selectedCategoryIds}
          onToggleCategory={handleToggleCategory}
        />
      );
    }

    if (mode === 'categories') {
      return (
        <CategoryForm
          formData={categoryForm}
          onFormChange={handleCategoryFormChange}
          onSubmit={handleUpdateCategory}
          submitting={submitting}
          isEdit
        />
      );
    }

    return (
      <UserForm
        formData={userForm}
        onFormChange={handleUserFormChange}
        onSubmit={handleUpdateUser}
        submitting={submitting}
        isEdit
      />
    );
  };

  const categorySearch = categorySearchQuery.trim().toLowerCase();
  const hasCategorySearch = categorySearch.length > 0;
  const filteredCategories = hasCategorySearch
    ? categories.filter(
        (c) =>
          c.name?.toLowerCase().includes(categorySearch) ||
          c.description?.toLowerCase().includes(categorySearch),
      )
    : categories;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <View className="flex-1 px-6 pt-16 pb-6" style={{ backgroundColor: colors.primary }}>
        <AppText className="text-[28px] font-bold mb-4" style={{ color: colors.text }}>
          Admin
        </AppText>

        {/* Mode Toggle */}
        <View
          className="flex-row p-1 rounded-full mb-4"
          style={{ backgroundColor: `${colors.primaryDark}55` }}
        >
          {(
            [
              { key: 'mantras', label: 'Mantras' },
              { key: 'categories', label: 'Categories' },
              { key: 'users', label: 'Users' },
              { key: 'analytics', label: 'Analytics' },
              { key: 'features', label: 'Features' },
              { key: 'reports', label: 'Reports' },
            ] as const
          ).map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              className="flex-1 rounded-full py-3"
              onPress={() => {
                setMode(key);
                if (key !== 'analytics' && key !== 'features') {
                  setAction('add');
                  resetMantraForm();
                  resetUserForm();
                  resetCategoryForm();
                  setCategorySearchQuery('');
                }
              }}
              style={{ backgroundColor: mode === key ? colors.secondary : 'transparent' }}
            >
              <AppText
                className="text-center font-semibold text-xs"
                style={{ color: mode === key ? colors.primaryDark : colors.text }}
              >
                {label}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Action Toggle: Add vs Manage (hidden for analytics) */}
        {mode !== 'analytics' && mode !== 'features' && (
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
        )}

        {/* Content */}
        {mode === 'mantras' && action === 'add' && (
          <MantraForm
            formData={mantraForm}
            onFormChange={handleMantraFormChange}
            onSubmit={handleCreateMantra}
            submitting={submitting}
            categories={categories}
            selectedCategoryIds={selectedCategoryIds}
            onToggleCategory={handleToggleCategory}
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

        {mode === 'categories' && action === 'add' && (
          <CategoryForm
            formData={categoryForm}
            onFormChange={handleCategoryFormChange}
            onSubmit={handleCreateCategory}
            submitting={submitting}
          />
        )}

        {mode === 'categories' && action === 'manage' && (
          <View className="flex-1">
            <TextInput
              className="bg-black/30 text-white p-4 rounded-xl mb-4"
              placeholder="Search categories here"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={categorySearchQuery}
              onChangeText={setCategorySearchQuery}
            />
            <CategoryList
              categories={hasCategorySearch ? filteredCategories : categories}
              loading={loading}
              deletingId={deletingId}
              onEdit={openEditCategory}
              onDelete={confirmDeleteCategory}
            />
          </View>
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
          <View className="flex-1">
            <TextInput
              className="bg-black/30 text-white p-4 rounded-xl mb-4"
              placeholder="Search user here"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={userSearchQuery}
              onChangeText={setUserSearchQuery}
            />

            <TouchableOpacity
              className="mb-4 p-3 rounded-lg flex-row justify-center"
              style={{ backgroundColor: colors.secondary }}
              onPress={() => setViewAllUsers(!viewAllUsers)}
            >
              <AppText className="font-semibold" style={{ color: colors.primaryDark }}>
                {viewAllUsers ? 'Hide All Users' : 'View All Users'}
              </AppText>
            </TouchableOpacity>

            {(userSearchQuery.trim() !== '' || viewAllUsers) && (
              <UserList
                users={
                  viewAllUsers
                    ? users
                    : users.filter(
                        (u) =>
                          u.username?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                          u.email?.toLowerCase().includes(userSearchQuery.toLowerCase()),
                      )
                }
                loading={loading}
                deletingId={deletingId}
                onEdit={openEditUser}
                onDelete={confirmDeleteUser}
              />
            )}
          </View>
        )}

        {/* Feature Flags */}
        {mode === 'features' && (
          <FeatureFlagsPanel
            colors={colors}
            loading={featuresLoading}
            submitting={featureSubmitting}
            flags={featureFlags}
            selectedFlagKey={selectedFlagKey}
            rolloutPercentage={rolloutPercentage}
            userSearchQuery={featureUserSearchQuery}
            users={usersWithFlags}
            selectedUserIds={selectedFeatureUserIds}
            onSelectFlag={setSelectedFlagKey}
            onChangeRolloutPercentage={setRolloutPercentage}
            onApplyRollout={(flagKey) => {
              void handleRollout(flagKey);
            }}
            onApplyExactRollout={(flagKey) => {
              void handleExactRollout(flagKey);
            }}
            onEnableAll={(flagKey) => {
              void handleSetFlagForAllUsers(flagKey, true);
            }}
            onDisableAll={(flagKey) => {
              void handleSetFlagForAllUsers(flagKey, false);
            }}
            onToggleUserFlag={(userId, flagKey, enabled) => {
              void handleSetUserFlag(userId, flagKey, enabled);
            }}
            onToggleUserSelection={handleToggleFeatureUserSelection}
            onSelectAllUsers={handleSelectAllFeatureUsers}
            onClearUserSelection={() => setSelectedFeatureUserIds([])}
            onApplySelectedUsers={(flagKey, enabled) => {
              void handleApplyFlagToSelectedUsers(flagKey, enabled);
            }}
            onChangeUserSearchQuery={setFeatureUserSearchQuery}
          />
        )}

        {/* Message Reports */}
        {mode === 'reports' && <MessageReportList colors={colors} />}

        {/* Analytics */}
        {mode === 'analytics' && (
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* Days picker */}
            <View
              className="flex-row p-1 rounded-full mb-6"
              style={{ backgroundColor: `${colors.primaryDark}33` }}
            >
              {([7, 30, 90] as const).map((d) => (
                <TouchableOpacity
                  key={d}
                  className="flex-1 rounded-full py-2"
                  onPress={() => setAnalyticsDays(d)}
                  style={{
                    backgroundColor: analyticsDays === d ? colors.secondary : 'transparent',
                  }}
                >
                  <AppText
                    className="text-center font-semibold text-sm"
                    style={{ color: analyticsDays === d ? colors.primaryDark : colors.text }}
                  >
                    {d}d
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>

            {(() => {
              if (analyticsLoading) {
                return (
                  <ActivityIndicator
                    size="large"
                    color={colors.secondary}
                    style={{ marginTop: 40 }}
                  />
                );
              }

              if (!analytics) {
                return (
                  <AppText className="text-center mt-10" style={{ color: colors.text }}>
                    No analytics data available.
                  </AppText>
                );
              }

              return (
                <>
                  {/* Notification Effectiveness */}
                  <AppText className="text-white text-lg font-bold mb-3">
                    Notification Effectiveness
                  </AppText>
                  <View className="flex-row flex-wrap gap-3 mb-6">
                    {[
                      { label: 'Sent', value: String(analytics.notification_effectiveness.sent) },
                      { label: 'Taps', value: String(analytics.notification_effectiveness.taps) },
                      {
                        label: 'Tap-Through',
                        value: formatPercentage(
                          analytics.notification_effectiveness.tap_through_rate_pct,
                        ),
                      },
                      {
                        label: 'Post-Tap Conv.',
                        value: formatPercentage(
                          analytics.notification_effectiveness.post_tap_conversion_rate_pct,
                        ),
                      },
                    ].map(({ label, value }) => (
                      <View
                        key={label}
                        className="rounded-2xl p-4"
                        style={{
                          backgroundColor: `${colors.primaryDark}55`,
                          minWidth: '45%',
                          flex: 1,
                        }}
                      >
                        <AppText className="text-white text-2xl font-bold">{value}</AppText>
                        <AppText className="text-sm" style={{ color: colors.text }}>
                          {label}
                        </AppText>
                      </View>
                    ))}
                  </View>

                  {/* Taps by hour */}
                  {analytics.tap_by_hour.length > 0 && (
                    <>
                      <AppText className="text-white text-lg font-bold mb-3">
                        Taps by Hour (UTC)
                      </AppText>
                      <View
                        className="mb-6 rounded-2xl p-4"
                        style={{ backgroundColor: `${colors.primaryDark}55` }}
                      >
                        {(() => {
                          const max = Math.max(...analytics.tap_by_hour.map((r) => r.count), 1);
                          return analytics.tap_by_hour.map(({ hour, count }) => (
                            <View key={hour} className="flex-row items-center mb-2">
                              <AppText className="text-white w-8 text-xs">
                                {String(hour).padStart(2, '0')}h
                              </AppText>
                              <View
                                className="flex-1 mx-2 h-4 rounded-full"
                                style={{ backgroundColor: `${colors.primaryDark}88` }}
                              >
                                <View
                                  className="h-4 rounded-full"
                                  style={{
                                    width: `${(count / max) * 100}%`,
                                    backgroundColor: colors.secondary,
                                  }}
                                />
                              </View>
                              <AppText className="text-white text-xs w-6 text-right">
                                {count}
                              </AppText>
                            </View>
                          ));
                        })()}
                      </View>
                    </>
                  )}

                  {/* Adaptive Timing */}
                  <AppText className="text-white text-lg font-bold mb-3">Adaptive Timing</AppText>
                  <View className="flex-row gap-3 mb-6">
                    <View
                      className="flex-1 rounded-2xl p-4"
                      style={{ backgroundColor: `${colors.primaryDark}55` }}
                    >
                      <AppText className="text-white text-2xl font-bold">
                        {analytics.adaptive_timing.users_with_optimal_hour}
                      </AppText>
                      <AppText className="text-sm" style={{ color: colors.text }}>
                        Personalised
                      </AppText>
                    </View>
                    <View
                      className="flex-1 rounded-2xl p-4"
                      style={{ backgroundColor: `${colors.primaryDark}55` }}
                    >
                      <AppText className="text-white text-2xl font-bold">
                        {analytics.adaptive_timing.users_using_default}
                      </AppText>
                      <AppText className="text-sm" style={{ color: colors.text }}>
                        Default (9 AM)
                      </AppText>
                    </View>
                  </View>

                  {/* Event counts */}
                  <AppText className="text-white text-lg font-bold mb-3">Event Breakdown</AppText>
                  <View
                    className="rounded-2xl p-4 mb-8"
                    style={{ backgroundColor: `${colors.primaryDark}55` }}
                  >
                    {Object.entries(analytics.event_counts).length === 0 ? (
                      <AppText style={{ color: colors.text }}>
                        No events recorded in this window.
                      </AppText>
                    ) : (
                      Object.entries(analytics.event_counts)
                        .sort(([, a], [, b]) => b - a)
                        .map(([type, count]) => (
                          <View
                            key={type}
                            className="flex-row justify-between py-2 border-b border-white/10"
                          >
                            <AppText className="text-white text-sm">
                              {type.replaceAll('_', ' ')}
                            </AppText>
                            <AppText className="font-bold" style={{ color: colors.secondary }}>
                              {count}
                            </AppText>
                          </View>
                        ))
                    )}
                  </View>

                  {/* Performance Monitoring */}
                  <View className="flex-row items-center justify-between mb-3">
                    <AppText className="text-white text-lg font-bold">
                      Performance Monitoring
                    </AppText>
                    <TouchableOpacity
                      className="px-3 py-2 rounded-full"
                      onPress={() => {
                        void loadPerformanceSummary(true);
                      }}
                      style={{ backgroundColor: `${colors.secondary}cc` }}
                    >
                      <AppText
                        className="text-xs font-semibold"
                        style={{ color: colors.primaryDark }}
                      >
                        Refresh
                      </AppText>
                    </TouchableOpacity>
                  </View>

                  {performanceLoading && (
                    <ActivityIndicator
                      size="small"
                      color={colors.secondary}
                      style={{ marginBottom: 16 }}
                    />
                  )}

                  {!performanceLoading && !performanceSummary && (
                    <View
                      className="rounded-2xl p-4 mb-6"
                      style={{ backgroundColor: `${colors.primaryDark}55` }}
                    >
                      <AppText style={{ color: colors.text }}>
                        No performance summary available yet.
                      </AppText>
                    </View>
                  )}

                  {performanceSummary && (
                    <>
                      <View className="flex-row flex-wrap gap-3 mb-6">
                        {(() => {
                          const totalCount = performanceSummary.by_metric.reduce(
                            (sum, metric) => sum + metric.count,
                            0,
                          );
                          const totalErrors = performanceSummary.by_metric.reduce(
                            (sum, metric) => sum + metric.error_count,
                            0,
                          );
                          const totalSlow = performanceSummary.by_metric.reduce(
                            (sum, metric) => sum + metric.slow_count,
                            0,
                          );
                          const overallErrorRate =
                            totalCount > 0 ? (totalErrors / totalCount) * 100 : 0;

                          return [
                            {
                              label: 'P50',
                              value: formatMs(performanceSummary.recent_stats.p50_ms),
                            },
                            {
                              label: 'P95',
                              value: formatMs(performanceSummary.recent_stats.p95_ms),
                            },
                            {
                              label: 'P99',
                              value: formatMs(performanceSummary.recent_stats.p99_ms),
                            },
                            {
                              label: 'Error Rate',
                              value: formatRate(overallErrorRate),
                            },
                            {
                              label: 'Slow Events',
                              value: String(totalSlow),
                            },
                            {
                              label: 'Buffer',
                              value: String(performanceSummary.buffer_size),
                            },
                          ].map(({ label, value }) => (
                            <View
                              key={label}
                              className="rounded-2xl p-4"
                              style={{
                                backgroundColor: `${colors.primaryDark}55`,
                                minWidth: '45%',
                                flex: 1,
                              }}
                            >
                              <AppText className="text-white text-xl font-bold">{value}</AppText>
                              <AppText className="text-sm" style={{ color: colors.text }}>
                                {label}
                              </AppText>
                            </View>
                          ));
                        })()}
                      </View>

                      <AppText className="text-white text-base font-semibold mb-3">
                        Trend (latest snapshots)
                      </AppText>
                      <View
                        className="rounded-2xl p-4 mb-6"
                        style={{ backgroundColor: `${colors.primaryDark}55` }}
                      >
                        {performanceSnapshots.length <= 1 && (
                          <AppText style={{ color: colors.text }}>
                            Waiting for more snapshots to display trend.
                          </AppText>
                        )}

                        {performanceSnapshots.length > 1 && (
                          <>
                            {[
                              {
                                label: 'P95 Latency',
                                field: 'p95' as const,
                                formatter: (v: number) => formatMs(v),
                              },
                              {
                                label: 'Error Rate',
                                field: 'errorRate' as const,
                                formatter: (v: number) => formatRate(v),
                              },
                              {
                                label: 'Slow Events',
                                field: 'slowEvents' as const,
                                formatter: (v: number) => String(Math.round(v)),
                              },
                            ].map((trend) => {
                              const values = performanceSnapshots.map((s) => s[trend.field]);
                              const max = Math.max(...values, 1);

                              return (
                                <View key={trend.label} className="mb-4">
                                  <View className="flex-row justify-between mb-2">
                                    <AppText className="text-white text-sm font-semibold">
                                      {trend.label}
                                    </AppText>
                                    <AppText style={{ color: colors.text }} className="text-xs">
                                      Latest: {trend.formatter(values[values.length - 1])}
                                    </AppText>
                                  </View>
                                  <View
                                    className="flex-row items-end"
                                    style={{ height: 44, gap: 4 }}
                                  >
                                    {performanceSnapshots.map((point) => {
                                      const rawValue = point[trend.field];
                                      const barHeight = Math.max(4, (rawValue / max) * 40);
                                      return (
                                        <View
                                          key={`${trend.label}-${point.at}`}
                                          style={{ flex: 1, alignItems: 'center' }}
                                        >
                                          <View
                                            style={{
                                              width: '100%',
                                              height: barHeight,
                                              backgroundColor: colors.secondary,
                                              borderRadius: 999,
                                            }}
                                          />
                                        </View>
                                      );
                                    })}
                                  </View>
                                </View>
                              );
                            })}

                            <View className="flex-row justify-between mt-1">
                              <AppText className="text-xs" style={{ color: colors.text }}>
                                {formatTime(performanceSnapshots[0].at)}
                              </AppText>
                              <AppText className="text-xs" style={{ color: colors.text }}>
                                {formatTime(
                                  performanceSnapshots[performanceSnapshots.length - 1].at,
                                )}
                              </AppText>
                            </View>
                          </>
                        )}
                      </View>

                      <AppText className="text-white text-base font-semibold mb-3">
                        Top Metrics by Request Volume
                      </AppText>
                      <View
                        className="rounded-2xl p-4 mb-8"
                        style={{ backgroundColor: `${colors.primaryDark}55` }}
                      >
                        {performanceSummary.by_metric.length === 0 ? (
                          <AppText style={{ color: colors.text }}>
                            No performance metrics recorded yet.
                          </AppText>
                        ) : (
                          performanceSummary.by_metric
                            .slice()
                            .sort((a, b) => b.count - a.count)
                            .slice(0, 8)
                            .map((metric) => (
                              <View key={metric.key} className="py-2 border-b border-white/10">
                                <AppText className="text-white text-xs mb-1">{metric.key}</AppText>
                                <View className="flex-row justify-between">
                                  <AppText className="text-xs" style={{ color: colors.text }}>
                                    Count: {metric.count}
                                  </AppText>
                                  <AppText className="text-xs" style={{ color: colors.text }}>
                                    Avg: {formatMs(metric.avg_duration_ms)}
                                  </AppText>
                                  <AppText className="text-xs" style={{ color: colors.text }}>
                                    Err: {formatRate(metric.error_rate * 100)}
                                  </AppText>
                                </View>
                              </View>
                            ))
                        )}
                      </View>
                    </>
                  )}
                </>
              );
            })()}
          </ScrollView>
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
                Edit {getEditModalTitle()}
              </AppText>
              <TouchableOpacity
                onPress={() => {
                  setEditModalVisible(false);
                  resetMantraForm();
                  resetUserForm();
                  resetCategoryForm();
                }}
              >
                <AppText className="text-white text-2xl">✕</AppText>
              </TouchableOpacity>
            </View>

            {renderEditForm()}
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
};

export default AdminScreen;
