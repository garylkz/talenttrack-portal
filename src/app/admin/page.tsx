import AdminDashboard from "@/components/AdminDashboard";
import { isAdminAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authenticated = await isAdminAuthenticated();
  return <AdminDashboard initialAuthenticated={authenticated} />;
}
