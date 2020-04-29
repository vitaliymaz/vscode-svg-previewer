import { h, FunctionalComponent, JSX } from 'preact'

import { BoundingBoxIcon } from './icons/BoundingBoxIcon'
import { TransparencyGridIcon } from './icons/TransparencyGridIcon'
import { ZoomInIcon } from './icons/ZoomInIcon'
import { ZoomOutIcon } from './icons/ZoomOutIcon'
import { ZoomResetIcon } from './icons/ZoomResetIcon'

interface ToolbarProps {
  onChangeBackgroundButtonClick: JSX.MouseEventHandler<EventTarget>;
  zoomIn: Function;
  zoomOut: Function;
  zoomReset: Function;
  fileSize?: string;
  sourceImageValidity: boolean;
  onBtnMouseDown: JSX.MouseEventHandler<EventTarget>;
  activeBtn?: string;
  onToggleTransparencyGridClick: JSX.MouseEventHandler<EventTarget>;
  onToggleBoundingBoxClick: JSX.MouseEventHandler<EventTarget>;
  scale: number;
  background: string;
  showBoundingBox: boolean;
  showTransparencyGrid: boolean;
}

const Toolbar: FunctionalComponent<ToolbarProps> = ({
  onChangeBackgroundButtonClick,
  zoomIn,
  zoomOut,
  zoomReset,
  fileSize,
  sourceImageValidity,
  onBtnMouseDown,
  activeBtn,
  onToggleTransparencyGridClick,
  onToggleBoundingBoxClick,
  scale,
  background,
  showBoundingBox,
  showTransparencyGrid
}) => (
  <div className='toolbar'>
    <div className='btn-group'>
      <button
        name='zoom-in'
        className={`btn btn-zoom-in ${activeBtn === 'zoom-in' ? 'active' : ''}`}
        disabled={!sourceImageValidity}
        onClick={zoomIn as JSX.MouseEventHandler<EventTarget>}
        onMouseDown={onBtnMouseDown}
        title='Zoom In'
      >
        <ZoomInIcon className='icon' />
      </button>
      <button
        name='zoom-out'
        className={`btn btn-zoom-out ${activeBtn === 'zoom-out' ? 'active' : ''}`}
        disabled={!sourceImageValidity}
        onClick={zoomOut as JSX.MouseEventHandler<EventTarget>}
        onMouseDown={onBtnMouseDown}
        title='Zoom Out'
      >
        <ZoomOutIcon className='icon' />
      </button>
      <button
        name='zoom-reset'
        className={`btn btn-zoom-reset ${activeBtn === 'zoom-reset' ? 'active' : ''}`}
        disabled={scale === 1 || !sourceImageValidity}
        onClick={zoomReset as JSX.MouseEventHandler<EventTarget>}
        onMouseDown={onBtnMouseDown}
        title='Zoom Reset'
      >
        <ZoomResetIcon className='icon' />
      </button>
    </div>
    <div className='separator' />
    <div className='btn-group'>
      <button
        disabled={!sourceImageValidity}
        className={`btn bg dark ${activeBtn === 'dark' ? 'active' : ''} ${background === 'dark' ? 'selected' : ''}`}
        name='dark'
        onClick={onChangeBackgroundButtonClick}
        onMouseDown={onBtnMouseDown}
        title='Dark'
      >
        <span className='icon' />
      </button>
      <button
        disabled={!sourceImageValidity}
        className={`btn bg light ${activeBtn === 'light' ? 'active' : ''} ${background === 'light' ? 'selected' : ''}`}
        name='light'
        onClick={onChangeBackgroundButtonClick}
        onMouseDown={onBtnMouseDown}
        title='Light'
      >
        <span className='icon' />
      </button>
    </div>
    <div className='separator' />
    <div className='btn-group'>
      <button
        disabled={!sourceImageValidity}
        className={`btn transparency-grid ${activeBtn === 'transparency-grid' ? 'active' : ''} ${showTransparencyGrid ? 'selected' : ''}`}
        name='transparency-grid'
        onClick={onToggleTransparencyGridClick}
        onMouseDown={onBtnMouseDown}
        title='Transparency Grid'
      >
        <TransparencyGridIcon className='icon' />
      </button>
      <button
        disabled={!sourceImageValidity}
        className={`btn bounding-box ${activeBtn === 'bounding-box' ? 'active' : ''} ${showBoundingBox ? 'selected' : ''}`}
        name='bounding-box'
        onClick={onToggleBoundingBoxClick}
        onMouseDown={onBtnMouseDown}
        title='Bounding Box'
      >
        <BoundingBoxIcon className='icon' />
      </button>
    </div>
    <div className='size'>{fileSize}</div>
  </div>
)

export default Toolbar
