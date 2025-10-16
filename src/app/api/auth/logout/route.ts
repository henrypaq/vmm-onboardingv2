import { signOut } from '@/lib/auth/auth';
import { handleApiRoute } from '@/lib/api/api-utils';

export async function POST() {
  return handleApiRoute('User Logout', async () => {
    await signOut();
    return { message: 'Logged out successfully' };
  });
}
