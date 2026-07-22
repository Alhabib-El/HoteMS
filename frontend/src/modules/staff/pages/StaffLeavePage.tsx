import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "../../../shared/components/Badge";
import { Button } from "../../../shared/components/Button";
import { Card } from "../../../shared/components/Card";
import { StaffTabs } from "../components/StaffTabs";
import { LeaveStatus, staffApi } from "../api";

const statusBadge: Record<LeaveStatus, "amber" | "green" | "red"> = {
  PENDING: "amber",
  APPROVED: "green",
  REJECTED: "red",
};

export function StaffLeavePage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | "">("PENDING");

  const { data: requests, isLoading } = useQuery({
    queryKey: ["leave-requests", statusFilter],
    queryFn: () => staffApi.listLeaveRequests(statusFilter ? { status: statusFilter } : {}),
  });

  const review = useMutation({
    mutationFn: (vars: { id: string; status: "APPROVED" | "REJECTED" }) => staffApi.reviewLeaveRequest(vars.id, vars.status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leave-requests"] }),
  });

  return (
    <div>
      <StaffTabs />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Leave requests</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as LeaveStatus | "")}
          className="border border-slate-300 rounded-md px-2 py-1.5 text-sm"
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {isLoading && <p className="text-slate-500">Loading leave requests…</p>}
      {requests?.length === 0 && <p className="text-slate-400 text-sm">No leave requests.</p>}

      <div className="space-y-3">
        {requests?.map((r) => (
          <Card key={r.id} className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm">
                {r.staff?.fullName} <span className="text-xs text-slate-400 font-normal">({r.leaveType})</span>
              </div>
              <div className="text-xs text-slate-500">
                {new Date(r.startDate).toLocaleDateString()} – {new Date(r.endDate).toLocaleDateString()}
                {r.reason && ` · ${r.reason}`}
              </div>
              {r.reviewedBy && (
                <div className="text-xs text-slate-400 mt-0.5">
                  Reviewed by {r.reviewedBy.fullName} {r.reviewedAt && new Date(r.reviewedAt).toLocaleDateString()}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge color={statusBadge[r.status]}>{r.status}</Badge>
              {r.status === "PENDING" && (
                <>
                  <Button
                    disabled={review.isPending}
                    onClick={() => review.mutate({ id: r.id, status: "APPROVED" })}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    disabled={review.isPending}
                    onClick={() => review.mutate({ id: r.id, status: "REJECTED" })}
                  >
                    Reject
                  </Button>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
