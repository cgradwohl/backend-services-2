// TS 4.1 supports recursive type aliases, this can be improved post update
// type UnpackPromise<T> = T extends PromiseLike<infer U> ? UnpackPromise<U> : T
export type UnpackPromise<T> = T extends PromiseLike<infer U> ? U : T;
