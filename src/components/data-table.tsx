"use client"

import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  IconChevronDown,
  IconChevronRight,
  IconDotsVertical,
  IconGripVertical,
  IconLayoutColumns,
  IconTrendingUp,
  IconSearch,
  IconFilter,
} from "@tabler/icons-react"
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  getExpandedRowModel,
  type ColumnDef,
  type ColumnFiltersState,
  type ExpandedState,
  type Row,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { z } from "zod"

import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Checkbox } from "@/components/ui/checkbox"

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
} from "@/components/ui/tabs"

export const schema = z.object({
  id: z.number(),
  tanggal: z.string(),
  nomor: z.string(),
  kategori: z.string(),
  status: z.string().default("Selesai"),
  items: z.array(z.object({
    sn: z.string(),
    nama: z.string().optional(),
    kategori: z.string().optional(),
    merek: z.string(),
    asal: z.string(),
    tujuan: z.string()
  })).default([])
})

// Create a separate component for the drag handle
function DragHandle({ id }: { id: number }) {
  const { attributes, listeners } = useSortable({
    id,
  })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="size-7 text-muted-foreground hover:bg-transparent"
    >
      <IconGripVertical className="size-3 text-muted-foreground" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

const columns: ColumnDef<z.infer<typeof schema>>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center gap-2 px-2">
        <div className="w-6" /> {/* Placeholder untuk chevron expand */}
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2 pl-2 pr-4">
        <div
          className="cursor-pointer p-1 hover:bg-muted rounded text-muted-foreground"
          onClick={(e) => {
            e.stopPropagation();
            row.toggleExpanded();
          }}
        >
          {row.getIsExpanded() ? <IconChevronDown className="size-4" /> : <IconChevronRight className="size-4" />}
        </div>
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "tanggal",
    header: "Tanggal",
    cell: ({ row }) => (
      <div className="text-muted-foreground whitespace-nowrap">
        {row.original.tanggal}
      </div>
    ),
  },
  {
    accessorKey: "nomor",
    header: "Nomor",
    cell: ({ row }) => (
      <div className="font-medium text-primary">
        {row.original.nomor}
      </div>
    ),
  },
  {
    accessorKey: "kategori",
    header: "Kategori",
    cell: ({ row }) => {
      const kat = row.original.kategori;
      let colorClass = "bg-muted-foreground";
      if (kat === "Masuk") colorClass = "bg-emerald-500";
      if (kat === "Keluar") colorClass = "bg-sky-500";
      if (kat === "Rusak") colorClass = "bg-rose-500";

      return (
        <Badge variant="secondary" className="font-normal gap-1.5 px-2.5 py-0.5">
          <div className={`w-1.5 h-1.5 rounded-full ${colorClass}`} />
          {kat}
        </Badge>
      )
    },
  },
  {
    id: "ringkasan_barang",
    header: "Ringkasan Barang",
    cell: ({ row }) => {
      const items = row.original.items || [];
      const totalBarang = items.length;
      return (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{totalBarang} barang</span>
        </div>
      );
    },
  },
  {
    id: "lokasi_terlibat",
    header: "Lokasi Terlibat",
    cell: ({ row }) => {
      const items = row.original.items || [];
      const lokasiSet = new Set<string>();
      items.forEach((i: any) => {
        if (i.asal) lokasiSet.add(i.asal);
        if (i.tujuan) lokasiSet.add(i.tujuan);
      });
      const lokasiList = Array.from(lokasiSet).filter(l => l !== "Keluar" && l !== "Masuk" && l !== "-" && !l.includes("Supplier"));

      const totalLokasi = lokasiList.length;
      let summaryStr = "";
      if (totalLokasi === 0) summaryStr = "-";
      else if (totalLokasi <= 2) summaryStr = lokasiList.join(", ");
      else summaryStr = `${lokasiList[0]}, ${lokasiList[1]} +${totalLokasi - 2} lainnya`;

      return (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{totalLokasi} lokasi</span>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status || "Selesai";
      let colorClass = "bg-muted-foreground";
      if (status === "Selesai") colorClass = "bg-emerald-500";
      if (status === "Draft") colorClass = "bg-amber-500";
      if (status === "Dibatalkan") colorClass = "bg-rose-500";

      return (
        <Badge variant="secondary" className="font-normal gap-1.5 px-2.5 py-0.5">
          <div className={`w-1.5 h-1.5 rounded-full ${colorClass}`} />
          {status}
        </Badge>
      )
    }
  },
  {
    id: "actions",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
            size="icon"
          >
            <IconDotsVertical />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem>Lihat Detail</DropdownMenuItem>
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Export PDF</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Batalkan</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

function DraggableRow({ row }: { row: Row<z.infer<typeof schema>> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

  return (
    <>
      <TableRow
        data-state={row.getIsSelected() && "selected"}
        data-dragging={isDragging}
        ref={setNodeRef}
        className={`relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80 cursor-pointer transition-colors ${row.getIsExpanded() ? 'bg-muted/30 hover:bg-muted/40' : ''}`}
        style={{
          transform: CSS.Transform.toString(transform),
          transition: transition,
          touchAction: "pan-y",
        }}
        onClick={() => row.toggleExpanded()}
      >
        {row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id} className="py-3">
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
      {row.getIsExpanded() && row.original.items && row.original.items.length > 0 && (
        <TableRow className="hover:bg-transparent bg-muted/5 border-b-0">
          <TableCell colSpan={row.getVisibleCells().length} className="p-0 border-b-2 border-border/50">
            <div className="px-6 py-4 w-full overflow-hidden">
              <div className="py-2">
                <div className="rounded-md border bg-card overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="h-9 py-2 text-xs font-medium">Serial Number</TableHead>
                        <TableHead className="h-9 py-2 text-xs font-medium">Kategori</TableHead>
                        <TableHead className="h-9 py-2 text-xs font-medium">Merek</TableHead>
                        <TableHead className="h-9 py-2 text-xs font-medium">Lokasi Asal</TableHead>
                        <TableHead className="h-9 py-2 text-xs font-medium">Lokasi Tujuan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {row.original.items.map((item: any, idx: number) => (
                        <TableRow key={idx} className="hover:bg-muted/30 cursor-default" onClick={(e) => e.stopPropagation()}>
                          <TableCell className="py-2.5">
                            <span className="text-foreground text-muted-foreground">{item.sn}</span>
                          </TableCell>
                          <TableCell className="py-2.5">
                            <span className="text-sm text-foreground">{item.kategori || row.original.kategori || "Masuk"}</span>
                          </TableCell>
                          <TableCell className="py-2.5">
                            <span className="text-sm text-foreground">{item.merek}</span>
                          </TableCell>
                          <TableCell className="py-2.5">
                            <span className="text-sm text-foreground">{item.asal || "-"}</span>
                          </TableCell>
                          <TableCell className="py-2.5">
                            <span className="text-sm text-foreground">{item.tujuan || "-"}</span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

export function DataTable({
  data: initialData,
  showTitle = true,
  showViewButton = true,
  showSelection = true,
}: {
  data: z.infer<typeof schema>[]
  showTitle?: boolean
  showViewButton?: boolean
  showSelection?: boolean
}) {
  const [data, setData] = React.useState(() => initialData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      select: showSelection,
    })
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {})
  )

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) || [],
    [data]
  )

  const [expanded, setExpanded] = React.useState<ExpandedState>({})

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
      expanded,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getExpandedRowModel: getExpandedRowModel(),
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(data, oldIndex, newIndex)
      })
    }
  }

  return (
    <Tabs
      defaultValue="outline"
      className="w-full flex-col justify-start"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 lg:px-6">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Filtering is now handled by the parent component */}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <DropdownMenu>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <TabsContent
        value="outline"
        className="relative flex flex-col gap-4 overflow-auto"
      >
        <div className="overflow-hidden rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {table.getRowModel().rows?.length ? (
                  <SortableContext
                    items={dataIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
      </TabsContent>
    </Tabs>
  )
}

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
]

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--primary)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--primary)",
  },
} satisfies ChartConfig

