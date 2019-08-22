class GamePadMapping {
  constructor(gamepad,buttons,axes,period,dz) {
    this.gamepad = gamepad
    this.index = gamepad.index
    this.buttons = []
    this.axes = []
    this.ready = false
    this.deadzone = dz
    this.period = period

    let f = () => {console.warn('Unhandled gamepad event!')}
    for(let button of buttons) {
      this['on'+button.name]=f
      this['on'+button.name+'up']=f
      button.array = null
      button.duration = 0
      this.buttons.push(button)
    }
    for(let axe of axes) {
      this['on'+axe.name]=f
      axe.arrays = [null,null,null,null]
      this.axes.push(axe)
    }

    this.onmapnext=f
    this.onwarn=f
    this.onready=f

    if(typeof InstallTrigger !== 'undefined') this.iid = setInterval(() => {this.interval()}, period)
    else {
      // Chrome, opera non updating gamepad fix
      let gamepad = {id:this.gamepad.id,index:this.gamepad.index,axes:this.gamepad.axes,buttons:[]}
      for(let button of this.gamepad.buttons) gamepad.buttons.push({value:button.value})
      this.gamepad = gamepad
      this.iid = setInterval(() => {
        let gamepad = navigator.getGamepads()[this.index]
        this.gamepad.axes = gamepad.axes
        for(let i = 0;i<gamepad.buttons.length;i++) this.gamepad.buttons[i].value = gamepad.buttons[i].value
        this.interval()
      }, period)
    }

    this.wipecache()
  }

  disconnect() { clearInterval(this.iid) }

  // Change the callback-functions with a function
  on(name,callback) { this['on'+name]=callback }
  up(name,callback) { this['on'+name+'up']=callback }

  // Trigger button does not change state in very fast interactions wheras axes do.
  // For a better performance store which callbacks fired and if timestamps match fire again
  interval() {
    if(!this.ready) return this.map()
    for(let button of this.buttons) {
      let value = this.valueof(button.array)
      if(value > this.deadzone) {
        button.duration++
        this['on'+button.name](value,button.duration*this.period)
      } else if(button.duration != 0) {
        button.duration = 0
        this['on'+button.name+'up']()
      }
    }
    for(let axe of this.axes) {
      let r = [];
      for(let i = 0;i<4;i+=2) {
        let value = this.valueof(axe.arrays[i])
        if(value > this.deadzone) r.push(value+0)
        else {
          let value = this.valueof(axe.arrays[i+1])
          if(value > this.deadzone) r.push(-value+0)
          else r.push(0)
        }
      }
      if(r[0]!=0||r[1]!=0) this['on'+axe.name](r)
    }
  }

  map() {
    for(let button of this.buttons) {
      if(button.array == null) {
        this.onmapnext(button.symbol)
        let matching = this.cache()
        if(matching) {
          this.wipecache()
          if(!this.isalreadymapped(matching)) button.array = matching
          else this.onwarn('Dublicate entry')
        }
        return
      }
    }
    for(let axe of this.axes) {
      for(let i = 0;i<4;i++) {
        if(axe.arrays[i] == null) {
          this.onmapnext(axe.symbols[(i-i%2)/2].symbol+' '+axe.symbols[(i-i%2)/2].directions[i%2])
          let matching = this.cache()
          if(matching) {
            this.wipecache()
            if(!this.isalreadymapped(matching)) axe.arrays[i] = matching
            else this.onwarn('Dublicate entry')
          }
          return
        }
      }
    }
    this.finished()
  }

  finished() {
    this.ready = true
    this.onready()
  }

  cache() {
    for(let i = 0;i<this.gamepad.buttons.length;i++) {
      if(!this.cbuttons[i]) this.cbuttons[i] = 0

      if(this.gamepad.buttons[i].value<1&&this.cbuttons[i]==0) this.cbuttons[i]=1
      if(this.gamepad.buttons[i].value<this.deadzone&&this.cbuttons[i]<2) this.cbuttons[i]=2
      if(this.gamepad.buttons[i].value>1-this.deadzone&&this.cbuttons[i]==2) this.cbuttons[i]=3
      else if(this.gamepad.buttons[i].value<this.deadzone&&this.cbuttons[i]==3) {
        this.cbuttons[i]++
        this.matchingb.push(this.gamepad.buttons[i])
      }
    }
    for(let i = 0;i<this.gamepad.axes.length;i++) {
      if(!this.caxes[i]&&this.gamepad.axes[i]!=-1) this.caxes[i] = 0

      if(this.gamepad.axes[i]>1-this.deadzone&&this.caxes[i]==0) this.caxes[i]++
      else if(this.gamepad.axes[i]<this.deadzone&&this.caxes[i]==1) {
        this.caxes[i]++
        this.matchinga.push(i)
        this.matchinga.push(1)
      }

      else if(this.gamepad.axes[i]<-1+this.deadzone&&this.caxes[i]==0) this.caxes[i]--
      else if(this.gamepad.axes[i]>-this.deadzone&&this.caxes[i]==-1) {
        this.caxes[i]--
        this.matchinga.push(i)
        this.matchinga.push(-1)
      }
    }

    if(this.matchingb.length>1||this.matchinga.length>2) this.wipecache()
    else if(this.matchingb.length==1&&this.matchinga.length==2) return this.matchinga.concat(this.matchingb) //trigger
    else if(this.matchingb.length==1) {
      let i = Math.max(this.caxes.indexOf(1),this.caxes.indexOf(-1))
      if(i==-1) return this.matchingb
      //else wait for next trigger
    } // button
    else if(this.matchinga.length==2) {
      let i = Math.max(this.cbuttons.indexOf(1),this.cbuttons.indexOf(3))
      if(i==-1) return this.matchinga
      //else wait for button finish
    } // axis or dpad
    return false
  }
  wipecache() {
    this.cbuttons = []
    this.caxes = []
    this.matchingb = []
    this.matchinga = []
  }

  isalreadymapped(o) {
    for(let button of this.buttons) if(this.comparearray(button.array, o)) return true;
    for(let axe of this.axes) {
      for(let array of axe.arrays) if(this.comparearray(array,o)) return true;
    }
  }

  comparearray(a,b) {
    if(a==null||b==null) return false
    if(a.length>1&&b.length>1) return a[0]==b[0]&&a[1]==b[1]
    return a[0] == b[0]
  }

  valueof(o) {
    if(o==null) return null
    if(o.length==1) return o[0].value
    else if(o.length==2) return this.gamepad.axes[o[0]]*o[1]
    else return (this.gamepad.axes[o[0]]*o[1]+1)/2
  }

  export() {
    let r = {}
    r.id = this.gamepad.id
    r.buttons = []
    for(let button of this.buttons) {
      button = button.array
      if(button==null) r.buttons.push(null)
      else if(button.length==1) r.buttons.push([this.gamepad.buttons.indexOf(button[0])])
      else if(button.length==2) r.buttons.push(button)
      else r.buttons.push([button[0],button[1],this.gamepad.buttons.indexOf(button[2])])
    }
    r.axes = []
    for(let axe of this.axes) {
      let axy = []
      for(let i = 0;i<4;i++) {
        let button = axe.arrays[i]
        if(button==null) axy.push(null)
        else if(button.length==1) axy.push([this.gamepad.buttons.indexOf(button[0])])
        else if(button.length==2) axy.push(button)
        else axy.push([button[0],button[1],this.gamepad.buttons.indexOf(button[2])])
      }
      r.axes.push(axy)
    }
    this.ready = false
    return r
  }

  import(o) {
    if(o.id!=this.gamepad.id) return false
    for(let i = 0;i<o.buttons.length;i++) {
      if(o.buttons[i]==null) this.buttons[i].array = null
      else if(o.buttons[i].length==1) this.buttons[i].array = [this.gamepad.buttons[o.buttons[i]]]
      else if(o.buttons[i].length==2) this.buttons[i].array = o.buttons[i]
      else this.buttons[i].array = [o.buttons[i][0],o.buttons[i][1],this.gamepad.buttons[o.buttons[i][2]]]
    }
    for(let i = 0;i<o.axes.length;i++) {
      for(let j = 0;j<4;j++) {
        if(o.axes[i][j]==null) this.axes[i].arrays[j] = null
        else if(o.axes[i][j].length==1) this.axes[i].arrays[j] = [this.gamepad.buttons[o.axes[i][j]]]
        else if(o.axes[i][j].length==2) this.axes[i].arrays[j] = o.axes[i][j]
        else this.axes[i].arrays[j] = [o.axes[i][j][0],o.axes[i][j][1],this.gamepad.buttons[o.axes[i][j][2]]]
      }
    }
    this.finished()
  }

}
