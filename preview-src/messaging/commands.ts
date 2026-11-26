import messageBroker from './'
import { IBackground } from '../store/IState'

class Commands {
  changeBoundingBoxVisibility (visible: boolean) {
    messageBroker.send({
      command: 'changeBoundingBoxVisibility',
      payload: { visible }
    })
  }

  changeTransparencyGridVisibility (visible: boolean) {
    messageBroker.send({
      command: 'changeTransparencyGridVisibility',
      payload: { visible }
    })
  }

  changeBackground (background: IBackground) {
    messageBroker.send({
      command: 'changeBackground',
      payload: { background }
    })
  }
}

export default new Commands()
