const express = require('express');
const router = express.Router();
const { Vote, Option } = require('../models');

router.post('/:pollId/vote/:optionId', async (req, res) => {
    const { pollId, optionId } = req.params;
    const userId = req.user.id;
  
    if (!userId) return res.status(400).json({ message: 'userId is required' });
  
    try {
      const option = await Option.findOne({ where: { id: optionId, pollId } });
      if (!option) return res.status(400).json({ message: 'Invalid option for this poll' });

      const existingVote = await Vote.findOne({ where: { userId, pollId } });
  
      if (!existingVote) {
        const vote = await Vote.create({ userId, pollId, optionId });
        return res.status(201).json({ message: 'Vote recorded', vote });
      }
  
      if (existingVote.optionId === parseInt(optionId)) {
        existingVote.optionId = null;
        await existingVote.save();
        return res.status(200).json({ message: 'Your vote removed', vote: existingVote });
      } else {
        existingVote.optionId = optionId;
        await existingVote.save();
        return res.status(200).json({ message: 'Your vote updated', vote: existingVote });
      }
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

router.get('/:pollId/results', async (req, res) => {
  try {
    const pollId = req.params.pollId;

    const options = await Option.findAll({
      where: { pollId },
      attributes: [
        'id', 'name',
        [Vote.sequelize.fn('COUNT', Vote.sequelize.col('Votes.id')), 'voteCount']
      ],
      include: [
        {
          model: Vote,
          as: 'votes',
          attributes: []
        }
      ],
      group: ['Option.id'],
      raw: true
    });

    const totalVotes = options.reduce((sum, opt) => sum + parseInt(opt.voteCount || 0), 0);

    const results = options.map(opt => ({
      optionId: opt.id,
      optionText: opt.name,
      votes: parseInt(opt.voteCount || 0),
      percentage: totalVotes === 0 ? 0 : Math.round((opt.voteCount / totalVotes) * 100)
    }));

    res.json({ pollId: parseInt(pollId), results, totalVotes });

  } catch (error) {
    console.error('Error fetching poll results:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
