
// Render verification page
exports.loadHome = async (req, res) => {
  try {
    const token = req.cookies.token || null;

    res.render('user/home', { token });
  } catch (error) {
    console.error(error);
  }
};
