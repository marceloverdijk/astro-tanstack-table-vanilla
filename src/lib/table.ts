import {
  type Table,
  type TableOptions,
  type TableOptionsResolved,
  type RowData,
  createTable,
} from '@tanstack/table-core'
import { atom } from 'nanostores'

export function flexRender<TProps extends object>(comp: any, props: TProps) {
  if (typeof comp === 'function') {
    return comp(props)
  }
  return comp
}

export function useTable<TData extends RowData>(
  options: TableOptions<TData>
) {

  // Compose in the generic options to the user options
  const resolvedOptions: TableOptionsResolved<TData> = {
    state: {}, // Dummy state
    onStateChange: () => {}, // noop
    renderFallbackValue: null,
    ...options,
  }

  // Create a new table
  const table = createTable<TData>(resolvedOptions)

  // By default, manage table state here using the table's initial state
  const state = atom(table.initialState)

  // Subscribe to state changes
  state.subscribe((currentState) => {
    table.setOptions((prev) => ({
      ...prev,
      ...options,
      state: {
        ...currentState,
        ...options.state,
      },
      // Similarly, we'll maintain both our internal state and any user-provided state
      onStateChange: (updater) => {
        if (typeof updater === 'function') {
          const newState = updater(currentState)
          state.set(newState)
        } else {
          state.set(updater)
        }
        options.onStateChange?.(updater)
      },
    }))
  })

  return table
}


export function renderTable<TData extends RowData>(el: string, table: Table<TData>): void {

  console.log('renderTable called')

  // Create table elements
  const tableElement = document.createElement('table')
  const theadElement = document.createElement('thead')
  const tbodyElement = document.createElement('tbody')
  tableElement.classList.add('table', 'table-hover')
  tableElement.appendChild(theadElement)
  tableElement.appendChild(tbodyElement)

  // Render table headers
  table.getHeaderGroups().forEach((headerGroup) => {
    const tr = document.createElement('tr')
    headerGroup.headers.forEach((header) => {
      const th = document.createElement('th')
      th.innerHTML = header.isPlaceholder
        ? ''
        : flexRender(header.column.columnDef.header, header.getContext())
      tr.appendChild(th)
    })
    theadElement.appendChild(tr)
  })

  // Render table rows for the current page
  table.getRowModel().rows.forEach((row) => {
    const tr = document.createElement('tr')
    row.getVisibleCells().forEach((cell) => {
      const td = document.createElement('td')
      td.innerHTML = flexRender(cell.column.columnDef.cell, cell.getContext())
      tr.appendChild(td)
    })
    tbodyElement.appendChild(tr)
  })

  // Pagination controls
  const paginationElement = document.createElement('div')

  // Previous page button
  const prevButton = document.createElement('button')
  prevButton.classList.add('btn', 'btn-primary', 'me-2');
  prevButton.innerHTML = 'Previous'
  prevButton.disabled = !table.getCanPreviousPage()
  prevButton.onclick = () => {
    table.previousPage()
    renderTable(el, table) // Re-render the table with updated page
  }
  paginationElement.appendChild(prevButton)

  // Next page button
  const nextButton = document.createElement('button')
  nextButton.classList.add('btn', 'btn-primary', 'me-2');
  nextButton.innerHTML = 'Next'
  nextButton.disabled = !table.getCanNextPage()
  nextButton.onclick = () => {
    table.nextPage()
    renderTable(el, table) // Re-render the table with updated page
  }
  paginationElement.appendChild(nextButton)

  // Clear previous content and append new content
  const container = document.getElementById(el)
  if (container) {
    container.innerHTML = ''
    container.appendChild(tableElement) // Add table
    container.appendChild(paginationElement) // Add pagination controls
  }
}
