module.exports = (context, next) =>
{
    try
    {
        context.replyUsers = []
        const ids = context.command?.match(/id\d+/g)
        let temp = null
        for(let i = 0; i < ids?.length; i++)
        {
            temp = parseInt(ids[i].replace("id", ""))
            if(temp < 0) continue
            if(!context.replyUsers.includes(temp))
            {
                context.replyUsers.push(temp)
            }
        }
        if(context.replyMessage)
        {
            context.replyUsers.push(context.replyMessage.senderId)
        }
        for(let i = 0; i < context.forwards.length; i++)
        {
            if(context.forwards[i].senderId > 0 && !context.replyUsers.includes(context.forwards[i].senderId))
            {
                context.replyUsers.push(context.forwards[i].senderId)
            }
        }
        context.command = context.command?.replace(/ ?\[.*?] ?/g, "")
        return next()
    }
    catch (e)
    {
        console.log(e)
    }
}