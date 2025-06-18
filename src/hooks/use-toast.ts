
"use client"

// Inspired by react-hot-toast library
import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action;
      let stateChanged = false;

      // Ensure toastId exists for specific dismissal before queueing
      if (toastId && state.toasts.find(t => t.id === toastId && t.open)) {
         addToRemoveQueue(toastId);
         stateChanged = true; // Will definitely change 'open' status
      } else if (!toastId) { // Dismiss all toasts
        state.toasts.forEach((toast) => {
          if (toast.open) {
            addToRemoveQueue(toast.id);
            stateChanged = true; // At least one toast's 'open' status will change
          } else {
            // If already closed, ensure it's in the queue (idempotent check in addToRemoveQueue)
            addToRemoveQueue(toast.id);
          }
        });
      }


      const newToasts = state.toasts.map((t) => {
        if (t.id === toastId || toastId === undefined) {
          if (t.open === false) { // If already dismissed, return same object instance
            return t;
          }
          // If stateChanged wasn't true before, it is now.
          // This path (t.open was true) is the primary path where stateChanged becomes true for a specific toast.
          if (!stateChanged && t.open) stateChanged = true;
          return { ...t, open: false };
        }
        return t;
      });

      // If no toast's `open` status was actually changed to `false`
      // (e.g. dismissing an already dismissed toast or a non-existent one),
      // and the array itself hasn't changed (no toasts removed by other means), return original state.
      if (!stateChanged && state.toasts.length === newToasts.length && state.toasts.every((t, i) => t === newToasts[i]) ) {
        // Still ensure the specific toastId (if provided) is in remove queue,
        // as it might be called for an already closed toast to ensure it's eventually removed.
        if (toastId && state.toasts.find(t => t.id === toastId)) {
             addToRemoveQueue(toastId);
        }
        return state;
      }

      return {
        ...state,
        toasts: newToasts,
      };
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  const previousState = memoryState;
  memoryState = reducer(memoryState, action)
  // Only notify listeners if the state object reference has changed,
  // or if specific deep changes indicate a need to re-render.
  // For simplicity here, we assume reducer returns new state object if changed.
  if (memoryState !== previousState) {
    listeners.forEach((listener) => {
      listener(memoryState)
    })
  }
}

type Toast = Omit<ToasterToast, "id">

function toast({ ...props }: Toast) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
