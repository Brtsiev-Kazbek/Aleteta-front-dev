import { AdminFailureNotice } from "@/components/admin/AdminFailureNotice";
import { UsersTable } from "@/components/admin/UsersTable";
import { isFailure, loadUsers, requirePlatformAdmin } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  /*
   * Кто смотрит — нужно самой таблице: кнопку на своей строке она гасит
   * заранее, чтобы человек не узнавал о запрете из отказа базы.
   */
  const [admin, users] = await Promise.all([
    requirePlatformAdmin(),
    loadUsers(),
  ]);

  return (
    <div className="relative z-10 -mt-8">
      {isFailure(users) ? (
        <AdminFailureNotice reason={users.reason} />
      ) : (
        <UsersTable users={users} currentUserId={admin.userId} />
      )}
    </div>
  );
}
