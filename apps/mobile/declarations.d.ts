declare module '*.ttf' {
  const value: any;
  export default value;
}
declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_POSTHOG_API_KEY?: string;
  }
}
