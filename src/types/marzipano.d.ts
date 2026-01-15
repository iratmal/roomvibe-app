declare module 'marzipano' {
  export interface ViewerOptions {
    controls?: {
      mouseViewMode?: string;
    };
    stage?: {
      preserveDrawingBuffer?: boolean;
    };
  }

  export interface LimiterParams {
    yawMin?: number;
    yawMax?: number;
    pitchMin?: number;
    pitchMax?: number;
    fovMin?: number;
    fovMax?: number;
  }

  export interface ViewParams {
    yaw?: number;
    pitch?: number;
    fov?: number;
  }

  export class Viewer {
    constructor(element: HTMLElement, options?: ViewerOptions);
    createScene(options: {
      source: ImageUrlSource;
      geometry: EquirectGeometry;
      view: RectilinearView;
      pinFirstLevel?: boolean;
    }): Scene;
    scene(): Scene | null;
    switchScene(scene: Scene, options?: { transitionDuration?: number }, done?: () => void): void;
    destroy(): void;
    updateSize(): void;
    controls(): Controls;
    view(): RectilinearView | null;
  }

  export class Controls {
    registerMethod(name: string, method: any): void;
    enableMethod(name: string): void;
    disableMethod(name: string): void;
  }

  export class ImageUrlSource {
    static fromString(url: string, options?: { cubeMapPreviewUrl?: string }): ImageUrlSource;
  }

  export class EquirectGeometry {
    constructor(levels: Array<{ width: number }>);
  }

  export class RectilinearView {
    constructor(params?: ViewParams, limiter?: any);
    setParameters(params: ViewParams): void;
    yaw(): number;
    pitch(): number;
    fov(): number;
    static limit: {
      traditional(maxFov: number, maxPitch: number): any;
      hfov(minFov: number, maxFov: number): any;
      vfov(minFov: number, maxFov: number): any;
      yaw(min: number, max: number): any;
      pitch(min: number, max: number): any;
    };
  }

  export class Scene {
    view(): RectilinearView;
    switchTo(options?: { transitionDuration?: number }, done?: () => void): void;
    hotspotContainer(): HotspotContainer;
    destroy(): void;
  }

  export class HotspotContainer {
    createHotspot(element: HTMLElement, position: { yaw: number; pitch: number }, options?: any): Hotspot;
    destroyHotspot(hotspot: Hotspot): void;
    listHotspots(): Hotspot[];
  }

  export class Hotspot {
    domElement(): HTMLElement;
    setPosition(position: { yaw: number; pitch: number }): void;
    position(): { yaw: number; pitch: number };
  }

  export const controls: {
    MethodManager: any;
  };

  export const util: {
    defaults: (dest: any, ...sources: any[]) => any;
  };

  export const dependencies: {
    bowser: any;
  };
}
