import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MexoAuthShell } from '../../components/auth/MexoAuthShell';
import { AuthTextField } from '../../components/auth/AuthTextField';
import { AuthPasswordField } from '../../components/auth/AuthPasswordField';
import { AccountChip } from '../../components/auth/AccountChip';
import { MexoButton } from '../../components/common/MexoButton';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { api } from '../../services/api';

export const SignInPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, isAuthenticated, currentUser, isLoading: authLoading } = useAuthStore();
  const { addToast } = useUIStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [usernameInput, setUsernameInput] = useState('');
  const [resolvedEmail, setResolvedEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Auto-redirect if user is already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated && currentUser) {
      if (currentUser.role === 'system_admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/mail/inbox', { replace: true });
      }
    }
  }, [isAuthenticated, currentUser, authLoading, navigate]);

  const handleStep1Next = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = usernameInput.trim();
    if (!clean) {
      setError('Enter a Register Number, username, or MEXO address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const verification = await api.verifyUserExists(clean);
      if (!verification.exists) {
        setError("Couldn't find your MEXO Account");
        return;
      }
      setResolvedEmail(verification.email);
      setStep(2);
    } catch {
      setError("Couldn't find your MEXO Account");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2SignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Enter your password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const success = await signIn(usernameInput, password);
      if (success) {
        useUIStore.getState().setMobileDrawerOpen(false);
        const activeUser = useAuthStore.getState().currentUser;
        if (activeUser) {
          addToast({ message: `Signed in as ${activeUser.firstName} (${activeUser.email})`, type: 'success' });
          if (activeUser.role === 'system_admin') {
            navigate('/admin');
          } else {
            navigate('/mail/inbox');
          }
        } else {
          navigate('/mail/inbox');
        }
      } else {
        const storeErr = useAuthStore.getState().error;
        setError(storeErr || 'Wrong password or account unavailable. Try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'Sign in failed. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MexoAuthShell leftBrandSubtitle="Your conversations, connected in one place.">
      {/* STEP 1: Address Input */}
      {step === 1 && (
        <form onSubmit={handleStep1Next} autoComplete="off" className="w-full">
          <div>
            <h2 className="text-2xl md:text-[32px] font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Sign in
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 font-medium">
              Use your MEXO Register No, Username, or Email
            </p>
          </div>

          <div className="mt-7 space-y-2">
            <AuthTextField
              name="mexo_user_identifier"
              autoComplete="off"
              label="Register No / Username / Email"
              value={usernameInput}
              error={error}
              onChange={(e) => {
                setUsernameInput(e.target.value);
                if (error) setError('');
              }}
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

          <div className="flex items-center justify-between pt-9">
            <Link
              to="/signup"
              className="text-sm font-bold text-[#0878e8] dark:text-blue-400 hover:underline"
            >
              Create account
            </Link>

            <MexoButton type="submit" isLoading={isLoading} size="lg" className="px-8 h-12 rounded-xl font-bold text-sm">
              Next
            </MexoButton>
          </div>
        </form>
      )}

      {/* STEP 2: Password Input */}
      {step === 2 && (
        <form onSubmit={handleStep2SignIn} autoComplete="off" className="w-full">
          <div>
            <h2 className="text-2xl md:text-[32px] font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Welcome
            </h2>
            
            <div className="mt-3">
              <AccountChip
                email={resolvedEmail}
                name={usernameInput}
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
              name="mexo_user_password"
              autoComplete="current-password"
              label="Enter your password"
              value={password}
              error={error}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
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
