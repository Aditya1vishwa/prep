import { useCallback, useMemo } from "react"
import { useNavigate, useSearchParams, useLocation } from "react-router"
import type { ServerTableState, SortOrder } from "@/components/data-table/types"
import { isSortOrder } from "@/lib/table-utils"

const PAGE_KEY = "page"
const LIMIT_KEY = "limit"
const SEARCH_KEY = "search"
const SORT_BY_KEY = "sort_by"
const SORT_ORDER_KEY = "sort_order"
const COLUMN_VISIBILITY_KEY = "columns"

function parseNumber(value: string | null, fallback: number): number {
  if (value == null || value === "") return fallback
  const n = parseInt(value, 10)
  return Number.isNaN(n) ? fallback : Math.max(1, n)
}


export function useTableState(options: {
  defaultLimit?: number
  filterParamKeys?: readonly string[]
  persistColumnVisibility?: boolean
}): [ServerTableState, (updates: Partial<ServerTableState>) => void] {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const {
    defaultLimit = 10,
    filterParamKeys = [],
    persistColumnVisibility = false,
  } = options

  const state = useMemo((): ServerTableState => {
    const page = parseNumber(searchParams.get(PAGE_KEY), 1)
    const limit = parseNumber(searchParams.get(LIMIT_KEY), defaultLimit)
    const search = searchParams.get(SEARCH_KEY) ?? ""
    const sort_by = searchParams.get(SORT_BY_KEY) || null
    const sortOrderParam = searchParams.get(SORT_ORDER_KEY)
    const sort_order: SortOrder = isSortOrder(sortOrderParam) ? sortOrderParam : "asc"
    const filters: Record<string, string | number | boolean | null> = {}
    for (const key of filterParamKeys) {
      const v = searchParams.get(`filter_${key}`)
      if (v === "" || v === null) continue
      if (v === "true") filters[key] = true
      else if (v === "false") filters[key] = false
      else if (v !== "" && !Number.isNaN(Number(v))) filters[key] = Number(v)
      else filters[key] = v
    }

    let columnVisibility: Record<string, boolean> | undefined
    if (persistColumnVisibility) {
      const colParam = searchParams.get(COLUMN_VISIBILITY_KEY)
      if (colParam) {
        try {
          const decoded = JSON.parse(decodeURIComponent(colParam)) as Record<string, boolean>
          if (typeof decoded === "object" && decoded !== null) {
            columnVisibility = decoded
          }
        } catch {
        }
      }
    }
    return {
      page,
      limit,
      search,
      sort_by,
      sort_order,
      filters,
      columnVisibility,
    }
  }, [searchParams, defaultLimit, filterParamKeys, persistColumnVisibility])
  const setState = useCallback(
    (updates: Partial<ServerTableState>) => {
      const next = new URLSearchParams(searchParams.toString())
      if (updates.page !== undefined) next.set(PAGE_KEY, String(updates.page))
      if (updates.limit !== undefined) next.set(LIMIT_KEY, String(updates.limit))
      if (updates.search !== undefined) next.set(SEARCH_KEY, updates.search)
      if (updates.sort_by !== undefined) {
        if (updates.sort_by) next.set(SORT_BY_KEY, updates.sort_by)
        else next.delete(SORT_BY_KEY)
      }
      if (updates.sort_order !== undefined) next.set(SORT_ORDER_KEY, updates.sort_order)

      if (updates.filters !== undefined) {
        for (const key of filterParamKeys) {
          const v = updates.filters[key]
          const paramKey = `filter_${key}`
          if (v === undefined || v === null || v === "") next.delete(paramKey)
          else next.set(paramKey, String(v))
        }
      }
      if (updates.columnVisibility !== undefined && persistColumnVisibility) {
        if (Object.keys(updates.columnVisibility).length === 0) next.delete(COLUMN_VISIBILITY_KEY)
        else next.set(COLUMN_VISIBILITY_KEY, encodeURIComponent(JSON.stringify(updates.columnVisibility)))
      }
      const query = next.toString()
      navigate(query ? `${pathname}?${query}` : pathname)
    },
    [navigate, pathname, searchParams, filterParamKeys, persistColumnVisibility]
  )

  return [state, setState]
}
