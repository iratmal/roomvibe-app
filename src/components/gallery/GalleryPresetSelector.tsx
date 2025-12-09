import { galleryPresets, GalleryPreset } from '../../data/galleryPresets';

interface GalleryPresetSelectorProps {
  selectedPresetId: string | null;
  onSelect: (preset: GalleryPreset) => void;
}

export function GalleryPresetSelector({ selectedPresetId, onSelect }: GalleryPresetSelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-[#264C61]">Choose Gallery Space</h3>
      <div className="grid grid-cols-2 gap-4">
        {galleryPresets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onSelect(preset)}
            className={`relative overflow-hidden rounded-xl transition-all ${
              selectedPresetId === preset.id
                ? 'ring-2 ring-[#264C61] ring-offset-2 shadow-lg'
                : 'border border-slate-200 hover:border-[#264C61]/40 hover:shadow-md'
            }`}
          >
            <div
              className="aspect-[16/10] bg-cover bg-center"
              style={{ backgroundImage: `url(${preset.image})` }}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
              <h4 className="text-sm font-semibold text-white text-left">{preset.name}</h4>
              <p className="text-xs text-white/70 text-left truncate">{preset.description}</p>
            </div>
            {selectedPresetId === preset.id && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-[#264C61] rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
