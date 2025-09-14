import { redirect } from 'next/navigation';

export default function AdminPage() {
  // Redirect to clients page as the main admin view
  redirect('/admin/clients');
}