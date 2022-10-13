declare module "project-name-generator" {
  export type ProjectNameGeneratorOptions = {
    words?: number;
    number?: boolean;
    alliterative?: boolean;
  };

  export type ProjectNameGeneratorResult = {
    raw: string[];
    dashed: string;
    spaced: string;
  };

  export function generate(
    options: ProjectNameGeneratorOptions
  ): ProjectNameGeneratorResult;
}

declare module "encode32" {
  export function decode32(input: string): number;
  export function encode32(input: number): string;
}
