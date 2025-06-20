const express = require('express');
const router = express.Router();
const upload = require('../helpers/multer-config');
const { Comment, Polls, User, Like } = require('../models');

const checkPollAndCommentPermission = async (req, res, next) => {
    try {
        const { pollId } = req.params;
        const poll = await Polls.findByPk(pollId);

        if (!poll) {
            return res.status(404).json({ error: 'Poll not found.' });
        }

        if (poll.commentPermission === 'disallow comments' || poll.commentPermission === 5) {
            return res.status(403).json({ error: 'Commenting is not allowed on this poll.' });
        }

        // Add more sophisticated checks here if 'followers' is implemented
        // For 'followers', you'd need an authentication middleware to get req.user.id
        // and then check if req.user.id is a follower of poll.userId.
        // For simplicity, we'll allow 'all' for now.
        // if (poll.commentPermission === 'followers' && !userIsFollower(req.user.id, poll.userId)) {
        //     return res.status(403).json({ error: 'Only followers can comment on this poll.' });
        // }

        req.poll = poll; // Attach poll object to request
        next();
    } catch (error) {
        console.error('Error in checkPollAndCommentPermission middleware:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

router.get('/', async (req, res) => {
    try {
        const comments = await Comment.findAll();
        res.status(200).json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Failed to fetch comments.' });
    }
});

router.post('/:pollId', upload.single('attachments'), checkPollAndCommentPermission, async (req, res) => {
    const { pollId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    if (!userId || !message) {
        return res.status(400).json({ error: 'User ID and message are required.' });
    }

    try {
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        const attachmentPath = req.file ? req.file.path : null;

        const newComment = await Comment.create({
            userId: userId,
            pollId: pollId,
            message: message,
            attachments: attachmentPath || null,
        });

        const commentWithUser = await Comment.findByPk(newComment.id, {
            include: [{ model: User, as: 'user', attributes: ['id', 'username'] }]
        });

        res.status(201).json(commentWithUser);
    } catch (error) {
        console.error('Error creating comment:', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ errors: error.errors.map(e => e.message) });
        }
        res.status(500).json({ error: 'Failed to create comment.' });
    }
});

// router.get('/:pollId', checkPollAndCommentPermission, async (req, res) => {
//     const { pollId } = req.params;

//     try {
//         const comments = await Comment.findAll({
//             where: { pollId: pollId },
//             include: [{
//                 model: User,
//                 as: 'user',
//                 attributes: ['id', 'username']
//             }],
//             order: [['createdAt', 'ASC']],
//         });
//         res.status(200).json(comments);
//     } catch (error) {
//         console.error('Error fetching comments:', error);
//         res.status(500).json({ error: 'Failed to fetch comments.' });
//     }
// });

router.get('/:pollId', checkPollAndCommentPermission, async (req, res) => {
    const { pollId } = req.params;
    const userId = req.user?.id;
  
    try {
      const comments = await Comment.findAll({
        where: {
          pollId,
          parentCommentId: null
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username']
          },
          {
            model: Like,
            as: 'likes',
            attributes: ['userId']
          },
          {
            model: Comment,
            as: 'subcomments',
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'username']
              },
              {
                model: Like,
                as: 'likes',
                attributes: ['userId']
              }
            ],
            order: [['createdAt', 'ASC']]
          }
        ],
        order: [['createdAt', 'ASC']]
      });
  
      const formattedComments = comments.map(comment => {
        const json = comment.toJSON();
  
        const isLiked = json.likes?.some(like => like.userId === userId) || false;
  
        const subcomments = (json.subcomments || []).map(sub => {
          const subIsLiked = sub.likes?.some(like => like.userId === userId) || false;
          return {
            id: sub.id,
            message: sub.message,
            user: sub.user,
            commentId: sub.id,
            isLiked: subIsLiked
          };
        });
  
        return {
          id: json.id,
          message: json.message,
          user: json.user,
          commentId: json.id,
          isLiked,
          subcomments
        };
      });
  
      res.status(200).json(formattedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ error: 'Failed to fetch comments.' });
    }
});

// router.get('/:pollId', checkPollAndCommentPermission, async (req, res) => {
//     const { pollId } = req.params;

//     try {
//         const comments = await Comment.findAll({
//             where: {
//                 pollId,
//                 parentCommentId: null
//             },
//             include: [
//                 {
//                     model: User,
//                     as: 'user',
//                     attributes: ['id', 'username']
//                 },
//                 {
//                     model: Comment,
//                     as: 'subcomments',
//                     include: [
//                         {
//                             model: User,
//                             as: 'user',
//                             attributes: ['id', 'username']
//                         }
//                     ],
//                     order: [['createdAt', 'ASC']]
//                 }
//             ],
//             order: [['createdAt', 'ASC']]
//         });

//         res.status(200).json(comments);
//     } catch (error) {
//         console.error('Error fetching comments:', error);
//         res.status(500).json({ error: 'Failed to fetch comments.' });
//     }
// });

router.put('/:commentId', upload.single('attachments'), async (req, res) => {
    const { commentId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    if (!userId || !message) {
        return res.status(400).json({ error: 'User ID and message are required for update.' });
    }

    try {
        const comment = await Comment.findByPk(commentId);
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found.' });
        }

        if (parseInt(comment.userId) !== parseInt(userId)) {
            return res.status(403).json({ error: 'You are not authorized to update this comment.' });
        }

        let attachmentPath = comment.attachments; 

        if (req.file) {
            attachmentPath = req.file.path.replace(/\\/g, '/');
        }

        await comment.update({
            message,
            attachments: attachmentPath || null
        });

        const updatedCommentWithUser = await Comment.findByPk(comment.id, {
            include: [{ model: User, as: 'user', attributes: ['id', 'username'] }]
        });

        res.status(200).json(updatedCommentWithUser);
    } catch (error) {
        console.error('Error updating comment:', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ errors: error.errors.map(e => e.message) });
        }
        res.status(500).json({ error: 'Failed to update comment.' });
    }
});

router.delete('/:commentId', async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user.id;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required for deletion.' });
    }

    try {
        const comment = await Comment.findByPk(commentId);

        if (!comment) {
            return res.status(404).json({ error: 'Comment not found.' });
        }

        if (comment.userId !== userId /* && !req.user.isAdmin */) {
            return res.status(403).json({ error: 'You are not authorized to delete this comment.' });
        }

        await comment.destroy();
        res.status(200).json({ message: 'comment deleted successfully' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ error: 'Failed to delete comment.' });
    }
});

router.post('/subcomment/:commentId', async (req, res) => {
    const { message, attachments } = req.body;
    const { commentId } = req.params;
    const userId = req.user.id;

    if (!userId || !message) {
        return res.status(400).json({ error: 'User ID and message are required.' });
    }

    try {
        const parentComment = await Comment.findByPk(commentId);
        if (!parentComment) {
            return res.status(404).json({ error: 'Parent comment not found.' });
        }

        const pollId = parentComment.pollId;

        const newSubcomment = await Comment.create({
            userId: userId,
            pollId: pollId,
            message: message,
            attachments: attachments || null,
            parentCommentId: commentId,
        });

        const subcommentWithUser = await Comment.findByPk(newSubcomment.id, {
            include: [{ model: User, as: 'user', attributes: ['id', 'username'] }]
        });

        res.status(201).json(subcommentWithUser);
    } catch (error) {
        console.error('Error creating subcomment:', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ errors: error.errors.map(e => e.message) });
        }
        res.status(500).json({ error: 'Failed to create subcomment.' });
    }
});



module.exports = router;