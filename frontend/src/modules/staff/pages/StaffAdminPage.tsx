import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "../../../shared/components/Badge";
import { Button } from "../../../shared/components/Button";
import { Card } from "../../../shared/components/Card";
import { formatMoney } from "../../../shared/utils/currency";
import { StaffRole } from "../../../shared/auth/authApi";
import { StaffTabs } from "../components/StaffTabs";
import { EmploymentType, staffApi } from "../api";

const roles: StaffRole[] = ["MANAGEMENT", "ROOMS", "RESTAURANT", "LIQUOR"];
const employmentTypes: EmploymentType[] = ["FULL_TIME", "PART_TIME", "CASUAL", "CONTRACT"];

const emptyForm = {
  fullName: "",
  role: "ROOMS" as StaffRole,
  pin: "",
  employeeNumber: "",
  jobTitle: "",
  phone: "",
  email: "",
  dateOfBirth: "",
  nationalId: "",
  dateHired: "",
  employmentType: "FULL_TIME" as EmploymentType,
  baseSalary: 0,
  annualLeaveDays: 21,
  emergencyContactName: "",
  emergencyContactPhone: "",
  emergencyContactRelation: "",
};

export function StaffAdminPage() {
  const queryClient = useQueryClient();
  const { data: staff, isLoading } = useQuery({ queryKey: ["staff"], queryFn: staffApi.list });

  const [form, setForm] = useState(emptyForm);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["staff"] });

  const createStaff = useMutation({
    mutationFn: () =>
      staffApi.create({
        ...form,
        employeeNumber: form.employeeNumber || undefined,
        jobTitle: form.jobTitle || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        nationalId: form.nationalId || undefined,
        dateHired: form.dateHired || undefined,
        emergencyContactName: form.emergencyContactName || undefined,
        emergencyContactPhone: form.emergencyContactPhone || undefined,
        emergencyContactRelation: form.emergencyContactRelation || undefined,
      }),
    onSuccess: () => {
      setForm(emptyForm);
      invalidate();
    },
  });

  const toggleActive = useMutation({
    mutationFn: (vars: { id: string; active: boolean }) => staffApi.setActive(vars.id, vars.active),
    onSuccess: invalidate,
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (form.fullName.trim() && /^\d{4,6}$/.test(form.pin)) createStaff.mutate();
  }

  return (
    <div>
      <StaffTabs />
      <h1 className="text-xl font-bold mb-4">Staff directory</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="font-semibold mb-2">Add staff member</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <input
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                placeholder="Full name"
                className="col-span-2 w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
              />
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as StaffRole }))}
                className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <input
                value={form.pin}
                onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value.replace(/\D/g, "") }))}
                placeholder="4-6 digit PIN"
                maxLength={6}
                className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
              />
            </div>

            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide pt-1">Employment</div>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={form.employeeNumber}
                onChange={(e) => setForm((f) => ({ ...f, employeeNumber: e.target.value }))}
                placeholder="Employee # (e.g. EMP-0005)"
                className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
              />
              <input
                value={form.jobTitle}
                onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
                placeholder="Job title"
                className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
              />
              <select
                value={form.employmentType}
                onChange={(e) => setForm((f) => ({ ...f, employmentType: e.target.value as EmploymentType }))}
                className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
              >
                {employmentTypes.map((t) => (
                  <option key={t} value={t}>
                    {t.replace("_", " ")}
                  </option>
                ))}
              </select>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date hired</label>
                <input
                  type="date"
                  value={form.dateHired}
                  onChange={(e) => setForm((f) => ({ ...f, dateHired: e.target.value }))}
                  className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Base salary / month (KES)</label>
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

            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide pt-1">Contact &amp; ID</div>
            <div className="grid grid-cols-2 gap-2">
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
                value={form.nationalId}
                onChange={(e) => setForm((f) => ({ ...f, nationalId: e.target.value }))}
                placeholder="National ID"
                className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
              />
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date of birth</label>
                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
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

            <Button type="submit" disabled={createStaff.isPending}>
              Add staff member
            </Button>
          </form>
        </Card>

        <Card>
          <h2 className="font-semibold mb-2">All staff</h2>
          {isLoading && <p className="text-sm text-slate-500">Loading…</p>}
          <div className="space-y-2">
            {staff?.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-sm border-b border-slate-100 pb-2">
                <div>
                  <Link to={`/staff/${s.id}`} className="font-medium text-blue-600 hover:underline">
                    {s.fullName}
                  </Link>
                  <div className="text-xs text-slate-400">
                    {s.jobTitle ?? s.role} {s.employeeNumber && `· ${s.employeeNumber}`}
                    {s.baseSalary && ` · ${formatMoney(Number(s.baseSalary))}/mo`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge color={s.active ? "green" : "slate"}>{s.active ? "Active" : "Inactive"}</Badge>
                  <Button
                    variant="secondary"
                    onClick={() => toggleActive.mutate({ id: s.id, active: !s.active })}
                    disabled={toggleActive.isPending}
                  >
                    {s.active ? "Deactivate" : "Reactivate"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
