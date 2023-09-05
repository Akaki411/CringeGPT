const GPT = require("./GPTController")
const ChatGPTModes = require("../models/BotCallModels")
const API = require("./API");
const {User} = require("../database/models");
const Data = require("../data/Data")

class ChatController
{
    MessageHandler = async (context) =>
    {
        if(context.command.match(/^кто я/))
        {
            await context.send(context.user.GetInfo())
            return
        }
        if(context.command.match(/^выдать прав/))
        {
            await this.GiveRight(context)
            return
        }
        if(context.command.match(/^забрать прав/))
        {
            await this.PickUpRight(context)
            return
        }
        if(context.command.match(/^!админ/))
        {
            await this.SetAdminRights(context)
            return
        }
        if(context.command.match(/^бот режим/))
        {
            await this.ChangeBotMode(context)
            return
        }
        if(context.replyMessage?.senderId === Data.groupId)
        {
            await this.ReplyRequest(context)
            return true
        }
        if(context.command.match(/^!|^\/|^бот/) && context.user.canUseBot)
        {
            await this.GPTRequest(context)
        }
    }

    SetAdminRights = async (context) =>
    {
        if(context.user.role !== "owner") return
        if(context.replyUsers.length === 0)
        {
            await context.send("⚠ Укажите пользователя")
            return
        }
        if(context.replyUsers[0] === context.user.id) return
        let user = await User.findOne({where: {id: context.replyUsers[0]}})
        if(!user) return
        const newRole = user.dataValues.role === "user" ? "admin" : "user"
        await User.update({role: newRole}, {where: {id: context.replyUsers[0]}})
        if(Data.users[context.replyUsers[0]]) Data.users[context.replyUsers[0]].role = newRole
        await context.send(`✅ Пользователь ${newRole === "admin" ? "назначен админом" : "больше не является админом"}`)
    }

    ChangeBotMode = async (context) =>
    {
        try
        {
            let temp = null
            for(const mode of Object.keys(ChatGPTModes))
            {
                if(context.command.match(ChatGPTModes[mode].keywords))
                {
                    temp = ChatGPTModes[mode]
                    break
                }
            }
            if(context.command.match(/off|выкл|откл|disable/) && !temp)
            {
                await context.chat.ChangeBotMode(0)
                const msg = await context.send("✅ Бот выключен")
                setTimeout(async () => {
                    try {
                        await API.messages.delete({
                            conversation_message_ids: context.conversationMessageId,
                            delete_for_all: 1,
                            peer_id: context.peerId
                        })
                    } catch (e) {
                    }
                    try {
                        await API.messages.delete({
                            conversation_message_ids: msg.conversationMessageId,
                            delete_for_all: 1,
                            peer_id: msg.peerId
                        })
                    } catch (e) {}
                }, 60000)
                return
            }
            if(!temp)
            {
                let request = "↖ Доступные режимы:\n\n"
                for(const mode of Object.keys(ChatGPTModes))
                {
                    request += ChatGPTModes[mode].name + "\n"
                }
                request += "\nℹ Сейчас установлен режим " + (context.chat.mode ? context.chat.mode.name : "❌ Выключен")
                const msg = await context.send(request)
                setTimeout(async () => {
                    try {
                        await API.messages.delete({
                            conversation_message_ids: context.conversationMessageId,
                            delete_for_all: 1,
                            peer_id: context.peerId
                        })
                    } catch (e) {
                    }
                    try {
                        await API.messages.delete({
                            conversation_message_ids: msg.conversationMessageId,
                            delete_for_all: 1,
                            peer_id: msg.peerId
                        })
                    } catch (e) {}
                }, 60000)
                return
            }
            await context.chat.ChangeBotMode(temp.id)
            const msg = await context.send("✅ Установлен режим ответов " + temp.name)
            setTimeout(async () => {
                try {
                    await API.messages.delete({
                        conversation_message_ids: context.conversationMessageId,
                        delete_for_all: 1,
                        peer_id: context.peerId
                    })
                } catch (e) {
                }
                try {
                    await API.messages.delete({
                        conversation_message_ids: msg.conversationMessageId,
                        delete_for_all: 1,
                        peer_id: msg.peerId
                    })
                } catch (e) {}
            }, 60000)
        }
        catch (e) {console.log(e)}
    }

    PickUpRight = async (context) =>
    {
        if(context.user.role === "user")
        {
            await context.send("⚠ Вы не можете забирать права")
            return
        }
        if(context.replyUsers.length === 0)
        {
            await context.send("⚠ Укажите пользователя")
            return
        }
        let user = await User.findOne({where: {id: context.replyUsers[0]}})
        if(user?.dataValues.role.match(/admin|owner/))
        {
            await context.send("⚠ Вы не можете забирать право пользоваться ботом у админов")
            return
        }
        user = await API.users.get({user_ids: context.replyUsers[0]})
        await User.findOrCreate({where: {id: context.replyUsers[0]}, defaults: {id: context.replyUsers[0], nick: user[0].first_name + " " + user[0].last_name}})
        await User.update({canUseBot: false}, {where: {id: context.replyUsers[0]}})
        if(Data.users[context.replyUsers[0]]) Data.users[context.replyUsers[0]].canUseBot = false
        await context.send("✅ Теперь пользователь не может пользоваться ботом")
    }

    GiveRight = async (context) =>
    {
        if(context.user.role === "user")
        {
            await context.send("⚠ Вы не можете выдавать права")
            return
        }
        if(context.replyUsers.length === 0 && !context.command.match(/все/))
        {
            await context.send("⚠ Укажите пользователя")
            return
        }
        if(context.command.match(/все/))
        {
            const chatInfo = await API.messages.getConversationMembers({peer_id: context.peerId})
            let chatMembers = []
            for(const profile of chatInfo.profiles)
            {
                await User.findOrCreate({where: {id: profile.id}, defaults: {id: profile.id, nick: profile.first_name + " " + profile.last_name}})
                chatMembers.push(profile.id)
                if(Data.users[profile.id]) Data.users[profile.id].canUseBot = true
            }
            await User.update({canUseBot: true}, {where: {id: chatMembers}})
            await context.send("✅ Право использования бота выдано всем участникам этого чата")
        }
        else
        {
            const user = await API.users.get({user_ids: context.replyUsers[0]})
            await User.findOrCreate({where: {id: context.replyUsers[0]}, defaults: {id: context.replyUsers[0], nick: user[0].first_name + " " + user[0].last_name}})
            await User.update({canUseBot: true}, {where: {id: context.replyUsers[0]}})
            if(Data.users[context.replyUsers[0]]) Data.users[context.replyUsers[0]].canUseBot = true
            await context.send("✅ Пользователю выдано право использования бота")
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