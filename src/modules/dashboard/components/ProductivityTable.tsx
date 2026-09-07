import { useState, useMemo, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Badge } from "@/shared/ui/badge";
import { Input } from "@/shared/ui/input";
import { Skeleton } from "@/shared/ui/skeleton";
import { Search, ArrowUpDown, ArrowUp, ArrowDown, AlertTriangle } from "lucide-react";
import type { MitraPerformanceMetrics } from "@/modules/dashboard/types";

interface ProductivityTableProps {
  metrics: MitraPerformanceMetrics[];
  isLoading: boolean;
  className?: string;
  activeHoverId?: string | null;
  onHoverMitra?: (id: string | null) => void;
}

type SortField = "name" | "requestCount" | "totalItems" | "averageLifespanDays" | "daysSinceLastRequest" | "status";
type SortOrder = "asc" | "desc";

const getBadgeStyle = (status: MitraPerformanceMetrics["status"]) => {
  switch (status) {
    case "Fast":
      return "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400";
    case "Steady":
      return "bg-blue-500/10 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400";
    case "Slow":
      return "bg-amber-500/10 text-amber-700 dark:bg-amber-950/40 dark:text-amber-500";
    case "Idle":
      return "bg-rose-500/10 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400";
    default:
      return "bg-zinc-500/10 text-zinc-600 dark:bg-zinc-800/40 dark:text-zinc-400";
  }
};

function ProductivityTableBase({
  metrics,
  isLoading,
  className,
  activeHoverId,
  onHoverMitra,
}: ProductivityTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [sortField, setSortField] = useState<SortField>("averageLifespanDays");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-3 w-3 opacity-40 inline" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3 text-primary inline" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3 text-primary inline" />
    );
  };

  const filteredAndSortedMetrics = useMemo(() => {
    return metrics
      .filter((m) => {
        const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "All" || m.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        // Handle priority sorting for null values
        let valA = a[sortField];
        let valB = b[sortField];

        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (typeof valA === "string" && typeof valB === "string") {
          return sortOrder === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }

        return sortOrder === "asc"
          ? (valA as number) - (valB as number)
          : (valB as number) - (valA as number);
      });
  }, [metrics, searchTerm, statusFilter, sortField, sortOrder]);

  const maxLifespan = useMemo(() => {
    const valid = metrics
      .map((m) => m.averageLifespanDays)
      .filter((days): days is number => days !== null && days > 0);
    return valid.length > 0 ? Math.max(...valid) : 30;
  }, [metrics]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-1" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full rounded-md" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const filterTabs = [
    { label: "Semua", value: "All" },
    { label: "Fast", value: "Fast" },
    { label: "Steady", value: "Steady" },
    { label: "Slow", value: "Slow" },
    { label: "Idle", value: "Idle" },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Analisis Produktivitas Mitra</CardTitle>
            <CardDescription>Rincian kecepatan perputaran (depletion rate) per mitra</CardDescription>
          </div>

          {/* Filter Status Tabs */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg self-start sm:self-auto text-xs">
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusFilter(tab.value)}
                className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                  statusFilter === tab.value
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar Toolbar */}
        <div className="mt-3 relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cari nama mitra..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs max-w-sm"
          />
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead
                  onClick={() => handleSort("name")}
                  className="cursor-pointer select-none hover:text-foreground font-semibold text-xs">
                  Nama Mitra {renderSortIcon("name")}
                </TableHead>
                <TableHead
                  onClick={() => handleSort("requestCount")}
                  className="text-center cursor-pointer select-none hover:text-foreground font-semibold text-xs">
                  Total BAST {renderSortIcon("requestCount")}
                </TableHead>
                <TableHead
                  onClick={() => handleSort("totalItems")}
                  className="text-center cursor-pointer select-none hover:text-foreground font-semibold text-xs">
                  Total Item {renderSortIcon("totalItems")}
                </TableHead>
                <TableHead
                  onClick={() => handleSort("averageLifespanDays")}
                  className="text-center cursor-pointer select-none hover:text-foreground font-semibold text-xs">
                  Avg. Lifespan {renderSortIcon("averageLifespanDays")}
                </TableHead>
                <TableHead
                  onClick={() => handleSort("daysSinceLastRequest")}
                  className="text-center cursor-pointer select-none hover:text-foreground font-semibold text-xs">
                  Days Idle {renderSortIcon("daysSinceLastRequest")}
                </TableHead>
                <TableHead
                  onClick={() => handleSort("status")}
                  className="text-center cursor-pointer select-none hover:text-foreground font-semibold text-xs">
                  Status {renderSortIcon("status")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedMetrics.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground h-24 text-xs">
                    Tidak ada data mitra yang sesuai filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedMetrics.map((mitra) => {
                  const isHovered = activeHoverId === mitra.id;
                  const isIdle = mitra.status === "Idle" || mitra.isIdleStock;
                  const lifespanDays = mitra.averageLifespanDays;
                  const percentWidth = lifespanDays !== null && maxLifespan > 0
                    ? Math.min(100, Math.max(10, Math.round((lifespanDays / maxLifespan) * 100)))
                    : 0;

                  return (
                    <TableRow
                      key={mitra.id}
                      onMouseEnter={() => onHoverMitra?.(mitra.id)}
                      onMouseLeave={() => onHoverMitra?.(null)}
                      className={`transition-colors duration-150 ${
                        isHovered
                          ? "bg-primary/10 shadow-xs"
                          : isIdle
                          ? "bg-rose-500/5 hover:bg-rose-500/10 border-l-2 border-l-rose-500"
                          : "hover:bg-muted/40"
                      }`}>
                      <TableCell className="font-medium text-xs">
                        <div className="flex items-center gap-1.5">
                          {isIdle && <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0" />}
                          <span>{mitra.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-xs">{mitra.requestCount}</TableCell>
                      <TableCell className="text-center text-xs">{mitra.totalItems}</TableCell>

                      {/* Avg. Lifespan Column with Mini Progress Meter */}
                      <TableCell className="text-center text-xs">
                        {lifespanDays !== null ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-medium">{lifespanDays} Hari</span>
                            <div className="w-16 bg-muted h-1 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  lifespanDays <= 7
                                    ? "bg-emerald-500"
                                    : lifespanDays <= 14
                                    ? "bg-blue-500"
                                    : "bg-amber-500"
                                }`}
                                style={{ width: `${percentWidth}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>

                      <TableCell className="text-center text-xs">
                        <span className={mitra.daysSinceLastRequest >= 30 ? "text-rose-600 font-semibold dark:text-rose-400" : ""}>
                          {mitra.daysSinceLastRequest} Hari
                        </span>
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge variant="secondary" size="sm" className={getBadgeStyle(mitra.status)}>
                          {mitra.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export const ProductivityTable = memo(ProductivityTableBase);
