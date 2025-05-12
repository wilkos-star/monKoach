import { Redirect } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
export default function StartPage() {
  const auth = useAuth();

  return <Redirect href="/chat" />;
} 