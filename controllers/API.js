const {API} = require("vk-io")

module.exports = new API({token: process.env.VK_TOKEN})