
"use client"

// Inspired by react-hot-toast library
import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000 * 60 * 5 // Keep toasts for 5 minutes after dismissal before removing from state

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

      if (toastId === undefined) { // Dismiss all toasts
        const allAlreadyClosed = state.toasts.every(t => !t.open);
        if (allAlreadyClosed) {
            // Still ensure they are queued for removal if not already
            state.toasts.forEach(t => addToRemoveQueue(t.id));
            return state; // All were already closed, no change to 'open' states, return original state object
        }
        // At least one toast needs to be closed
        state.toasts.forEach(t => addToRemoveQueue(t.id));
        return {
            ...state,
            toasts: state.toasts.map((t) => t.open ? { ...t, open: false } : t),
        };
      }

      // Dismiss specific toast
      const targetToastIndex = state.toasts.findIndex(t => t.id === toastId);
      if (targetToastIndex === -1) {
          return state; // Toast not found, return original state object
      }

      const targetToast = state.toasts[targetToastIndex];
      if (!targetToast.open) {
          addToRemoveQueue(toastId); // Ensure it's queued for removal
          return state; // Already closed, no change to 'open' status, return original state object
      }

      // Toast found and is open, mark it as closed
      addToRemoveQueue(toastId);
      // Create a new array with the modified toast
      const newToasts = state.toasts.map((t, index) => 
        index === targetToastIndex ? { ...targetToast, open: false } : t
      );
      return {
          ...state,
          toasts: newToasts,
      };
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        // If all toasts are already removed, return original state
        if(state.toasts.length === 0) return state;
        return {
          ...state,
          toasts: [],
        }
      }
      // If the specific toast to remove doesn't exist, return original state
      if (!state.toasts.find(t => t.id === action.toastId)) return state;
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

  // Only notify listeners if the state object reference has changed.
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
    const callback = (newState: State) => {
      // Ensure we only call setState if the part of the state we care about changed
      // For useToast, it's primarily the toasts array.
      // If memoryState didn't change its reference in dispatch, this listener wouldn't be called.
      // If it did, we update our local component state.
      setState(newState);
    };

    listeners.push(callback);
    return () => {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []); // Empty dependency array: subscribe/unsubscribe once.

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
