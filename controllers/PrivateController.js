const GPT = require("./GPTController")

class PrivateController
{
    MessageHandler = async (context) =>
    {
        try
        {
            let messages = []
            let limit = 15
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
            if(context.replyMessage && context.replyMessage?.text?.length > 0)
            {
                messages.push({role: context.replyMessage.senderId > 0 ? "user" : "assistant", content: context.replyMessage.text})
            }
            for(const a of context.attachments)
            {
                if(a.type === "audio")
                {
                    messages.push({role: "user", content: `Песня ${a.title} от исполнителя ${a.artist}`})
                    break
                }
            }
            messages.push({role: "user", content: context.text})
            let request = await GPT(messages)
            for (const sample of request)
            {
                await context.send(sample)
            }
        }
        catch (e) {}
    }
}

module.exports = new PrivateController()