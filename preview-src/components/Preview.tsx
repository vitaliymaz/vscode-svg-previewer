import { h, FunctionalComponent, Ref, JSX } from 'preact'

import { ISettings } from '../store/IState'

interface PreviewProps {
  data: string;
  settings: ISettings;
  attachRef: Ref<HTMLImageElement>;
  dimension: { width: number, height: number, units: string };
  onWheel: JSX.WheelEventHandler<EventTarget>;
  background: string;
  showTransparencyGrid: boolean;
}

const Preview: FunctionalComponent<PreviewProps> = ({
  data,
  attachRef,
  dimension: { width, height, units },
  onWheel,
  background,
  settings,
  showTransparencyGrid
}) => {
  const styles = {
    width: `${width}${units}`,
    minWidth: `${width}${units}`,
    height: `${height}${units}`,
    minHeight: `${height}${units}`
  }
  return (
    <div className={`preview ${background} ${settings.showBoundingBox ? 'bounding-box' : ''} ${showTransparencyGrid ? 'transparency-grid' : ''}`} onWheel={onWheel}>
      <img
        src={`data:image/svg+xml,${encodeURIComponent(data.text)}`}
        ref={attachRef}
        style={styles}
        alt=''
      />
    </div>
  )
}

export default Preview
