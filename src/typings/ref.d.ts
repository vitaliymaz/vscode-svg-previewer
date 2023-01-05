// Define TextEncoder + TextDecoder globals for both browser and node runtimes
// Source: https://github.com/microsoft/vscode/blob/1.52.0/extensions/types/lib.textEncoder.d.ts
// Proper fix: https://github.com/microsoft/TypeScript/issues/31535
declare var TextDecoder: typeof import('util').TextDecoder;
