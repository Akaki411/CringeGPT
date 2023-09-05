const botMods = require("../models/BotCallModels")
const {VKChats} = require("../database/models")

class VKChat
{
    constructor(chat)
    {
        this.id = chat.dataValues.id
        this.mode = null
        let temp = null
        for(const i of Object.keys(botMods))
        {
            if(botMods[i].id === chat.dataValues.botModeId)
            {
                temp = botMods[i]
                break
            }
        }
        if(temp) {this.mode = temp}
        else {this.mode = null}
    }

    async ChangeBotMode(id)
    {
        let temp = null
        for(const i of Object.keys(botMods))
        {
            if(botMods[i].id === id)
            {
                temp = botMods[i]
                break
            }
        }
        if(temp)
        {
            await VKChats.update({botModeId: id}, {where: {id: this.id}})
            this.mode = temp
        }
        else
        {
            await VKChats.update({botModeId: 0}, {where: {id: this.id}})
            this.mode = null
        }
    }
}

module.exports = VKChat