# GamePadMapping
Javascript object to access the values of Gamepad buttons, axes and triggers with callback functions. It allows to import game-specific mappings or let the user decide how to map the gamepad.

The object is very flexible. When the object is created, an gamepad recognises buttons, triggers and joysticks but within the mapping there are only buttons and axes. You can even combine a button, a trigger, a dpad button and a joystick to one axes callback if you want to.

Keep in mind
 * Mapping a Dpad/Joystick as buttons means some buttons cannot be pressed simultaneously
 * Mapping buttons as on axes means that the first button of a direction will be prefered and represent 1 instead of -1

Callback functions are called in the interval given by the creation of the object
Replace "--insertname--" with the name of button/axes

Buttons have two callbacks
 * gamepadmapping.on--insertname-- = (value, duration) => {}
 * gamepadmapping.on--insertname--up = () => {}
Alternatively use gamepad.on('--insertname--',(value, duration)=>{}) and gamepad.up('--insertname--',()=>{})

Axes have one callbacks
 * gamepadmapping.on--insertname-- = (direction) => {}
Alternatively use gamepad.on('--insertname--',(direction)=>{})

As soon as the class is implemented e.g. download gamepadmapping.js and add "<script src="gamepadmapping.js"></script>"

    // Buttons mean one interaction of any known kind
    // Axes combine four buttons. Two each represent one coordinate
    // Names are intended be unique. If not two buttons call the same callback ...
    // ... (up to double frequency) and cannot be differented.
    let buttons = [
      {name:'primary',symbol:'A/X',description:'Used to confirm'}
    ]
    let axes = [
      {name:'stick',symbols:[
        {symbol:'⬌',directions:['→','←']},
        {symbol:'⬍',directions:['↑','↓']}
      ],description:'Used to move character'}
    ]
    
    let gamepad = null
    
    window.addEventListener('gamepadconnected', window.ongamepadconnected)
    window.addEventListener('gamepaddisconnected', window.ongamepaddisconnected)
    
    window.ongamepadconnected = event => {
      /* Parameters:
       * Gamepad ... Is used to pass on the gamepad you got from the event
       * [] ... Tells the object the names of the buttons that will be used for the callbacks - see structure in variable
       * [] ... Tells the object the names of the axes that will be used for the callbacks - see structure in variable
       * number ... The time between two callback fires when a button is pressed
       * The death zone for joysticks/triggers. When the value of a trigger/joystick is lower no callback is fired
       */
      gamepad = new GamePadMapping(event.gamepad,buttons,axes,50,.15)
      
      // You can import a custom mapping of a known gamepad. Mapping will be applied if the ids match.
      // Please allow the user to make a user specific mapping. Just create a new GamePadMapping and skip the import.
      // Note: the id of a gamepad type might change depending on the browser/connection you use
      gamepad.import({"id":"054c-09cc-Sony Interactive Entertainment Wireless Controller","buttons":[[0]],
        "axes":[ [[0,1],[0,-1],[1,-1],[1,1]] ]})
      
      gamepad.onready = () => {
        // The callbacks for buttons/axes will start fire
        // Be sure that functions are assigned to all callbacks or you will see warnings in the console
        
        // Buttons have two callbacks
        // Note: if you do not use arrow functions the function will be called with the object as this
        gamepad.onprimary = (value, duration) => {
          // Will be called in the interval of the object creation parameter ...
          // ... as long the button/triger/axes is greater than death zone
          
          // If a trigger or axes is declared as button you will be able to multiplicate ...
          // ... the value parameter [0; 1] with the max value
          // Use "(100**Math.abs(value)-1)/1000" to increase slowly
          
          // If you want to react less often to the click simply divide the duration ]0; ∞[ with the ms of the intervall
          // A multiple of object frequency e.g.: every 2 seconds "duration%2000==0"
        }
        
        gamepad.onprimaryup = () => {
          // No parameters, you know that the button was released or the deathzone of trigger/joystick is reached.
        }
        
        // Axes have only one callback
        gamepad.onstick = (direction) => {
          // direction ... Array(2) e.g. [0,1] each [-1; 1]
          // The first value is from the first mapped axes (positive is the first direction, negative the second)
        }
      }
      
      gamepad.onmapnext = (o) => {
        // o ... symbol of button or symbol of axes then space then symbol of direction
        
        // The object is now waiting for a control that can be mapped for the given event
        
        // Prompt the user to entirely press & release button/trigger or ...
        // ... move axes into the correct direction and release it (before and after the axes must be centered)
        
        // If two or more independend controls of the gamepad are changed simultaneously ...
        // ... the object automatically resets and tries again to find the control assumed to be mapped
        
        // Note: Be aware that one joystick and one button in certain cases may be recognized as trigger
      }
      
      this.gamepad.onwarn = () => {
        // Promt the user to choose a not assigned button, trigger or joystick
        // Dublicate uses are prevented
      }
    }
    
    // When the gamepad is no longer connected we want to deactivate the GamePadMapping
    // Otherwise the GamePadMapping will continue check if the gamepad controls are used
    window.ongamepaddisconnected = event => {
      gamepad.disconnect()
      gamepad = null
    }

Known issues with Gamepads
 * If you are using a Ps3 controller on Ubuntu 19.04 via Bluetooth the Leds won't stop blinking
 * If you are using a wiimote on Linux, the Dpad is redirected to the arrow keys install "wminput"
   Download file "wiimote.conf" and execute it "sudo wminput -c ~/Path/to/File/wiimote.conf"
 
