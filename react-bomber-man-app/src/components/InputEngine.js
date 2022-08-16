class InputEngine {
  constructor() {
    /**
     * A dictionary mapping ASCII key codes to string values describing
     * the action we want to take when that key is pressed.
     */
    this.bindings = {};

    /**
     * A dictionary mapping actions that might be taken in our game
     * to a boolean value indicating whether that action is currently being performed.
     */
    this.actions = {};

    this.listeners = [];

    this.setup = () => {
      this.bind(38, 'up');
      this.bind(37, 'left');
      this.bind(40, 'down');
      this.bind(39, 'right');
      this.bind(32, 'bomb');

      this.bind(13, 'restart');
      this.bind(27, 'escape');
      this.bind(77, 'mute');

      document.addEventListener('keydown', (event) => {
        this.onKeyDown(event);
      });
      document.addEventListener('keyup', (event) => {
        this.onKeyUp(event);
      });
    };
    this.setup();
  }

  onKeyDown(event) {
    let action = this.bindings[event.keyCode];
    if (action) {
      this.actions[action] = true;
      event.preventDefault();
    }
    return false;
  }

  onKeyUp(event) {
    let action = this.bindings[event.keyCode];
    if (action) {
      this.actions[action] = false;

      let listeners = this.listeners[action];
      if (listeners) {
        for (let i = 0; i < listeners.length; i++) {
          let listener = listeners[i];
          listener();
        }
      }
      event.preventDefault();
    }
    return false;
  }

  /**
   * The bind function takes an ASCII keycode and a string representing
   * the action to take when that key is pressed.
   */
  bind(key, action) {
    this.bindings[key] = action;
  }

  addListener(action, listener) {
    this.listeners[action] = this.listeners[action] || new Array();
    this.listeners[action].push(listener);
  }

  removeAllListeners() {
    this.listeners = [];
  }
}

export { InputEngine };
