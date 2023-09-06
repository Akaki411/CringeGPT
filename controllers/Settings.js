const {User} = require("../database/models");
const Data = require("../data/Data");
const ChatGPTModes = require("../models/BotCallModels");
const API = require("./API");
const {Keyboard} = require("vk-io");

class Settings
{
    async MessageHandler(context, callback)
    {
        if(context.command?.match(/^начать/) && context.peerType === "user")
        {
            await context.send("Привет.\n\nℹ Это бот, который может отвечать на твои вопросы. Он основан на нейросети ChatGPT, а именно на модели GPT 3.5 Turbo.\n\n❗ Для того чтобы бот начал отвечать вам свяжитесь с одним из администраторов и он выдаст вам право. К кому обращаться вы знаете сами, так как этот бот написан за один вечер специально для того, чтобы облегчить выполнение домашнего задания для группы КЭ-105", {keyboard: Keyboard.keyboard([])})
            return
        }
        if(context.command?.match(/^кто я/))
        {
            await context.send(context.user.GetInfo())
            return
        }
        if(context.command?.match(/^!ник /))
        {
            await this.ChangeNick(context)
            return
        }
        if(context.command?.match(/^!статус /))
        {
            await this.ChangeStatus(context)
            return
        }
        if(context.command?.match(/^выдать прав/))
        {
            await this.GiveRight(context)
            return
        }
        if(context.command?.match(/^забрать прав/))
        {
            await this.PickUpRight(context)
            return
        }
        if(context.command?.match(/^!админ/))
        {
            await this.SetAdminRights(context)
            return
        }
        if(context.command?.match(/^бот режим/) && context.peerType === "chat")
        {
            await this.ChangeBotMode(context)
            return
        }
        await callback()
    }

    ChangeStatus = async (context) =>
    {
        const newStatus = context.text.replace(/!статус /, "")
        if(newStatus.length === 0) return
        await User.update({status: newStatus}, {where: {id: context.user.id}})
        context.user.status = newStatus
        await context.send(`✅ Установлен статус ${newStatus}`)
    }

    ChangeNick = async (context) =>
    {
        const newNick = context.text.replace(/!ник /, "")
        if(newNick.length === 0) return
        await User.update({nick: newNick}, {where: {id: context.user.id}})
        context.user.nick = newNick
        await context.send(`✅ Установлен ник *id${context.user.id}(${newNick})`)
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
            if(!context.user?.canUseBot)
            {
                await context.send("⚠ Вы не можете менять режим бота, так как у вас нет права на его использование, обратитесь к админу.", {keyboard: Keyboard.keyboard([])})
                return
            }
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
        if(context.replyUsers.length === 0 && !(context.command.match(/все/) && context.peerType === "chat"))
        {
            await context.send("⚠ Укажите пользователя")
            return
        }
        if(context.command.match(/все/))
        {
            try
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
            catch (e)
            {
                await context.send("⚠ Бот не имеет доступа к информации о чате, выдайте ему админку в чате")
            }
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
}

module.exports = new Settings()