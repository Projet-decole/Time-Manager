// frontend/src/pages/DashboardPage.jsx

import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

/**
 * Dashboard page - placeholder for Epic 6
 * Navigation is now handled by AppLayout
 */
export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Tableau de bord</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Bienvenue, {user?.firstName || user?.email || 'utilisateur'} !
          </p>
          <p className="text-sm text-gray-500">
            Cette page sera implementee dans Epic 6.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
