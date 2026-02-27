import type { ServerTableState, ServerTableParams, SortOrder } from "@/components/data-table/types"


export const DEFAULT_TABLE_STATE: Readonly<ServerTableState> = {
    page: 1,
    limit: 10,
    search: "",
    sort_by: null,
    sort_order: "asc",
    filters: {},
} as const


export function tableStateToParams(state: ServerTableState): ServerTableParams {
    const { page, limit, search, sort_by, sort_order, filters } = state
    return {
        page,
        limit,
        offset: (page - 1) * limit,
        search: search.trim() || "",
        sort_by,
        sort_order,
        filters,
    }
}


export function isSortOrder(value: unknown): value is SortOrder {
    return value === "asc" || value === "desc"
}
