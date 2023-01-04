export type ISettings = { showBoundingBox: boolean, showTransparencyGrid: boolean };
export type ISource = { uri: string, data: { dimension: Record<'width' | 'height', number> | null, filesize: string | null }, settings: ISettings };
export type IBackground = 'dark' | 'light';

export interface IState {
  source: ISource;
  scale: number;
  background: IBackground;
  sourceImageValidity: boolean;
}
