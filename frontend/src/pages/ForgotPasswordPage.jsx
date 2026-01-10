// frontend/src/pages/ForgotPasswordPage.jsx

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authService } from '../services/authService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Alert, AlertDescription } from '../components/ui/Alert';

/**
 * CheckCircle icon component (simple SVG)
 */
function CheckCircleIcon({ className = '' }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    try {
      setError(null);
      setIsLoading(true);
      await authService.forgotPassword(data.email);
      setIsSuccess(true);
    } catch (err) {
      // For security, we still show success message to not reveal if email exists
      // But log the error for debugging
      console.error('Forgot password error:', err);
      // Only show error for network/server issues, not "email not found"
      if (err.message && !err.message.toLowerCase().includes('not found')) {
        setError(err.message);
      } else {
        // Security best practice: show success even if email doesn't exist
        setIsSuccess(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6 space-y-4">
            <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto" />
            <h2 className="text-xl font-semibold">Email envoye</h2>
            <p className="text-gray-600">
              Si un compte existe avec cet email, vous recevrez un lien de reinitialisation.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-md font-medium h-10 px-4 py-2 text-sm border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            >
              Retour a la connexion
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl text-center">Mot de passe oublie</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <p className="text-sm text-gray-600">
              Entrez votre email pour recevoir un lien de reinitialisation.
            </p>

            {error && (
              <Alert variant="error">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                error={!!errors.email}
                {...register('email', { required: 'Email requis' })}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Envoi...' : 'Envoyer le lien'}
            </Button>

            <div className="text-center">
              <Link to="/login" className="text-sm text-blue-600 hover:underline">
                Retour a la connexion
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
