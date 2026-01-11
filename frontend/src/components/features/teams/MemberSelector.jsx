// frontend/src/components/features/teams/MemberSelector.jsx
// Story 3.6: User selection modal for adding members to a team

import { useState, useEffect, useMemo } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Alert, AlertDescription } from '../../ui/Alert';
import { usersService } from '../../../services/usersService';

/**
 * MemberSelector modal component for adding users to a team
 * Story 3.6: AC6 - Add Member
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Callback to close the modal
 * @param {Function} props.onSelect - Callback when a user is selected
 * @param {Array} [props.excludeUserIds=[]] - User IDs to exclude (already members)
 * @param {boolean} [props.isLoading=false] - Whether selection is in progress
 * @param {string|null} [props.error=null] - Error message to display
 */
export function MemberSelector({
  isOpen,
  onClose,
  onSelect,
  excludeUserIds = [],
  isLoading = false,
  error = null
}) {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Fetch users when modal opens
  useEffect(() => {
    const fetchUsers = async () => {
      if (!isOpen) return;

      setLoadingUsers(true);
      setLoadError(null);

      try {
        // Fetch all users (could paginate for large datasets)
        const response = await usersService.getAll({ limit: 100 });
        if (response.success) {
          setUsers(response.data || []);
        } else {
          setLoadError('Erreur lors du chargement des utilisateurs');
        }
      } catch (err) {
        setLoadError(err.message || 'Erreur lors du chargement des utilisateurs');
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [isOpen]);

  // Filter users: exclude already-members and apply search
  const filteredUsers = useMemo(() => {
    const excludeSet = new Set(excludeUserIds);

    return users
      .filter((user) => !excludeSet.has(user.id))
      .filter((user) => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        return (
          fullName.includes(search) ||
          user.email.toLowerCase().includes(search)
        );
      });
  }, [users, excludeUserIds, searchTerm]);

  const handleClose = () => {
    setSearchTerm('');
    onClose();
  };

  const handleSelect = (user) => {
    onSelect(user);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Ajouter un membre">
      {(error || loadError) && (
        <Alert variant="error" className="mb-4">
          <AlertDescription>{error || loadError}</AlertDescription>
        </Alert>
      )}

      {/* Search input */}
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Rechercher par nom ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Users list */}
      <div className="max-h-[300px] overflow-y-auto border rounded-md">
        {loadingUsers ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm
              ? 'Aucun utilisateur trouve'
              : 'Aucun utilisateur disponible'
            }
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <li
                key={user.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  onClick={() => handleSelect(user)}
                >
                  {isLoading ? 'Ajout...' : 'Ajouter'}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Close button */}
      <div className="flex justify-end pt-4 border-t mt-4">
        <Button variant="outline" onClick={handleClose}>
          Fermer
        </Button>
      </div>
    </Modal>
  );
}

export default MemberSelector;
