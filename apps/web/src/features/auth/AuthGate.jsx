import { Command, Eye, EyeOff, KeyRound } from "lucide-react";

export function AuthGate({
  mode, error, loginBusy, passwordChangeBusy, showLoginPassword,
  showPasswordChangeFields, onLogin, onPasswordChange, onToggleLoginPassword,
  onTogglePasswordVisibility, onRetry, onEnterDemo,
}) {
  if (mode === "loading") return (
    <div className="auth-screen"><div className="auth-card auth-loading"><div className="brand-mark"><Command size={20} /></div><strong>Connecting to your store…</strong></div></div>
  );

  if (mode === "password-change-required") return (
    <div className="auth-screen">
      <form className="auth-card login-card" onSubmit={onPasswordChange}>
        <div className="login-logo" aria-hidden="true"><KeyRound size={30} /></div>
        <div className="login-intro"><p className="eyebrow login-eyebrow">ACCOUNT SECURITY</p><h1>Set a new password</h1><p className="auth-description">Your temporary password must be replaced before you can use the account.</p></div>
        {error && <div className="auth-error" role="alert">{error}</div>}
        <label>New password<input type={showPasswordChangeFields ? "text" : "password"} name="newPassword" autoComplete="new-password" minLength="8" maxLength="72" required autoFocus /></label>
        <label>Confirm new password<input type={showPasswordChangeFields ? "text" : "password"} name="confirmPassword" autoComplete="new-password" minLength="8" maxLength="72" required /></label>
        <button type="button" className="auth-demo-link" aria-pressed={showPasswordChangeFields} onClick={onTogglePasswordVisibility}>{showPasswordChangeFields ? "Hide password" : "Show password"}</button>
        <button className="primary-button auth-submit" disabled={passwordChangeBusy}>{passwordChangeBusy ? "Changing password…" : "Set new password"}</button>
      </form>
    </div>
  );

  if (mode === "auth-error") return (
    <div className="auth-screen"><div className="auth-card">
      <a className="brand auth-brand" href="#"><div className="brand-mark"><Command size={20} /></div><span>counterpoint<span className="brand-period">.</span></span></a>
      <h1>Can’t reach your store</h1><p className="auth-description">{error || "Check that the API server is running and try again."}</p>
      <button type="button" className="primary-button auth-submit" onClick={onRetry}>Try again</button>
      <button type="button" className="auth-demo-link" onClick={onEnterDemo}>Explore the local demo instead</button>
    </div></div>
  );

  if (mode === "login") return (
    <div className="auth-screen"><form className="auth-card login-card" onSubmit={onLogin}>
      <div className="login-logo" aria-hidden="true"><Command size={35} strokeWidth={2.1} /></div>
      <div className="login-intro"><p className="eyebrow login-eyebrow">WELCOME BACK</p><h1>Sign in to your POS account</h1></div>
      {error && <div className="auth-error" role="alert">{error}</div>}
      <label>Email address<input type="email" name="email" autoComplete="username" placeholder="you@yourstore.com" aria-label="Email address" required /></label>
      <label>Password<span className="auth-password-field"><input type={showLoginPassword ? "text" : "password"} name="password" autoComplete="current-password" aria-label="Password" required /><button type="button" className="password-toggle" aria-label={showLoginPassword ? "Hide password" : "Show password"} aria-pressed={showLoginPassword} onClick={onToggleLoginPassword}>{showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></span></label>
      <button className="primary-button auth-submit" disabled={loginBusy}>{loginBusy ? "Signing in…" : "Sign in"}</button>
      <div className="auth-divider"><span>or</span></div>
      <button type="button" className="auth-demo-link" onClick={onEnterDemo}>Explore the local demo</button>
    </form></div>
  );

  return null;
}
