import 'solid-js'

declare module 'solid-js' {
  namespace JSX {
    interface Directives {
      draggable: unknown
      droppable: unknown
    }
  }
}
