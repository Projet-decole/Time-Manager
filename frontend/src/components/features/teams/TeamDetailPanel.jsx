// frontend/src/components/features/teams/TeamDetailPanel.jsx
// Story 3.6: Team detail side panel with members and projects

import { useState } from 'react';
import { Sheet, SheetSection } from '../../ui/Sheet';
import { Button } from '../../ui/Button';
import { Alert, AlertDescription } from '../../ui/Alert';
import { Modal } from '../../ui/Modal';
import { useTeamDetails } from '../../../hooks/useTeams';
import { MemberSelector } from './MemberSelector';
import { ProjectSelector } from './ProjectSelector';

/**
 * TeamDetailPanel - Side panel showing team details, members, and projects
 * Story 3.6: AC5 - Team Detail Panel, AC6 - Add Member, AC7 - Remove Member, AC8 - Assign/Unassign Project
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the panel is open
 * @param {Function} props.onClose - Callback to close the panel
 * @param {Object} props.team - Team object with basic info
 * @param {Function} [props.onTeamUpdated] - Callback when team data changes (to refresh list)
 */
export function TeamDetailPanel({
  isOpen,
  onClose,
  team,
  onTeamUpdated
}) {
  const {
    members,
    projects,
    loading,
    error,
    addMember,
    removeMember,
    assignProject,
    unassignProject
  } = useTeamDetails(team?.id);

  // Modal states
  const [isMemberSelectorOpen, setMemberSelectorOpen] = useState(false);
  const [isProjectSelectorOpen, setProjectSelectorOpen] = useState(false);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Clear messages after delay
  const showSuccess = (message) => {
    setSuccessMessage(message);
    setActionError(null);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Handle adding a member
  const handleAddMember = async (user) => {
    setActionLoading(true);
    setActionError(null);

    try {
      await addMember(user.id);
      setMemberSelectorOpen(false);
      showSuccess(`${user.firstName} ${user.lastName} ajoute a l'equipe`);
      onTeamUpdated?.();
    } catch (err) {
      setActionError(err.message || 'Erreur lors de l\'ajout du membre');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle removing a member
  const handleRemoveMember = async () => {
    if (!confirmAction?.userId) return;

    setActionLoading(true);
    setActionError(null);

    try {
      await removeMember(confirmAction.userId);
      setConfirmOpen(false);
      setConfirmAction(null);
      showSuccess('Membre retire de l\'equipe');
      onTeamUpdated?.();
    } catch (err) {
      setActionError(err.message || 'Erreur lors du retrait du membre');
      setConfirmOpen(false);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle assigning a project
  const handleAssignProject = async (project) => {
    setActionLoading(true);
    setActionError(null);

    try {
      await assignProject(project.id);
      setProjectSelectorOpen(false);
      showSuccess(`Projet "${project.name}" assigne a l'equipe`);
    } catch (err) {
      setActionError(err.message || 'Erreur lors de l\'assignation du projet');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle unassigning a project
  const handleUnassignProject = async () => {
    if (!confirmAction?.projectId) return;

    setActionLoading(true);
    setActionError(null);

    try {
      await unassignProject(confirmAction.projectId);
      setConfirmOpen(false);
      setConfirmAction(null);
      showSuccess('Projet retire de l\'equipe');
    } catch (err) {
      setActionError(err.message || 'Erreur lors du retrait du projet');
      setConfirmOpen(false);
    } finally {
      setActionLoading(false);
    }
  };

  // Open confirmation modal for remove actions
  const openRemoveMemberConfirm = (user) => {
    setConfirmAction({
      type: 'removeMember',
      userId: user.id,
      name: `${user.firstName} ${user.lastName}`
    });
    setConfirmOpen(true);
  };

  const openUnassignProjectConfirm = (project) => {
    setConfirmAction({
      type: 'unassignProject',
      projectId: project.id,
      name: project.name
    });
    setConfirmOpen(true);
  };

  // Handle confirm action
  const handleConfirm = () => {
    if (confirmAction?.type === 'removeMember') {
      handleRemoveMember();
    } else if (confirmAction?.type === 'unassignProject') {
      handleUnassignProject();
    }
  };

  const handleClose = () => {
    setActionError(null);
    setSuccessMessage(null);
    onClose();
  };

  if (!team) return null;

  const memberIds = members.map((m) => m.id);
  const projectIds = projects.map((p) => p.id);

  return (
    <>
      <Sheet
        isOpen={isOpen}
        onClose={handleClose}
        title={team.name}
        description={team.description}
      >
        {/* Messages */}
        {actionError && (
          <Alert variant="error" className="mb-4">
            <AlertDescription>{actionError}</AlertDescription>
          </Alert>
        )}
        {successMessage && (
          <Alert variant="success" className="mb-4">
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="error" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Members Section */}
            <SheetSection>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-700">
                  Membres ({members.length})
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMemberSelectorOpen(true)}
                >
                  Ajouter
                </Button>
              </div>

              {members.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">
                  Aucun membre dans cette equipe
                </p>
              ) : (
                <ul className="divide-y divide-gray-200 border rounded-md">
                  {members.map((member) => (
                    <li
                      key={member.id}
                      className="flex items-center justify-between px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{member.email}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => openRemoveMemberConfirm(member)}
                      >
                        Retirer
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </SheetSection>

            {/* Projects Section */}
            <SheetSection>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-700">
                  Projets ({projects.length})
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setProjectSelectorOpen(true)}
                >
                  Assigner
                </Button>
              </div>

              {projects.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">
                  Aucun projet assigne a cette equipe
                </p>
              ) : (
                <ul className="divide-y divide-gray-200 border rounded-md">
                  {projects.map((project) => (
                    <li
                      key={project.id}
                      className="flex items-center justify-between px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{project.name}</p>
                        {project.code && (
                          <p className="text-sm text-gray-500">
                            Code: {project.code}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => openUnassignProjectConfirm(project)}
                      >
                        Retirer
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </SheetSection>
          </div>
        )}
      </Sheet>

      {/* Member Selector Modal */}
      <MemberSelector
        isOpen={isMemberSelectorOpen}
        onClose={() => setMemberSelectorOpen(false)}
        onSelect={handleAddMember}
        excludeUserIds={memberIds}
        isLoading={actionLoading}
        error={actionError}
      />

      {/* Project Selector Modal */}
      <ProjectSelector
        isOpen={isProjectSelectorOpen}
        onClose={() => setProjectSelectorOpen(false)}
        onSelect={handleAssignProject}
        excludeProjectIds={projectIds}
        isLoading={actionLoading}
        error={actionError}
      />

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setConfirmAction(null);
        }}
        title="Confirmation"
      >
        <p className="text-gray-600 mb-6">
          {confirmAction?.type === 'removeMember'
            ? `Voulez-vous vraiment retirer ${confirmAction.name} de l'equipe ?`
            : `Voulez-vous vraiment retirer le projet "${confirmAction?.name}" de l'equipe ?`
          }
        </p>
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => {
              setConfirmOpen(false);
              setConfirmAction(null);
            }}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={actionLoading}
          >
            {actionLoading ? 'Suppression...' : 'Confirmer'}
          </Button>
        </div>
      </Modal>
    </>
  );
}

export default TeamDetailPanel;
