declare global {
  var __ExpoImportMetaRegistry:
    | {
        readonly url: string | null;
      }
    | undefined;
}

if (typeof globalThis.__ExpoImportMetaRegistry === 'undefined') {
  globalThis.__ExpoImportMetaRegistry = {
    get url() {
      return null;
    },
  };
}

export {};
