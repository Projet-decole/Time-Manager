// frontend/src/pages/DashboardPage.jsx

import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';

/**
 * Placeholder Dashboard page - will be fully implemented in Epic 6
 */
export default function DashboardPage() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <Button variant="outline" onClick={handleLogout}>
              Se deconnecter
            </Button>
          </div>
          <p className="text-gray-600">
            Bienvenue, {user?.email || 'utilisateur'} !
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Cette page sera implementee dans Epic 6.
          </p>
        </div>
      </div>
    </div>
  );
}
