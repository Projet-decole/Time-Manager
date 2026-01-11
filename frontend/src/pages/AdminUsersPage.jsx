// frontend/src/pages/AdminUsersPage.jsx
// Story 2.14: Manager User Management

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../components/ui/Table';
import { Select, SelectOption } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Alert, AlertDescription } from '../components/ui/Alert';
import { usersService } from '../services/usersService';
import { UserFormModal } from '../components/users/UserFormModal';

/**
 * Format role for display with French labels
 */
function formatRole(role) {
  const roleLabels = {
    employee: 'Employe',
    manager: 'Manager',
    admin: 'Admin'
  };
  return roleLabels[role] || role;
}

/**
 * Role badge component with color styling
 */
function RoleBadge({ role }) {
  const colorClasses = {
    employee: 'bg-blue-100 text-blue-800',
    manager: 'bg-purple-100 text-purple-800',
    admin: 'bg-red-100 text-red-800'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[role] || 'bg-gray-100 text-gray-800'}`}>
      {formatRole(role)}
    </span>
  );
}

/**
 * Admin Users page - displays user list with filtering and pagination
 * Requires manager role (protected by RoleProtectedRoute)
 * Story 2.14: Manager User Management - Create and Edit users
 */
export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [roleFilter, setRoleFilter] = useState('all');

  // Story 2.14: Modal state for create/edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  const fetchUsers = useCallback(async (page = 1, role = roleFilter) => {
    setIsLoading(true);
    setError(null);

    try {
      const options = { page, limit: pagination.limit };
      if (role && role !== 'all') {
        options.role = role;
      }

      const response = await usersService.getAll(options);

      if (response.success) {
        setUsers(response.data);
        setPagination(response.meta.pagination);
      } else {
        setError('Erreur lors du chargement des utilisateurs');
      }
    } catch {
      setError('Erreur lors du chargement des utilisateurs');
    } finally {
      setIsLoading(false);
    }
  }, [roleFilter, pagination.limit]);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRoleFilterChange = (value) => {
    setRoleFilter(value);
    fetchUsers(1, value);
  };

  const handlePreviousPage = () => {
    if (pagination.page > 1) {
      fetchUsers(pagination.page - 1, roleFilter);
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      fetchUsers(pagination.page + 1, roleFilter);
    }
  };

  // Story 2.14: Handle opening create modal
  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setModalError(null);
    setIsModalOpen(true);
  };

  // Story 2.14: Handle opening edit modal
  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setModalError(null);
    setIsModalOpen(true);
  };

  // Story 2.14: Handle closing modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setModalError(null);
  };

  // Story 2.14: Handle form submission (create or update)
  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    setModalError(null);

    try {
      if (editingUser) {
        // Update existing user
        await usersService.update(editingUser.id, formData);
        setSuccessMessage('Utilisateur modifie avec succes');
      } else {
        // Create new user
        await usersService.create(formData);
        setSuccessMessage('Utilisateur cree avec succes');
      }

      handleCloseModal();
      // Refresh the user list
      fetchUsers(pagination.page, roleFilter);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      // Handle specific error codes
      if (err.code === 'EMAIL_EXISTS') {
        setModalError('Un utilisateur avec cet email existe deja');
      } else if (err.code === 'NOT_FOUND') {
        setModalError('Utilisateur non trouve');
      } else {
        setModalError(err.message || 'Erreur lors de l\'operation');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const showPagination = pagination.totalPages > 1;

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle>Gestion des utilisateurs</CardTitle>
            <div className="flex items-center gap-4">
              <div className="w-48">
                <Select
                  value={roleFilter}
                  onValueChange={handleRoleFilterChange}
                >
                  <SelectOption value="all">Tous les roles</SelectOption>
                  <SelectOption value="employee">Employe</SelectOption>
                  <SelectOption value="manager">Manager</SelectOption>
                </Select>
              </div>
              {/* Story 2.14: Create User button */}
              <Button onClick={handleOpenCreateModal}>
                Nouvel utilisateur
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Story 2.14: Success message */}
          {successMessage && (
            <Alert variant="success" className="mb-4">
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {!isLoading && users.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              Aucun utilisateur
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Prenom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Heures/sem</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.lastName}</TableCell>
                    <TableCell>{user.firstName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <RoleBadge role={user.role} />
                    </TableCell>
                    <TableCell>{user.weeklyHoursTarget}h</TableCell>
                    <TableCell>
                      {/* Story 2.14: Edit button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditModal(user)}
                      >
                        Modifier
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {showPagination && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-gray-600 space-x-2">
                <span>{pagination.total} utilisateurs</span>
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

      {/* Story 2.14: Create/Edit User Modal */}
      <UserFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleFormSubmit}
        user={editingUser}
        isLoading={isSubmitting}
        error={modalError}
      />
    </div>
  );
}
