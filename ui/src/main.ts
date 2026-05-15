import { type Message, MessageType } from "./messaging.js"

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

const wsUri = "ws://localhost:3000/websocket"
const websocket = new WebSocket(wsUri)
let websocketReady = false

let keys: Record<string, boolean> = {}

interface Vec2 {
    x: number
    y: number
}

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
    color?: string
    draw(): void
}

interface CanvasData {
    id: string
    cameraTarget: Vec2
    objects: Entity[]
}

let canvasData: CanvasData = {
    id: "",
    cameraTarget: {x:0,y:0},
    objects: []
}

let cursors: Map<string, {p:Vec2, c:string}> = new Map()

const randRange = (min: number = 0, max: number = 1) => {
    let r = min/max
    return (Math.random()+r) * max
}

const randColor = () => {
    return Math.floor(randRange(0.5)*0xFF + randRange(0.5)*0xFF00 + randRange(0.5)*0xFF0000).toString(16)
}

function drawRectangle(this: Entity) {
    ctx.fillStyle = this.color as string
    ctx.fillRect(this.position.x - canvasData.cameraTarget.x, this.position.y-canvasData.cameraTarget.y, this.width as number, this.height as number)
}

function drawCircle(this: Entity) {
    ctx.beginPath()
    ctx.fillStyle = this.color as string
    // ctx.moveTo(this.position.x - cameraTarget.x, this.position.y-cameraTarget.y)
    ctx.arc(this.position.x - canvasData.cameraTarget.x, this.position.y-canvasData.cameraTarget.y, this.radius as number, 0, 2*Math.PI, true)
    ctx.fill()
    ctx.stroke()
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
        color: "#" + Math.floor(randRange(0.5)*0xFF + randRange(0.5)*0xFF00 + randRange(0.5)*0xFF0000).toString(16)
    })
}

const handleWebsocketMessages = (ev: MessageEvent) => {
    try {
        let v = JSON.parse(ev.data)
        console.log(v);
        switch (v.type) {
            case MessageType.CanvasCreated:
                console.log(v.data);
                canvasData.id = v.data.canvas.id
                history.pushState({}, "", canvasData.id)
                break;
            case MessageType.UserCreated:
                console.log(v.data);
                localStorage.setItem("user", JSON.stringify(v.data.user))
                localStorage.setItem("user_id", v.data.user.id)
                break;
            case MessageType.CursorUpdate:
                if(v.data.user_id != localStorage.getItem("user_id")) {
                    if(v.data.disconnected) {
                        cursors.delete(v.data.user_id)
                        break
                    }
                    let old = cursors.get(v.data.user_id)
                    if(old == undefined) {
                        // TODO: make sure color isn't too bright for white text on top
                        old = {p: v.data.cursor_pos, c: "#" + randColor()}
                    }
                    old.p = v.data.cursor_pos
                    cursors.set(v.data.user_id, old)
                }
                break;
            default:
                break;
        }
    } catch(err) {
        console.log(err);
    }
}

if(location.pathname.slice(1).split("/")[0]?.length == 36) {
    // Init message ConnectToCanvas
    canvasData.id = location.pathname.slice(1).split("/")[0] as string

    websocket.addEventListener("open", (ev) => {
        console.log("Socket Connected");
        // init message
        websocket.send(JSON.stringify({
            type: MessageType.ConnectToCanvas,
            data: {
                user_id: localStorage.getItem("user_id") ?? "",
                canvas_id: canvasData.id
            }
        }))
    })

    websocket.addEventListener("message", handleWebsocketMessages)
} else {
    // Init message NewCanvas
    // canvasData.id = crypto.randomUUID()
    // history.pushState({}, "", canvasData.id)

    websocket.addEventListener("open", (ev) => {
        console.log("Socket Connected");
        // init message
        websocket.send(JSON.stringify({
            type: MessageType.NewCanvas,
            data: {
                user_id: localStorage.getItem("user_id") ?? ""
            }
        }))
    })

    websocket.addEventListener("message", handleWebsocketMessages)
}

const update = (time: DOMHighResTimeStamp) => {
    // UPDATE
    if(keys["KeyA"]) {
        canvasData.cameraTarget.x -= 10
    }
    if(keys["KeyD"]) {
        canvasData.cameraTarget.x += 10
    }
    if(keys["KeyW"]) {
        canvasData.cameraTarget.y -= 10
    }
    if(keys["KeyS"]) {
        canvasData.cameraTarget.y += 10
    }

    let mouseDelta = {x: mouseTarget.x - mouseCurrent.x, y: mouseTarget.y - mouseCurrent.y}

    mouseCurrent.x += mouseDelta.x
    mouseCurrent.y += mouseDelta.y

    if(mouseDown && keys["ControlLeft"]) {
        canvasData.cameraTarget.x -= mouseDelta.x
        canvasData.cameraTarget.y -= mouseDelta.y
    }

    // DRAW
    ctx.fillStyle = `rgb(90, 110, 100)`
    ctx.fillRect(0,0,canvas.width, canvas.height)

    for(let e of objects) {
        e.draw()
    }

    for(const [k,v] of cursors) {
        ctx.fillStyle = v.c
        ctx.beginPath();
        ctx.moveTo(v.p.x, v.p.y);
        ctx.lineTo(v.p.x+12, v.p.y+15);
        ctx.lineTo(v.p.x, v.p.y+20);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(v.p.x+10, v.p.y+15, 240, 16, [40]);
        ctx.fill();
        ctx.fillStyle = "white"
        ctx.font = "12px sans-serif";
        ctx.fillText(k, v.p.x+15, v.p.y+27);
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

//#region fix keys stalling as true not being unset, modifier keys specifically (ControlLeft)
window.addEventListener("blur", () => {
    for(const key in keys) {
        keys[key] = false
    }
})

document.addEventListener("visibilitychange", () => {
    if(document.hidden) {
        for(const key in keys) {
            keys[key] = false
        }
    }
})
//#endregion

window.addEventListener("mousemove", (ev) => {
    mouseTarget.x = ev.clientX
    mouseTarget.y = ev.clientY
    if(websocket.OPEN && keys["ControlLeft"] && mouseDown) {
        websocket.send(JSON.stringify({
            id: canvasData.id,
            cameraTarget: canvasData.cameraTarget
        }))
    }

    if(websocket.OPEN) {
        websocket.send(JSON.stringify({
            type: MessageType.CursorUpdate,
            data: {
                user_id: localStorage.getItem("user_id"),
                cursor_pos: mouseTarget
            }
        }))
    }
})

window.addEventListener('beforeunload', () => {
    // Check if the socket is open before trying to send
    if (websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify({
            type: MessageType.CursorUpdate,
            data: {
                user_id: localStorage.getItem("user_id"),
                cursor_pos: {x:null,y:null},
                disconnected: true
            }
        }));
        // Optional: Gracefully close the connection manually
        websocket.close();
    }
});

window.addEventListener("mousedown", () => mouseDown = true)
window.addEventListener("mouseup", () => mouseDown = false)