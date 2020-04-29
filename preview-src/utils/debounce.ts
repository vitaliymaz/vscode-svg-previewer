export function debounce (func: Function, wait: number) {
  let timeout: NodeJS.Timer
  return (...args: any[]) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
