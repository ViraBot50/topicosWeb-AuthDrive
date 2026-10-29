
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    (accessToken, refreshToken, profile, done) => {
      const usuario = {
        id: profile.id,
        nombre: profile.displayName,
        correo: profile.emails?.[0]?.value ?? null,
        foto: profile.photos?.[0]?.value ?? null,

        // Credenciales para utilizar Google Drive desde Express.
        googleAccessToken: accessToken,
        googleRefreshToken: refreshToken ?? null,
      };

      return done(null, usuario);
    }
  )
);

passport.serializeUser((usuario, done) => {
  done(null, usuario);
});

passport.deserializeUser((usuario, done) => {
  done(null, usuario);
});

export default passport;
