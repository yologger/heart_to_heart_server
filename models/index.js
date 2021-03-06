const Sequelize = require('sequelize')
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];
const db = {};

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password, {
  host: config.host,
  dialect: config.dialect
}
);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.User = require('./user')(sequelize, Sequelize)
db.Post = require('./post')(sequelize, Sequelize)
db.Hashtag = require('./hashtag')(sequelize, Sequelize)
db.Session = require('./session')(sequelize, Sequelize)
db.PostImage = require('./postImage')(sequelize, Sequelize)
db.Favorite = require("./favorite")(sequelize, Sequelize)

// 1:1
db.User.hasOne(db.Session)

// 1:N
db.User.hasMany(db.Post)
db.Post.belongsTo(db.User)
// db.User.hasMany(db.Post, { foreignKey: 'author', sourceKey: 'id' })
// db.Post.belongsTo(db.User, { foreignKey: 'author', targetKey: 'id' })
db.Post.hasMany(db.Favorite)
db.Favorite.belongsTo(db.Post)


db.Post.hasMany(db.PostImage)
// db.Post.belongsToMany(db.Hashtag, { through: 'post_hashtag' })
// db.Hashtag.belongsToMany(db.Post, { through: 'post_hashtag' })

// N:M
db.User.belongsToMany(db.User, {
  foreignKey: "followingId",
  as: "Followers",
  through: "follow"
})

db.User.belongsToMany(db.User, {
  foreignKey: "followerId",
  as: "Followings",
  through: "follow"
})

module.exports = db;