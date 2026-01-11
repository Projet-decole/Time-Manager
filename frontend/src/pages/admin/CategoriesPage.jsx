// frontend/src/pages/admin/CategoriesPage.jsx
// Story 3.8: Admin Management UI - Categories

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Alert, AlertDescription } from '../../components/ui/Alert';
import { CategoriesList } from '../../components/features/categories/CategoriesList';
import { CategoryForm } from '../../components/features/categories/CategoryForm';
import { useCategories } from '../../hooks/useCategories';

/**
 * Admin Categories Page - Manage time categories
 * Story 3.8: Admin Management UI - Categories
 * Requires manager role (protected by RoleProtectedRoute)
 */
export default function CategoriesPage() {
  // Filter state
  const [showInactive, setShowInactive] = useState(false);

  // Categories data
  const {
    categories,
    loading,
    error,
    refetch,
    createCategory,
    updateCategory,
    deactivateCategory,
    activateCategory
  } = useCategories({ includeInactive: showInactive });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success message
  const [successMessage, setSuccessMessage] = useState(null);

  // Confirmation dialog state
  const [confirmAction, setConfirmAction] = useState(null);

  /**
   * Show success message temporarily
   */
  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  /**
   * Handle filter toggle
   */
  const handleToggleInactive = () => {
    const newValue = !showInactive;
    setShowInactive(newValue);
    refetch(newValue);
  };

  /**
   * Open create modal
   */
  const handleOpenCreate = () => {
    setEditingCategory(null);
    setModalError(null);
    setIsModalOpen(true);
  };

  /**
   * Open edit modal
   */
  const handleEdit = (category) => {
    setEditingCategory(category);
    setModalError(null);
    setIsModalOpen(true);
  };

  /**
   * Close modal
   */
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setModalError(null);
  };

  /**
   * Handle form submission (create or update)
   */
  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    setModalError(null);

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData);
        showSuccess('Categorie modifiee avec succes');
      } else {
        await createCategory(formData);
        showSuccess('Categorie creee avec succes');
      }
      handleCloseModal();
    } catch (err) {
      if (err.code === 'DUPLICATE_NAME') {
        setModalError('Une categorie avec ce nom existe deja');
      } else if (err.code === 'VALIDATION_ERROR') {
        setModalError(err.message || 'Donnees invalides');
      } else {
        setModalError(err.message || 'Erreur lors de l\'operation');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle deactivate action
   */
  const handleDeactivate = useCallback((category) => {
    setConfirmAction({
      type: 'deactivate',
      category,
      message: `Voulez-vous vraiment desactiver la categorie "${category.name}" ?`
    });
  }, []);

  /**
   * Handle activate action
   */
  const handleActivate = useCallback((category) => {
    setConfirmAction({
      type: 'activate',
      category,
      message: `Voulez-vous vraiment activer la categorie "${category.name}" ?`
    });
  }, []);

  /**
   * Confirm action execution
   */
  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    const { type, category } = confirmAction;
    setConfirmAction(null);

    try {
      if (type === 'deactivate') {
        await deactivateCategory(category.id);
        showSuccess('Categorie desactivee avec succes');
      } else if (type === 'activate') {
        await activateCategory(category.id);
        showSuccess('Categorie activee avec succes');
      }
    } catch (err) {
      setSuccessMessage(null);
      // Show error in an alert or toast
      console.error('Action failed:', err);
    }
  };

  /**
   * Cancel confirmation
   */
  const handleCancelConfirm = () => {
    setConfirmAction(null);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle>Gestion des categories</CardTitle>
            <div className="flex items-center gap-4">
              {/* Show Inactive Toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={handleToggleInactive}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">Afficher les inactifs</span>
              </label>

              {/* Create Button */}
              <Button onClick={handleOpenCreate}>
                Nouvelle categorie
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Success Message */}
          {successMessage && (
            <Alert variant="success" className="mb-4">
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Categories List */}
          <CategoriesList
            categories={categories}
            loading={loading}
            onEdit={handleEdit}
            onDeactivate={handleDeactivate}
            onActivate={handleActivate}
          />
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <CategoryForm
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleFormSubmit}
        category={editingCategory}
        isLoading={isSubmitting}
        error={modalError}
      />

      {/* Confirmation Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={handleCancelConfirm} />
          <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-lg shadow-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirmation
            </h3>
            <p className="text-gray-600 mb-6">
              {confirmAction.message}
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleCancelConfirm}>
                Annuler
              </Button>
              <Button
                variant={confirmAction.type === 'deactivate' ? 'destructive' : 'default'}
                onClick={handleConfirmAction}
              >
                {confirmAction.type === 'deactivate' ? 'Desactiver' : 'Activer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
