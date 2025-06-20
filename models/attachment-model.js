module.exports = (sequelize, DataTypes) => {
    const Attachment = sequelize.define('Attachment', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        pollId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Polls',
                key: 'id',
            },
        },
        attachmentType: {
            type: DataTypes.ENUM('video', 'image'),
            allowNull: false,
        },
        attachment: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    }, {
        tableName: 'attachments',
        timestamps: true,
    });

    Attachment.associate = (models) => {
        Attachment.belongsTo(models.Polls, {
            foreignKey: 'pollId',
            as: 'polls',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
    };

    return Attachment;
};