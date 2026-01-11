// frontend/src/components/features/teams/TeamsList.jsx
// Story 3.6: Teams list component with table display

import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from '../../ui/Table';
import { Button } from '../../ui/Button';

/**
 * Truncate text to a maximum length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength = 50) {
  if (!text) return '-';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * TeamsList component - Displays teams in a table format
 * Story 3.6: AC1 - Teams List Page
 *
 * @param {Object} props
 * @param {Array} props.teams - Array of team objects
 * @param {boolean} [props.loading=false] - Loading state
 * @param {Function} props.onRowClick - Callback when clicking on a row
 * @param {Function} props.onEdit - Callback when clicking edit button
 * @param {Function} props.onDelete - Callback when clicking delete button
 */
export function TeamsList({
  teams = [],
  loading = false,
  onRowClick,
  onEdit,
  onDelete
}) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Aucune equipe</p>
        <p className="text-sm text-gray-400 mt-1">
          Creez votre premiere equipe pour commencer
        </p>
      </div>
    );
  }

  const handleRowClick = (e, team) => {
    // Don't trigger row click if clicking on action buttons
    if (e.target.closest('button')) return;
    onRowClick?.(team);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nom</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="text-center">Membres</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {teams.map((team) => (
          <TableRow
            key={team.id}
            className="cursor-pointer"
            onClick={(e) => handleRowClick(e, team)}
          >
            <TableCell className="font-medium">{team.name}</TableCell>
            <TableCell className="text-gray-500">
              {truncateText(team.description)}
            </TableCell>
            <TableCell className="text-center">
              <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                {team.memberCount ?? 0}
              </span>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(team);
                  }}
                >
                  Modifier
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(team);
                  }}
                >
                  Supprimer
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default TeamsList;
