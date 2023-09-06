class User
{
    constructor(user)
    {
        this.id = user.dataValues.id
        this.nick = user.dataValues.nick
        this.role = user.dataValues.role
        this.status = user.dataValues.status
        this.canUseBot = user.dataValues.canUseBot
    }

    GetInfo()
    {
        return `*id${this.id}(${this.nick})\n\nСтатус: ${this.status}\nРоль: ${this.role === "user" ? "Пользователь" : "Админ"}`
    }
}

module.exports = User