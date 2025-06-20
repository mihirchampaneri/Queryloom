const express = require('express');
const router = express.Router();
const { Education, AnnualIncome, Countries, State, City, Gender, Get_expertise, PoliticalAffiliation, Race, RelationshipStatus } = require('../models');

router.get('/', (req, res) => {
  res.send('Hello This is Index Page!');
});

router.get('/country', async (req, res) => {
  try {
    const countrylist = await Countries.findAll();
    res.json(countrylist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/state', async (req, res) => {
  try {
    const { countryId } = req.query;
    const stateslist = await State.findAll({
      where: { countryId: countryId }
    });
    res.json(stateslist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/city', async (req, res) => {
  try {
    const { stateId } = req.query;
    const citieslist = await City.findAll({
      where: { stateId: stateId }
    });
    res.json(citieslist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/education', async (req, res) => {
  try {
    const educationlist = await Education.findAll();
    res.json(educationlist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/income', async (req, res) => {
  try {
    const incomelist = await AnnualIncome.findAll();
    res.json(incomelist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/gender', async (req, res) => {
  try {
    const genderlist = await Gender.findAll();
    res.json(genderlist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/get_expertise', async (req, res) => {
  try {
    const getexpertiselist = await Get_expertise.findAll();
    res.json(getexpertiselist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/political_affiliation', async (req, res) => {
  try {
    const politicalaffiliationlist = await PoliticalAffiliation.findAll();
    res.json(politicalaffiliationlist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/race', async (req, res) => {
  try {
    const racelist = await Race.findAll();
    res.json(racelist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/relationstatus', async (req, res) => {
  try {
    const relationstatuslist = await RelationshipStatus.findAll();
    res.json(relationstatuslist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;