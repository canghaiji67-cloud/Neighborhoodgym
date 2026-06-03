module.exports = (sequelize, DataTypes) => {
  const ChatSession = sequelize.define(
    'ChatSession',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: '新对话',
      },
    },
    {
      tableName: 'chat_sessions',
      underscored: true,
    }
  );

  return ChatSession;
};
