import messageBroker from './'

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
}

export default new Commands()
