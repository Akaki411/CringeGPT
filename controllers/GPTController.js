const APIKeysGenerator = require("../models/ApiKeysGenerator")
const axios = require("axios")

module.exports = async (messages) =>
{
    let key = APIKeysGenerator.GetKey()
    try
    {
        let request = await axios.post("https://api.openai.com/v1/chat/completions", {
                model: "gpt-3.5-turbo",
                messages: messages
            },
            {
                headers: {
                    Authorization: 'Bearer ' + key
                }
            })
        request = request.data["choices"][0].message.content
        let pages = []
        for(let i = 0; i < Math.ceil(request.length/4000); i++)
        {
            pages[i] = request.slice((i * 4000), (i * 4000) + 4000)
        }
        return pages
    }
    catch (e)
    {
        APIKeysGenerator.WarnKey(key)
        return undefined
    }
}