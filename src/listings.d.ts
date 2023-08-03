export interface IListingOptions {
  recursive?: boolean;
  fullPath?: boolean;
  relativePath?: boolean;
  extentions?: string[];
  excludeSystemFiles?: boolean;
  includePatterns?: RegExp[];
  excludePatterns?: RegExp[];
}
