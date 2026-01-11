// frontend/src/components/features/projects/ProjectsList.jsx
// Story 3.7: Admin Management UI - Projects

import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../ui/Table';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { BudgetProgress } from './BudgetProgress';

/**
 * Status badge component with color styling
 */
function StatusBadge({ status }) {
  const isActive = status === 'active';

  return (
    <Badge variant={isActive ? 'default' : 'secondary'}>
      {isActive ? 'Actif' : 'Archive'}
    </Badge>
  );
}

/**
 * Projects list table component
 * Story 3.7: Admin Management UI - Projects
 *
 * @param {Object} props
 * @param {Array} props.projects - Array of project objects
 * @param {Function} props.onEdit - Callback when edit is clicked
 * @param {Function} props.onArchive - Callback when archive is clicked
 * @param {Function} props.onRestore - Callback when restore is clicked
 * @param {Function} props.onRowClick - Callback when row is clicked (for details)
 * @param {boolean} [props.loading=false] - Loading state
 */
export function ProjectsList({
  projects,
  onEdit,
  onArchive,
  onRestore,
  onRowClick,
  loading = false
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <p className="text-gray-600 text-center py-8">
        Aucun projet
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Code</TableHead>
          <TableHead>Nom</TableHead>
          <TableHead>Budget</TableHead>
          <TableHead>Heures suivies</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => {
          const isArchived = project.status === 'archived';

          return (
            <TableRow
              key={project.id}
              className={`cursor-pointer hover:bg-gray-50 ${isArchived ? 'opacity-60 bg-gray-50' : ''}`}
              onClick={() => onRowClick?.(project)}
            >
              <TableCell>
                <span className="font-mono text-sm font-medium text-blue-600">
                  {project.code}
                </span>
              </TableCell>
              <TableCell>
                <div>
                  <span className={isArchived ? 'text-gray-500' : 'text-gray-900'}>
                    {project.name}
                  </span>
                  {project.description && (
                    <p className="text-xs text-gray-500 truncate max-w-xs">
                      {project.description}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {project.budgetHours !== null && project.budgetHours !== undefined ? (
                  <span className="text-gray-900">{project.budgetHours}h</span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </TableCell>
              <TableCell>
                <BudgetProgress
                  budgetHours={project.budgetHours}
                  trackedHours={project.totalHoursTracked || 0}
                  compact
                />
              </TableCell>
              <TableCell>
                <StatusBadge status={project.status} />
              </TableCell>
              <TableCell>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(project)}
                  >
                    Modifier
                  </Button>
                  {isArchived ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRestore(project.id)}
                    >
                      Restaurer
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onArchive(project.id)}
                    >
                      Archiver
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export default ProjectsList;
