import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { Badge } from "../../../shared/components/Badge";
import { Button } from "../../../shared/components/Button";
import { Card } from "../../../shared/components/Card";
import { StaffRole } from "../../../shared/auth/authApi";
import { staffApi } from "../api";

const roles: StaffRole[] = ["MANAGEMENT", "ROOMS", "RESTAURANT", "LIQUOR"];

export function StaffAdminPage() {
  const queryClient = useQueryClient();
  const { data: staff, isLoading } = useQuery({ queryKey: ["staff"], queryFn: staffApi.list });

  const [form, setForm] = useState<{ fullName: string; role: StaffRole; pin: string }>({
    fullName: "",
    role: "ROOMS",
    pin: "",
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["staff"] });

  const createStaff = useMutation({
    mutationFn: () => staffApi.create(form),
    onSuccess: () => {
      setForm({ fullName: "", role: "ROOMS", pin: "" });
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
      <h1 className="text-xl font-bold mb-4">Staff accounts</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h2 className="font-semibold mb-2">Add staff member</h2>
          <form onSubmit={handleSubmit} className="space-y-2">
            <input
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              placeholder="Full name"
              className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
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
              <div key={s.id} className="flex items-center justify-between text-sm">
                <span>
                  {s.fullName} <span className="text-xs text-slate-400">({s.role})</span>
                </span>
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
