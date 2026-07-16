export interface ManifestIcon {
  src?: string;
  sizes?: string;
  type?: string;
  purpose?: string;
}

export interface WebAppManifest {
  icons?: ManifestIcon[];
}
