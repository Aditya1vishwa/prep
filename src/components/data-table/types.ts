import type { ColumnDef, OnChangeFn, Row, RowSelectionState } from "@tanstack/react-table"
import * as React from "react"

export type SortOrder = "asc" | "desc"

export interface ServerTableState {
  page: number
  limit: number
  search: string
  sort_by: string | null
  sort_order: SortOrder
  filters: Record<string, string | number | boolean | null>
  columnVisibility?: Record<string, boolean>
}

export interface ServerTableParams {
  page: number
  limit: number
  offset: number
  search: string
  sort_by: string | null
  sort_order: SortOrder
  filters: Record<string, string | number | boolean | null>
}

export interface ServerTableResponse<TData> {
  data: TData[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ServerDataTableProps<TData> {
  tableState: ServerTableState
  onTableStateChange: (updates: Partial<ServerTableState>) => void
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  total: number
  isLoading?: boolean
  isFetching?: boolean
  onRefresh?: () => void
  filterSlot?: React.ReactNode
  searchPlaceholder?: string
  searchDebounceMs?: number
  enableColumnVisibility?: boolean
  pageSizeOptions?: readonly number[]
  expandableRowRender?: (row: Row<TData>) => React.ReactNode
  enableRowSelection?: boolean
  rowSelection?: RowSelectionState
  onRowSelectionChange?: OnChangeFn<RowSelectionState>
  bulkActions?: (selectedRows: TData[]) => React.ReactNode
  emptyState?: React.ReactNode
  error?: Error | null
  errorState?: React.ReactNode
  className?: string
  onRowClick?: (row: TData) => void
}

export interface SelectionColumnProps {
  rowSelection: RowSelectionState
  setRowSelection: OnChangeFn<RowSelectionState>
}


export interface UseTableStateGenericOptions {
  /** Initial/default limit */
  defaultLimit?: number
  /** Keys of custom filters to track */
  filterParamKeys?: readonly string[]
  /** Persist column visibility */
  persistColumnVisibility?: boolean
  /** Initial state (overrides defaults) */
  initialState?: Partial<ServerTableState>
  /** Callback when state changes (for persistence) */
  onStateChange?: (state: ServerTableState) => void
  /** Load initial state from external source (e.g., URL, localStorage) */
  loadInitialState?: () => Partial<ServerTableState>
}