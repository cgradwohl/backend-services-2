import {
  ApiPreferencesGetResponse,
  ApiPreferencesListResponse,
  ApiPreferencesPatchResponse,
  ApiPreferencesPutResponse,
  ApiPreferenceTemplateGetResponse,
  ApiPreferenceTemplatesGetResponse,
} from "~/types.public";

export interface IGetFn {
  (context: any): Promise<ApiPreferencesGetResponse>;
}

export interface IGetPreferenceTemplateFn {
  (context: any): Promise<ApiPreferenceTemplateGetResponse>;
}

export interface IGetPreferenceTemplatesFn {
  (context: any): Promise<ApiPreferenceTemplatesGetResponse>;
}

export interface IListFn {
  (context: any): Promise<ApiPreferencesListResponse>;
}

export interface IPatchFn {
  (context: any): Promise<ApiPreferencesPatchResponse>;
}

export interface IPutFn {
  (context: any): Promise<ApiPreferencesPutResponse>;
}
