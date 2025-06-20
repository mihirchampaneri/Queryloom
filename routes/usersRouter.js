const express = require('express');
const router = express.Router();
const upload = require('../helpers/multer-config');
const { Op, Sequelize } = require('sequelize');
const { UserFollows,Group, Report, User, Polls, Like, Comment, Attachment, Option, Vote } = require('../models');
const { signIn, signUpRequest, signUpVerify, logout } = require('../controllers/authController');


router.post('/signin',signIn);

router.post('/signup/request',upload.single("image"), signUpRequest);

router.post('/signup/verify', signUpVerify);

router.post('/logout',logout);

router.post('/blocked', async (req, res) => {
    try {
      const userId = req.user.id;
      const { targetUserId } = req.body;
  
      if (!targetUserId || userId === parseInt(targetUserId)) {
        return res.status(400).json({ message: "Invalid target user ID" });
      }

      const relation = await UserFollows.findOne({
        where: {
          [Op.or]: [
            { followerId: userId, followingId: targetUserId },
            { followerId: targetUserId, followingId: userId }
          ]
        }
      });
  
      if (relation) {
        relation.blocked = !relation.blocked;
        await relation.save();
  
        const status = relation.blocked ? 'blocked' : 'unblocked';
        return res.status(200).json({ message: `User ${status} successfully`, blocked: relation.blocked });
      } else {
        await UserFollows.create({
          followerId: userId,
          followingId: targetUserId,
          blocked: true
        });
  
        return res.status(201).json({ message: 'User blocked successfully', blocked: true });
      }
    } catch (err) {
      console.error('Error toggling block status:', err);
      return res.status(500).json({ message: 'Server error' });
    }
});

router.get('/blocked',  async (req, res) => {
  try {
    const userId = req.user.id;

    const blockedUsers = await UserFollows.findAll({
      where: {
        blocked: true,
        followerId: userId
      },
      include: [{
        model: User,
        as: 'BlockedUser',
        foreignKey: 'followingId',
        attributes: ['id', 'fullname', 'username']
      }]
    });

    const result = blockedUsers.map(entry => ({
      id: entry.BlockedUser?.id,
      FullName: entry.BlockedUser?.fullname,
      Username: entry.BlockedUser?.username
    })).filter(Boolean);

    res.status(200).json({ blockedUsers: result });
  } catch (err) {
    console.error('Error fetching blocked users:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/followers', async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const followers = await user.getFollowers({
      attributes: ['id', 'username','fullname'],
      joinTableAttributes: ['blocked']
    });

    const formattedFollowers = followers.map(follower => ({
      id: follower.id,
      username: follower.username,
      fullname:follower.fullname,
      blocked: follower.UserFollows.blocked
    }));

    res.json(formattedFollowers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch followers.' });
  }
});

router.get('/followings', async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const followings = await user.getFollowings({
      attributes: ['id', 'username','fullname'],
      joinTableAttributes: ['blocked']
    });

    const formattedFollowings = followings.map(following => ({
      id: following.id,
      fullname:following.fullname,
      username: following.username,
      blocked: following.UserFollows.blocked
    }));

    res.json(formattedFollowings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch followings.' });
  }
});

router.post('/follow', async (req, res) => {
  try {
    const followerId = req.user.id;
    const { followingId } = req.body;

    if (!followingId || followerId === parseInt(followingId)) {
      return res.status(400).json({ message: "Invalid follow target." });
    }

    const existingFollow = await UserFollows.findOne({
      where: {
        followerId,
        followingId
      }
    });

    if (existingFollow) {
      await existingFollow.destroy();
      return res.status(200).json({ message: 'Unfollowed successfully.' });
    }

    await UserFollows.create({
      followerId,
      followingId,
      blocked: false
    });

    res.status(201).json({ message: 'Followed successfully.' });
  } catch (err) {
    console.error('Error in follow route:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      attributes: ['id', 'username', 'email', 'fullname', 'image', 'createdAt', 'updatedAt']
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const followers = await UserFollows.findAll({
      where: { followingId: userId, blocked: false },
      include: { model: User, as: 'Follower', attributes: ['id', 'username', 'fullname'] }
    });

    const followings = await UserFollows.findAll({
      where: { followerId: userId, blocked: false },
      include: { model: User, as: 'Following', attributes: ['id', 'username', 'fullname'] }
    });

    const blockedUsers = await UserFollows.findAll({
      where: { followerId: userId, blocked: true },
      include: { model: User, as: 'BlockedUser', attributes: ['id', 'username', 'fullname'] }
    });

    const userPolls = await Polls.findAll({
      where: { userId },
      include: [
        {
          model: Attachment,
          as: 'attachments',
          attributes: ['id', 'attachmentType', 'attachment']
        },
        {
          model: Like,
          as: 'likes',
          attributes: []
        },
        {
          model: Comment,
          as: 'comments',
          attributes: []
        },
        {
          model: Option,
          as: 'options',
          attributes: ['id', 'name'],
          include: [
            {
              model: Vote,
              as: 'votes',
              attributes: ['id'] 
            }
          ],
          required: false
        }
      ],
      attributes: {
        include: [
          [Sequelize.fn('COUNT', Sequelize.col('likes.id')), 'likeCount'],
          [Sequelize.fn('COUNT', Sequelize.col('comments.id')), 'commentCount']
        ]
      },
      group: [
        'Polls.id',
        'attachments.id',
        'options.id',
        'options->votes.id'
      ]
    });

    const posts = userPolls.map(poll => {
      const totalVotes = poll.options?.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0) || 0;

      const options = poll.postType === 'poll'
        ? poll.options.map(opt => {
            const voteCount = opt.votes?.length || 0;
            const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
            return {
              id: opt.id,
              optionText: opt.name,
              voteCount,
              votePercentage: +percentage.toFixed(2)
            };
          })
        : [];

      return {
        id: poll.id,
        questionText: poll.questionText,
        postType: poll.postType,
        createdAt: poll.createdAt,
        updatedAt: poll.updatedAt,
        attachments: poll.attachments,
        likeCount: poll.dataValues.likeCount || 0,
        commentCount: poll.dataValues.commentCount || 0,
        options
      };
    });

    res.status(200).json({
      id: user.id,
      username: user.username,
      fullname: user.fullname,
      email: user.email,
      image: user.image,
      stats: {
        followerCount: followers.length,
        followingCount: followings.length,
        blockedCount: blockedUsers.length,
        postCount: userPolls.length,
        followers: followers.map(entry => entry.Follower),
        followings: followings.map(entry => entry.Following),
        blocked: blockedUsers.map(entry => entry.BlockedUser)
      },
      posts,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ message: 'Failed to fetch profile.' });
  }
});

// router.get('/profile', async (req, res) => {
//   try {
//     const userId = req.user.id;

//     const user = await User.findByPk(userId, {
//       attributes: ['id', 'username', 'email', 'fullname', 'image', 'createdAt', 'updatedAt']
//     });

//     if (!user) {
//       return res.status(404).json({ message: 'User not found.' });
//     }

//     const followers = await UserFollows.findAll({
//       where: {
//         followingId: userId,
//         blocked: false
//       },
//       include: {
//         model: User,
//         as: 'Follower',
//         attributes: ['id', 'username', 'fullname']
//       }
//     });

//     const followings = await UserFollows.findAll({
//       where: {
//         followerId: userId,
//         blocked: false
//       },
//       include: {
//         model: User,
//         as: 'Following',
//         attributes: ['id', 'username', 'fullname']
//       }
//     });

//     const blockedUsers = await UserFollows.findAll({
//       where: {
//         followerId: userId,
//         blocked: true
//       },
//       include: {
//         model: User,
//         as: 'BlockedUser',
//         attributes: ['id', 'username', 'fullname']
//       }
//     });

//     res.status(200).json({
//       id: user.id,
//       username: user.username,
//       fullname: user.fullname,
//       email: user.email,
//       image: user.image,
//       stats: {
//         followerCount: followers.length,
//         followingCount: followings.length,
//         blockedCount: blockedUsers.length,
//         followers: followers.map(entry => entry.Follower), 
//         followings: followings.map(entry => entry.Following),
//         blocked: blockedUsers.map(entry => entry.BlockedUser)
//       },
//       createdAt: user.createdAt,
//       updatedAt: user.updatedAt,
//     });
//   } catch (err) {
//     console.error('Error fetching profile:', err);
//     res.status(500).json({ message: 'Failed to fetch profile.' });
//   }
// });

router.get('/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    const type = req.query.type;

    let users = [];
    let posts = [];
    let groups = []; 

    if (!type || type === 'user') {
      users = await User.findAll({
        where: {
          verificationStatus: 'verified',
          [Op.or]: [
            { username: { [Op.like]: `%${query}%` } },
            { fullname: { [Op.like]: `%${query}%` } }
          ]
        },
        attributes: ['id', 'username', 'fullname', 'image']
      });
    }
  
    if (!type || type === 'post') {
      const rawPosts = await Polls.findAll({
        where: {
          questionText: {
            [Op.like]: `%${query}%`
          }
        },
        include: [
          {
            model: Attachment,
            as: 'attachments',
            attributes: ['id', 'attachmentType', 'attachment']
          },
          {
            model: Option,
            as: 'options',
            attributes: ['id', 'name'],
            include: [
              {
                model: Vote,
                as: 'votes',
                attributes: ['id']
              }
            ]
          }
        ],
        attributes: ['id', 'questionText', 'postType', 'createdAt']
      });

      posts = rawPosts.map(post => {
        const plain = post.get({ plain: true });

        if (plain.postType === 'poll') {
          const totalVotes = plain.options.reduce((sum, opt) => sum + opt.votes.length, 0);

          const options = plain.options.map(opt => {
            const voteCount = opt.votes.length;
            const percentage = totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(2) : '0.00';
            return {
              id: opt.id,
              name: opt.name,
              voteCount,
              percentage: `${percentage}%`
            };
          });

          return {
            id: plain.id,
            questionText: plain.questionText,
            postType: plain.postType,
            createdAt: plain.createdAt,
            totalVotes,
            options
          };
        }

        return {
          id: plain.id,
          questionText: plain.questionText,
          postType: plain.postType,
          createdAt: plain.createdAt,
          attachments: plain.attachments
        };
      });
    }

    if (!type || type === 'group') {
      groups = await Group.findAll({
        where: {
          visibility: 'public',
          groupname: { [Op.like]: `%${query}%` }
        },
        attributes: ['id', 'groupname'] 
      });
    }
    res.status(200).json({ users, posts, groups });

  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ message: 'Search failed' });
  }
});

router.post('/reports/polls/:pollId', async (req, res) => {
  const userId = req.user.id;
  const { pollId } = req.params;
  const { message } = req.body;

  if (!message || message.trim() === '') {
    return res.status(400).json({ message: 'Message is required.' });
  }

  try {
    const poll = await Polls.findByPk(pollId);
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found.' });
    }

    const existingReport = await Report.findOne({
      where: { userId, pollId }
    });

    if (existingReport) {
      return res.status(409).json({ message: 'You have already reported this poll.' });
    }

    await Report.create({
      userId,
      pollId,
      message,
      status: 'pending'
    });

    return res.status(201).json({ message: 'Report submitted successfully.' });

  } catch (err) {
    console.error('Error reporting poll:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

router.post('/reports/user/:userId', async (req, res) => {
  const userId = req.user.id;
  const reportUserId = req.params.userId;
  const { message } = req.body;

  if (!message || message.trim() === '') {
    return res.status(400).json({ message: 'Message is required.' });
  }

  try {
    const user = await User.findByPk(reportUserId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const existingReport = await Report.findOne({
      where: { userId, reportUserId } 
    });

    if (existingReport) {
      return res.status(409).json({ message: 'You have already reported this user.' });
    }

    await Report.create({
      userId,
      reportUserId, 
      message,
      status: 'pending'
    });

    return res.status(201).json({ message: 'Report submitted successfully.' });

  } catch (err) {
    console.error('Error reporting user:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;