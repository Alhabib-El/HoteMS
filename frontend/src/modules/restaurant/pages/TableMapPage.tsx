import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "../../../shared/components/Badge";
import { Button } from "../../../shared/components/Button";
import { Card } from "../../../shared/components/Card";
import { useAuth } from "../../../shared/auth/AuthContext";
import { restaurantApi } from "../api";

export function TableMapPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { staff } = useAuth();

  const { data: tables, isLoading } = useQuery({ queryKey: ["restaurant-tables"], queryFn: restaurantApi.listTables });
  const { data: openOrders } = useQuery({
    queryKey: ["restaurant-orders", "open"],
    queryFn: () => restaurantApi.listOrders(true),
  });

  const openOrder = useMutation({
    mutationFn: (tableId: string) => restaurantApi.openOrder({ tableId, assignedStaffId: staff?.id }),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ["restaurant-tables"] });
      queryClient.invalidateQueries({ queryKey: ["restaurant-orders"] });
      navigate(`/restaurant/orders/${order.id}`);
    },
  });

  function handleTableClick(tableId: string, status: string) {
    if (status === "FREE") {
      openOrder.mutate(tableId);
      return;
    }
    const order = openOrders?.find((o) => o.tableId === tableId);
    if (order) navigate(`/restaurant/orders/${order.id}`);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Restaurant — table map</h1>
        <Link to="/restaurant/menu">
          <Button variant="secondary">Manage menu</Button>
        </Link>
      </div>

      {isLoading && <p className="text-slate-500">Loading tables…</p>}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tables?.map((table) => (
          <Card
            key={table.id}
            className="cursor-pointer hover:shadow-md transition"
          >
            <button className="w-full text-left" onClick={() => handleTableClick(table.id, table.status)}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-bold">{table.number}</div>
                  <div className="text-xs text-slate-500">{table.seats} seats</div>
                </div>
                <Badge color={table.status === "FREE" ? "green" : "red"}>{table.status}</Badge>
              </div>
              <div className="mt-3 text-sm text-restaurant font-medium">
                {table.status === "FREE" ? "Open order" : "View order"}
              </div>
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
