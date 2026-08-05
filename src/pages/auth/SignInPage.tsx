import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MexoAuthShell } from '../../components/auth/MexoAuthShell';
import { AuthTextField } from '../../components/auth/AuthTextField';
import { AuthPasswordField } from '../../components/auth/AuthPasswordField';
import { AccountChip } from '../../components/auth/AccountChip';
import { MexoButton } from '../../components/common/MexoButton';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { db } from '../../services/db';

export const SignInPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn } = useAuthStore();
  const { setMobileDrawerOpen, addToast } = useUIStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [usernameInput, setUsernameInput] = useState('');
  const [resolvedEmail, setResolvedEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = usernameInput.trim().toLowerCase();
    if (!clean) {
      setError('Enter a MEXO address or username');
      return;
    }

    const fullEmail = clean.includes('@') ? clean : `${clean}@mexo.com`;
    const user = db.getUserByEmail(fullEmail);

    if (!user) {
      setError("Couldn't find your MEXO Account");
      return;
    }

    setResolvedEmail(user.email);
    setError('');
    setStep(2);
  };

  const targetUser = resolvedEmail ? db.getUserByEmail(resolvedEmail) : undefined;
  const targetUserName = targetUser ? `${targetUser.firstName} ${targetUser.lastName}`.trim() : undefined;

  const handleStep2SignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Enter your password');
      return;
    }

    setIsLoading(true);
    setError('');

    setTimeout(() => {
      const success = signIn(resolvedEmail, password);
      setIsLoading(false);
      if (success) {
        useUIStore.getState().setMobileDrawerOpen(false);
        const loggedUser = db.getUserByEmail(resolvedEmail);
        if (loggedUser) {
          useUIStore.getState().addToast({ message: `Signed in as ${loggedUser.firstName} (${loggedUser.email})`, type: 'success' });
        }
        navigate('/mail/inbox');
      } else {
        setError('Wrong password. Try again or click "Forgot password" to reset it.');
      }
    }, 250);
  };

  return (
    <MexoAuthShell leftBrandSubtitle="Your conversations, connected in one place.">
      {/* STEP 1: Address Input */}
      {step === 1 && (
        <form onSubmit={handleStep1Next} className="w-full">
          <div>
            <h2 className="text-2xl md:text-[32px] font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Sign in
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 font-medium">
              Use your MEXO Account
            </p>
          </div>

          <div className="mt-7 space-y-2">
            <AuthTextField
              label="MEXO address or username"
              value={usernameInput}
              error={error}
              onChange={(e) => {
                setUsernameInput(e.target.value);
                if (error) setError('');
              }}
              autoFocus
            />

            <div className="text-left pt-1">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-xs font-bold text-[#0878e8] dark:text-blue-400 hover:underline"
              >
                Forgot username?
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-6 leading-relaxed">
            Not your computer? Use a private browsing window to sign in securely.
          </p>

          {/* Bottom Actions Alignment Grid */}
          <div className="flex items-center justify-between pt-9">
            <Link
              to="/signup"
              className="text-sm font-bold text-[#0878e8] dark:text-blue-400 hover:underline"
            >
              Create account
            </Link>

            <MexoButton type="submit" size="lg" className="px-8 h-12 rounded-xl font-bold text-sm">
              Next
            </MexoButton>
          </div>
        </form>
      )}

      {/* STEP 2: Password Input */}
      {step === 2 && (
        <form onSubmit={handleStep2SignIn} className="w-full">
          <div>
            <h2 className="text-2xl md:text-[32px] font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Welcome
            </h2>
            
            <div className="mt-3">
              <AccountChip
                email={resolvedEmail}
                name={targetUserName}
                avatarUrl={targetUser?.avatarUrl}
                onClickChange={() => {
                  setStep(1);
                  setPassword('');
                  setError('');
                }}
              />
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <AuthPasswordField
              label="Enter your password"
              value={password}
              error={error}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              autoFocus
            />

            <div className="text-left pt-1">
              <Link
                to="/forgot-password"
                className="text-xs font-bold text-[#0878e8] dark:text-blue-400 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          {/* Bottom Actions Alignment Grid */}
          <div className="flex items-center justify-between pt-9">
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setError('');
              }}
              className="text-sm font-bold text-[#0878e8] dark:text-blue-400 hover:underline"
            >
              Back
            </button>

            <MexoButton type="submit" isLoading={isLoading} size="lg" className="px-8 h-12 rounded-xl font-bold text-sm">
              Sign in
            </MexoButton>
          </div>
        </form>
      )}
    </MexoAuthShell>
  );
};
