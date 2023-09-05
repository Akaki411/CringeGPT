require('dotenv').config()
const {VK} = require('vk-io')

const ChatController = require('./controllers/ChatController')
const PrivateController = require('./controllers/PrivateController')

const VKbot = new VK({token: process.env.VK_TOKEN})

const StartVKBot = async () =>
{
    return new Promise((resolve) => {
        try
        {
            VKbot.updates.on('message', async(context) =>
            {
                if(context.senderId > 0)
                {
                    context.peerType === "user" && await PrivateController.MessageHandler(context)
                    context.peerType === "chat" && await ChatController.MessageHandler(context)
                }
            })
            VKbot.updates.start().then(() => {
                console.log("VK LongPool подключен")
                return resolve()
            })
        }
        catch (e)
        {
            console.log("ВК бот не смог запуститься из-за ошибки: " + e.message)
            return resolve()
        }
    })
}

StartVKBot().then(() => console.log("Бот запущен"))