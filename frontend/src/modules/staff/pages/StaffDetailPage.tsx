import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Badge } from "../../../shared/components/Badge";
import { Button } from "../../../shared/components/Button";
import { Card } from "../../../shared/components/Card";
import { formatMoney } from "../../../shared/utils/currency";
import { LeaveStatus, staffApi } from "../api";

const leaveBadge: Record<LeaveStatus, "amber" | "green" | "red"> = {
  PENDING: "amber",
  APPROVED: "green",
  REJECTED: "red",
};

function hoursWorked(clockInAt: string, clockOutAt: string | null) {
  if (!clockOutAt) return "—";
  const hours = (new Date(clockOutAt).getTime() - new Date(clockInAt).getTime()) / (1000 * 60 * 60);
  return `${hours.toFixed(1)}h`;
}

export function StaffDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string | number>>({});

  const { data, isLoading } = useQuery({ queryKey: ["staff-detail", id], queryFn: () => staffApi.getDetail(id!), enabled: !!id });

  useEffect(() => {
    if (data && !editing) {
      setForm({
        jobTitle: data.staff.jobTitle ?? "",
        phone: data.staff.phone ?? "",
        email: data.staff.email ?? "",
        address: data.staff.address ?? "",
        baseSalary: data.staff.baseSalary ? Number(data.staff.baseSalary) : 0,
        annualLeaveDays: data.staff.annualLeaveDays,
        emergencyContactName: data.staff.emergencyContactName ?? "",
        emergencyContactPhone: data.staff.emergencyContactPhone ?? "",
        emergencyContactRelation: data.staff.emergencyContactRelation ?? "",
      });
    }
  }, [data, editing]);

  const updateProfile = useMutation({
    mutationFn: () =>
      staffApi.updateProfile(id!, {
        jobTitle: String(form.jobTitle) || undefined,
        phone: String(form.phone) || undefined,
        email: String(form.email) || undefined,
        address: String(form.address) || undefined,
        baseSalary: Number(form.baseSalary) || undefined,
        annualLeaveDays: Number(form.annualLeaveDays),
        emergencyContactName: String(form.emergencyContactName) || undefined,
        emergencyContactPhone: String(form.emergencyContactPhone) || undefined,
        emergencyContactRelation: String(form.emergencyContactRelation) || undefined,
      }),
    onSuccess: () => {
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["staff-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });

  const toggleActive = useMutation({
    mutationFn: () => staffApi.setActive(id!, !data!.staff.active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });

  function handleSave(e: FormEvent) {
    e.preventDefault();
    updateProfile.mutate();
  }

  if (isLoading || !data) return <p className="text-slate-500">Loading staff member…</p>;
  const { staff, shifts, attendance, leaveRequests, leaveBalance } = data;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">{staff.fullName}</h1>
          <p className="text-sm text-slate-500">
            {staff.jobTitle ?? staff.role} {staff.employeeNumber && `· ${staff.employeeNumber}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate("/staff")}>
            Back to directory
          </Button>
          <Button variant={staff.active ? "danger" : "primary"} onClick={() => toggleActive.mutate()} disabled={toggleActive.isPending}>
            {staff.active ? "Deactivate" : "Reactivate"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Profile</h2>
              {!editing && (
                <Button variant="secondary" onClick={() => setEditing(true)}>
                  Edit
                </Button>
              )}
            </div>

            {editing ? (
              <form onSubmit={handleSave} className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={form.jobTitle}
                    onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
                    placeholder="Job title"
                    className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                  />
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="Phone"
                    className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                  />
                  <input
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="Email"
                    className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                  />
                  <input
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    placeholder="Address"
                    className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                  />
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Base salary / month</label>
                    <input
                      type="number"
                      min={0}
                      value={form.baseSalary}
                      onChange={(e) => setForm((f) => ({ ...f, baseSalary: Number(e.target.value) }))}
                      className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Annual leave days</label>
                    <input
                      type="number"
                      min={0}
                      value={form.annualLeaveDays}
                      onChange={(e) => setForm((f) => ({ ...f, annualLeaveDays: Number(e.target.value) }))}
                      className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                    />
                  </div>
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wide pt-1">Emergency contact</div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    value={form.emergencyContactName}
                    onChange={(e) => setForm((f) => ({ ...f, emergencyContactName: e.target.value }))}
                    placeholder="Name"
                    className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                  />
                  <input
                    value={form.emergencyContactPhone}
                    onChange={(e) => setForm((f) => ({ ...f, emergencyContactPhone: e.target.value }))}
                    placeholder="Phone"
                    className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                  />
                  <input
                    value={form.emergencyContactRelation}
                    onChange={(e) => setForm((f) => ({ ...f, emergencyContactRelation: e.target.value }))}
                    placeholder="Relationship"
                    className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={updateProfile.isPending}>
                    Save
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <div className="text-slate-500">Role</div>
                <div>{staff.role}</div>
                <div className="text-slate-500">Employment type</div>
                <div>{staff.employmentType.replace("_", " ")}</div>
                <div className="text-slate-500">Date hired</div>
                <div>{staff.dateHired ? new Date(staff.dateHired).toLocaleDateString() : "—"}</div>
                <div className="text-slate-500">Date of birth</div>
                <div>{staff.dateOfBirth ? new Date(staff.dateOfBirth).toLocaleDateString() : "—"}</div>
                <div className="text-slate-500">National ID</div>
                <div>{staff.nationalId ?? "—"}</div>
                <div className="text-slate-500">Phone</div>
                <div>{staff.phone ?? "—"}</div>
                <div className="text-slate-500">Email</div>
                <div>{staff.email ?? "—"}</div>
                <div className="text-slate-500">Address</div>
                <div>{staff.address ?? "—"}</div>
                <div className="text-slate-500">Base salary</div>
                <div>{staff.baseSalary ? `${formatMoney(Number(staff.baseSalary))}/mo` : "—"}</div>
                <div className="text-slate-500">Emergency contact</div>
                <div>
                  {staff.emergencyContactName
                    ? `${staff.emergencyContactName} (${staff.emergencyContactRelation ?? "—"}) · ${staff.emergencyContactPhone ?? "—"}`
                    : "—"}
                </div>
              </div>
            )}
          </Card>

          <Card>
            <h2 className="font-semibold mb-3">Recent shifts</h2>
            {shifts.length === 0 && <p className="text-sm text-slate-400">No shifts scheduled.</p>}
            <div className="space-y-1">
              {shifts.map((s) => (
                <div key={s.id} className="flex justify-between text-sm">
                  <span>{new Date(s.date).toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short" })}</span>
                  <Badge color="slate">{s.shiftType}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="font-semibold mb-3">Recent attendance</h2>
            {attendance.length === 0 && <p className="text-sm text-slate-400">No attendance records yet.</p>}
            <div className="space-y-1">
              {attendance.map((a) => (
                <div key={a.id} className="flex justify-between text-sm">
                  <span>{new Date(a.clockInAt).toLocaleString()}</span>
                  <span className="text-slate-500">{hoursWorked(a.clockInAt, a.clockOutAt)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="font-semibold mb-2">Leave balance</h2>
            <div className="text-2xl font-bold text-emerald-700">{leaveBalance.remaining} days</div>
            <div className="text-xs text-slate-500 mt-1">
              {leaveBalance.used} used of {leaveBalance.entitlement} annual leave days this year
            </div>
          </Card>

          <Card>
            <h2 className="font-semibold mb-2">Leave requests</h2>
            {leaveRequests.length === 0 && <p className="text-sm text-slate-400">No leave requests.</p>}
            <div className="space-y-2">
              {leaveRequests.map((l) => (
                <div key={l.id} className="text-sm border-b border-slate-100 pb-2">
                  <div className="flex justify-between">
                    <span>
                      {l.leaveType} · {new Date(l.startDate).toLocaleDateString()} – {new Date(l.endDate).toLocaleDateString()}
                    </span>
                    <Badge color={leaveBadge[l.status]}>{l.status}</Badge>
                  </div>
                  {l.reason && <div className="text-xs text-slate-400 mt-0.5">{l.reason}</div>}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
