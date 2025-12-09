export interface ArtworkPlacement {
  artworkId: number;
  x: number;
  y: number;
  scale: number;
}

export interface ExhibitionScene {
  exhibitionId: number;
  presetId: string;
  placements: ArtworkPlacement[];
  updatedAt: string;
}

export interface PlacedArtwork {
  id: number;
  title: string;
  artistName: string;
  imageUrl: string;
  width: number;
  height: number;
  dimensionUnit: string;
  price?: number | null;
  currency?: string;
  buyUrl?: string | null;
  x: number;
  y: number;
  scale: number;
}
