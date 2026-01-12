// frontend/src/components/features/teams/TeamFormComplete.jsx
// Enhanced team form with members and projects management

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { Textarea } from '../../ui/Textarea';
import { Alert, AlertDescription } from '../../ui/Alert';
import { teamsService } from '../../../services/teamsService';
import { usersService } from '../../../services/usersService';
import { projectsService } from '../../../services/projectsService';

/**
 * TeamFormComplete - Full team management modal
 * Allows creating/editing teams with members and projects in one place
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Callback to close the modal
 * @param {Function} props.onSave - Callback when team is saved (receives team data)
 * @param {Object} [props.team] - Team data for edit mode (null for create mode)
 */
export function TeamFormComplete({
  isOpen,
  onClose,
  onSave,
  team = null
}) {
  const isEditMode = !!team;
  const title = isEditMode ? `Gerer l'equipe: ${team.name}` : 'Nouvelle equipe';

  // Form state
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: { name: '', description: '' }
  });

  // Data states
  const [availableUsers, setAvailableUsers] = useState([]);
  const [availableProjects, setAvailableProjects] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);

  // UI states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('info');

  // Search states
  const [memberSearch, setMemberSearch] = useState('');
  const [projectSearch, setProjectSearch] = useState('');

  // Load data when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      setActiveTab('info');
      setMemberSearch('');
      setProjectSearch('');

      try {
        // Load available users and projects
        const [usersRes, projectsRes] = await Promise.all([
          usersService.getAll({ limit: 100 }),
          projectsService.getAll({ limit: 100 })
        ]);

        if (usersRes.success) {
          setAvailableUsers(usersRes.data || []);
        }
        if (projectsRes.success) {
          setAvailableProjects(projectsRes.data || []);
        }

        // If editing, load current team members and projects
        if (team?.id) {
          const [membersRes, teamProjectsRes] = await Promise.all([
            teamsService.getMembers(team.id),
            teamsService.getProjects(team.id)
          ]);

          if (membersRes.success) {
            // Extract user data from nested structure
            const members = (membersRes.data || [])
              .filter(m => m.user)
              .map(m => ({
                id: m.user.id || m.userId,
                firstName: m.user.firstName || '',
                lastName: m.user.lastName || '',
                email: m.user.email || ''
              }));
            setSelectedMembers(members);
          }

          if (teamProjectsRes.success) {
            // Extract project data from nested structure
            const projects = (teamProjectsRes.data || [])
              .filter(tp => tp.project)
              .map(tp => ({
                id: tp.project.id || tp.projectId,
                name: tp.project.name || '',
                code: tp.project.code || ''
              }));
            setSelectedProjects(projects);
          }

          reset({
            name: team.name || '',
            description: team.description || ''
          });
        } else {
          setSelectedMembers([]);
          setSelectedProjects([]);
          reset({ name: '', description: '' });
        }
      } catch {
        setError('Erreur lors du chargement des donnees');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, team, reset]);

  // Filter available users (not already selected)
  const filteredAvailableUsers = useMemo(() => {
    const selectedIds = new Set(selectedMembers.map(m => m.id));
    return availableUsers
      .filter(u => !selectedIds.has(u.id))
      .filter(u => {
        if (!memberSearch) return true;
        const search = memberSearch.toLowerCase();
        const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
        return fullName.includes(search) || u.email.toLowerCase().includes(search);
      });
  }, [availableUsers, selectedMembers, memberSearch]);

  // Filter available projects (not already selected)
  const filteredAvailableProjects = useMemo(() => {
    const selectedIds = new Set(selectedProjects.map(p => p.id));
    return availableProjects
      .filter(p => !selectedIds.has(p.id))
      .filter(p => {
        if (!projectSearch) return true;
        const search = projectSearch.toLowerCase();
        return p.name.toLowerCase().includes(search) ||
               (p.code && p.code.toLowerCase().includes(search));
      });
  }, [availableProjects, selectedProjects, projectSearch]);

  // Add member to selection
  const handleAddMember = useCallback((user) => {
    setSelectedMembers(prev => [...prev, {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email
    }]);
  }, []);

  // Remove member from selection
  const handleRemoveMember = useCallback((userId) => {
    setSelectedMembers(prev => prev.filter(m => m.id !== userId));
  }, []);

  // Add project to selection
  const handleAddProject = useCallback((project) => {
    setSelectedProjects(prev => [...prev, {
      id: project.id,
      name: project.name,
      code: project.code
    }]);
  }, []);

  // Remove project from selection
  const handleRemoveProject = useCallback((projectId) => {
    setSelectedProjects(prev => prev.filter(p => p.id !== projectId));
  }, []);

  // Handle form submission
  const handleFormSubmit = async (formData) => {
    setSaving(true);
    setError(null);

    try {
      let savedTeam;

      if (isEditMode) {
        // Update team info
        const updateRes = await teamsService.update(team.id, {
          name: formData.name.trim(),
          description: formData.description?.trim() || ''
        });
        if (!updateRes.success) throw new Error('Erreur lors de la mise a jour');
        savedTeam = updateRes.data;

        // Sync members: get current, compare, add/remove as needed
        const currentMembersRes = await teamsService.getMembers(team.id);
        const currentMemberIds = new Set(
          (currentMembersRes.data || [])
            .filter(m => m.user)
            .map(m => m.user.id || m.userId)
        );
        const newMemberIds = new Set(selectedMembers.map(m => m.id));

        // Remove members no longer selected
        for (const m of currentMembersRes.data || []) {
          const userId = m.user?.id || m.userId;
          if (!newMemberIds.has(userId)) {
            await teamsService.removeMember(team.id, userId);
          }
        }

        // Add new members
        for (const member of selectedMembers) {
          if (!currentMemberIds.has(member.id)) {
            await teamsService.addMember(team.id, member.id);
          }
        }

        // Sync projects: get current, compare, assign/unassign as needed
        const currentProjectsRes = await teamsService.getProjects(team.id);
        const currentProjectIds = new Set(
          (currentProjectsRes.data || [])
            .filter(tp => tp.project)
            .map(tp => tp.project.id || tp.projectId)
        );
        const newProjectIds = new Set(selectedProjects.map(p => p.id));

        // Unassign projects no longer selected
        for (const tp of currentProjectsRes.data || []) {
          const projectId = tp.project?.id || tp.projectId;
          if (!newProjectIds.has(projectId)) {
            await teamsService.unassignProject(team.id, projectId);
          }
        }

        // Assign new projects
        for (const project of selectedProjects) {
          if (!currentProjectIds.has(project.id)) {
            await teamsService.assignProject(team.id, project.id);
          }
        }

      } else {
        // Create new team
        const createRes = await teamsService.create({
          name: formData.name.trim(),
          description: formData.description?.trim() || ''
        });
        if (!createRes.success) throw new Error('Erreur lors de la creation');
        savedTeam = createRes.data;

        // Add members
        for (const member of selectedMembers) {
          await teamsService.addMember(savedTeam.id, member.id);
        }

        // Assign projects
        for (const project of selectedProjects) {
          await teamsService.assignProject(savedTeam.id, project.id);
        }
      }

      setSuccessMessage(isEditMode ? 'Equipe mise a jour' : 'Equipe creee');
      setTimeout(() => {
        onSave(savedTeam);
        handleClose();
      }, 500);

    } catch (err) {
      setError(err.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setSuccessMessage(null);
    reset();
    onClose();
  };

  const tabs = [
    { id: 'info', label: 'Informations' },
    { id: 'members', label: `Membres (${selectedMembers.length})` },
    { id: 'projects', label: `Projets (${selectedProjects.length})` }
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="lg">
      {error && (
        <Alert variant="error" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {successMessage && (
        <Alert variant="success" className="mb-4">
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          {/* Tabs */}
          <div className="flex border-b mb-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-[300px]">
            {/* Info Tab */}
            {activeTab === 'info' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de l'equipe *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Equipe Marketing"
                    error={!!errors.name}
                    {...register('name', {
                      required: 'Le nom est requis',
                      minLength: { value: 2, message: 'Minimum 2 caracteres' },
                      maxLength: { value: 100, message: 'Maximum 100 caracteres' }
                    })}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Description de l'equipe (optionnel)"
                    rows={3}
                    {...register('description', {
                      maxLength: { value: 500, message: 'Maximum 500 caracteres' }
                    })}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500">{errors.description.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Members Tab */}
            {activeTab === 'members' && (
              <div className="space-y-4">
                {/* Selected members */}
                <div>
                  <Label>Membres selectionnes ({selectedMembers.length})</Label>
                  {selectedMembers.length === 0 ? (
                    <p className="text-sm text-gray-500 py-2">Aucun membre selectionne</p>
                  ) : (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedMembers.map(member => (
                        <span
                          key={member.id}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {member.firstName} {member.lastName}
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(member.id)}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Available users */}
                <div>
                  <Label>Ajouter des membres</Label>
                  <Input
                    type="text"
                    placeholder="Rechercher par nom ou email..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="mt-2"
                  />
                  <div className="max-h-[150px] overflow-y-auto border rounded-md mt-2">
                    {filteredAvailableUsers.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        {memberSearch ? 'Aucun utilisateur trouve' : 'Tous les utilisateurs sont deja membres'}
                      </p>
                    ) : (
                      <ul className="divide-y">
                        {filteredAvailableUsers.map(user => (
                          <li
                            key={user.id}
                            className="flex items-center justify-between px-3 py-2 hover:bg-gray-50"
                          >
                            <div>
                              <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddMember(user)}
                            >
                              Ajouter
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Projects Tab */}
            {activeTab === 'projects' && (
              <div className="space-y-4">
                {/* Selected projects */}
                <div>
                  <Label>Projets assignes ({selectedProjects.length})</Label>
                  {selectedProjects.length === 0 ? (
                    <p className="text-sm text-gray-500 py-2">Aucun projet assigne</p>
                  ) : (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedProjects.map(project => (
                        <span
                          key={project.id}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                        >
                          {project.name} {project.code && `(${project.code})`}
                          <button
                            type="button"
                            onClick={() => handleRemoveProject(project.id)}
                            className="ml-1 text-green-600 hover:text-green-800"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Available projects */}
                <div>
                  <Label>Assigner des projets</Label>
                  <Input
                    type="text"
                    placeholder="Rechercher par nom ou code..."
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    className="mt-2"
                  />
                  <div className="max-h-[150px] overflow-y-auto border rounded-md mt-2">
                    {filteredAvailableProjects.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        {projectSearch ? 'Aucun projet trouve' : 'Tous les projets sont deja assignes'}
                      </p>
                    ) : (
                      <ul className="divide-y">
                        {filteredAvailableProjects.map(project => (
                          <li
                            key={project.id}
                            className="flex items-center justify-between px-3 py-2 hover:bg-gray-50"
                          >
                            <div>
                              <p className="text-sm font-medium">{project.name}</p>
                              {project.code && (
                                <p className="text-xs text-gray-500">Code: {project.code}</p>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddProject(project)}
                            >
                              Assigner
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving}>
              {saving
                ? 'Enregistrement...'
                : isEditMode
                  ? 'Enregistrer'
                  : 'Creer l\'equipe'
              }
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export default TeamFormComplete;
