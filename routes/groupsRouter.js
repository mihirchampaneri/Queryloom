const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { Sequelize, Op } = require('sequelize');
const upload = require('../helpers/multer-config');
const { Group, GroupMember, Report, GroupPost, Polls, Attachment, Option, User, Vote, Comment, Like, Saved, Rule, sequelize } = require('../models');

// router.post('/create', upload.fields([{ name: 'groupProfilePic', maxCount: 1 }, { name: 'groupBackgroundImg', maxCount: 1 }]), async (req, res) => {
//     const {
//       groupName,
//       groupInfo,
//       groupCategory,
//       whoCanPost = 'anyone',
//       visibility = 'public',
//       approvalRequired = false,
//       allowIncognitoPost = false,
//       member,
//       rules
//     } = req.body;

//     const userId = req.user?.id;
//     const groupProfilePic = req.files['groupProfilePic']?.[0]?.path.replace(/\\/g, '/') || null;
//     const groupBackgroundImg = req.files['groupBackgroundImg']?.[0]?.path.replace(/\\/g, '/') || null;

//     if (!groupName) {
//       return res.status(400).json({ message: 'Group name is required.' });
//     }

//     const t = await sequelize.transaction();

//     try {
//       const group = await Group.create({
//         groupName,
//         groupInfo,
//         groupCategory,
//         groupProfilePic,
//         groupBackgroundImg,
//         whoCanPost,
//         visibility,
//         approvalRequired,
//         allowIncognitoPost,
//         userId,
//         rules,
//       }, { transaction: t });

//       await GroupMember.create({
//         groupId: group.id,
//         userId: userId,
//         role: 'admin',
//         approved: true,
//       }, { transaction: t });

//       let memberIds = [];

//       if (member) {
//         memberIds = typeof member === 'string'
//           ? member.split(',').map(id => parseInt(id)).filter(id => id && id !== userId)
//           : Array.isArray(member)
//           ? member.map(id => parseInt(id)).filter(id => id && id !== userId)
//           : [];

//         if (memberIds.length > 0) {
//           const membersToInsert = memberIds.map(id => ({
//             groupId: group.id,
//             userId: id,
//             role: 'member',
//             approved: false,
//           }));

//           await GroupMember.bulkCreate(membersToInsert, { transaction: t });
//         }
//       }

//       await t.commit();

//       return res.status(201).json({
//         message: 'Group created successfully',
//         group,
//       });

//     } catch (error) {
//       await t.rollback();
//       console.error('Error creating group:', error);
//       return res.status(500).json({ message: 'Internal server error' });
//     }
//   }
// );

router.post('/create', upload.fields([{ name: 'groupProfilePic', maxCount: 1 }, { name: 'groupBackgroundImg', maxCount: 1 }]), async (req, res) => {
  const {
    groupName,
    groupInfo,
    groupCategory,
    whoCanPost = 'anyone',
    visibility = 'public',
    approvalRequired = false,
    allowIncognitoPost = false,
    postapproval = false,
    member,
    rules
  } = req.body;

  const userId = req.user?.id;
  const groupProfilePic = req.files['groupProfilePic']?.[0]?.path.replace(/\\/g, '/') || null;
  const groupBackgroundImg = req.files['groupBackgroundImg']?.[0]?.path.replace(/\\/g, '/') || null;

  if (!groupName) {
    return res.status(400).json({ message: 'Group name is required.' });
  }

  let parsedRules = [];
  if (rules) {
    if (typeof rules === 'string') {
      try {
        parsedRules = JSON.parse(rules);
      } catch {
        parsedRules = rules.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
      }
    } else if (Array.isArray(rules)) {
      parsedRules = rules.map(id => parseInt(id)).filter(id => !isNaN(id));
    }
  }

  const t = await sequelize.transaction();

  try {
    const group = await Group.create({
      groupName,
      groupInfo,
      groupCategory,
      groupProfilePic,
      groupBackgroundImg,
      whoCanPost,
      visibility,
      approvalRequired,
      allowIncognitoPost,
      postapproval,
      userId,
    }, { transaction: t });

    await GroupMember.create({
      groupId: group.id,
      userId: userId,
      role: 'admin',
      approved: true,
    }, { transaction: t });

    if (parsedRules.length > 0) {
      const validRules = await Rule.findAll({
        where: {
          id: parsedRules,
          isCustom: false
        }
      });

      if (validRules.length > 0) {
        await group.addRules(validRules, { transaction: t });
      }
    }

    let memberIds = [];
    if (member) {
      memberIds = typeof member === 'string'
        ? member.split(',').map(id => parseInt(id)).filter(id => id && id !== userId)
        : Array.isArray(member)
          ? member.map(id => parseInt(id)).filter(id => id && id !== userId)
          : [];

      if (memberIds.length > 0) {
        const membersToInsert = memberIds.map(id => ({
          groupId: group.id,
          userId: id,
          role: 'member',
          approved: false,
        }));
        await GroupMember.bulkCreate(membersToInsert, { transaction: t });
      }
    }

    await t.commit();

    return res.status(201).json({
      message: 'Group created successfully',
      group,
    });

  } catch (error) {
    await t.rollback();
    console.error('Error creating group:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/:groupId', async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user?.id;

  const t = await sequelize.transaction();

  try {
    const group = await Group.findByPk(groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.userId !== userId) {
      return res.status(403).json({ message: 'You are not authorized to delete this group' });
    }

    await GroupMember.destroy({ where: { groupId }, transaction: t });

    await group.destroy({ transaction: t });

    await t.commit();

    return res.status(200).json({ message: 'Group deleted successfully' });

  } catch (error) {
    await t.rollback();
    console.error('Error deleting group:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/:groupId', upload.fields([{ name: 'groupProfilePic', maxCount: 1 }, { name: 'groupBackgroundImg', maxCount: 1 }]), async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user?.id;

  try {
    const group = await Group.findByPk(groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.userId !== userId) {
      return res.status(403).json({ message: 'Only the group admin can update the group' });
    }

    const {
      groupName,
      groupInfo,
      groupCategory,
      whoCanPost,
      visibility,
      approvalRequired,
      allowIncognitoPost
    } = req.body;

    const groupProfilePic = req.files['groupProfilePic']?.[0]?.path.replace(/\\/g, '/') || group.groupProfilePic;
    const groupBackgroundImg = req.files['groupBackgroundImg']?.[0]?.path.replace(/\\/g, '/') || group.groupBackgroundImg;

    await group.update({
      groupName: groupName || group.groupName,
      groupInfo: groupInfo || group.groupInfo,
      groupCategory: groupCategory || group.groupCategory,
      whoCanPost: whoCanPost || group.whoCanPost,
      visibility: visibility || group.visibility,
      approvalRequired: approvalRequired ?? group.approvalRequired,
      allowIncognitoPost: allowIncognitoPost ?? group.allowIncognitoPost,
      groupProfilePic,
      groupBackgroundImg
    });

    return res.status(200).json({
      message: 'Group updated successfully',
      group
    });

  } catch (error) {
    console.error('Error updating group:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/remove/:groupId', async (req, res) => {
  const { groupId } = req.params;
  const adminId = req.user?.id;
  const { userId } = req.body;

  try {
    const group = await Group.findByPk(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (group.userId !== adminId)
      return res.status(403).json({ message: 'Only group admin can remove members' });

    const removed = await GroupMember.destroy({ where: { groupId, userId } });
    if (!removed) return res.status(404).json({ message: 'User is not in the group' });

    return res.json({ message: 'User removed from group' });

  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/add/:groupId', async (req, res) => {
  const { groupId } = req.params;
  const adminId = req.user?.id;
  const { userId, role = 'member', approved = false } = req.body;

  try {
    const group = await Group.findByPk(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (group.userId !== adminId)
      return res.status(403).json({ message: 'Only group admin can add members' });

    const exists = await GroupMember.findOne({ where: { groupId, userId } });
    if (exists) return res.status(400).json({ message: 'User already in group' });

    await GroupMember.create({ groupId, userId, role, approved });

    return res.status(201).json({ message: 'User added to group' });

  } catch (error) {
    console.error('Error adding member:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/update/:groupId', async (req, res) => {
  const { groupId } = req.params;
  const adminId = req.user?.id;
  const { userId, role, approved } = req.body;

  try {
    const group = await Group.findByPk(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (group.userId !== adminId)
      return res.status(403).json({ message: 'Only group admin can update members' });

    const member = await GroupMember.findOne({ where: { groupId, userId } });
    if (!member) return res.status(404).json({ message: 'Member not found in group' });

    const updatedData = {};
    if (role !== undefined) updatedData.role = role;
    if (typeof approved === 'boolean') updatedData.approved = approved;

    await member.update(updatedData);

    return res.json({ message: 'Member updated successfully', member });

  } catch (error) {
    console.error('Error updating member:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/:groupId', async (req, res) => {
  const { groupId } = req.params;

  try {
    const group = await Group.findByPk(groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const totalMembers = await GroupMember.count({
      where: { groupId }
    });

    return res.status(200).json({
      group,
      totalMembers
    });

  } catch (error) {
    console.error('Error fetching group details:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const groups = await Group.findAll({
      where: {
        visibility: 'public'
      },
      attributes: [
        'id',
        'groupName',
        'groupProfilePic',
        'groupBackgroundImg',
        [
          Sequelize.literal(`(SELECT COUNT(*) FROM GroupMembers AS gm WHERE gm.groupId = Group.id)`),
          'totalMembers'
        ]
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({ groups });

  } catch (error) {
    console.error('Error fetching groups:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/createpolls', upload.array('attachments', 10), async function (req, res) {
  const t = await sequelize.transaction();
  const userId = req.user.id;

  try {
    const {
      questionText,
      postType,
      expiration,
      commentPermission,
      incognito = false,
      unpublish = false,
      options,
      groupId
    } = req.body;

    const uploadedFiles = req.files;

    const member = await GroupMember.findOne({ where: { groupId, userId, approved: true } });

    if (!member) {
      return res.status(403).json({ error: 'You dont have permission to create the post' });
    }

    if (!userId || !questionText || !postType || !commentPermission) {
      await t.rollback();
      return res.status(400).json({ error: 'Missing required fields.' });
    }


    if (postType !== 'poll' && postType !== 'post') {
      await t.rollback();
      return res.status(400).json({ error: 'Invalid postType. Must be "poll" or "post".' });
    }
    let groupPostApproval = false;

    if (groupId) {
      const group = await Group.findByPk(groupId);
      if (!group) {
        await t.rollback();
        return res.status(404).json({ error: 'Group not found.' });
      }

      groupPostApproval = group.postapproval;

      if (group.whoCanPost == 'admin') {
        if (group.adminId !== userId) {
          await t.rollback();
          return res.status(403).json({ error: 'Only group admin can post in this group.' });
        }
      } else if (group.whoCanPost == 'anyone') {
        const isMember = await GroupMember.findOne({ where: { groupId, userId } });
        if (!isMember) {
          await t.rollback();
          return res.status(403).json({ error: 'You must be a member of this group to post.' });
        }
      } else {
        await t.rollback();
        return res.status(400).json({ error: 'Invalid group posting configuration.' });
      }

      if (incognito == true && group.allowIncognitoPost == false) {
        await t.rollback();
        return res.status(403).json({ error: 'You do not have permission to create incognito polls in this group.' });
      }
    }


    const newPollData = {
      userId,
      questionText,
      postType,
      expiration: expiration || null,
      visibility: 4,
      commentPermission,
      incognito,
      unpublish
    };

    const createdPoll = await Polls.create(newPollData, { transaction: t });

    let associatedData = null;

    if (postType === 'poll') {
      if (!options || !Array.isArray(options) || options.length === 0) {
        await t.rollback();
        return res.status(400).json({ error: 'Options are required for a poll.' });
      }

      const optionsToCreate = options.map(optionText => ({
        pollId: createdPoll.id,
        name: optionText,
      }));

      associatedData = await Option.bulkCreate(optionsToCreate, { transaction: t });

    } else if (postType === 'post') {
      if (!uploadedFiles || uploadedFiles.length === 0) {
        await t.rollback();
        return res.status(400).json({ error: 'Attachments required for postType "post".' });
      }

      const attachmentsToCreate = uploadedFiles.map(file => {
        let attachmentType;
        if (file.mimetype.startsWith('image/')) {
          attachmentType = 'image';
        } else if (file.mimetype.startsWith('video/')) {
          attachmentType = 'video';
        } else {
          throw new Error(`Unsupported file type uploaded: ${file.mimetype}`);
        }

        return {
          pollId: createdPoll.id,
          attachmentType,
          attachment: `/uploads/content/${file.filename}`,
        };
      });

      associatedData = await Attachment.bulkCreate(attachmentsToCreate, { transaction: t });
    }

    if (groupId) {
      await GroupPost.create({
        groupId,
        pollId: createdPoll.id,
        approved: !groupPostApproval
      }, { transaction: t });
    }

    await t.commit();

    const responseData = createdPoll.toJSON();
    if (postType === 'poll') {
      responseData.options = associatedData;
    } else if (postType === 'post') {
      responseData.attachments = associatedData;
    }

    res.status(201).json(responseData);

  } catch (error) {
    await t.rollback();
    console.error('Error creating poll/post:', error);

    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ errors: error.errors.map(e => e.message) });
    }
    if (error instanceof multer.MulterError) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message.includes('Invalid file type')) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to create poll/post due to a server error.' });
  }
});

// router.post('/createpolls', upload.array('attachments', 10), async function (req, res) {
//   const t = await sequelize.transaction();
//   const userId = req.user.id;

//   try {
//     const {
//       questionText,
//       postType,
//       expiration,
//       commentPermission,
//       incognito = false,
//       unpublish = false,
//       options,
//       groupId
//     } = req.body;

//     const uploadedFiles = req.files;

//     if (!userId || !questionText || !postType || !commentPermission) {
//       await t.rollback();
//       return res.status(400).json({ error: 'Missing required fields.' });
//     }

//     if (postType !== 'poll' && postType !== 'post') {
//       await t.rollback();
//       return res.status(400).json({ error: 'Invalid postType. Must be "poll" or "post".' });
//     }

//     const newPollData = {
//       userId,
//       questionText,
//       postType,
//       expiration: expiration || null,
//       visibility: 4,
//       commentPermission,
//       incognito,
//       unpublish
//     };

//     const createdPoll = await Polls.create(newPollData, { transaction: t });

//     let associatedData = null;

//     if (postType === 'poll') {
//       if (!options || !Array.isArray(options) || options.length === 0) {
//         await t.rollback();
//         return res.status(400).json({ error: 'Options are required for a poll.' });
//       }

//       const optionsToCreate = options.map(optionText => ({
//         pollId: createdPoll.id,
//         name: optionText,
//       }));

//       associatedData = await Option.bulkCreate(optionsToCreate, { transaction: t });

//     } else if (postType === 'post') {
//       if (!uploadedFiles || uploadedFiles.length === 0) {
//         await t.rollback();
//         return res.status(400).json({ error: 'Attachments required for postType "post".' });
//       }

//       const attachmentsToCreate = uploadedFiles.map(file => {
//         let attachmentType;
//         if (file.mimetype.startsWith('image/')) {
//           attachmentType = 'image';
//         } else if (file.mimetype.startsWith('video/')) {
//           attachmentType = 'video';
//         } else {
//           throw new Error(`Unsupported file type uploaded: ${file.mimetype}`);
//         }

//         return {
//           pollId: createdPoll.id,
//           attachmentType,
//           attachment: `/uploads/content/${file.filename}`,
//         };
//       });

//       associatedData = await Attachment.bulkCreate(attachmentsToCreate, { transaction: t });
//     }

//     if (groupId) {
//       await GroupPost.create({
//         groupId,
//         pollId: createdPoll.id
//       }, { transaction: t });
//     }

//     await t.commit();

//     const responseData = createdPoll.toJSON();
//     if (postType === 'poll') {
//       responseData.options = associatedData;
//     } else if (postType === 'post') {
//       responseData.attachments = associatedData;
//     }

//     res.status(201).json(responseData);

//   } catch (error) {
//     await t.rollback();
//     console.error('Error creating poll/post:', error);

//     if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
//       return res.status(400).json({ errors: error.errors.map(e => e.message) });
//     }
//     if (error instanceof multer.MulterError) {
//       return res.status(400).json({ error: error.message });
//     }
//     if (error.message.includes('Invalid file type')) {
//       return res.status(400).json({ error: error.message });
//     }

//     res.status(500).json({ error: 'Failed to create poll/post due to a server error.' });
//   }
// });

// router.get('/:groupId/polls', async (req, res) => {
//   const { groupId } = req.params;

//   try {
//     const groupPosts = await GroupPost.findAll({
//       where: { groupId },
//       include: [
//         {
//           model: Polls,
//           as: 'poll',
//           where: { visibility: 4 },
//           required: true,
//           include: [
//             {
//               model: User,
//               as: 'user',
//               attributes: ['id', 'username', 'fullname', 'image'],
//             },
//             {
//               model: Option,
//               as: 'options',
//               include: [
//                 { model: Vote, as: 'votes' }
//               ],
//               required: false,
//             },
//             {
//               model: Attachment,
//               as: 'attachments',
//               required: false,
//             },
//             {
//               model: Comment,
//               as: 'comments',
//               required: false,
//             },
//             {
//               model: Like,
//               as: 'likes',
//               required: false,
//             },
//             {
//               model: Saved,
//               as: 'saves',
//               required: false,
//             },
//           ],
//         },
//       ],
//     });

//     const polls = groupPosts
//       .filter(gp => gp.poll)
//       .map(gp => {
//         const poll = gp.poll.toJSON();
//         if (poll.postType === 'poll') {
//           poll.options = poll.options.map(opt => {
//             opt.voteCount = opt.votes?.length || 0;
//             delete opt.votes;
//             return opt;
//           });
//           poll.attachments = [];
//         } else if (poll.postType === 'post') {
//           poll.options = [];
//         }

//         return {
//           ...poll,
//           groupId: gp.groupId
//         };
//       });

//     res.json(polls);
//   } catch (error) {
//     console.error('Error fetching group polls:', error);
//     res.status(500).json({ error: 'Failed to fetch group polls' });
//   }
// });

router.get('/:groupId/polls', async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.id;

  try {
    const isMember = await GroupMember.findOne({
      where: { groupId, userId, approved: true }
    });

    if (!isMember) {
      return res.status(403).json({ error: 'You are not approved to access this group.' });
    }

    const groupPosts = await GroupPost.findAll({
      where: { groupId, approved: true },
      include: [
        {
          model: Polls,
          as: 'poll',
          where: { visibility: 4 },
          required: true,
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'fullname', 'image'],
            },
            {
              model: Option,
              as: 'options',
              attributes: ['id', 'name'],
              include: [{ model: Vote, as: 'votes' }],
              required: false,
            },
            {
              model: Attachment,
              as: 'attachments',
              required: false,
            },
            {
              model: Comment,
              as: 'comments',
              attributes: ['id', 'userId', 'message', 'attachments', 'parentCommentId'],
              required: false,
            },
            {
              model: Like,
              as: 'likes',
              attributes: ['id', 'userId', 'isLiked'],
              required: false,
            },
            {
              model: Saved,
              as: 'saves',
              required: false,
            },
          ],
        },
      ],
      order: [[{ model: Polls, as: 'poll' }, 'createdAt', 'DESC']]
    });

    const visiblePolls = groupPosts
      .filter(gp => gp.poll && gp.poll.unpublish !== true)
      .map(gp => {
        const poll = gp.poll.toJSON();

        if (poll.incognito && poll.user) {
          poll.user.username = 'incognito';
          poll.user.fullname = 'incognito';
          poll.user.image = 'incognito';
        }

        const totalVotes = poll.options?.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0) || 0;

        if (poll.postType === 'poll') {
          poll.options = poll.options.map(opt => {
            const voteCount = opt.votes?.length || 0;
            const percentage = totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(2) : '0.00';
            delete opt.votes;

            return {
              ...opt,
              voteCount,
              percentage: `${percentage}%`
            };
          });
        } else {
          poll.options = [];
        }

        poll.totalVotes = totalVotes;
        poll.commentCount = poll.comments?.length || 0;
        poll.likeCount = poll.likes?.length || 0;
        poll.saveCount = poll.saves?.length || 0;

        return {
          ...poll,
          groupId: gp.groupId
        };
      });

    if (visiblePolls.length === 0) {
      return res.status(404).json({ error: 'Polls do not exist.' });
    }

    res.json(visiblePolls);
  } catch (error) {
    console.error('Error fetching group polls:', error);
    res.status(500).json({ error: 'Failed to fetch group polls' });
  }
});

router.get('/media/:groupId', async (req, res) => {
  const { groupId } = req.params;

  try {
    const groupPosts = await GroupPost.findAll({
      where: { groupId },
      include: [
        {
          model: Polls,
          as: 'poll',
          where: {
            postType: 'post',
            unpublish: false,
          },
          required: true,
          attributes: {
            exclude: ['groupId'],
          },
          include: [
            {
              model: Attachment,
              as: 'attachments',
              required: true,
            },
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'fullname', 'image'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    const posts = groupPosts
      .map(gp => gp.poll?.toJSON())
      .filter(Boolean)
      .map(poll => {
        const images = poll.attachments.filter(att => att.attachmentType === 'image');
        const videos = poll.attachments.filter(att => att.attachmentType === 'video');

        return {
          ...poll,
          images,
          videos,
          attachments: undefined,
        };
      });

    res.json(posts);
  } catch (error) {
    console.error('Error fetching group media posts:', error);
    res.status(500).json({ error: 'Failed to fetch media posts' });
  }
});

router.post('/join/:groupId', async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.id;

  try {
    const group = await Group.findByPk(groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.visibility !== 'public') {
      return res.status(403).json({ message: 'This group is not public. You cannot join.' });
    }

    const isMember = await GroupMember.findOne({
      where: { groupId, userId }
    });

    if (isMember) {
      return res.status(400).json({ message: 'You are already a member of this group.' });
    }

    await GroupMember.create({ groupId, userId });

    res.status(200).json({ message: 'Successfully joined the group.' });
  } catch (error) {
    console.error('Error joining group:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/createrules', async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Rule name is required.' });
    }

    const newRule = await Rule.create({ name, description });

    res.status(201).json({
      message: 'Rule created successfully.',
      rule: newRule
    });

  } catch (error) {
    console.error('Error creating rule:', error);
    res.status(500).json({ error: 'Internal server error while creating rule.' });
  }
});

router.get('/rule/predefined', async (req, res) => {
  try {
    const rules = await Rule.findAll({
      where: { isCustom: false }
    });

    res.status(200).json({ rules });
  } catch (error) {
    console.error('Error fetching predefined rules:', error);
    res.status(500).json({ error: 'Failed to fetch predefined rules.' });
  }
});

router.get('/rule/userdefined', async (req, res) => {
  try {
    const rules = await Rule.findAll({
      where: { isCustom: true },
      attributes: ['id', 'name', 'description']
    });

    res.status(200).json({ rules });
  } catch (error) {
    console.error('Error fetching predefined rules:', error);
    res.status(500).json({ error: 'Failed to fetch predefined rules.' });
  }
});

router.get('/rules/:groupId', async (req, res) => {
  const { groupId } = req.params;

  try {
    const group = await Group.findOne({
      where: { id: groupId },
      include: [
        {
          model: Rule,
          as: 'Rules',
          attributes: ['id', 'name', 'description'],
          through: { attributes: [] }
        }
      ]
    });

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    return res.status(200).json({
      groupId: group.id,
      groupName: group.groupName,
      rules: group.Rules
    });
  } catch (err) {
    console.error('Error fetching rules by group ID:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/:groupId/unpublish/:pollId', async (req, res) => {
  const { groupId, pollId } = req.params;
  const userId = req.user.id;

  try {
    const groupPost = await GroupPost.findOne({
      where: { groupId, pollId },
      include: [{
        model: Polls,
        as: 'poll',
        attributes: ['id', 'userId', 'unpublish']
      }]
    });

    if (!groupPost || !groupPost.poll) {
      return res.status(404).json({ error: 'Poll not found in this group.' });
    }

    if (groupPost.poll.userId !== userId) {
      return res.status(403).json({ error: 'You are not authorized to modify this poll.' });
    }

    const currentUnpublish = groupPost.poll.unpublish;
    const newUnpublish = !currentUnpublish;

    await Polls.update(
      { unpublish: newUnpublish },
      { where: { id: pollId } }
    );

    const statusMsg = newUnpublish ? 'Poll has been unpublished.' : 'Poll has been republished.';

    res.json({ message: statusMsg, unpublish: newUnpublish });

  } catch (error) {
    console.error('Error toggling poll publish status:', error);
    res.status(500).json({ error: 'Failed to update publish status.' });
  }
});

// router.delete('/:groupId/leave', async (req, res) => {
//   const { groupId } = req.params;
//   const userId = req.user.id;

//   try {
//     const membership = await GroupMember.findOne({
//       where: { groupId, userId }
//     });

//     if (!membership) {
//       return res.status(404).json({ error: 'You are not a member of this group.' });
//     }

//     if (membership.role == 'admin') {
//       await GroupMember.update({ role:'admin' }),
//      res.status(403).json({ error: 'You are the admin of this group and you leave the group.' });
//     }

//     await membership.destroy();

//     res.json({ message: 'You have successfully left the group.' });
//   } catch (error) {
//     console.error('Error leaving group:', error);
//     res.status(500).json({ error: 'Failed to leave group.' });
//   }
// });

router.delete('/:groupId/leave', async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.id;

  try {
    const membership = await GroupMember.findOne({
      where: { groupId, userId }
    });

    if (!membership) {
      return res.status(404).json({ error: 'You are not a member of this group.' });
    }

    if (membership.role == 'admin') {
      const nextMember = await GroupMember.findOne({
        where: {
          groupId,
          userId: { [Op.ne]: userId },
          approved: true
        },
        order: [['createdAt', 'ASC']]
      });

      if (nextMember) {
        await nextMember.update({ role: 'admin' });
      } else {
        return res.status(403).json({
          error: 'You are the only member of this group. You cannot leave until someone else joins.'
        });
      }
    }

    await membership.destroy();

    res.status(200).json({ message: 'You have successfully left the group.' });
  } catch (error) {
    console.error('Error leaving group:', error);
    res.status(500).json({ error: 'Failed to leave group.' });
  }
});

router.put('/:groupId/approve/:userId', async (req, res) => {
  const { groupId, userId } = req.params;
  const adminId = req.user.id;

  try {
    const admin = await GroupMember.findOne({
      where: { groupId, userId: adminId, role: 'admin', approved: true }
    });

    if (!admin) {
      return res.status(403).json({ error: 'Only admin can approve or disapprove members.' });
    }

    const member = await GroupMember.findOne({
      where: { groupId, userId }
    });

    if (!member) {
      return res.status(404).json({ error: 'Member not found in this group.' });
    }

    member.approved = !member.approved;
    await member.save();

    res.json({ 
      message: `Member ${member.approved ? 'approved' : 'disapproved'} successfully.`,
      approved: member.approved 
    });
  } catch (error) {
    console.error('Error toggling member approval:', error);
    res.status(500).json({ error: 'Failed to toggle member approval.' });
  }
});

// router.put('/:groupId/approve/:userId', async (req, res) => {
//   const { groupId, userId } = req.params;
//   const adminId = req.user.id;

//   try {
//     const admin = await GroupMember.findOne({
//       where: { groupId, userId: adminId, role: 'admin', approved: true }
//     });

//     if (!admin) {
//       return res.status(403).json({ error: 'Only admin can approve members.' });
//     }

//     const member = await GroupMember.findOne({
//       where: { groupId, userId }
//     });

//     if (!member) {
//       return res.status(404).json({ error: 'Member not found in this group.' });
//     }

//     member.approved = true;
//     await member.save();

//     res.json({ message: 'Member approved successfully.' });
//   } catch (error) {
//     console.error('Error approving member:', error);
//     res.status(500).json({ error: 'Failed to approve member.' });
//   }
// });

router.get('/:groupId/requests', async (req, res) => {
  const { groupId } = req.params;
  const adminId = req.user.id;

  try {
    const adminMember = await GroupMember.findOne({
      where: {
        groupId,
        userId: adminId,
        role: 'admin',
        approved: true
      }
    });

    if (!adminMember) {
      return res.status(403).json({ error: 'Only approved group admins can view approval requests.' });
    }
    const pendingMembers = await GroupMember.findAll({
      where: {
        groupId,
        approved: false
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'fullname']
      }]
    });

    res.json(pendingMembers);
  } catch (error) {
    console.error('Error fetching approval requests:', error);
    res.status(500).json({ error: 'Failed to fetch approval requests.' });
  }
});

router.get('/requests/groupposts', async (req, res) => {
  const userId = req.user.id;

  try {
    const pendingPosts = await GroupPost.findAll({
      where: {
        approved: false
      },
      include: [
        {
          model: Group,
          where: {
            postApproval: true
          },
          include: [
            {
              model: GroupMember,
              where: {
                userId,
                role: 'admin'
              },
              attributes: []
            }
          ],
          attributes: ['id', 'groupName', 'postApproval']
        }
      ]
    });

    res.status(200).json({ requests: pendingPosts });
  } catch (err) {
    console.error('Error fetching approval requests:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/groupposts/:pollId/approval', async (req, res) => {
  const userId = req.user.id;
  const { pollId } = req.params;
  const { action } = req.body;

  try {
    const groupPost = await GroupPost.findOne({
      where: { pollId },
      include: {
        model: Group,
        include: {
          model: GroupMember,
          where: {
            userId,
            role: 'admin'
          },
          required: true
        }
      }
    });

    if (!groupPost) {
      return res.status(404).json({ error: 'GroupPost not found or you are not an admin of this group.' });
    }

    if (action === 'approve') {
      groupPost.approved = true;
      await groupPost.save();
      return res.status(200).json({ message: 'Group post approved successfully.' });

    } else if (action === 'reject') {
      await groupPost.destroy();
      const poll = await Polls.findByPk(pollId);
      if (poll) {
        await poll.destroy();
      }
      return res.status(200).json({ message: 'Group post rejected and deleted successfully.' });

    } else {
      return res.status(400).json({ error: 'Invalid action. Use "approve" or "reject".' });
    }

  } catch (err) {
    console.error('Error processing group post approval:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/editpolls/:pollId', upload.array('attachments', 10), async (req, res) => {
  const t = await sequelize.transaction();
  const userId = req.user.id;
  const { pollId } = req.params;

  try {
    const poll = await Polls.findOne({ where: { id: pollId, userId } });

    if (!poll) {
      await t.rollback();
      return res.status(403).json({ error: 'You are not authorized to edit this poll or poll does not exist.' });
    }

    const {
      questionText,
      expiration,
      commentPermission,
      unpublish = false,
      options,
    } = req.body;

    poll.questionText = questionText || poll.questionText;
    poll.expiration = expiration || null;
    poll.commentPermission = commentPermission || poll.commentPermission;
    poll.unpublish = unpublish;

    await poll.save({ transaction: t });

    let updatedData = null;

    if (poll.postType === 'poll') {
      if (options && Array.isArray(options)) {
        await Option.destroy({ where: { pollId }, transaction: t });

        const newOptions = options.map(optionText => ({
          pollId: poll.id,
          name: optionText
        }));

        updatedData = await Option.bulkCreate(newOptions, { transaction: t });
      }
    } else if (poll.postType === 'post') {
      if (req.files && req.files.length > 0) {
        const oldAttachments = await Attachment.findAll({ where: { pollId } });

        for (const att of oldAttachments) {
          const filePath = path.join(__dirname, '..', 'uploads', 'content', path.basename(att.attachment));
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        await Attachment.destroy({ where: { pollId }, transaction: t });

        const attachmentsToCreate = req.files.map(file => {
          let attachmentType;
          if (file.mimetype.startsWith('image/')) {
            attachmentType = 'image';
          } else if (file.mimetype.startsWith('video/')) {
            attachmentType = 'video';
          } else {
            throw new Error(`Unsupported file type uploaded: ${file.mimetype}`);
          }

          return {
            pollId: poll.id,
            attachmentType,
            attachment: `/uploads/content/${file.filename}`,
          };
        });

        updatedData = await Attachment.bulkCreate(attachmentsToCreate, { transaction: t });
      }
    }

    await t.commit();

    const responseData = poll.toJSON();
    if (poll.postType === 'poll') {
      responseData.options = updatedData;
    } else {
      responseData.attachments = updatedData;
    }

    res.status(200).json({ message: 'Poll updated successfully.', poll: responseData });

  } catch (err) {
    await t.rollback();
    console.error('Error updating poll:', err);

    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ errors: err.errors.map(e => e.message) });
    }

    res.status(500).json({ error: 'Failed to update poll due to a server error.' });
  }
});

router.delete('/:groupId/polls/:pollId', async (req, res) => {
  const userId = req.user.id;
  const { groupId, pollId } = req.params;

  try {
    const poll = await Polls.findOne({
      where: { id: pollId, userId },
      include: {
        model: GroupPost,
        as: 'groupposts',
        where: { groupId }
      }
    });

    if (!poll) {
      return res.status(403).json({ error: 'You are not authorized to delete this group poll or it does not exist.' });
    }

    if (poll.postType === 'post') {
      const attachments = await Attachment.findAll({ where: { pollId } });

      for (const att of attachments) {
        const filePath = path.join(__dirname, '..', 'uploads', 'content', path.basename(att.attachment));
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    }

    await poll.destroy();

    return res.status(200).json({ message: 'Group poll deleted successfully.' });

  } catch (err) {
    console.error('Error deleting group poll:', err);
    return res.status(500).json({ error: 'Failed to delete group poll.' });
  }
});

router.post('/report/:pollId', async (req, res) => {
  const userId = req.user.id;
  const { pollId } = req.params;
  const { message } = req.body;

  if (!message || message.trim() === '') {
    return res.status(400).json({ message: 'Message is required.' });
  }

  try {
    const groupPost = await GroupPost.findOne({
      where: {
        pollId,
        approved: true
      }
    });

    if (!groupPost) {
      return res.status(404).json({ message: 'No approved group post found for this poll.' });
    }

    const member = await GroupMember.findOne({
      where: {
        groupId: groupPost.groupId,
        userId,
        approved: true
      }
    });

    if (!member) {
      return res.status(403).json({ error: 'You are not a member of this group.' });
    }

    const existingReport = await Report.findOne({
      where: {
        userId,
        pollId
      }
    });

    if (existingReport) {
      return res.status(409).json({ message: 'You have already reported this poll.' });
    }

    await Report.create({
      userId,
      pollId,
      groupPostId: groupPost.id,
      message
    });

    return res.status(201).json({ message: 'Report submitted successfully.' });

  } catch (err) {
    console.error('Error reporting poll:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

router.post('/report/:reportId/action', async (req, res) => {
  const adminId = req.user.id;
  const { reportId } = req.params;
  const { action } = req.body;

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ message: 'Invalid action. Must be "approve" or "reject".' });
  }

  try {
    const report = await Report.findByPk(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found.' });
    }

    const groupPost = await GroupPost.findByPk(report.groupPostId);
    if (!groupPost) {
      return res.status(404).json({ message: 'Group post not found.' });
    }

     const isAdmin = await GroupMember.findOne({
      where: {
        groupId: groupPost.groupId,
        userId: adminId,
        role: 'admin', 
        approved: true
      }
    });

    if (!isAdmin) {
      return res.status(403).json({ message: 'Only group admins can take action on this report.' });
    }

    if (action === 'approve') {
      await report.update({ status: 'approved' });

      await GroupPost.update(
        { approved: 0 },
        { where: { pollId: report.pollId } }
      );

      return res.status(200).json({ message: 'Report approved and poll hidden from all users.' });
    } else if (action === 'reject') {
      await report.destroy();
      return res.status(200).json({ message: 'Report rejected and deleted.' });
    }

  } catch (err) {
    console.error('Error processing report action:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

router.get('/:groupId/mypolls', async (req, res) => {
  const userId = req.user.id;
  const { groupId } = req.params;

  try {
    const member = await GroupMember.findOne({
      where: { groupId, userId, approved: true }
    });

    if (!member) {
      return res.status(403).json({ message: 'You are not a member of this group.' });
    }

    const posts = await GroupPost.findAll({
      where: { groupId },
      attributes:['groupId'],
      include: {
        model: Polls,
        as: 'poll',
        where: { userId: userId },
        attributes:['id','questionText','postType','expiration'],
        required: true,
        include: [
          { model: Attachment, as: 'attachments', attributes:['attachmentType','attachment']},
          { model: Option, as: 'options', attributes:[ 'id', 'name'] ,include: [{ model: Vote, as: 'votes', attributes:['id', 'userId'] }],},
          { model: Like, as: 'likes', attributes:['id', 'userId', 'isLiked']},
          { model: Comment, as: 'comments', attributes:['id', 'userId', 'message', 'attachments', 'parentCommentId'] }
        ]
      }
    });

    return res.status(200).json({ polls: posts });

  } catch (err) {
    console.error('Error fetching user polls by group:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;