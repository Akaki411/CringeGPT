const GPT = require("./GPTController")
const {Keyboard} = require("vk-io")
const Settings = require("./Settings")

class PrivateController
{
    MessageHandler = async (context) =>
    {
        if(context.command?.match(/^начать/))
        {
            await context.send("Привет.\n\nℹ Это бот, который может отвечать на твои вопросы. Он основан на нейросети ChatGPT, а именно на модели GPT 3.5 Turbo.\n\n❗ Для того чтобы бот начал отвечать вам свяжитесь с одним из администраторов и он выдаст вам право. К кому обращаться вы знаете сами, так как этот бот написан за один вечер специально для того, чтобы облегчить выполнение домашнего задания для группы КЭ-105", {keyboard: Keyboard.keyboard([])})
            return
        }
        await Settings.MessageHandler(context, async () =>
        {
            if(!context.user?.canUseBot)
            {
                await context.send("⚠ Сейчас вы не можете пользоваться ботом, чтобы открыть эту возможность - обратитесь к админам.", {keyboard: Keyboard.keyboard([])})
                return
            }
            await this.SendGPTRequest(context)
        })
    }
    async SendGPTRequest(context)
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