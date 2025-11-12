export type Theme = 'azure' | 'royal' | 'sunset';
export type Mode = 'showcase' | 'designer';
export type CheckoutType = 'shopify' | 'thrivecart';
export type RoomPreset = 'living' | 'hallway' | 'bedroom';
export type FrameOption = 'none' | 'black' | 'white' | 'oak';

export interface Artwork {
  id: string;
  title: string;
  image: string;
  ratio: number;
  sizes: string[];
  frameOptions: FrameOption[];
  price: number;
  checkout: {
    type: CheckoutType;
    template: string;
  };
  tags: string[];
}

export interface RoomVibeProps {
  mode?: Mode;
  collection?: string;
  theme?: Theme;
  oneClickBuy?: boolean;
  checkoutType?: CheckoutType;
  checkoutLinkTemplate?: string;
  onEvent?: (event: AnalyticsEvent) => void;
}

export interface AnalyticsEvent {
  type: 'rv_view' | 'rv_art_select' | 'rv_size_change' | 'rv_wall_color_change' | 
        'rv_buy_click' | 'rv_email_submit' | 'rv_share_copy' | 'rv_designer_mode_toggle' | 
        'rv_frame_change' | 'rv_room_change';
  artId?: string;
  size?: string;
  theme?: Theme;
  mode?: Mode;
  wallColor?: string;
  frame?: FrameOption;
  room?: RoomPreset;
  ts: number;
}
