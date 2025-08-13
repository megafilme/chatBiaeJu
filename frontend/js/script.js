// login elements
const login = document.querySelector(".login")
const loginForm = login.querySelector(".login__form")
const loginInput = login.querySelector(".login__input")

// chat elements
const chat = document.querySelector(".chat")
const chatForm = chat.querySelector(".chat__form")
const chatInput = chat.querySelector(".chat__input")
const chatMessages = chat.querySelector(".chat__messages")

const colors = [
    "cadetblue",
    "darkgoldenrod",
    "cornflowerblue",
    "darkkhaki",
    "hotpink",
    "gold"
]

const user = { id: "", name: "", color: "" }

let websocket
let onlineDiv
let onlineCount = 0
let onlineUsers = new Set()

const updateOnline = () => {
    onlineDiv.innerHTML = `Online: ${Array.from(onlineUsers).join(", ")} (${onlineCount})`
}

const createMessageSelfElement = (content) => {
    const div = document.createElement("div")
    const span = document.createElement("span")

    div.classList.add("message--self")

    span.classList.add("message--sender")
    span.style.color = user.color
    span.innerHTML = user.name

    div.appendChild(span)
    div.appendChild(document.createTextNode(" " + content))

    return div
}

const createMessageOtherElement = (content, sender, senderColor) => {
    const div = document.createElement("div")
    const span = document.createElement("span")

    div.classList.add("message--other")

    span.classList.add("message--sender")
    span.style.color = senderColor
    span.innerHTML = sender

    div.appendChild(span)
    div.appendChild(document.createTextNode(" " + content))

    return div
}

const getRandomColor = () => {
    const randomIndex = Math.floor(Math.random() * colors.length)
    return colors[randomIndex]
}

const scrollScreen = () => {
    window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth"
    })
}

const showNotification = (message) => {
    const notification = document.createElement("div")
    notification.classList.add("notification")
    notification.innerHTML = message
    document.body.appendChild(notification)

    setTimeout(() => {
        notification.remove()
    }, 3000)
}

const processMessage = ({ data }) => {
    const { userId, userName, userColor, content } = JSON.parse(data)

    if (content === "has joined the chat" && userId !== user.id) {
        onlineCount++
        onlineUsers.add(userName)
        updateOnline()
        showNotification(`${userName} has joined the chat!`)
    } else if (content === "has left the chat" && userId !== user.id) {
        onlineCount--
        onlineUsers.delete(userName)
        updateOnline()
        showNotification(`${userName} has left the chat!`)
    }

    const message =
        userId == user.id
            ? createMessageSelfElement(content)
            : createMessageOtherElement(content, userName, userColor)

    chatMessages.appendChild(message)

    scrollScreen()
}

const handleLogin = (event) => {
    event.preventDefault()

    user.id = crypto.randomUUID()
    user.name = loginInput.value
    user.color = getRandomColor()

    login.style.display = "none"
    chat.style.display = "flex"

    onlineDiv = document.createElement("div")
    onlineDiv.classList.add("online__count")
    chat.insertBefore(onlineDiv, chatMessages)

    websocket = new WebSocket("ws://localhost:8080")
    websocket.onmessage = processMessage
    websocket.onopen = () => {
        const joinContent = "has joined the chat"
        const joinMessage = {
            userId: user.id,
            userName: user.name,
            userColor: user.color,
            content: joinContent
        }

        websocket.send(JSON.stringify(joinMessage))

        // Add join message locally for self
        const messageElement = createMessageSelfElement(joinContent)
        chatMessages.appendChild(messageElement)
        scrollScreen()

        // Set initial online count to 1 (self)
        onlineCount = 1
        onlineUsers.add(user.name)
        updateOnline()
    }
}

const sendMessage = (event) => {
    event.preventDefault()

    const content = chatInput.value

    const message = {
        userId: user.id,
        userName: user.name,
        userColor: user.color,
        content: content
    }

    websocket.send(JSON.stringify(message))

    // Add the message locally to make it visible immediately
    const messageElement = createMessageSelfElement(content)
    chatMessages.appendChild(messageElement)
    scrollScreen()

    chatInput.value = ""
}

loginForm.addEventListener("submit", handleLogin)
chatForm.addEventListener("submit", sendMessage)

window.onbeforeunload = () => {
    const leaveContent = "has left the chat"
    const leaveMessage = {
        userId: user.id,
        userName: user.name,
        userColor: user.color,
        content: leaveContent
    }

    websocket.send(JSON.stringify(leaveMessage))
}

// Basic CSS for notification (add this to your stylesheet)
const style = document.createElement('style')
style.innerHTML = `
    .notification {
        position: fixed;
        top: 10px;
        right: 10px;
        background: #333;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 1000;
        box-shadow: 0 0 10px rgba(0,0,0,0.5);
    }
`
document.head.appendChild(style)