const Data = require("../data/Data")
const user = require("../models/User")
const {User} = require("../database/models")
const API = require("../controllers/API")

module.exports = async (context, next) =>
{
    context.command = context.text?.toLowerCase()
    const userId = context.peerType === "chat" ? context.senderId : context.peerId

    if(Data.users[userId])
    {
        context.user = Data.users[userId]
        next()
    }
    else
    {
        let temp = await User.findOne({where: {id: userId}})
        if(temp)
        {

            Data.users[userId] = new user(temp)
            context.user = Data.users[userId]
            next()
        }
        else
        {
            const userInfo = await API.users.get({user_ids: userId})
            temp = await User.create({
                id: userId,
                nick: userInfo[0].first_name + " " + userInfo[0].last_name
            })
            Data.users[userId] = new user(temp)
            context.user = Data.users[userId]
            next()
        }
    }
}