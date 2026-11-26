export type IBackground = 'dark' | 'light';
export type IBackgroundSetting = 'auto' | IBackground;
export type ISettings = { showBoundingBox: boolean, showTransparencyGrid: boolean, background: IBackgroundSetting };
export type ISource = { uri: string, data: string, settings: ISettings };

export interface IState {
  source: ISource;
  scale: number;
  fitToWindow: boolean;
  fitScale: number;
  background: IBackground;
  sourceImageValidity: boolean;
}
