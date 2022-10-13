import { Operation } from "fast-json-patch";
import { ICreatableBrand, IReplaceableBrand } from "~/lib/brands/types";

export interface IStudioBrandsPatchRequestBody {
  patch: Operation[];
}
// tslint:disable-next-line: no-empty-interface
export interface IStudioBrandsPostRequestBody extends ICreatableBrand {}
// tslint:disable-next-line: no-empty-interface
export interface IStudioBrandsPutRequestBody extends IReplaceableBrand {}
