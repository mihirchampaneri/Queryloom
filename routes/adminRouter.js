const express = require('express');
const router = express.Router();
const { User, Polls, Report, Option, Comment, Vote, Like, Saved, Attachment, GroupPost, Group, GroupMember, GroupRules } = require('../models');

router.get('/users/all', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password', 'otp', 'otpExpires', 'createdAt', 'updatedAt'] },
      order: [['createdAt', 'DESC']]
    });

    res.json({ users });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/users/role/:userId', async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;

  const validRoles = ['admin', 'user'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: `Invalid role. Use: ${validRoles.join(', ')}` });
  }

  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (req.user.id === user.id) {
      return res.status(400).json({ error: 'Admins cannot change their own role' });
    }

    user.role = role;
    await user.save();

    res.status(200).json({ message: `User role updated to ${role}`, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    console.error('Role update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/users/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (req.user.id === user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account as an admin.' });
    }

    await user.destroy();

    res.status(200).json({ message: `User with ID ${userId} has been deleted.` });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

router.get('/reports', async (req, res) => {
  try {
    const reports = await Report.findAll({
      where: {
        status: 'pending'
      },
      attributes: [
        'id',
        ['userId', 'ReportedBy'],
        'message',
        ['reportUserId', 'ReportedTo'],
        'groupPostId',
        'pollId',
        'status'
      ],
      include: [
        {
          model: User,
          attributes: ['id', 'username'],
          required: false
        },
        {
          model: Polls,
          attributes: ['id', 'userId', 'questionText', 'PostType', 'expiration'],
          include: [
            {
              model: Option,
              as: 'options',
              required: false,
              include: [{ model: Vote, as: 'votes', attributes: ['id'] }]
            },
            {
              model: Comment,
              as: 'comments',
              include: [{ model: User, as: 'user', attributes: ['username'] }],
              attributes: ['id', 'message', 'attachments'],
              required: false
            },
            {
              model: Vote,
              as: 'votes',
              attributes: ['id'],
              required: false
            },
            {
              model: Like,
              as: 'likes',
              attributes: ['id', 'userId'],
              required: false
            },
            {
              model: Saved,
              as: 'saves',
              attributes: ['id'],
              required: false
            },
            {
              model: Attachment,
              as: 'attachments',
              attributes: ['id', 'attachmentType', 'attachment'],
              required: false
            }
          ]
        },
        {
          model: GroupPost,
          where: { approved: true },
          required: false,
          include: [
            {
              model: Group,
              attributes: ['id', 'groupName'],
              required: false
            }
          ]
        }
      ]
    });

    res.json(reports);
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/reports/polls/:reportId', async (req, res) => {
  const { reportId } = req.params;
  const { action } = req.body;

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ message: 'Invalid action. Must be "approve" or "reject".' });
  }

  try {
    const report = await Report.findByPk(reportId);
    if (!report || !report.pollId) {
      return res.status(404).json({ message: 'Report or associated poll not found.' });
    }

    const poll = await Polls.findByPk(report.pollId);
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found.' });
    }

    if (action === 'approve') {
      await report.update({ status: 'approved' });
      await poll.update({ unpublish: true });

      return res.status(200).json({ message: 'Report approved. Poll unpublished.' });

    } else if (action === 'reject') {
      // await report.destroy();
      await report.update({ status: 'rejected' });
      await poll.update({ unpublish: false });
      return res.status(200).json({ message: 'Report rejected. Poll is fine' });
    }

  } catch (err) {
    console.error('Error processing report action:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

router.post('/reports/users/:reportId', async (req, res) => {
  const { reportId } = req.params;
  const { action } = req.body;

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ message: 'Invalid action. Must be "approve" or "reject".' });
  }

  try {
    const report = await Report.findByPk(reportId);
    if (!report || !report.reportUserId) {
      return res.status(404).json({ message: 'Report user not found.' });
    }

    const user = await User.findByPk(report.reportUserId);
    if (!user) {
      return res.status(404).json({ message: 'user not found.' });
    }

    if (action === 'approve') {
      await report.update({ status: 'approved' });
      await user.update({ verificationStatus: 'blocked' });

      return res.status(200).json({ message: 'Report approved. user blocked Successfully.' });

    } else if (action === 'reject') {
      // await report.destroy();
      await report.update({ status: 'rejected' });
      return res.status(200).json({ message: 'Report rejected. user is fine' });
    }

  } catch (err) {
    console.error('Error processing report action:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

router.post('/reports/comments/:reportId', async (req, res) => {
  const { reportId } = req.params;
  const { action } = req.body;

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ message: 'Invalid action. Must be "approve" or "reject".' });
  }

  try {
    const report = await Report.findByPk(reportId);

    if (!report || !report.commentId) {
      return res.status(404).json({ message: 'Comment report not found.' });
    }

    const comment = await Comment.findByPk(report.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found.' });
    }

    if (action === 'approve') {
      await report.update({ status: 'approved' });
      await comment.destroy();

      return res.status(200).json({
        message: 'Report approved. Comment has been deleted.',
        pollId: report.pollId,
        commentId: report.commentId
      });

    } else if (action === 'reject') {
      await report.update({ status: 'rejected' });
      return res.status(200).json({
        message: 'Report rejected. Comment remains visible.',
        pollId: report.pollId,
        commentId: report.commentId
      });
    }

  } catch (err) {
    console.error('Error processing comment report:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

router.get('/polls', async (req, res) => {
  try {
    const polls = await Polls.findAll({
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
        { model: Comment, as: 'comments', attributes: ['id'], required: false },
        { model: Vote, as: 'votes', attributes: ['id'], required: false },
        {
          model: Like,
          as: 'likes',
          attributes: ['id', 'userId'],
          required: false
        },
        { model: Saved, as: 'saves', attributes: ['id'], required: false },
        { model: Attachment, as: 'attachments', required: false }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json({ polls });
  } catch (err) {
    console.log('Error fetching polls:', err);
    res.status(500).json({ error: 'Internal server error' })
  }
});

router.delete('/polls/:pollId', async (req, res) => {
  const { pollId } = req.params;

  try {
    const poll = await Polls.findOne({
      where: { id: pollId },
      include: [
        { model: Option, as: 'options', include: [{ model: Vote, as: 'votes' }] },
        { model: Attachment, as: 'attachments' }
      ]
    });

    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    if (poll.PostType === 'poll') {
      for (const option of poll.options) {
        await Vote.destroy({ where: { optionId: option.id } });
      }

      await Option.destroy({ where: { pollId } });

    } else if (poll.PostType === 'post') {
      await Attachment.destroy({ where: { pollId } });
    }

    await Polls.destroy({ where: { id: pollId } });

    res.json({ message: 'Poll deleted successfully' });

  } catch (err) {
    console.error('Error deleting poll:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/verification/:userId', async (req, res) => {
  const { userId } = req.params;
  const { verificationStatus } = req.body;

  const allowedStatuses = ["verified", "unverified", "blocked"];

  if (!allowedStatuses.includes(verificationStatus)) {
    return res.status(400).json({ message: 'Please enter a correct field: verified, unverified, or blocked.' });
  }

  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.verificationStatus === verificationStatus) {
      return res.status(400).json({ message: 'Verification status already exists.' });
    }

    await user.update({ verificationStatus });

    res.status(200).json({ message: `User has been ${verificationStatus} successfully.` });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.get('/groups', async (req, res) => {
  try {
    const groups = await Group.findAll({
      attributes: ['id', 'groupName', 'groupProfilePic', 'groupBackgroundImg', 'visibility', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({ groups });
  } catch (error) {
    console.error('Error fetching groups for admin:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/groups/:groupId', async (req, res) => {
  const { groupId } = req.params;

  try {
    const group = await Group.findByPk(groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    await GroupMember.destroy({ where: { groupId } });
    await GroupPost.destroy({ where: { groupId } });
    await GroupRules.destroy({ where: { groupId } });

    await group.destroy();

    res.status(200).json({ message: 'Group deleted successfully.' });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.get('/groups/members', async (req, res) => {
  try {
    const groups = await Group.findAll({
      attributes: ['id', 'groupName'],
      include: [
        {
          model: GroupMember,
          attributes: ['id', 'role', 'approved'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'fullname']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({ groups });
  } catch (error) {
    console.error('Error fetching groups with members:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/groups/:groupId/members', async (req, res) => {
  const { groupId } = req.params;

  try {
    const members = await GroupMember.findAll({
      where: { groupId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'fullname'],
        }
      ],
      attributes: ['id', 'role', 'approved']
    });

    res.status(200).json({ groupId, members });
  } catch (error) {
    console.error('Error fetching group members:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/groups/members/:memberId', async (req, res) => {
  const { memberId } = req.params;

  try {
    const member = await GroupMember.findByPk(memberId);

    if (!member) {
      return res.status(404).json({ message: 'Group member not found.' });
    }

    const newStatus = member.approved == 1 ? 0 : 1;
    await member.update({ approved: newStatus });

    const statusText = newStatus == 1 ? 'approved' : 'removed';

    res.status(200).json({ message: `Group member is now ${statusText}.` });
  } catch (error) {
    console.error('Error toggling group member approval:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.delete('/groups/members/:memberId', async (req, res) => {
  const { memberId } = req.params;

  try {
    const member = await GroupMember.findByPk(memberId);

    if (!member) {
      return res.status(404).json({ message: 'Group member not found.' });
    }

    await member.destroy();

    res.status(200).json({ message: 'Group member deleted successfully.', member });
  } catch (error) {
    console.error('Error deleting group member:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.put('/groups/members/:memberId/role', async (req, res) => {
  const { memberId } = req.params;
  const { Role } = req.body;

  const validRoles = ['member', 'sub-admin', 'admin'];
  if (!validRoles.includes(Role)) {
    return res.status(400).json({ message: 'Invalid role specified.' });
  }

  try {
    const member = await GroupMember.findByPk(memberId);
    if (!member) {
      return res.status(404).json({ message: 'Group member not found.' });
    }

    member.role = Role;
    member.approved = true
    await member.save();

    res.status(200).json({ message: `Role updated to ${Role}`, member });
  } catch (error) {
    console.error('Error updating member role:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/comments', async (req, res) => {
  try {
    const comments = await Comment.findAll({
      attributes: ['id', 'message', 'attachments', 'parentCommentId'],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username']
        },
        {
          model: Polls,
          as: 'poll',
          attributes: ['id', 'questionText', 'postType', 'visibility', 'commentPermission','createdAt'],
          include: [
            {
              model: Option,
              as: 'options',
              attributes: ['name'],
              required: false,
            },
            { model: Attachment, as: 'attachments', attributes: ['attachmentType', 'attachment'], required: false }
          ],
        },
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({ comments });
  } catch (error) {
    console.error('Error fetching all comments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/comments/:commentId', async (req, res) => {

  const { commentId } = req.params;

  try {
    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found.' });
    }

    await comment.destroy();

    res.status(200).json({ message: 'Comment deleted successfully.', comment });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const ActiveUsers = await User.count({ where: { verificationStatus: 'verified' } });
    const Poll = await Polls.count({ where: { unpublish: false, visibility: 1 } });
    const Groups = await Group.count();
    const GroupPolls = await GroupPost.count({ where: { approved: true } });

    return res.status(200).json({
      Active_User: ActiveUsers,
      Polls: Poll,
      Groups: Groups,
      Group_Polls: GroupPolls
    });
  } catch (error) {
    console.error('Error fetching admin summary:', error);
    return res.status(500).json({ message: 'Failed to fetch summary' });
  }
});

module.exports = router;