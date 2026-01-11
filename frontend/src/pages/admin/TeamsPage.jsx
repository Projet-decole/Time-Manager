// frontend/src/pages/admin/TeamsPage.jsx
// Story 3.6: Admin Management UI - Teams

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Alert, AlertDescription } from '../../components/ui/Alert';
import { Modal } from '../../components/ui/Modal';
import { useTeams } from '../../hooks/useTeams';
import { TeamsList, TeamFormComplete } from '../../components/features/teams';

/**
 * TeamsPage - Main page for team management
 * Story 3.6: Admin Management UI - Teams
 *
 * Features:
 * - List all teams with member count
 * - Create new team
 * - Edit existing team
 * - Delete team with confirmation
 * - View team details (members and projects) in side panel
 *
 * Access: Manager only (protected by RoleProtectedRoute)
 */
export default function TeamsPage() {
  const {
    teams,
    loading,
    error,
    pagination,
    deleteTeam,
    refresh,
    goToPage
  } = useTeams();

  // Modal states
  const [isFormOpen, setFormOpen] = useState(false);
  const [managingTeam, setManagingTeam] = useState(null);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);

  // Action states
  const [isSubmitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  // Clear success message after delay
  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // ========== CREATE/MANAGE HANDLERS ==========

  const handleOpenCreate = () => {
    setManagingTeam(null);
    setFormOpen(true);
  };

  const handleOpenManage = (team) => {
    setManagingTeam(team);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setManagingTeam(null);
  };

  const handleFormSave = useCallback(() => {
    const isUpdate = !!managingTeam;
    showSuccess(isUpdate ? 'Equipe mise a jour' : 'Equipe creee');
    setFormOpen(false);
    setManagingTeam(null);
    refresh();
  }, [managingTeam, refresh]);

  // ========== DELETE HANDLERS ==========

  const handleOpenDelete = (team) => {
    setTeamToDelete(team);
    setDeleteDialogOpen(true);
  };

  const handleCloseDelete = () => {
    setDeleteDialogOpen(false);
    setTeamToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!teamToDelete) return;

    setSubmitting(true);

    try {
      await deleteTeam(teamToDelete.id);
      showSuccess('Equipe supprimee avec succes');
      handleCloseDelete();
    } catch {
      // Error handled by hook
    } finally {
      setSubmitting(false);
    }
  };

  // ========== ROW CLICK HANDLER ==========

  const handleRowClick = (team) => {
    // Open manage form when clicking on a row
    handleOpenManage(team);
  };

  // ========== PAGINATION HANDLERS ==========

  const handlePreviousPage = () => {
    if (pagination.page > 1) {
      goToPage(pagination.page - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      goToPage(pagination.page + 1);
    }
  };

  const showPagination = pagination.totalPages > 1;

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle>Gestion des equipes</CardTitle>
            <Button onClick={handleOpenCreate}>
              Nouvelle equipe
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Success message */}
          {successMessage && (
            <Alert variant="success" className="mb-4">
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          {/* Error message */}
          {error && (
            <Alert variant="error" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Teams list */}
          <TeamsList
            teams={teams}
            loading={loading}
            onRowClick={handleRowClick}
            onManage={handleOpenManage}
            onDelete={handleOpenDelete}
          />

          {/* Pagination */}
          {showPagination && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-gray-600 space-x-2">
                <span>{pagination.total} equipes</span>
                <span>-</span>
                <span>Page {pagination.page} sur {pagination.totalPages}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={pagination.page <= 1}
                >
                  Precedent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Manage Team Modal */}
      <TeamFormComplete
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSave={handleFormSave}
        team={managingTeam}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDelete}
        title="Supprimer l'equipe"
      >
        <p className="text-gray-600 mb-6">
          Voulez-vous vraiment supprimer l'equipe "{teamToDelete?.name}" ?
          <br />
          <span className="text-sm text-gray-500">
            Cette action est irreversible.
          </span>
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleCloseDelete}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmDelete}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Suppression...' : 'Supprimer'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
