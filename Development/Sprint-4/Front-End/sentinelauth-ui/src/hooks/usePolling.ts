import { useEffect, useRef } from 'react'

export function usePolling(task: () => void | Promise<void>, intervalMs: number) {
  const taskRef = useRef(task)

  useEffect(() => {
    taskRef.current = task
  }, [task])

  useEffect(() => {
    let timerId: number | undefined
    let cancelled = false

    const run = async () => {
      if (cancelled) {
        return
      }
      await taskRef.current()
      if (!cancelled) {
        timerId = window.setTimeout(run, intervalMs)
      }
    }

    void run()

    return () => {
      cancelled = true
      if (timerId) {
        window.clearTimeout(timerId)
      }
    }
  }, [intervalMs])
}
