import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { Badge } from "../../../shared/components/Badge";
import { Button } from "../../../shared/components/Button";
import { Card } from "../../../shared/components/Card";
import { useAuth } from "../../../shared/auth/AuthContext";
import { LeaveStatus, LeaveType, staffApi } from "../api";

const statusBadge: Record<LeaveStatus, "amber" | "green" | "red"> = {
  PENDING: "amber",
  APPROVED: "green",
  REJECTED: "red",
};

const leaveTypes: LeaveType[] = ["ANNUAL", "SICK", "UNPAID", "OTHER"];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function MyProfilePage() {
  const { staff } = useAuth();
  const queryClient = useQueryClient();
  const [leaveForm, setLeaveForm] = useState({ leaveType: "ANNUAL" as LeaveType, startDate: todayStr(), endDate: todayStr(), reason: "" });

  const { data: status } = useQuery({ queryKey: ["my-attendance-status"], queryFn: staffApi.myAttendanceStatus });
  const { data: shifts } = useQuery({
    queryKey: ["my-shifts"],
    queryFn: () => staffApi.myShifts({ from: todayStr() }),
  });
  const { data: leaveBalance } = useQuery({ queryKey: ["my-leave-balance"], queryFn: staffApi.myLeaveBalance });
  const { data: leaveRequests } = useQuery({ queryKey: ["my-leave-requests"], queryFn: staffApi.myLeaveRequests });

  const invalidateAttendance = () => {
    queryClient.invalidateQueries({ queryKey: ["my-attendance-status"] });
  };

  const clockIn = useMutation({ mutationFn: staffApi.clockIn, onSuccess: invalidateAttendance });
  const clockOut = useMutation({ mutationFn: staffApi.clockOut, onSuccess: invalidateAttendance });

  const requestLeave = useMutation({
    mutationFn: () => staffApi.requestLeave(leaveForm),
    onSuccess: () => {
      setLeaveForm({ leaveType: "ANNUAL", startDate: todayStr(), endDate: todayStr(), reason: "" });
      queryClient.invalidateQueries({ queryKey: ["my-leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-leave-balance"] });
    },
  });

  function handleLeaveSubmit(e: FormEvent) {
    e.preventDefault();
    requestLeave.mutate();
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">My profile</h1>
      <p className="text-sm text-slate-500 mb-4">
        {staff?.fullName} · {staff?.role}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <h2 className="font-semibold mb-2">Time clock</h2>
            {status ? (
              <>
                <Badge color="green">Clocked in</Badge>
                <p className="text-xs text-slate-500 mt-1">Since {new Date(status.clockInAt).toLocaleTimeString()}</p>
                <Button className="w-full mt-3" variant="danger" disabled={clockOut.isPending} onClick={() => clockOut.mutate()}>
                  Clock out
                </Button>
              </>
            ) : (
              <>
                <Badge color="slate">Not clocked in</Badge>
                <Button className="w-full mt-3" disabled={clockIn.isPending} onClick={() => clockIn.mutate()}>
                  Clock in
                </Button>
              </>
            )}
          </Card>

          <Card>
            <h2 className="font-semibold mb-2">Leave balance</h2>
            <div className="text-2xl font-bold text-emerald-700">{leaveBalance?.remaining ?? "—"} days</div>
            <div className="text-xs text-slate-500 mt-1">
              {leaveBalance ? `${leaveBalance.used} used of ${leaveBalance.entitlement} annual leave days this year` : ""}
            </div>
          </Card>

          <Card>
            <h2 className="font-semibold mb-2">Upcoming shifts</h2>
            {shifts?.length === 0 && <p className="text-sm text-slate-400">No shifts scheduled.</p>}
            <div className="space-y-1">
              {shifts?.map((s) => (
                <div key={s.id} className="flex justify-between text-sm">
                  <span>{new Date(s.date).toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short" })}</span>
                  <Badge color="slate">{s.shiftType}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h2 className="font-semibold mb-2">Request leave</h2>
            <form onSubmit={handleLeaveSubmit} className="flex flex-wrap gap-2 items-end">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
                <select
                  value={leaveForm.leaveType}
                  onChange={(e) => setLeaveForm((f) => ({ ...f, leaveType: e.target.value as LeaveType }))}
                  className="border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                >
                  {leaveTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Start date</label>
                <input
                  type="date"
                  value={leaveForm.startDate}
                  onChange={(e) => setLeaveForm((f) => ({ ...f, startDate: e.target.value }))}
                  className="border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">End date</label>
                <input
                  type="date"
                  value={leaveForm.endDate}
                  onChange={(e) => setLeaveForm((f) => ({ ...f, endDate: e.target.value }))}
                  className="border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                />
              </div>
              <input
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm((f) => ({ ...f, reason: e.target.value }))}
                placeholder="Reason (optional)"
                className="flex-1 min-w-[160px] border border-slate-300 rounded-md px-2 py-1.5 text-sm"
              />
              <Button type="submit" disabled={requestLeave.isPending}>
                Submit request
              </Button>
            </form>
          </Card>

          <Card>
            <h2 className="font-semibold mb-2">My leave requests</h2>
            {leaveRequests?.length === 0 && <p className="text-sm text-slate-400">No leave requests yet.</p>}
            <div className="space-y-2">
              {leaveRequests?.map((r) => (
                <div key={r.id} className="text-sm border-b border-slate-100 pb-2">
                  <div className="flex justify-between">
                    <span>
                      {r.leaveType} · {new Date(r.startDate).toLocaleDateString()} – {new Date(r.endDate).toLocaleDateString()}
                    </span>
                    <Badge color={statusBadge[r.status]}>{r.status}</Badge>
                  </div>
                  {r.reason && <div className="text-xs text-slate-400 mt-0.5">{r.reason}</div>}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
