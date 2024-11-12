const OTP = require('../models/OTP');

const generateNumericOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const saveOTP = async (email) => {
  const otp = generateNumericOTP();
  let otpRecord = await OTP.findOne({ email });

  if (otpRecord) {
    otpRecord.otp = otp;
    otpRecord.lastRequestedAt = Date.now();
  } else {
    otpRecord = new OTP({ email, otp, lastRequestedAt: Date.now() });
  }

  await otpRecord.save();
  return otp;
};

const verifyOTP = async (email, otp) => {
  const otpRecord = await OTP.findOne({ email, otp });

  if (!otpRecord) {
    return false;
  }

  const isExpired = Date.now() > otpRecord.expiry;
  if (isExpired) {
    await OTP.deleteOne({ _id: otpRecord._id }); // Delete expired OTP
    return false;
  }

  return true;
};

// Delete OTP from the database
const deleteOTP = async (email, otp) => {
  await OTP.deleteOne({ email, otp });
};



module.exports = { saveOTP, verifyOTP, deleteOTP };
