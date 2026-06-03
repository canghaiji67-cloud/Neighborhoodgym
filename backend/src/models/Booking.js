module.exports = (sequelize, DataTypes) => {
  const Booking = sequelize.define(
    'Booking',
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
      courseId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('pending_payment', 'booked', 'checked_in', 'cancelled'),
        defaultValue: 'booked',
      },
      txHash: {
        type: DataTypes.STRING(66),
        allowNull: true,
        comment: 'Nullable for free courses',
      },
    },
    {
      tableName: 'bookings',
      underscored: true,
    }
  );

  return Booking;
};
