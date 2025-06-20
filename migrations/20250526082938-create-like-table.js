'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('likes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      commentId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Comments',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      pollId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Polls',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      isLiked: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    }, {
      indexes: [
        {
          unique: true,
          fields: ['userId', 'commentId'],
          where: {
            commentId: {
              [Sequelize.Op.ne]: null 
            }
          },
          name: 'unique_user_comment_like'
        },
        {
          unique: true,
          fields: ['userId', 'pollId'],
          where: {
            pollId: {
              [Sequelize.Op.ne]: null
            }
          },
          name: 'unique_user_poll_like'
        }
      ]
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('likes');
  }
};
