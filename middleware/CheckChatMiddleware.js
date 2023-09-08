const Data = require("../data/Data")
const {VKChats} = require("../database/models")
const VKChat = require("../models/VKChat")

module.exports = async (context, next) =>
{
    if(context.peerType !== "chat") return next()

    if(Data.VKchats[context.peerId])
    {
        context.chat = Data.VKchats[context.peerId]
        next()
    }
    else
    {
        const chat = await VKChats.findOrCreate({
            where: {id: context.peerId},
            defaults: {id: context.peerId, botModeId: 0, ignore: JSON.stringify([])}
        })
        Data.VKchats[context.peerId] = new VKChat(chat[0])
        context.chat = Data.VKchats[context.peerId]
        next()
    }
}