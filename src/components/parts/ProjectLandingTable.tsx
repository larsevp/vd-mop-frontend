import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/shadcn-io/table";
import { useReactTable, getCoreRowModel, getFilteredRowModel, ColumnFiltersState, flexRender } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { getPaginatedEnhet } from "@/api/endpoints";

export default function ProjectLandingTable() {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [data, setData] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch paginated data
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getPaginatedEnhet(page, pageSize);
        setData(response.data.items);
        setTotalPages(response.data.totalPages);
      } catch (error) {
        console.error("Error fetching paginated data:", error);
      }
    };
    fetchData();
  }, [page, pageSize]);

  const columns = [
    {
      accessorKey: "prosjektnummer",
      header: "Prosjektnummer",
    },
    {
      accessorKey: "navn",
      header: "Prosjektnavn",
    },
    {
      accessorKey: "beskrivelse",
      header: "Beskrivelse",
    },
    {
      accessorKey: "actions",
      header: "",
      cell: ({ row }) => (
        <a
          className="text-blue-600 hover:text-blue-900 hover:underline font-semibold"
          href={`/projects/${row.id}`}
        >
          Åpne
        </a>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: {
      columnFilters,
      globalFilter,
    },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: "includesString",
  });

  return (
    <section className="max-w-screen-xl mx-auto px-4 py-12 sm:px-6 md:px-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-neutral-900 flex-shrink-0">Alle prosjekter</h2>
        <div className="flex items-center gap-1 ml-auto">
          <div className="flex items-center rounded-lg px-2 py-1 w-full max-w-lg bg-white">
            <span className="text-gray-400 mr-2">🔍</span>
            <Input
              type="text"
              placeholder="Søk"
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(String(event.target.value))}
              className="flex-1 text-sm focus:outline-none focus:ring-0 placeholder-gray-400"
            />
          </div>
        </div>
      </div>
      <div className="rounded-md overflow-hidden border shadow-md">
        <Table className="min-w-full divide-y divide-neutral-200">
          <TableHeader className="bg-neutral-50 border-b-1 border-neutral-300">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-neutral-900 sm:pl-6">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="divide-y divide-neutral-200 bg-white">
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-neutral-50">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-neutral-500 sm:pl-6">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
          className="px-4 py-2 bg-gray-200 text-gray-600 rounded-md disabled:opacity-50"
        >
          Forrige
        </button>
        <span>
          Side {page} av {totalPages}
        </span>
        <button
          onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={page === totalPages}
          className="px-4 py-2 bg-gray-200 text-gray-600 rounded-md disabled:opacity-50"
        >
          Neste
        </button>
      </div>
    </section>
  );
}