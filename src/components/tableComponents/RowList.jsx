import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash, Search, ArrowUpDown, ArrowUp, ArrowDown, X } from "lucide-react";
import { DisplayValueResolver } from "./displayValues/DisplayValueResolver";
import { useEffect, useState, useRef } from "react";
import { TablePagination, SkeletonLoader } from "@/components/ui";
import HorizontalScrollableContainer from "@/components/ui/layout/horizontal-scrollable-container";
import Swal from "sweetalert2";

export default function RowList({ fields, onEdit, queryKey, queryFn, deleteFn, loadingText = "Laster data..." }) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [expandedPages, setExpandedPages] = useState(false); // Track if ellipsis is expanded
  const [initialTotalRows, setInitialTotalRows] = useState(null); // State for initial total rows
  const searchInputRef = useRef(null);
  const clearButtonRef = useRef(null);

  const {
    data = { items: [], totalPages: 1 },
    isLoading,
    isError,
    isFetching,
  } = useQuery({
    queryKey: [...queryKey, page, pageSize, search, sortBy, sortOrder],
    queryFn: () => {
      return queryFn(page, pageSize, search, sortBy, sortOrder);
    },
    select: (res) => res?.data || { items: [], totalPages: 1 },
    refetchOnWindowFocus: true,
    placeholderData: (previousData) => previousData, // v5 equivalent of keepPreviousData
    staleTime: 100, // Consider data fresh for 100ms to reduce unnecessary refetches
  });
  // Set the initial total rows after the first query resolves (only when no search is active)
  useEffect(() => {
    if (initialTotalRows === null && data.items.length > 0 && search === "") {
      setInitialTotalRows(data.items.length);
      //console.log("Initial rows set to:", data.items.length);
    }
  }, [data.items.length, initialTotalRows, search]);

  // Calculate the number of empty rows based on the initial total rows
  // Only calculate empty rows if we have initial rows set AND we're not loading
  const emptyRowsCount = initialTotalRows !== null && !isLoading ? Math.max(0, initialTotalRows - data.items.length) : 0;

  const mutation = useMutation({
    mutationFn: deleteFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const handleSort = (fieldName) => {
    if (sortBy === fieldName) {
      // Cycle through: asc -> desc -> clear
      if (sortOrder === "asc") {
        setSortOrder("desc");
      } else if (sortOrder === "desc") {
        setSortBy("");
        setSortOrder("asc");
      }
    } else {
      setSortBy(fieldName);
      setSortOrder("asc");
    }
    setPage(1); // Reset to first page when sorting
  };

  const getSortIcon = (fieldName) => {
    if (sortBy !== fieldName) {
      return <ArrowUpDown size={14} className="text-gray-400" />;
    }
    return sortOrder === "asc" ? <ArrowUp size={14} className="text-blue-600" /> : <ArrowDown size={14} className="text-blue-600" />;
  };

  const clearSearch = () => {
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
    if (clearButtonRef.current) {
      clearButtonRef.current.style.display = "none";
    }
    setSearch("");
    setPage(1);
  };

  const handleSearch = () => {
    const inputValue = searchInputRef.current?.value || "";
    setSearch(inputValue);
    setPage(1); // Reset to first page when searching
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleDelete = (id) => {
    const confirmButtonColor = "#3b82f6"; // primary-500 from tailwind.config.js
    const cancelButtonColor = "#ef4444"; // error-500 from tailwind.config.js

    Swal.fire({
      title: "Er du sikker?",
      text: "Du vil ikke kunne angre dette!",
      showCancelButton: true,
      confirmButtonColor,
      cancelButtonColor,
      confirmButtonText: "Ja",
      cancelButtonText: "Nei",
    }).then((result) => {
      if (result.isConfirmed) {
        mutation.mutate(id);
        //Swal.fire("Slettet!", "Elementet ditt har blitt slettet.", "success");
      }
    });
  };

  if (isLoading && !data.items.length) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
        <SkeletonLoader cardCount={5} cardHeight={20} cardSpacing={12} />
      </div>
    );
  }

  if (isError || !data.items) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
        <p className="text-center text-red-500">Kunne ikke laste data. Vennligst prøv igjen senere.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
      {/* Search Input */}
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Søk..."
            defaultValue=""
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setSearch(e.target.value);
                setPage(1);
              } else if (e.key === "Escape") {
                clearSearch();
              }
            }}
            onInput={(e) => {
              if (clearButtonRef.current) {
                clearButtonRef.current.style.display = e.target.value.length > 0 ? "block" : "none";
              }
            }}
          />
          <button
            ref={clearButtonRef}
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            style={{ display: "none" }}
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        </div>
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Søk
        </button>
      </div>

      <HorizontalScrollableContainer fadeColor="from-white" dependencies={[data.items]} className="mb-4">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              {fields
                .filter((f) => !f.hiddenIndex)
                .map((f) => (
                  <th
                    key={f.name}
                    className="py-2 px-3 text-left text-sm font-semibold text-neutral-900 cursor-pointer hover:bg-neutral-100"
                    onClick={() => handleSort(f.name)}
                  >
                    <div className="flex items-center gap-2">
                      {f.label}
                      {getSortIcon(f.name)}
                    </div>
                  </th>
                ))}
              <th className="py-2 px-3 text-right text-sm font-semibold text-text-primary">Handlinger</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-muted bg-background-primary">
            {data.items.map((row) => (
              <tr key={row.id} className="hover:bg-background-muted h-[60px]">
                {fields
                  .filter((f) => !f.hiddenIndex)
                  .map((f) => {
                    const modelName = Array.isArray(queryKey) && queryKey.length > 0 ? queryKey[0] : null;
                    return (
                      <td key={f.name} className="py-2 px-3 text-sm text-text-primary">
                        {DisplayValueResolver.getDisplayComponent(row, f, "LIST", modelName, queryKey)}
                      </td>
                    );
                  })}
                <td className="py-2 px-3 text-right">
                  <div className="flex gap-2 justify-end">
                    <button className="btn btn-secondary w-8 h-8 p-0 shadow-sm hover:shadow" onClick={() => onEdit(row)} title="Rediger">
                      <Pencil size={16} />
                    </button>
                    {deleteFn && (
                      <button
                        className={`inline-flex items-center justify-center w-8 h-8 bg-background-muted text-error-600 hover:bg-error-50 hover:text-error-700 rounded-md border border-border-muted hover:border-error-300 transition-all shadow-sm hover:shadow`}
                        onClick={() => handleDelete(row.id)}
                        title="Slett"
                      >
                        <Trash size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {/* Add empty rows to maintain consistent height */}
            {emptyRowsCount > 0 &&
              Array.from({ length: emptyRowsCount }).map((_, index) => (
                <tr key={`empty-${index}`} className="h-[60px] border-none">
                  {fields
                    .filter((f) => !f.hiddenIndex)
                    .map((f) => (
                      <td key={f.name} className="py-2 px-3 text-sm text-text-primary border-none">
                        <div className="h-5"></div>
                      </td>
                    ))}
                  <td className="py-2 px-3 text-right border-none">
                    <div className="h-5"></div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </HorizontalScrollableContainer>

      {/* Additional Pagination Controls */}
      <TablePagination
        currentPage={page}
        totalPages={data.totalPages}
        onPageChange={setPage}
        expandedPages={expandedPages}
        onToggleExpandedPages={() => setExpandedPages(!expandedPages)}
      />
    </div>
  );
}
