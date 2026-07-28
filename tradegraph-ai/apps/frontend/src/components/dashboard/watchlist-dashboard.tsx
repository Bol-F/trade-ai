"use client";

import { useMemo, useState } from "react";
import { Bell, Ellipsis, Plus, Search, Trash2 } from "lucide-react";

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
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type WatchlistAsset,
  watchlistAssets,
} from "@/lib/dashboard-demo-data";
import { cn } from "@/lib/utils";

export function WatchlistDashboard() {
  const [items, setItems] = useState<WatchlistAsset[]>([...watchlistAssets]);
  const [search, setSearch] = useState("");
  const [signal, setSignal] = useState("All");
  const [remove, setRemove] = useState<WatchlistAsset | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newTicker, setNewTicker] = useState("");
  const visible = useMemo(
    () =>
      items.filter(
        (item) =>
          (!search ||
            `${item.asset} ${item.ticker}`
              .toLowerCase()
              .includes(search.toLowerCase())) &&
          (signal === "All" || item.signal === signal),
      ),
    [items, search, signal],
  );

  function addAsset() {
    const ticker = newTicker.trim().toUpperCase();
    if (!ticker || items.some((item) => item.ticker === ticker)) return;
    setItems((current) => [
      ...current,
      {
        asset: `${ticker} demo asset`,
        ticker,
        price: 0,
        change: 0,
        volume: "N/A",
        aiScore: 0,
        signal: "Watch",
        alert: "Disabled",
      },
    ]);
    setNewTicker("");
    setAddOpen(false);
  }

  return (
    <>
      <DashboardPageHeader
        titleKey="dashboard.watchlist"
        descriptionKey="dashboard.watchlistDescription"
        action={
          <Button onClick={() => setAddOpen(true)}>
            <Plus aria-hidden="true" />
            Add asset
          </Button>
        }
      />
      <Card className="shadow-none">
        <CardContent className="p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
            <label className="relative">
              <span className="sr-only">Search watchlist</span>
              <Search
                aria-hidden="true"
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
                placeholder="Search asset or ticker…"
              />
            </label>
            <label>
              <span className="sr-only">Filter by signal</span>
              <Select
                value={signal}
                onChange={(event) => setSignal(event.target.value)}
              >
                <option>All</option>
                <option>Bullish</option>
                <option>Bearish</option>
                <option>Watch</option>
              </Select>
            </label>
          </div>
        </CardContent>
      </Card>
      <Card className="mt-4 shadow-none">
        <CardContent className="px-0">
          <Table>
            <TableHeader className="sticky top-16 z-10 bg-card">
              <TableRow>
                <TableHead className="pl-5">Asset</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Daily change</TableHead>
                <TableHead className="text-right">Volume</TableHead>
                <TableHead className="text-right">AI score</TableHead>
                <TableHead>Signal</TableHead>
                <TableHead>Alert</TableHead>
                <TableHead className="pr-5">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((item) => (
                <TableRow key={item.ticker} tabIndex={0}>
                  <TableCell className="pl-5">
                    <p className="font-medium">{item.asset}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {item.ticker}
                    </p>
                  </TableCell>
                  <TableCell
                    data-numeric="true"
                    className="text-right font-mono"
                  >
                    ${item.price.toLocaleString()}
                  </TableCell>
                  <TableCell
                    data-numeric="true"
                    className={cn(
                      "text-right font-mono",
                      item.change >= 0 ? "text-success" : "text-destructive",
                    )}
                  >
                    {item.change >= 0 ? "+" : ""}
                    {item.change.toFixed(1)}%{" "}
                    <span className="sr-only">
                      {item.change >= 0 ? "increase" : "decrease"}
                    </span>
                  </TableCell>
                  <TableCell
                    data-numeric="true"
                    className="text-right font-mono"
                  >
                    {item.volume}
                  </TableCell>
                  <TableCell
                    data-numeric="true"
                    className="text-right font-mono"
                  >
                    {item.aiScore}/100
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      tone={
                        item.signal === "Bullish"
                          ? "success"
                          : item.signal === "Bearish"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {item.signal}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      <Bell aria-hidden="true" className="size-3" />
                      {item.alert}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Actions for ${item.asset}`}
                        >
                          <Ellipsis aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View analysis</DropdownMenuItem>
                        <DropdownMenuItem>Create alert</DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => setRemove(item)}
                        >
                          <Trash2 />
                          Remove
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
              <h2 className="font-medium">No matching assets</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Adjust the filters or add a demo asset.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add demo asset</DialogTitle>
            <DialogDescription>
              This interaction is stored only in local component state and does
              not connect to a brokerage account.
            </DialogDescription>
          </DialogHeader>
          <label className="space-y-2 text-sm">
            <span className="font-medium">Ticker symbol</span>
            <Input
              value={newTicker}
              onChange={(event) => setNewTicker(event.target.value)}
              placeholder="e.g. TSLA"
            />
          </label>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addAsset}>Add to watchlist</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(remove)}
        onOpenChange={(open) => !open && setRemove(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {remove?.ticker}?</DialogTitle>
            <DialogDescription>
              This removes the item from this local demo watchlist. It does not
              affect any real account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemove(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (remove)
                  setItems((current) =>
                    current.filter((item) => item.ticker !== remove.ticker),
                  );
                setRemove(null);
              }}
            >
              Remove asset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
