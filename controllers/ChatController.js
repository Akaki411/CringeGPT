const GPT = require("./GPTController")
const ChatGPTModes = require("../models/BotCallModels")
const API = require("./API");
const {User} = require("../database/models");
const Data = require("../data/Data")
const Settings = require("./Settings")

class ChatController
{
    MessageHandler = async (context) =>
    {
        if(context.command?.match(/^кто я/))
        {
            await context.send(context.user.GetInfo())
            return
        }
        await Settings.MessageHandler(context, async () =>
        {
            if(context.replyMessage?.senderId === Data.groupId && context.user?.canUseBot)
            {
                await this.ReplyRequest(context)
                return true
            }
            if(context.command?.match(/^!|^\/|^бот/) && context.user?.canUseBot)
            {
                await this.GPTRequest(context)
            }
        })
    }
    async ReplyRequest(context)
    {
        try
        {
            if(!context.chat.mode) return
            if(context.command?.length < 6) return
            if(context.command?.match(/ахах/)) return
            let messages = []
            messages.push(context.chat.mode.request)
            messages.push({role: "assistant", content: context.replyMessage.text})
            messages.push({role: "user", content: context.text})
            messages = messages.filter(key => {return !!key})
            let request = await GPT(messages)
            if(!request) return
            for (const sample of request)
            {
                const index = request.indexOf(sample);
                if(index === 0) await context.reply(sample)
                else await context.send(sample)
            }
        }
        catch (e) {console.log(e)}
    }

    GPTRequest = async (context) =>
    {
        try
        {
            if(!context.chat.mode) return
            let messages = []
            messages.push(context.chat.mode.request)
            let limit = 10
            if(context.forwards.length > 0)
            {
                for(const msg of context.forwards)
                {
                    if(msg.text?.length > 0 && limit > 0)
                    {
                        messages.push({role: msg.senderId > 0 ? "user" : "assistant", content: msg.text})
                        limit --
                    }
                }
            }
            if(context.replyMessage && context.replyMessage?.text?.length > 0) messages.push({role: context.replyMessage.senderId > 0 ? "user" : "assistant", content: context.replyMessage.text})
            for(const a of context.attachments)
            {
                if(a.type === "audio")
                {
                    messages.push({role: "user", content: `Песня ${a.title} от исполнителя ${a.artist}`})
                    break
                }
            }
            messages.push({role: "user", content: context.text.replace(/^!|^\//, "")})
            messages = messages.filter(key => {return !!key})
            let request = await GPT(messages)
            if(!request) return
            for (const sample of request)
            {
                const index = request.indexOf(sample);
                if(index === 0) await context.reply(sample)
                else await context.send(sample)
            }
        } catch (e) {console.log(e)}
    }
}

module.exports = new ChatController()