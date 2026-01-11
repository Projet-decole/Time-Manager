// frontend/src/pages/AdminUsersPage.jsx

import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

/**
 * Admin Users page - placeholder for Story 2-13
 * Requires manager role (protected by RoleProtectedRoute)
 */
export default function AdminUsersPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Gestion des utilisateurs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Cette page sera implementee dans Story 2-13.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
