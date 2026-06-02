import { redirect } from 'next/navigation';

// Root redirect ke dashboard
export default function RootPage() {
  redirect('/dashboard');
}
