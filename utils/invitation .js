const sendInvitation = asyncHandler(async (req, res) => {
    const { email } = req.body;
  
    const user = await User.findOne({ email });
  
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
  
    const token = generateToken(user._id, '1h'); // Token valid for 1 hour
    const invitationLink = `${process.env.APP_URL}/invite?token=${token}`;
  
    await sendEmail(email, invitationLink);
  
    res.status(200).json({ message: 'Invitation link sent to email' });
  });
  