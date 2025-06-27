// src/app/types/global.d.ts
export {};

declare global {
  var mongoose: {
    conn: any | null;
    promise: Promise<any> | null;
  };
}
