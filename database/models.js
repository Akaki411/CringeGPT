const sequelize = require('./database')
const {DataTypes} = require('sequelize')

//Характеристики игрока
const User = sequelize.define("user", {
    id: {type: DataTypes.INTEGER, unique: true, primaryKey: true},
    nick: {type: DataTypes.STRING, allowNull: false},
    role: {type: DataTypes.STRING, allowNull: false, defaultValue: "user"},
    status: {type: DataTypes.STRING, allowNull: false, defaultValue: "Без статуса"},
    canUseBot: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false}
})

const VKChats = sequelize.define("vk-chat", {
    id: {type: DataTypes.INTEGER, unique: true, primaryKey: true},
    botModeId: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0}
})

module.exports = {
    User,
    VKChats
}