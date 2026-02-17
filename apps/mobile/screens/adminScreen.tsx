import React, { useEffect, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TextInput,
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

type AdminMode = 'mantras' | 'users' | 'categories';
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
    image_url: '',
  });

  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [viewAllUsers, setViewAllUsers] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');

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
      image_url: '',
    });
    setEditingCategory(null);
  };

  const resetUserForm = () => {
    setUserForm({ username: '', email: '', password: '', confirmPassword: '' });
    setEditingUser(null);
    setUserSearchQuery('');
    setViewAllUsers(false);
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
      if (categoryForm.image_url) payload.image_url = categoryForm.image_url;

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
      if (categoryForm.image_url) payload.image_url = categoryForm.image_url;

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
      image_url: category.image_url || '',
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <View className="flex-1 px-6 pt-16 pb-6" style={{ backgroundColor: colors.primary }}>
        <AppText className="text-white text-3xl font-bold mb-4">Admin Controls</AppText>

        {/* Mode Toggle: Mantras vs Users vs Categories */}
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
              resetCategoryForm();
              setCategorySearchQuery('');
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
              setMode('categories');
              setAction('add');
              resetMantraForm();
              resetUserForm();
              resetCategoryForm();
              setCategorySearchQuery('');
            }}
            style={{ backgroundColor: mode === 'categories' ? colors.secondary : 'transparent' }}
          >
            <AppText
              className="text-center font-semibold"
              style={{ color: mode === 'categories' ? colors.primaryDark : colors.text }}
            >
              Categories
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 rounded-full px-4 py-3"
            onPress={() => {
              setMode('users');
              setAction('add');
              resetMantraForm();
              resetUserForm();
              resetCategoryForm();
              setCategorySearchQuery('');
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

            {categorySearchQuery.trim() !== '' ? (
              <CategoryList
                categories={categories.filter(
                  (c) =>
                    c.name?.toLowerCase().includes(categorySearchQuery.toLowerCase()) ||
                    c.description?.toLowerCase().includes(categorySearchQuery.toLowerCase()),
                )}
                loading={loading}
                deletingId={deletingId}
                onEdit={openEditCategory}
                onDelete={confirmDeleteCategory}
              />
            ) : (
              <CategoryList
                categories={categories}
                loading={loading}
                deletingId={deletingId}
                onEdit={openEditCategory}
                onDelete={confirmDeleteCategory}
              />
            )}
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

        {/* Edit Modal */}
        <Modal
          visible={editModalVisible}
          animationType="slide"
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View className="flex-1 px-6 pt-16 pb-6" style={{ backgroundColor: colors.primary }}>
            <View className="flex-row justify-between items-center mb-6">
              <AppText className="text-white text-2xl font-bold">
                Edit {mode === 'mantras' ? 'Mantra' : mode === 'categories' ? 'Category' : 'User'}
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

            {mode === 'mantras' ? (
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
            ) : mode === 'categories' ? (
              <CategoryForm
                formData={categoryForm}
                onFormChange={handleCategoryFormChange}
                onSubmit={handleUpdateCategory}
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
