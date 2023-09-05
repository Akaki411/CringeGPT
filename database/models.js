const sequelize = require('./DataBase')
const {DataTypes} = require('sequelize')

//Характеристики игрока
const User = sequelize.define("user", {
    id: {type: DataTypes.INTEGER, unique: true, primaryKey: true},
    TGID: {type: DataTypes.INTEGER, unique: true, allowNull: true},
    TGShortName: {type: DataTypes.STRING, unique: true, allowNull: true},
    nick: {type: DataTypes.STRING, unique: false, allowNull: false},
    gender: {type: DataTypes.BOOLEAN, allowNull: false},
    isBanned: {type: DataTypes.BOOLEAN, defaultValue: false},
    role: {type: DataTypes.STRING, allowNull: false, defaultValue: "player"},
    status: {type: DataTypes.STRING, allowNull: false, defaultValue: "stateless"},
    platform: {type: DataTypes.STRING, allowNull: false, defaultValue: "ANDROID"},
    avatar: {type: DataTypes.STRING, unique: false, allowNull: true},
    beer: {type: DataTypes.REAL, defaultValue: 0.0}
})

module.exports = {
    User
}