export type RoomTier = 'standard' | 'premium';

export type PremiumRoom = {
  id: string;
  category: "bathroom" | "bedroom" | "cafe" | "kids" | "kitchen" | "livingroom";
  name: string;
  image: string;
  wallWidthPx: number;
  scaleFactor?: number;  // Optional per-scene scale multiplier (default: 1.0)
  tier?: RoomTier;  // 'standard' for 30+ free rooms, 'premium' for 100+ paid rooms (default: 'premium')
};

export const premiumRooms: PremiumRoom[] = [
  {
    "id": "bathroom_1",
    "category": "bathroom",
    "name": "Bathroom 1",
    "image": "/rooms/bathroom/bathroom1.jpg",
    "wallWidthPx": 750
  },
  {
    "id": "bathroom_2",
    "category": "bathroom",
    "name": "Bathroom 2",
    "image": "/rooms/bathroom/bathroom2.jpeg",
    "wallWidthPx": 800
  },
  {
    "id": "bathroom_3",
    "category": "bathroom",
    "name": "Bathroom 3",
    "image": "/rooms/bathroom/bathroom3.jpeg",
    "wallWidthPx": 850
  },
  {
    "id": "bathroom_4",
    "category": "bathroom",
    "name": "Bathroom 4",
    "image": "/rooms/bathroom/bathroom4.jpeg",
    "wallWidthPx": 900
  },
  {
    "id": "bathroom_5",
    "category": "bathroom",
    "name": "Bathroom 5",
    "image": "/rooms/bathroom/bathroom5.jpeg",
    "wallWidthPx": 950
  },
  {
    "id": "bathroom_6",
    "category": "bathroom",
    "name": "Bathroom 6",
    "image": "/rooms/bathroom/bathroom6.jpeg",
    "wallWidthPx": 750
  },
  {
    "id": "bathroom_7",
    "category": "bathroom",
    "name": "Bathroom 7",
    "image": "/rooms/bathroom/bathroom7.jpeg",
    "wallWidthPx": 800
  },
  {
    "id": "bathroom_8",
    "category": "bathroom",
    "name": "Bathroom 8",
    "image": "/rooms/bathroom/bathroom8.jpeg",
    "wallWidthPx": 850
  },
  {
    "id": "bathroom_9",
    "category": "bathroom",
    "name": "Bathroom 9",
    "image": "/rooms/bathroom/bathroom9.jpeg",
    "wallWidthPx": 900
  },
  {
    "id": "bathroom_10",
    "category": "bathroom",
    "name": "Bathroom 10",
    "image": "/rooms/bathroom/bathroom10.jpeg",
    "wallWidthPx": 950
  },
  {
    "id": "bathroom_11",
    "category": "bathroom",
    "name": "Bathroom 11",
    "image": "/rooms/bathroom/bathroom11.jpeg",
    "wallWidthPx": 750
  },
  {
    "id": "bathroom_12",
    "category": "bathroom",
    "name": "Bathroom 12",
    "image": "/rooms/bathroom/bathroom14.jpeg",
    "wallWidthPx": 800
  },
  {
    "id": "bedroom_1",
    "category": "bedroom",
    "name": "Bedroom 1",
    "image": "/rooms/bedroom/bedroom1.jpeg",
    "wallWidthPx": 900
  },
  {
    "id": "bedroom_2",
    "category": "bedroom",
    "name": "Bedroom 2",
    "image": "/rooms/bedroom/bedroom2.jpeg",
    "wallWidthPx": 950
  },
  {
    "id": "bedroom_3",
    "category": "bedroom",
    "name": "Bedroom 3",
    "image": "/rooms/bedroom/bedroom5.jpeg",
    "wallWidthPx": 1000
  },
  {
    "id": "bedroom_4",
    "category": "bedroom",
    "name": "Bedroom 4",
    "image": "/rooms/bedroom/bedroom6.jpeg",
    "wallWidthPx": 1050
  },
  {
    "id": "bedroom_5",
    "category": "bedroom",
    "name": "Bedroom 5",
    "image": "/rooms/bedroom/bedroom7.jpeg",
    "wallWidthPx": 1100
  },
  {
    "id": "bedroom_6",
    "category": "bedroom",
    "name": "Bedroom 6",
    "image": "/rooms/bedroom/bedroom8.jpeg",
    "wallWidthPx": 900
  },
  {
    "id": "bedroom_7",
    "category": "bedroom",
    "name": "Bedroom 7",
    "image": "/rooms/bedroom/bedroom9.jpeg",
    "wallWidthPx": 950
  },
  {
    "id": "bedroom_8",
    "category": "bedroom",
    "name": "Bedroom 8",
    "image": "/rooms/bedroom/bedroom10.jpeg",
    "wallWidthPx": 1000
  },
  {
    "id": "bedroom_9",
    "category": "bedroom",
    "name": "Bedroom 9",
    "image": "/rooms/bedroom/bedroom11.jpeg",
    "wallWidthPx": 1050
  },
  {
    "id": "bedroom_10",
    "category": "bedroom",
    "name": "Bedroom 10",
    "image": "/rooms/bedroom/bedroom12.jpeg",
    "wallWidthPx": 1100
  },
  {
    "id": "bedroom_11",
    "category": "bedroom",
    "name": "Bedroom 11",
    "image": "/rooms/bedroom/bedroom13.jpeg",
    "wallWidthPx": 900
  },
  {
    "id": "bedroom_12",
    "category": "bedroom",
    "name": "Bedroom 12",
    "image": "/rooms/bedroom/bedroom14.jpeg",
    "wallWidthPx": 950
  },
  {
    "id": "bedroom_13",
    "category": "bedroom",
    "name": "Bedroom 13",
    "image": "/rooms/bedroom/bedroom15.jpeg",
    "wallWidthPx": 1000
  },
  {
    "id": "bedroom_14",
    "category": "bedroom",
    "name": "Bedroom 14",
    "image": "/rooms/bedroom/bedroom18.jpeg",
    "wallWidthPx": 1050
  },
  {
    "id": "bedroom_15",
    "category": "bedroom",
    "name": "Bedroom 15",
    "image": "/rooms/bedroom/bedroom19.jpeg",
    "wallWidthPx": 1100
  },
  {
    "id": "bedroom_16",
    "category": "bedroom",
    "name": "Bedroom 16",
    "image": "/rooms/bedroom/bedroom20.jpeg",
    "wallWidthPx": 900
  },
  {
    "id": "bedroom_17",
    "category": "bedroom",
    "name": "Bedroom 17",
    "image": "/rooms/bedroom/bedroom21.jpeg",
    "wallWidthPx": 950
  },
  {
    "id": "bedroom_18",
    "category": "bedroom",
    "name": "Bedroom 18",
    "image": "/rooms/bedroom/bedroom22.jpeg",
    "wallWidthPx": 1000
  },
  {
    "id": "bedroom_19",
    "category": "bedroom",
    "name": "Bedroom 19",
    "image": "/rooms/bedroom/bedroom23.jpeg",
    "wallWidthPx": 1050
  },
  {
    "id": "bedroom_20",
    "category": "bedroom",
    "name": "Bedroom 20",
    "image": "/rooms/bedroom/bedroom24.jpeg",
    "wallWidthPx": 1100
  },
  {
    "id": "cafe_1",
    "category": "cafe",
    "name": "Cafe 1",
    "image": "/rooms/cafe/cafe1.jpeg",
    "wallWidthPx": 1050
  },
  {
    "id": "cafe_2",
    "category": "cafe",
    "name": "Cafe 2",
    "image": "/rooms/cafe/cafe2.jpeg",
    "wallWidthPx": 1100
  },
  {
    "id": "cafe_3",
    "category": "cafe",
    "name": "Cafe 3",
    "image": "/rooms/cafe/cafe3.jpeg",
    "wallWidthPx": 1150
  },
  {
    "id": "cafe_4",
    "category": "cafe",
    "name": "Cafe 4",
    "image": "/rooms/cafe/cafe4.jpeg",
    "wallWidthPx": 1200
  },
  {
    "id": "cafe_5",
    "category": "cafe",
    "name": "Cafe 5",
    "image": "/rooms/cafe/cafe5.jpeg",
    "wallWidthPx": 1250
  },
  {
    "id": "cafe_6",
    "category": "cafe",
    "name": "Cafe 6",
    "image": "/rooms/cafe/cafe6.jpeg",
    "wallWidthPx": 1050
  },
  {
    "id": "cafe_7",
    "category": "cafe",
    "name": "Cafe 7",
    "image": "/rooms/cafe/cafe7.jpeg",
    "wallWidthPx": 1100
  },
  {
    "id": "cafe_8",
    "category": "cafe",
    "name": "Cafe 8",
    "image": "/rooms/cafe/cafe10.jpeg",
    "wallWidthPx": 1150
  },
  {
    "id": "cafe_9",
    "category": "cafe",
    "name": "Cafe 9",
    "image": "/rooms/cafe/cafe11.jpeg",
    "wallWidthPx": 1200
  },
  {
    "id": "cafe_10",
    "category": "cafe",
    "name": "Cafe 10",
    "image": "/rooms/cafe/cafe13.jpeg",
    "wallWidthPx": 1250
  },
  {
    "id": "cafe_11",
    "category": "cafe",
    "name": "Cafe 11",
    "image": "/rooms/cafe/cafe14.jpeg",
    "wallWidthPx": 1050
  },
  {
    "id": "cafe_12",
    "category": "cafe",
    "name": "Cafe 12",
    "image": "/rooms/cafe/cafe15.jpeg",
    "wallWidthPx": 1100
  },
  {
    "id": "cafe_13",
    "category": "cafe",
    "name": "Cafe 13",
    "image": "/rooms/cafe/cafe16.jpeg",
    "wallWidthPx": 1150
  },
  {
    "id": "cafe_14",
    "category": "cafe",
    "name": "Cafe 14",
    "image": "/rooms/cafe/cafe17.jpeg",
    "wallWidthPx": 1200
  },
  {
    "id": "cafe_15",
    "category": "cafe",
    "name": "Cafe 15",
    "image": "/rooms/cafe/cafe18.jpeg",
    "wallWidthPx": 1250
  },
  {
    "id": "cafe_16",
    "category": "cafe",
    "name": "Cafe 16",
    "image": "/rooms/cafe/cafe19.jpeg",
    "wallWidthPx": 1050
  },
  {
    "id": "cafe_17",
    "category": "cafe",
    "name": "Cafe 17",
    "image": "/rooms/cafe/cafe20.jpeg",
    "wallWidthPx": 1100
  },
  {
    "id": "cafe_18",
    "category": "cafe",
    "name": "Cafe 18",
    "image": "/rooms/cafe/cafe21.jpeg",
    "wallWidthPx": 1150
  },
  {
    "id": "cafe_19",
    "category": "cafe",
    "name": "Cafe 19",
    "image": "/rooms/cafe/cafe22.jpeg",
    "wallWidthPx": 1200
  },
  {
    "id": "cafe_20",
    "category": "cafe",
    "name": "Cafe 20",
    "image": "/rooms/cafe/cafe23.jpeg",
    "wallWidthPx": 1250
  },
  {
    "id": "cafe_21",
    "category": "cafe",
    "name": "Cafe 21",
    "image": "/rooms/cafe/cafe24.jpeg",
    "wallWidthPx": 1050
  },
  {
    "id": "cafe_22",
    "category": "cafe",
    "name": "Cafe 22",
    "image": "/rooms/cafe/cafe26.jpeg",
    "wallWidthPx": 1100
  },
  {
    "id": "cafe_23",
    "category": "cafe",
    "name": "Cafe 23",
    "image": "/rooms/cafe/cafe27.jpeg",
    "wallWidthPx": 1150
  },
  {
    "id": "cafe_24",
    "category": "cafe",
    "name": "Cafe 24",
    "image": "/rooms/cafe/cafe28.jpeg",
    "wallWidthPx": 1200
  },
  {
    "id": "cafe_25",
    "category": "cafe",
    "name": "Cafe 25",
    "image": "/rooms/cafe/cafe29.jpeg",
    "wallWidthPx": 1250
  },
  {
    "id": "cafe_26",
    "category": "cafe",
    "name": "Cafe 26",
    "image": "/rooms/cafe/cafe30.jpeg",
    "wallWidthPx": 1050
  },
  {
    "id": "cafe_27",
    "category": "cafe",
    "name": "Cafe 27",
    "image": "/rooms/cafe/cafe31.jpeg",
    "wallWidthPx": 1100
  },
  {
    "id": "cafe_28",
    "category": "cafe",
    "name": "Cafe 28",
    "image": "/rooms/cafe/cafe32.jpeg",
    "wallWidthPx": 1150
  },
  // Kids Room
  { "id": "kids_1", "category": "kids", "name": "Kids Room 1", "image": "/rooms/kids/kidsroom1.jpeg", "wallWidthPx": 900 },
  { "id": "kids_2", "category": "kids", "name": "Kids Room 2", "image": "/rooms/kids/kidsroom2.jpeg", "wallWidthPx": 850 },
  { "id": "kids_3", "category": "kids", "name": "Kids Room 3", "image": "/rooms/kids/kidsroom3.jpeg", "wallWidthPx": 900 },
  { "id": "kids_4", "category": "kids", "name": "Kids Room 4", "image": "/rooms/kids/kidsroom4.jpg", "wallWidthPx": 950 },
  { "id": "kids_5", "category": "kids", "name": "Kids Room 5", "image": "/rooms/kids/kidsroom5.jpeg", "wallWidthPx": 900 },
  { "id": "kids_6", "category": "kids", "name": "Kids Room 6", "image": "/rooms/kids/kidsroom6.jpeg", "wallWidthPx": 850 },
  { "id": "kids_7", "category": "kids", "name": "Kids Room 7", "image": "/rooms/kids/kidsroom7.jpeg", "wallWidthPx": 900 },
  { "id": "kids_8", "category": "kids", "name": "Kids Room 8", "image": "/rooms/kids/kidsroom8.jpeg", "wallWidthPx": 950 },
  { "id": "kids_9", "category": "kids", "name": "Kids Room 9", "image": "/rooms/kids/kidsroom9.jpeg", "wallWidthPx": 900 },
  { "id": "kids_10", "category": "kids", "name": "Kids Room 10", "image": "/rooms/kids/kidsroom10.jpeg", "wallWidthPx": 850 },
  { "id": "kids_11", "category": "kids", "name": "Kids Room 11", "image": "/rooms/kids/kidsroom11.jpeg", "wallWidthPx": 900 },
  { "id": "kids_12", "category": "kids", "name": "Kids Room 12", "image": "/rooms/kids/kidsroom12.jpeg", "wallWidthPx": 950 },
  { "id": "kids_13", "category": "kids", "name": "Kids Room 13", "image": "/rooms/kids/kidsroom13.jpeg", "wallWidthPx": 900 },
  { "id": "kids_14", "category": "kids", "name": "Kids Room 14", "image": "/rooms/kids/kidsroom14.jpeg", "wallWidthPx": 850 },
  { "id": "kids_15", "category": "kids", "name": "Kids Room 15", "image": "/rooms/kids/kidsroom15.jpeg", "wallWidthPx": 900 },
  { "id": "kids_16", "category": "kids", "name": "Kids Room 16", "image": "/rooms/kids/kidsroom16.jpeg", "wallWidthPx": 950 },
  { "id": "kids_17", "category": "kids", "name": "Kids Room 17", "image": "/rooms/kids/kidsroom17.jpeg", "wallWidthPx": 900 },
  { "id": "kids_18", "category": "kids", "name": "Kids Room 18", "image": "/rooms/kids/kidsroom18.jpeg", "wallWidthPx": 850 },
  { "id": "kids_19", "category": "kids", "name": "Kids Room 19", "image": "/rooms/kids/kidsroom19.jpeg", "wallWidthPx": 900 },
  { "id": "kids_20", "category": "kids", "name": "Kids Room 20", "image": "/rooms/kids/kidsroom20.jpeg", "wallWidthPx": 950 },
  { "id": "kids_21", "category": "kids", "name": "Kids Room 21", "image": "/rooms/kids/kidsroom21.jpeg", "wallWidthPx": 900 },
  { "id": "kids_22", "category": "kids", "name": "Kids Room 22", "image": "/rooms/kids/kidsroom22.jpeg", "wallWidthPx": 850 },
  { "id": "kids_23", "category": "kids", "name": "Kids Room 23", "image": "/rooms/kids/kidsroom23.jpeg", "wallWidthPx": 900 },
  { "id": "kids_24", "category": "kids", "name": "Kids Room 24", "image": "/rooms/kids/kidsroom24.jpeg", "wallWidthPx": 950 },
  // Kitchen
  { "id": "kitchen_1", "category": "kitchen", "name": "Kitchen 1", "image": "/rooms/kitchen/kitchen1.jpeg", "wallWidthPx": 1000 },
  { "id": "kitchen_2", "category": "kitchen", "name": "Kitchen 2", "image": "/rooms/kitchen/kitchen2.jpeg", "wallWidthPx": 950 },
  { "id": "kitchen_3", "category": "kitchen", "name": "Kitchen 3", "image": "/rooms/kitchen/kitchen3.jpeg", "wallWidthPx": 1000 },
  { "id": "kitchen_4", "category": "kitchen", "name": "Kitchen 4", "image": "/rooms/kitchen/kitchen4.jpeg", "wallWidthPx": 1050 },
  { "id": "kitchen_5", "category": "kitchen", "name": "Kitchen 5", "image": "/rooms/kitchen/kitchen5.jpeg", "wallWidthPx": 1000 },
  { "id": "kitchen_6", "category": "kitchen", "name": "Kitchen 6", "image": "/rooms/kitchen/kitchen6.jpeg", "wallWidthPx": 950 },
  { "id": "kitchen_7", "category": "kitchen", "name": "Kitchen 7", "image": "/rooms/kitchen/kitchen7.jpeg", "wallWidthPx": 1000 },
  { "id": "kitchen_8", "category": "kitchen", "name": "Kitchen 8", "image": "/rooms/kitchen/kitchen8.jpeg", "wallWidthPx": 1050 },
  { "id": "kitchen_9", "category": "kitchen", "name": "Kitchen 9", "image": "/rooms/kitchen/kitchen9.jpeg", "wallWidthPx": 1000 },
  { "id": "kitchen_10", "category": "kitchen", "name": "Kitchen 10", "image": "/rooms/kitchen/kitchen10.jpeg", "wallWidthPx": 950 },
  { "id": "kitchen_11", "category": "kitchen", "name": "Kitchen 11", "image": "/rooms/kitchen/kitchen11.jpeg", "wallWidthPx": 1000 },
  { "id": "kitchen_12", "category": "kitchen", "name": "Kitchen 12", "image": "/rooms/kitchen/kitchen12.jpeg", "wallWidthPx": 1050 },
  { "id": "kitchen_13", "category": "kitchen", "name": "Kitchen 13", "image": "/rooms/kitchen/kitchen13.jpeg", "wallWidthPx": 1000 },
  { "id": "kitchen_14", "category": "kitchen", "name": "Kitchen 14", "image": "/rooms/kitchen/kitchen14.jpeg", "wallWidthPx": 950 },
  { "id": "kitchen_15", "category": "kitchen", "name": "Kitchen 15", "image": "/rooms/kitchen/kitchen15.jpeg", "wallWidthPx": 1000 },
  { "id": "kitchen_16", "category": "kitchen", "name": "Kitchen 16", "image": "/rooms/kitchen/kitchen16.jpeg", "wallWidthPx": 1050 },
  { "id": "kitchen_17", "category": "kitchen", "name": "Kitchen 17", "image": "/rooms/kitchen/kitchen17.jpeg", "wallWidthPx": 1000 },
  { "id": "kitchen_18", "category": "kitchen", "name": "Kitchen 18", "image": "/rooms/kitchen/kitchen18.jpeg", "wallWidthPx": 950 },
  { "id": "kitchen_19", "category": "kitchen", "name": "Kitchen 19", "image": "/rooms/kitchen/kitchen19.jpeg", "wallWidthPx": 1000 },
  { "id": "kitchen_20", "category": "kitchen", "name": "Kitchen 20", "image": "/rooms/kitchen/kitchen20.jpeg", "wallWidthPx": 1050 },
  { "id": "kitchen_21", "category": "kitchen", "name": "Kitchen 21", "image": "/rooms/kitchen/kitchen21.jpeg", "wallWidthPx": 1000 },
  { "id": "kitchen_22", "category": "kitchen", "name": "Kitchen 22", "image": "/rooms/kitchen/kitchen22.jpeg", "wallWidthPx": 950 },
  { "id": "kitchen_23", "category": "kitchen", "name": "Kitchen 23", "image": "/rooms/kitchen/kitchen23.jpeg", "wallWidthPx": 1000 },
  { "id": "kitchen_24", "category": "kitchen", "name": "Kitchen 24", "image": "/rooms/kitchen/kitchen24.jpeg", "wallWidthPx": 1050 },
  { "id": "kitchen_25", "category": "kitchen", "name": "Kitchen 25", "image": "/rooms/kitchen/kitchen25.jpeg", "wallWidthPx": 1000 },
  { "id": "kitchen_26", "category": "kitchen", "name": "Kitchen 26", "image": "/rooms/kitchen/kitchen26.jpeg", "wallWidthPx": 950 },
  { "id": "kitchen_27", "category": "kitchen", "name": "Kitchen 27", "image": "/rooms/kitchen/kitchen27.jpeg", "wallWidthPx": 1000 },
  { "id": "kitchen_28", "category": "kitchen", "name": "Kitchen 28", "image": "/rooms/kitchen/kitchen28.jpeg", "wallWidthPx": 1050 },
  { "id": "kitchen_29", "category": "kitchen", "name": "Kitchen 29", "image": "/rooms/kitchen/kitchen29.jpeg", "wallWidthPx": 1000 },
  { "id": "kitchen_30", "category": "kitchen", "name": "Kitchen 30", "image": "/rooms/kitchen/kitchen30.jpeg", "wallWidthPx": 950 },
  { "id": "kitchen_31", "category": "kitchen", "name": "Kitchen 31", "image": "/rooms/kitchen/kitchen31.jpeg", "wallWidthPx": 1000 },
  { "id": "kitchen_32", "category": "kitchen", "name": "Kitchen 32", "image": "/rooms/kitchen/kitchen32.jpeg", "wallWidthPx": 1050 },
  { "id": "kitchen_33", "category": "kitchen", "name": "Kitchen 33", "image": "/rooms/kitchen/kitchen33.jpeg", "wallWidthPx": 1000 },
  { "id": "kitchen_34", "category": "kitchen", "name": "Kitchen 34", "image": "/rooms/kitchen/kitchen34.jpeg", "wallWidthPx": 950 },
  { "id": "kitchen_35", "category": "kitchen", "name": "Kitchen 35", "image": "/rooms/kitchen/kitchen35.jpeg", "wallWidthPx": 1000 },
  { "id": "kitchen_36", "category": "kitchen", "name": "Kitchen 36", "image": "/rooms/kitchen/kitchen36.jpeg", "wallWidthPx": 1050 },
  { "id": "kitchen_37", "category": "kitchen", "name": "Kitchen 37", "image": "/rooms/kitchen/kitchen37.jpeg", "wallWidthPx": 1000 },
  { "id": "kitchen_38", "category": "kitchen", "name": "Kitchen 38", "image": "/rooms/kitchen/kitchen38.jpeg", "wallWidthPx": 950 },
  { "id": "kitchen_39", "category": "kitchen", "name": "Kitchen 39", "image": "/rooms/kitchen/kitchen39.jpeg", "wallWidthPx": 1000 },
  { "id": "kitchen_40", "category": "kitchen", "name": "Kitchen 40", "image": "/rooms/kitchen/kitchen40.jpeg", "wallWidthPx": 1050 },
  { "id": "kitchen_41", "category": "kitchen", "name": "Kitchen 41", "image": "/rooms/kitchen/kitchen41.jpeg", "wallWidthPx": 1000 },
  { "id": "kitchen_42", "category": "kitchen", "name": "Kitchen 42", "image": "/rooms/kitchen/kitchen42.jpeg", "wallWidthPx": 950 },
  { "id": "kitchen_43", "category": "kitchen", "name": "Kitchen 43", "image": "/rooms/kitchen/kitchen43.jpeg", "wallWidthPx": 1000 },
  { "id": "kitchen_44", "category": "kitchen", "name": "Kitchen 44", "image": "/rooms/kitchen/kitchen44.jpeg", "wallWidthPx": 1050 },
  // Living Room
  { "id": "livingroom_1", "category": "livingroom", "name": "Living Room 1", "image": "/rooms/livingroom/livingroom1.jpg", "wallWidthPx": 1100 },
  { "id": "livingroom_2", "category": "livingroom", "name": "Living Room 2", "image": "/rooms/livingroom/livingroom2.jpeg", "wallWidthPx": 1050 },
  { "id": "livingroom_3", "category": "livingroom", "name": "Living Room 3", "image": "/rooms/livingroom/livingroom3.jpg", "wallWidthPx": 1100 },
  { "id": "livingroom_4", "category": "livingroom", "name": "Living Room 4", "image": "/rooms/livingroom/livingroom4.jpeg", "wallWidthPx": 1150 },
  { "id": "livingroom_5", "category": "livingroom", "name": "Living Room 5", "image": "/rooms/livingroom/livingroom5.jpg", "wallWidthPx": 1100 },
  { "id": "livingroom_6", "category": "livingroom", "name": "Living Room 6", "image": "/rooms/livingroom/livingroom6.jpeg", "wallWidthPx": 1050 },
  { "id": "livingroom_7", "category": "livingroom", "name": "Living Room 7", "image": "/rooms/livingroom/livingroom7.jpg", "wallWidthPx": 1100 },
  { "id": "livingroom_8", "category": "livingroom", "name": "Living Room 8", "image": "/rooms/livingroom/livingroom8.jpeg", "wallWidthPx": 1150 },
  { "id": "livingroom_9", "category": "livingroom", "name": "Living Room 9", "image": "/rooms/livingroom/livingroom9.jpeg", "wallWidthPx": 1100 },
  { "id": "livingroom_10", "category": "livingroom", "name": "Living Room 10", "image": "/rooms/livingroom/livingroom10.jpeg", "wallWidthPx": 1050 },
  { "id": "livingroom_11", "category": "livingroom", "name": "Living Room 11", "image": "/rooms/livingroom/livingroom11.jpg", "wallWidthPx": 1100 },
  { "id": "livingroom_12", "category": "livingroom", "name": "Living Room 12", "image": "/rooms/livingroom/livingroom12.jpeg", "wallWidthPx": 1150 },
  { "id": "livingroom_13", "category": "livingroom", "name": "Living Room 13", "image": "/rooms/livingroom/livingroom13.jpeg", "wallWidthPx": 1100 },
  { "id": "livingroom_14", "category": "livingroom", "name": "Living Room 14", "image": "/rooms/livingroom/livingroom14.jpeg", "wallWidthPx": 1050 },
  { "id": "livingroom_15", "category": "livingroom", "name": "Living Room 15", "image": "/rooms/livingroom/livingroom15.jpeg", "wallWidthPx": 1100 },
  { "id": "livingroom_16", "category": "livingroom", "name": "Living Room 16", "image": "/rooms/livingroom/livingroom16.jpeg", "wallWidthPx": 1150 },
  { "id": "livingroom_17", "category": "livingroom", "name": "Living Room 17", "image": "/rooms/livingroom/livingroom17.jpeg", "wallWidthPx": 1100 },
  { "id": "livingroom_18", "category": "livingroom", "name": "Living Room 18", "image": "/rooms/livingroom/livingroom18.jpeg", "wallWidthPx": 1050 },
  { "id": "livingroom_19", "category": "livingroom", "name": "Living Room 19", "image": "/rooms/livingroom/livingroom19.jpg", "wallWidthPx": 1100 },
  { "id": "livingroom_20", "category": "livingroom", "name": "Living Room 20", "image": "/rooms/livingroom/livingroom20.jpeg", "wallWidthPx": 1150 },
  { "id": "livingroom_21", "category": "livingroom", "name": "Living Room 21", "image": "/rooms/livingroom/livingroom21.jpeg", "wallWidthPx": 1100 },
  { "id": "livingroom_22", "category": "livingroom", "name": "Living Room 22", "image": "/rooms/livingroom/livingroom22.jpeg", "wallWidthPx": 1050 }
];

export const getCategoryDisplayName = (category: string): string => {
  const names: Record<string, string> = {
    bathroom: "Bathroom",
    bedroom: "Bedroom",
    cafe: "Cafe",
    kids: "Kids Room",
    kitchen: "Kitchen",
    livingroom: "Living Room",
  };
  return names[category] || category;
};
