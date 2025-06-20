require('dotenv').config();

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const transporter = require('../helpers/nodemailer');
const generateOtp  = require('../helpers/otp');
const resolveToName  = require('../helpers/resolvename');
const { User, Countries, State, City, Education, AnnualIncome, Get_expertise, PoliticalAffiliation, Race, RelationshipStatus } = require('../models');

module.exports.signIn = async function (req, res) {
    const { loginMethod, email, phone, countryCode, password } = req.body;

    try {
        let user;

        if (loginMethod === 'email') {
            if (!email) return res.status(400).json({ message: "Email is required" });
            user = await User.findOne({ where: { email } });

        } else if (loginMethod === 'phone') {
            if (!phone || !countryCode) {
                return res.status(400).json({ message: "Phone and country code are required" });
            }
            user = await User.findOne({ where: { phone, countryCode } });

        } else {
            return res.status(400).json({ message: "Invalid login method" });
        }

        if (!user) return res.status(401).json({ message: "Invalid username or password" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid password credentials" });

        if (user.verificationStatus !== 'verified') {
          return res.status(403).json({ message: "You don't have permission to Log in" });
      }
        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(200).json({ message: "Login successful", token,
          user: {
            id: user.id,
            fullname: user.fullname,
            username:user.username
          }
    });
        console.log(token);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports.signUpRequest = async function (req, res) {
  try {
    let imagePath = req.file?.path;
    if (imagePath) {
      imagePath = imagePath.replace(/\\/g, '/');
    }

    const {
      fullname,
      username,
      signupMethod,
      email,
      countryCode,
      phone,
      password,
      confirmpass,
      gender,
      birthdayMonth,
      birthdayDay,
      birthdayYear,
      country,
      state,
      city,
      annual_income,
      get_expertise,
      education,
      political_affiliation,
      race,
      relationship
    } = req.body;

    if (!signupMethod) {
      return res.status(400).json({ error: 'Signup method is required.' });
    }
    if (password || confirmpass) {
        if (!password || !confirmpass) {
            return res.status(400).json({ error: 'Both password and confirm password are required if one is provided.' });
        }
        if (password !== confirmpass) {
            return res.status(400).json({ error: 'Passwords do not match.' });
        }
    }


    let whereClause = {};
    let identifierField = ''; 

    if (signupMethod === 'email') {
      if (!email) return res.status(400).json({ error: 'Email is required for email signup.' });
      whereClause = { email: email.toLowerCase() }; 
      identifierField = 'Email';
    } else if (signupMethod === 'phone') {
      if (!countryCode || !phone) {
        return res.status(400).json({ error: 'Country code and phone number are required for phone signup.' });
      }
      whereClause = { phone, countryCode };
      identifierField = 'Phone number';
    } else {
      return res.status(400).json({ error: 'Invalid signup method.' });
    }

    if (username) {
      const verifiedUserWithSameUsername = await User.findOne({
        where: { username, verificationStatus: 'verified' }
      });
    
      if (verifiedUserWithSameUsername) {
        return res.status(409).json({ error: 'Username is already taken by a verified user.' });
      }
    
      await User.destroy({
        where: {
          username,
          verificationStatus: 'unverified'
        }
      });
    }
    const existingUser = await User.findOne({ where: whereClause });

    const newOtp = generateOtp();
    const newOtpExpires = new Date(Date.now() + 10 * 60 * 1000); 

    const dataToProcess = {
      ...(fullname && { fullname }), 
      ...(username && { username }),
      signupMethod,
      ...(gender && { gender }),
      ...(birthdayMonth && { birthdayMonth }),
      ...(birthdayDay && { birthdayDay }),
      ...(birthdayYear && { birthdayYear }),
      ...(country && { country: await resolveToName(Countries, country) }),
      ...(state && { state: await resolveToName(State, state) }),
      ...(city && { city: await resolveToName(City, city) }),
      ...(annual_income && { annual_income: await resolveToName(AnnualIncome, annual_income) }),
      ...(get_expertise && { get_expertise: await resolveToName(Get_expertise, get_expertise) }),
      ...(education && { education: await resolveToName(Education, education) }),
      ...(political_affiliation && { political_affiliation: await resolveToName(PoliticalAffiliation, political_affiliation) }),
      ...(race && { race: await resolveToName(Race, race) }),
      ...(relationship && { relationship: await resolveToName(RelationshipStatus, relationship) }),
      otp: newOtp,
      otpExpires: newOtpExpires,
    };

    if (imagePath) { 
        dataToProcess.image = imagePath;
    }

    if (password) {
        dataToProcess.password = await bcrypt.hash(password, 10);
    }

    if (signupMethod === 'email') {
      dataToProcess.email = email.toLowerCase();
    } else if (signupMethod === 'phone') {
      dataToProcess.countryCode = countryCode;
      dataToProcess.phone = phone;
    }

    if (existingUser) {
      if (existingUser.verificationStatus === 'verified') {
        return res.status(409).json({ error: `${identifierField} already registered and verified.` });
      } else if (existingUser.verificationStatus === 'unverified') {
        if (!password && !existingUser.password) {
             return res.status(400).json({ error: 'Password is required to proceed with verification.' });
        }

        await existingUser.update(dataToProcess);

        if (signupMethod === 'email') {
          await transporter.sendMail({
            to: existingUser.email,
            subject: 'Verify Your Email - OTP Resent',
            text: `Hi ${existingUser.fullname || 'User'},\n\nYour new OTP for account verification is: ${newOtp}\nIt is valid for 10 minutes.\n\nThanks,\nQueryLoom`
          });
        } else if (signupMethod === 'phone') {
          console.log(`OTP for phone ${existingUser.phone} (resent): ${newOtp}`);
        }
        return res.status(200).json({ message: 'OTP resent. Please verify to complete signup.' });
      }
    } else {
      if (!password) {
        return res.status(400).json({ error: 'Password is required for new signups.' });
      }
      dataToProcess.verificationStatus = 'unverified';
      dataToProcess.role = 'user';

      const newUser = await User.create(dataToProcess);

      if (signupMethod === 'email') {
        await transporter.sendMail({
          to: newUser.email,
          subject: 'Verify Your Email',
          text: `Hi ${newUser.fullname || 'User'},\n\nYour OTP for account creation is: ${newOtp}\nIt is valid for 10 minutes.\n\nThanks,\nQueryLoom`
        });
      } else if (signupMethod === 'phone') {
        console.log(`OTP for new phone ${newUser.phone} signup: ${newOtp}`);
      }
      return res.status(201).json({ message: 'OTP sent. Please verify to complete signup.' }); 
    }

  } catch (err) {
    console.error("Error in signUpRequest:", err);
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ errors: err.errors.map(e => e.message) });
    }
    res.status(500).json({ error: 'Signup request failed. Please try again.' });
  }
};

// module.exports.signUpRequest = async function (req, res) {
//   try {
//     let imagePath = req.file?.path;
//     if (imagePath) {
//       imagePath = imagePath.replace(/\\/g, '/');
//     }
//     const {
//       fullname,
//       username,
//       signupMethod,
//       email,
//       countryCode,
//       phone,
//       password,
//       confirmpass,
//       gender,
//       birthdayMonth,
//       birthdayDay,
//       birthdayYear,
//       country,
//       state,
//       city,
//       annual_income,
//       get_expertise,
//       education,
//       political_affiliation,
//       race,
//       relationship
//     } = req.body;

//     if (!signupMethod || !password || !confirmpass) {
//       return res.status(400).json({ error: 'Signup method and password are required.' });
//     }
//     if (password !== confirmpass) {
//       return res.status(400).json({ error: 'Passwords do not match.' });
//     }

//     let whereClause = {};
//     if (signupMethod === 'email') {
//       if (!email) return res.status(400).json({ error: 'Email is required.' });
//       whereClause = { email };
//     } else if (signupMethod === 'phone') {
//       if (!countryCode || !phone) {
//         return res.status(400).json({ error: 'Country code and phone number are required.' });
//       }
//       whereClause = { phone, countryCode };
//     } else {
//       return res.status(400).json({ error: 'Invalid signup method.' });
//     }

//     const existingUser = await User.findOne({ where: whereClause });
//     if (existingUser) {
//       return res.status(409).json({ error: `${signupMethod === 'email' ? 'Email' : 'Phone number'} already registered.` });
//     }

//     const otp = generateOtp();
//     const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
//     const hashedPassword = await bcrypt.hash(password, 10);

//     const userData = {
//       image: imagePath,
//       fullname,
//       username,
//       signupMethod,
//       password: hashedPassword,
//       gender,
//       birthdayMonth,
//       birthdayDay,
//       birthdayYear,
//       country: await resolveToName(Countries, country),
//       state: await resolveToName(State, state),
//       city: await resolveToName(City, city),
//       annual_income: await resolveToName(AnnualIncome, annual_income),
//       get_expertise: await resolveToName(Get_expertise, get_expertise),
//       education: await resolveToName(Education, education),
//       political_affiliation: await resolveToName(PoliticalAffiliation, political_affiliation),
//       race: await resolveToName(Race, race),
//       relationship: await resolveToName(RelationshipStatus, relationship),
//       otp,
//       otpExpires,
//       verificationStatus: 'unverified',
//     };

//     if (signupMethod === 'email') {
//       userData.email = email;
//     } else if (signupMethod === 'phone') {
//       userData.countryCode = countryCode;
//       userData.phone = phone;
//     }

//     if (signupMethod === 'email') {
//       userData.email = email;
//       await transporter.sendMail({
//         to: email,
//         subject: 'Verify Your Email',
//         text: `Hi ${fullname},\n\nYour OTP for account creation is: ${otp}\nIt is valid for 10 minutes.\n\nThanks,\nQueryLoom`
//       });
//     } else if (signupMethod === 'phone') {
//       userData.countryCode = countryCode;
//       userData.phone = phone;
//       let otpp = userData.otp = 1111;
//       console.log(`OTP for phone signup: ${otpp}`); // For testing purposes
//     }
//     // In a real application, for phone signup, you would send the OTP via SMS

//     await User.create(userData);

//     return res.status(200).json({ message: 'OTP sent. Please verify to complete signup.' });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Signup request failed. Please try again.' });
//   }
// };

module.exports.signUpVerify = async function (req, res) {
  try {
    const { signupMethod, email, phone, otp } = req.body;

    let whereClause = { otp };
    if (signupMethod === 'email') {
      whereClause.email = email;
    } else if (signupMethod === 'phone') {
      whereClause.phone = phone;
    } else {
      return res.status(400).json({ error: 'Invalid signup method provided for verification.' });
    }

    const user = await User.findOne({ where: whereClause });

    if (!user || new Date(user.otpExpires) < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired OTP.' });
    }

    await user.update({ otp: null, otpExpires: null, verificationStatus: 'verified' });

    res.status(200).json({ message: 'Account verified successfully!' , Username: user.fullname});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'OTP verification failed. Please try again.' });
  }
};

module.exports.logout = function (req, res) {
  res.cookie("token", "");
  res.redirect("/");
};