export * from "./generated/api";
export * from "./generated/types";
// Operations with both path and query params generate a Zod `<Op>Params` (path)
// and a TS `<Op>Params` (query) with the same name. Prefer the Zod schema here.
export { GetLineupsParams, GetSubstitutesParams } from "./generated/api";
