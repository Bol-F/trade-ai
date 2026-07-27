"use client";

import { useState } from "react";
import { BellRing, Ellipsis, Plus } from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { StatusBadge } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type DemoAlert, demoAlerts } from "@/lib/dashboard-demo-data";

const categories = ["All", "Price", "Signal", "Risk", "Market event"] as const;

export function AlertsDashboard() {
  const [alerts, setAlerts] = useState<DemoAlert[]>(demoAlerts);
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [editing, setEditing] = useState<DemoAlert | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const visible =
    category === "All"
      ? alerts
      : alerts.filter((alert) => alert.category === category);

  function createAlert(formData: FormData) {
    const asset = String(formData.get("asset") || "").trim();
    const condition = String(formData.get("condition") || "").trim();
    if (!asset || !condition) return;
    setAlerts((current) => [
      ...current,
      {
        id: `alert-${Date.now()}`,
        category: String(formData.get("category")) as DemoAlert["category"],
        asset,
        condition,
        status: "Active",
        created: "Just now",
        lastTriggered: "Never",
        channel: String(formData.get("channel")) as DemoAlert["channel"],
      },
    ]);
    setCreateOpen(false);
  }

  return (
    <>
      <DashboardPageHeader
        title="Alerts"
        description="Organize illustrative price, signal, risk, and market-event conditions. Delivery is not connected to a production notification service."
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus aria-hidden="true" />
            Create alert
          </Button>
        }
      />
      <Tabs
        value={category}
        onValueChange={(value) =>
          setCategory(value as (typeof categories)[number])
        }
      >
        <TabsList
          aria-label="Alert categories"
          className="max-w-full overflow-x-auto"
        >
          {categories.map((item) => (
            <TabsTrigger key={item} value={item}>
              {item}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Card className="mt-4 shadow-none">
        <CardContent className="px-0">
          <Table>
            <TableHeader className="sticky top-16 z-10 bg-card">
              <TableRow>
                <TableHead className="pl-5">Type / asset</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last triggered</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead className="pr-5">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((alert) => (
                <TableRow key={alert.id} tabIndex={0}>
                  <TableCell className="pl-5">
                    <p className="font-medium">{alert.asset}</p>
                    <p className="text-xs text-muted-foreground">
                      {alert.category} alert
                    </p>
                  </TableCell>
                  <TableCell className="max-w-72 whitespace-normal">
                    {alert.condition}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      tone={
                        alert.status === "Triggered"
                          ? "warning"
                          : alert.status === "Active"
                            ? "success"
                            : "neutral"
                      }
                    >
                      {alert.status}
                    </StatusBadge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {alert.created}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {alert.lastTriggered}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{alert.channel}</Badge>
                  </TableCell>
                  <TableCell className="pr-5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Actions for ${alert.asset} alert`}
                        >
                          <Ellipsis aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setEditing(alert)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() =>
                            setAlerts((current) =>
                              current.map((item) =>
                                item.id === alert.id
                                  ? {
                                      ...item,
                                      status:
                                        item.status === "Paused"
                                          ? "Active"
                                          : "Paused",
                                    }
                                  : item,
                              ),
                            )
                          }
                        >
                          {alert.status === "Paused" ? "Resume" : "Pause"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() =>
                            setAlerts((current) =>
                              current.filter((item) => item.id !== alert.id),
                            )
                          }
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!visible.length && (
            <div className="p-10 text-center">
              <BellRing
                aria-hidden="true"
                className="mx-auto size-6 text-muted-foreground"
              />
              <h2 className="mt-4 font-medium">No alerts in this category</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Create a demo condition or choose another category.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create demo alert</DialogTitle>
            <DialogDescription>
              The condition is stored locally for interface evaluation only.
            </DialogDescription>
          </DialogHeader>
          <form action={createAlert} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="alert-category">Category</Label>
              <Select id="alert-category" name="category">
                <option>Price</option>
                <option>Signal</option>
                <option>Risk</option>
                <option>Market event</option>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="alert-asset">Asset</Label>
              <Input
                id="alert-asset"
                name="asset"
                required
                placeholder="NVDA"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="alert-condition">Condition</Label>
              <Input
                id="alert-condition"
                name="condition"
                required
                placeholder="Price above $130"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="alert-channel">Delivery channel</Label>
              <Select id="alert-channel" name="channel">
                <option>In-app</option>
                <option>Email + in-app</option>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create alert</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit alert</DialogTitle>
            <DialogDescription>
              Editing is local demo state; no notification will be delivered.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="edit-condition">Condition</Label>
                <Input
                  id="edit-condition"
                  value={editing.condition}
                  onChange={(event) =>
                    setEditing({ ...editing, condition: event.target.value })
                  }
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setAlerts((current) =>
                      current.map((item) =>
                        item.id === editing.id ? editing : item,
                      ),
                    );
                    setEditing(null);
                  }}
                >
                  Save changes
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
