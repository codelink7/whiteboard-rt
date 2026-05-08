const canvas = document.getElementById("canvas") as HTMLCanvasElement
canvas.width = window.innerWidth
canvas.height = window.innerHeight
window.addEventListener("resize", () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
})

const ctx = canvas.getContext("2d") as CanvasRenderingContext2D

if (!ctx) {
  throw new Error("Could not get 2d context from canvas");
}

// const texture = new ImageData(canvas.width, canvas.height)

// for(let i = 0; i < texture.data.length; i++) {
//     texture.data[i] = i/255
// }

// ctx.putImageData(texture, 0, 0)

let keys: Record<string, boolean> = {}

interface Vec2 {
    x: number
    y: number
}

let cameraTarget: Vec2 = {x:0,y:0}
let mouseCurrent: Vec2 = {x:0,y:0}
let mouseTarget: Vec2 = {x:0,y:0}
let mouseEase = 0.1
let mouseDown = false

enum Shape { Rect, Circle }

interface Entity {
    position: Vec2
    shape: Shape
    width?: number
    height?: number
    radius?: number
    color?: number
    draw(): void
}

const randRange = (min: number = 0, max: number = 1) => {
    let r = min/max
    return (Math.random()+r) * max
}

function drawRectangle(this: Entity) {
    ctx.fillStyle = `#${this.color?.toString(16)}`
    ctx.fillRect(this.position.x - cameraTarget.x, this.position.y-cameraTarget.y, this.width as number, this.height as number)
}

function drawCircle(this: Entity) {
    ctx.beginPath()
    ctx.fillStyle = `#${this.color?.toString(16)}`
    ctx.moveTo(this.position.x - cameraTarget.x, this.position.y-cameraTarget.y)
    ctx.arc(this.position.x - cameraTarget.x, this.position.y-cameraTarget.y, this.radius as number, 0, 2*Math.PI, true)
    ctx.fill()
}

let objects: Entity[] = []

for(let i = 0; i < 50; i++) {
    let s = Math.random() > 0.5 ? Shape.Rect : Shape.Circle
    objects.push({
        position: {x: Math.random()*canvas.width, y: Math.random()*canvas.height},
        shape: s,
        draw: s == Shape.Rect ? drawRectangle : drawCircle,
        width: ((Math.random() + 0.5)/1.5)*100,
        height: ((Math.random() + 0.5)/1.5)*100,
        radius: ((Math.random() + 0.5)/1.5)*100,
        color: Math.floor(randRange(0.5)*0xFF + randRange(0.5)*0xFF00 + randRange(0.5)*0xFF0000)
    })
}

if(location.pathname.slice(1).split("/")[0]?.length == 36) {
    let roomId = location.pathname.slice(1).split("/")[0]
    // establish websocket connection on existing room data 
    // and populate objects from there

    const wsUri = "ws://127.0.0.1:3000/websocket"
    const websocket = new WebSocket(wsUri)

    websocket.addEventListener("open", (ev) => {
        console.log("Socket Connected");
        websocket.send(JSON.stringify({roomId}))
    })

    websocket.addEventListener("message", (ev: MessageEvent) => {
        console.log("Message received: " + ev.data)
    })
} else {
    let roomId = crypto.randomUUID()
    history.pushState({}, "", roomId)

    const wsUri = "ws://127.0.0.1:3000/websocket"
    const websocket = new WebSocket(wsUri)

    websocket.addEventListener("open", (ev) => {
        console.log("Socket Connected");
    })

    websocket.addEventListener("message", (ev: MessageEvent) => {
        console.log("Message received: " + ev.data)
    })
}

const update = (time: DOMHighResTimeStamp) => {
    // UPDATE
    if(keys["KeyA"]) {
        cameraTarget.x -= 10
    }
    if(keys["KeyD"]) {
        cameraTarget.x += 10
    }
    if(keys["KeyW"]) {
        cameraTarget.y -= 10
    }
    if(keys["KeyS"]) {
        cameraTarget.y += 10
    }

    let mouseDelta = {x: mouseTarget.x - mouseCurrent.x, y: mouseTarget.y - mouseCurrent.y}

    mouseCurrent.x += mouseDelta.x
    mouseCurrent.y += mouseDelta.y

    if(mouseDown && keys["ControlLeft"]) {
        cameraTarget.x -= mouseDelta.x
        cameraTarget.y -= mouseDelta.y
    }

    // DRAW
    ctx.fillStyle = `rgb(90, 110, 100)`
    ctx.fillRect(0,0,canvas.width, canvas.height)

    for(let e of objects) {
        e.draw()
    }

    requestAnimationFrame(update)
}

requestAnimationFrame(update)

window.addEventListener("keydown", (ev) => {
    keys[ev.code] = true
})

window.addEventListener("keyup", (ev) => {
    keys[ev.code] = false
})

window.addEventListener("mousemove", (ev) => {
    mouseTarget.x = ev.clientX
    mouseTarget.y = ev.clientY
})

window.addEventListener("mousedown", () => mouseDown = true)
window.addEventListener("mouseup", () => mouseDown = false)