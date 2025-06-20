const express = require('express');
const router = express.Router();
const { Saved, Polls, Option, Vote, Attachment, Comment, Like, User } = require('../models');

router.post('/', async (req, res) => {
    try {
        const { pollId } = req.body;
        const userId = req.user.id;
    
        let saved = await Saved.findOne({ where: { userId, pollId } });
    
        if (saved) {
          saved.pollId = null;
          await saved.save();
          return res.status(200).json({ message: 'Poll unsaved', saved });
        }
    
        let existing = await Saved.findOne({ where: { userId, pollId: null } });
    
        if (existing) {
          existing.pollId = pollId;
          await existing.save();
          return res.status(200).json({ message: 'Poll saved', saved: existing });
        }
    
        saved = await Saved.create({ userId, pollId });
        res.status(201).json({ message: 'Poll saved successfully', saved });
    
      } catch (error) {
        console.error('Error toggling poll save:', error);
        res.status(500).json({ message: 'Server error' });
      }
});

// router.get('/user/:userId', async (req, res) => {
//   try {
//     const { userId } = req.params;

//     const savedPolls = await Saved.findAll({
//       where: { userId },
//       include: [
//         {
//           model: Polls,
//           as: 'poll'
//         }
//       ]
//     });

//     res.status(200).json(savedPolls);
//   } catch (error) {
//     console.error('Error fetching saved polls:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// GET / - Get all saved polls/posts for a user with full details

router.get('/user', async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) return res.status(400).json({ message: 'Missing userId' });

    const savedPolls = await Saved.findAll({
      where: { userId },
      include: [
        {
          model: Polls,
          as: 'poll',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['username', 'fullname']
            },
            {
              model: Option,
              as: 'options',
              include: [{ model: Vote, as: 'votes' }]
            },
            { model: Attachment, as: 'attachments' },
            { model: Comment, as: 'comments' },
            { model: Like, as: 'likes' }
          ]
        }
      ]
    });

    const result = savedPolls.map(saved => {
      const poll = saved.poll;
      if (!poll) return null;

      let username = poll.user?.username || 'Unknown';
      let fullname = poll.user?.fullname || 'Unknown';

      // Apply incognito logic
      if (poll.incognito == 1 && poll.user) {
        username = 'incognito';
        fullname = 'incognito';
      }

      if (poll.postType === 'poll') {
        const totalVotes = poll.options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0);
        const options = poll.options.map(opt => ({
          text: opt.name,
          voteCount: opt.votes?.length || 0,
          votePercentage: totalVotes ? ((opt.votes.length / totalVotes) * 100).toFixed(2) : '0.00'
        }));

        return {
          id: poll.id,
          type: 'poll',
          questionText: poll.questionText,
          username,
          fullname,
          totalVotes,
          options
        };
      } else {
        const attachments = poll.attachments.map(att => ({
          type: att.attachmentType,
          url: att.attachment
        }));

        return {
          id: poll.id,
          type: 'post',
          questionText: poll.questionText,
          username,
          fullname,
          attachments,
          likes: poll.likes?.length || 0,
          comments: poll.comments?.length || 0
        };
      }
    }).filter(Boolean);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching saved posts/polls:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;