const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const upload = require("../helpers/multer-config");
const { Allowcomments, Publish, Report, Polls, User, Option, Comment, Vote, Like, Saved, Attachment, sequelize } = require('../models');

router.get('/allowcomments', async (req, res) => {
    try {
        const allowcommentslist = await Allowcomments.findAll();
        res.json(allowcommentslist);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/publish', async (req, res) => {
    try {
        const publishlist = await Publish.findAll();
        res.json(publishlist);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// router.get('/', async (req, res) => {
//   try {
//     const polls = await Polls.findAll({
//       include: [
//         {
//           model: User,
//           as: 'user',
//           attributes: ['id', 'username', 'fullname', 'image'],
//           required: false
//         },
//         {
//           model: Option,
//           as: 'options',
//           required: false,
//           include: [{ model: Vote, as: 'votes', attributes: ['id'] }]
//         },
//         { model: Comment, as: 'comments', attributes: ['id'], required: false },
//         { model: Vote, as: 'votes', attributes: ['id'], required: false },
//         {
//           model: Like,
//           as: 'likes',
//           attributes: ['id', 'userId'],
//           required: false
//         },
//         { model: Saved, as: 'saves', attributes: ['id'], required: false },
//         { model: Attachment, as: 'attachments', required: false }
//       ]
//     });

//     const requestingUserId = req.user?.id;

//     const visiblePolls = polls.filter(poll => {
//       const json = poll.toJSON();
//       return json.unpublish != 1 || json.user?.id === requestingUserId;
//     });

//     const formatted = visiblePolls.map(poll => {
//       const json = poll.toJSON();
//       const isLiked = json.likes?.some(like => like.userId === requestingUserId) || false;

//       let userData = json.user;
//       if (json.incognito === 1 && userData) {
//         userData = {
//           ...userData,
//           username: 'incognito',
//           fullname: 'incognito',
//           image: 'incognito'
//         };
//       }

//       return {
//         id: json.id,
//         questionText: json.questionText,
//         user: userData,
//         likeCount: json.likes?.length || 0,
//         commentCount: json.comments?.length || 0,
//         voteCount: json.votes?.length || 0,
//         saveCount: json.saves?.length || 0,
//         optionCount: json.options?.length || 0,
//         isLiked,
//         options: json.options?.map(opt => ({
//           id: opt.id,
//           name: opt.name,
//           voteCount: opt.votes?.length || 0
//         })) || [],
//         attachments: json.attachments || []
//       };
//     });

//     res.status(200).json(formatted);
//   } catch (error) {
//     console.error('Error fetching polls:', error);
//     res.status(500).json({ error: 'Failed to fetch polls' });
//   }
// });

router.get('/', async (req, res) => {
  try {
    const requestingUserId = req.user?.id;

    const polls = await Polls.findAll({
      where:{
        visibility: 1,
        unpublish:false
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'fullname', 'image'],
          required: false
        },
        {
          model: Option,
          as: 'options',
          required: false,
          include: [{ model: Vote, as: 'votes', attributes: ['id'] }]
        },
        { model: Comment, as: 'comments', attributes: ['id','message','attachment'], required: false },
        { model: Vote, as: 'votes', attributes: ['id'], required: false },
        {
          model: Like,
          as: 'likes',
          attributes: ['id', 'userId'],
          required: false
        },
        { model: Saved, as: 'saves', attributes: ['id'], required: false },
        { model: Attachment, as: 'attachments', required: false }
      ]
    });

    const userReports = await Report.findAll({
      where: {
        userId: requestingUserId,
        groupPostId: null
      },
      attributes: ['pollId']
    });

    const reportedPollIds = userReports.map(report => report.pollId);

    const visiblePolls = polls.filter(poll => {
      const json = poll.toJSON();

      const isUnpublished = json.unpublish == 1;
      const isOwner = json.user?.id === requestingUserId;
      const isReportedByUser = reportedPollIds.includes(json.id);

      return (!isUnpublished || isOwner) && !isReportedByUser;
    });

    const formatted = visiblePolls.map(poll => {
      const json = poll.toJSON();
      const isLiked = json.likes?.some(like => like.userId === requestingUserId) || false;

      let userData = json.user;
      if (json.incognito == 1 && userData) {
        userData = {
          ...userData,
          username: 'incognito',
          fullname: 'incognito',
          image: 'incognito'
        };
      }

      return {
        id: json.id,
        questionText: json.questionText,
        user: userData,
        likeCount: json.likes?.length || 0,
        commentCount: json.comments?.length || 0,
        voteCount: json.votes?.length || 0,
        saveCount: json.saves?.length || 0,
        optionCount: json.options?.length || 0,
        isLiked,
        options: json.options?.map(opt => ({
          id: opt.id,
          name: opt.name,
          voteCount: opt.votes?.length || 0
        })) || [],
        attachments: json.attachments || []
      };
    });
    res.status(200).json(formatted);
  } catch (error) {
    console.error('Error fetching polls:', error);
    res.status(500).json({ error: 'Failed to fetch polls' });
  }
});

// router.get('/', async (req, res) => {
//     try {
//       const polls = await Polls.findAll({
//         include: [
//           { model: User, as: 'user', attributes: ['id', 'username'], required: false },
//           {
//             model: Option,
//             as: 'options',
//             required: false,
//             include: [{ model: Vote, as: 'votes', attributes: ['id'] }]
//           },
//           { model: Comment, as: 'comments', attributes: ['id'], required: false },
//           { model: Vote, as: 'votes', attributes: ['id'], required: false },
//           { model: Like, as: 'likes', attributes: ['id'], required: false },
//           { model: Saved, as: 'saves', attributes: ['id'], required: false },
//           { model: Attachment, as: 'attachments', required: false }
//         ]
//       });
  
//       const formatted = polls.map(poll => {
//         const json = poll.toJSON();
//         return {
//           id: json.id,
//           questionText: json.questionText,
//           user: json.user,
//           likeCount: json.likes?.length || 0,
//           commentCount: json.comments?.length || 0,
//           voteCount: json.votes?.length || 0,
//           saveCount: json.saves?.length || 0,
//           optionCount: json.options?.length || 0,
//           options: json.options?.map(opt => ({
//             id: opt.id,
//             name: opt.name,
//             voteCount: opt.votes?.length || 0
//           })) || [],
//           attachments: json.attachments || []
//         };
//       });
  
//       res.status(200).json(formatted);
//     } catch (error) {
//       console.error('Error fetching polls:', error);
//       res.status(500).json({ error: 'Failed to fetch polls' });
//     }
//   });

router.get('/:id', async (req, res) => {
  try {
    const poll = await Polls.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'fullname', 'image'],
          required: false
        },
        { model: Option, as: 'options', required: false },
        { model: Comment, as: 'comments', required: false },
        { model: Vote, as: 'votes', required: false },
        { model: Like, as: 'likes', required: false },
        { model: Saved, as: 'saves', required: false },
        { model: Attachment, as: 'attachments', required: false }
      ]
    });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    const json = poll.toJSON();
    const requestingUserId = req.user?.id;

    if (json.unpublish == 1 && json.user?.id != requestingUserId) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    if (json.incognito == 1 && json.user) {
      json.user.username = 'incognito';
      json.user.fullname = 'incognito';
      json.user.image = 'incognito';
    }

    res.status(200).json(json);
  } catch (error) {
    console.error('Error fetching poll:', error);
    res.status(500).json({ error: 'Failed to fetch poll' });
  }
});

// router.post('/', async (req, res) => {
//   try {
//     const { userId, questionText, postType, expiration, visibility, commentPermission } = req.body;
    
//     if (!userId || !questionText || !postType || !visibility || !commentPermission) {
//       return res.status(400).json({ error: 'Missing required fields' });
//     }

//     const newPoll = await Polls.create({
//       userId,
//       questionText,
//       postType,
//       expiration,
//       visibility,
//       commentPermission,
//       incognito: req.body.incognito || false,
//       unpublish: req.body.unpublish || false,
//     });
//     res.status(201).json(newPoll);
//   } catch (error) {
//     console.error('Error creating poll:', error);
     
//     if (error.name === 'SequelizeValidationError') {
//       return res.status(400).json({ errors: error.errors.map(e => e.message) });
//     }
//     res.status(500).json({ error: 'Failed to create poll' });
//   }
// });

// routes/pollsRouter.js

router.post('/',upload.array('attachments', 10), async function (req, res) {

      const t = await sequelize.transaction();
      const userId = req.user.id;

      try {
          const {
              questionText,
              postType,
              expiration,
              visibility,
              commentPermission,
              incognito = false,
              unpublish = false, 
              options 
          } = req.body;

          const uploadedFiles = req.files;

          if (!userId || !questionText || !postType || !visibility || !commentPermission) {
              await t.rollback();
              return res.status(400).json({ error: 'Missing required common fields: userId, questionText, postType, visibility, commentPermission.' });
          }

          if (postType !== 'poll' && postType !== 'post') {
              await t.rollback();
              return res.status(400).json({ error: 'Invalid postType. Must be "poll" or "post".' });
          }
          const newPollData = {
              userId,
              questionText,
              postType,
              expiration: expiration || null, 
              visibility,
              commentPermission,
              incognito,
              unpublish,
          };

          const createdPoll = await Polls.create(newPollData, { transaction: t }); 

          let associatedData = null; 

          if (postType === 'poll') {
              if (!options || !Array.isArray(options) || options.length === 0) {
                  await t.rollback();
                  return res.status(400).json({ error: 'Options array is required and cannot be empty for postType "poll".' });
              }
              if (options.some(opt => typeof opt !== 'string' || opt.trim() === '')) {
                  await t.rollback();
                  return res.status(400).json({ error: 'All options must be non-empty strings for postType "poll".' });
              }
              const optionsToCreate = options.map(optionText => ({
                  pollId: createdPoll.id,
                  name: optionText,
              }));
              associatedData = await Option.bulkCreate(optionsToCreate, { transaction: t, validate: true });

          } else if (postType === 'post') {
              if (!uploadedFiles || uploadedFiles.length === 0) {
                  await t.rollback();
                  return res.status(400).json({ error: 'Attachments are required for postType "post". Please upload at least one file.' });
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
                      attachmentType: attachmentType,
                      attachment: `/uploads/content/${file.filename}`,
                  };
              });

              associatedData = await Attachment.bulkCreate(attachmentsToCreate, { transaction: t, validate: true });
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

router.put('/:pollId', upload.array('attachments', 10), async (req, res) => {
    const { pollId } = req.params;
    const userId = req.user.id;
    const t = await sequelize.transaction();

    try {
        const poll = await Polls.findOne({ where: { id: pollId } });
        if (!poll) {
            await t.rollback();
            return res.status(404).json({ error: 'Poll not found.' });
        }

        if (poll.userId !== userId) {
            await t.rollback();
            return res.status(403).json({ error: 'You are not authorized to edit this poll.' });
        }

        const {
            questionText,
            expiration,
            visibility,
            commentPermission,
            options,
            incognito,
            unpublish
        } = req.body;

        const updates = {
            questionText: questionText ?? poll.questionText,
            expiration: expiration ?? poll.expiration,
            visibility: visibility ?? poll.visibility,
            commentPermission: commentPermission ?? poll.commentPermission,
            incognito: incognito ?? poll.incognito,
            unpublish: unpublish ?? poll.unpublish,
        };

        await poll.update(updates, { transaction: t });

        if (poll.postType === 'poll') {
            if (options && Array.isArray(options)) {
                await Option.destroy({ where: { pollId }, transaction: t });

                const newOptions = options.map(opt => ({
                    pollId,
                    name: opt,
                }));
                await Option.bulkCreate(newOptions, { transaction: t });
            }
        } else if (poll.postType === 'post') {
            const uploadedFiles = req.files;

            if (uploadedFiles && uploadedFiles.length > 0) {
                const oldAttachments = await Attachment.findAll({ where: { pollId } });

                for (const att of oldAttachments) {
                    const filePath = path.join(__dirname, '..', 'uploads', 'content', path.basename(att.attachment));
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                }

                await Attachment.destroy({ where: { pollId }, transaction: t });

                const newAttachments = uploadedFiles.map(file => {
                    let attachmentType;
                    if (file.mimetype.startsWith('image/')) {
                        attachmentType = 'image';
                    } else if (file.mimetype.startsWith('video/')) {
                        attachmentType = 'video';
                    } else {
                        throw new Error(`Unsupported file type uploaded: ${file.mimetype}`);
                    }

                    return {
                        pollId,
                        attachmentType,
                        attachment: `/uploads/content/${file.filename}`,
                    };
                });

                await Attachment.bulkCreate(newAttachments, { transaction: t });
            }
        }

        await t.commit();
        res.json({ message: 'Poll updated successfully.' });

    } catch (error) {
        await t.rollback();
        console.error('Error editing poll:', error);
        res.status(500).json({ error: 'Failed to edit poll.' });
    }
});

module.exports = router;