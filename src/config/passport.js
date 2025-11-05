import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/userModel.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,  
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,  
      callbackURL: 'http://localhost:3000/auth/google/callback',  
    },
    async (token, tokenSecret, profile, done) => {
        console.log(profile)
      try {
        
        let user = await User.findOne({ googleId: profile.id });
        
        if (!user) {
        
          user = new User({
            googleId: profile.id,
            userName: profile.displayName,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            email: profile.emails[0].value,
            profilePhoto: profile.photos[0].value, 
          });

          await user.save();
        }

        return done(null, user);  
      } catch (error) {
        return done(error, null);  
        
      }
    }
  )
);


passport.serializeUser((user, done) => {
  done(null, user.id);
});


passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id); 
    done(null, user);  
  } catch (error) {
    done(error, null);  
  }
});
