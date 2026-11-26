import { h, FunctionalComponent, JSX } from 'preact'

import { ISettings } from '../store/IState'

interface PreviewProps {
  data: string;
  settings: ISettings;
  onLoad: () => void;
  onError: () => void;
  dimension: { width: number, height: number, units: string };
  onWheel: JSX.WheelEventHandler<EventTarget>;
  containerRef: (element: HTMLDivElement | null) => void;
  background: string;
  showTransparencyGrid: boolean;
}

const Preview: FunctionalComponent<PreviewProps> = ({
  data,
  onLoad,
  onError,
  dimension: { width, height, units },
  onWheel,
  containerRef,
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
    <div className={`preview ${background} ${settings.showBoundingBox ? 'bounding-box' : ''} ${showTransparencyGrid ? 'transparency-grid' : ''}`} onWheel={onWheel} ref={containerRef}>
      <img
        src={`data:image/svg+xml,${encodeURIComponent(data)}`}
        onLoad={onLoad}
        onError={onError}
        style={styles}
        alt=''
      />
    </div>
  )
}

export default Preview
