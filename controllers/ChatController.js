const GPT = require("./GPTController")
const Data = require("../data/Data")
const Settings = require("./Settings")
const API = require("./API");
const {User} = require("../database/models");

class ChatController
{
    MessageHandler = async (context) =>
    {
        if(context.command?.match(/^!жереб.[её]вка/))
        {
            await this.Randomize(context)
            return
        }
        if(context.command?.match(/^!игнор/))
        {
            await this.IgnoreUser(context)
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

    async IgnoreUser(context)
    {
        try
        {
            if(context.replyUsers.length === 0)
            {
                await context.send("⚠ Укажите пользователя")
                return
            }
            if(context.chat.ignore.contains(context.replyUsers[0]))
            {
                context.chat.ignore = context.chat.ignore.filter(key => {return key !== context.replyUsers[0]})
            }
            else
            {
                context.chat.ignore.push(context.replyUsers[0])
            }
            await context.chat.Save()
        }
        catch (e)
        {
            console.log(e)
        }
    }

    async Randomize(context)
    {
        try
        {
            const chatInfo = await API.messages.getConversationMembers({peer_id: context.peerId})
            let chatMembers = []
            let prefix = context.text.replace(/^!жереб.[её]вка/, "")
            prefix = prefix.length > 0 ? prefix : ""
            let names = {}
            for(const profile of chatInfo.profiles)
            {
                names[profile.id] = `@id${profile.id}(${profile.first_name + " " + profile.last_name})`
                chatMembers.push(profile.id)
            }
            const newList = []
            while(chatMembers.length > 0)
            {
                let i = Math.floor(Math.random() * chatMembers.length)
                newList.push(chatMembers[i])
                chatMembers = chatMembers.filter(key => {return key !== chatMembers[i]})
            }
            let request = `Результат жеребьевки ${prefix}\n\n`
            for(let i = 0; i < newList.length; i++)
            {
                request += (i+1) + ": " + names[newList[i]] + "\n"
            }
            await context.send(request, {disable_mentions: true})
        }
        catch (e)
        {
            console.log(e)
        }
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