import { useCallback, useState } from 'react'

interface LaneDragAndDrop {
  dropTargetId: string | null
  setDropTargetId: (departmentId: string | null) => void
  handleDragStart: (employeeId: string) => void
  handleDrop: (departmentId: string) => void
}

/** Ephemeral pointer state for lane drag and drop; placement lives in the store. */
export const useLaneDragAndDrop = (
  onMove: (employeeId: string, departmentId: string) => void,
): LaneDragAndDrop => {
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dropTargetId, setDropTargetId] = useState<string | null>(null)

  const handleDragStart = useCallback((employeeId: string) => setDraggingId(employeeId), [])

  const handleDrop = useCallback(
    (departmentId: string) => {
      if (draggingId) onMove(draggingId, departmentId)
      setDraggingId(null)
      setDropTargetId(null)
    },
    [draggingId, onMove],
  )

  return { dropTargetId, setDropTargetId, handleDragStart, handleDrop }
}
