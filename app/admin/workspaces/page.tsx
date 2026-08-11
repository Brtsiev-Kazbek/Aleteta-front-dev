import { AdminFailureNotice } from "@/components/admin/AdminFailureNotice";
import { WorkspacesTable } from "@/components/admin/WorkspacesTable";
import { isFailure, loadWorkspaces } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

export default async function AdminWorkspacesPage() {
  const workspaces = await loadWorkspaces();

  return (
    <div className="relative z-10 -mt-8">
      {isFailure(workspaces) ? (
        <AdminFailureNotice reason={workspaces.reason} />
      ) : (
        <WorkspacesTable workspaces={workspaces} />
      )}
    </div>
  );
}
