export type PremiumRoom = {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
};

const categories = ["living_room", "bedroom", "office", "gallery"];

const categoryNames: Record<string, string> = {
  living_room: "Living Room",
  bedroom: "Bedroom",
  office: "Office",
  gallery: "Gallery",
};

export const premiumRooms: PremiumRoom[] = Array.from({ length: 100 }, (_, i) => {
  const index = i + 1;
  const category = categories[i % categories.length];
  return {
    id: `PRM_ROOM_${index.toString().padStart(2, "0")}`,
    name: `${categoryNames[category]} ${Math.ceil(index / 4)}`,
    category,
    imageUrl: "/images/rooms/premium/default.jpg",
  };
});

export const getCategoryDisplayName = (category: string): string => {
  return categoryNames[category] || category;
};
