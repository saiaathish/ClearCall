export interface MediaLibraryItem {
  id: string;
  src: string;
  width: number;
  height: number;
  alt: string;
  tags: readonly string[];
}
