// frontend/src/components/features/categories/CategoriesList.jsx
// Story 3.8: Admin Management UI - Categories

import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../ui/Table';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { ColorChip } from './ColorChip';

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength = 50) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Categories list table component
 * Displays all categories with actions
 * @param {Object} props
 * @param {Array} props.categories - Array of category objects
 * @param {function} props.onEdit - Callback when edit is clicked
 * @param {function} props.onDeactivate - Callback when deactivate is clicked
 * @param {function} props.onActivate - Callback when activate is clicked
 * @param {boolean} [props.loading=false] - Loading state
 */
export function CategoriesList({
  categories,
  onEdit,
  onDeactivate,
  onActivate,
  loading = false
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Chargement des categories...</div>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Aucune categorie trouvee
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">Couleur</TableHead>
          <TableHead>Nom</TableHead>
          <TableHead className="hidden md:table-cell">Description</TableHead>
          <TableHead className="w-24">Statut</TableHead>
          <TableHead className="w-48 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categories.map((category) => (
          <TableRow
            key={category.id}
            className={!category.isActive ? 'opacity-60 bg-gray-50' : ''}
          >
            <TableCell>
              <ColorChip color={category.color} size="md" />
            </TableCell>
            <TableCell className="font-medium">
              {category.name}
            </TableCell>
            <TableCell className="hidden md:table-cell text-gray-600">
              {truncateText(category.description)}
            </TableCell>
            <TableCell>
              <Badge variant={category.isActive ? 'default' : 'secondary'}>
                {category.isActive ? 'Actif' : 'Inactif'}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(category)}
                >
                  Modifier
                </Button>
                {category.isActive ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeactivate(category)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Desactiver
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onActivate(category)}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    Activer
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default CategoriesList;
