import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MexoAuthShell } from '../../components/auth/MexoAuthShell';
import { AuthTextField } from '../../components/auth/AuthTextField';
import { MexoAddressInput } from '../../components/auth/MexoAddressInput';
import { AuthPasswordField } from '../../components/auth/AuthPasswordField';
import { PasswordStrengthIndicator } from '../../components/auth/PasswordStrengthIndicator';
import { AvatarPicker } from '../../components/auth/AvatarPicker';
import { MexoButton } from '../../components/common/MexoButton';
import { MexoAvatar } from '../../components/common/MexoAvatar';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import { Check, X, ArrowRight, Calendar } from 'lucide-react';
import confetti from 'canvas-confetti';

const MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { signUp } = useAuthStore();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8>(1);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  // DOB & Gender State
  const [dobMonth, setDobMonth] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [gender, setGender] = useState('');

  // Account details State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Username validation state
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{
    available?: boolean;
    reason?: string;
  }>({});

  useEffect(() => {
    if (!username.trim()) {
      setUsernameStatus({});
      return;
    }

    setIsCheckingUsername(true);
    const timer = setTimeout(async () => {
      const result = await api.checkUsernameAvailable(username);
      setUsernameStatus(result);
      setIsCheckingUsername(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [username]);

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (firstName.trim() && lastName.trim()) {
      setError('');
      setStep(2);
    } else {
      setError('Please enter both your first and last name.');
    }
  };

  const handleStep2Next = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!dobMonth || !dobDay || !dobYear || !gender) {
      setError('Please fill in your date of birth and select your gender.');
      return;
    }

    setStep(3);
  };

  const handleStep3Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameStatus.available) {
      setError('');
      setStep(4);
    } else {
      setError('Please choose an available MEXO address.');
    }
  };

  const handleStep4Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setStep(5);
  };

  const handleStep5Next = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStep(6);
  };

  const handleStep6Next = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStep(7);
  };

  const handleCreateAccountFinal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const formattedDob = `${dobYear}-${dobMonth}-${dobDay.padStart(2, '0')}`;
      const user = await signUp({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim().toLowerCase(),
        password: password.trim(),
        dob: formattedDob,
        gender: gender,
        avatarUrl: avatarUrl || undefined,
        recoveryEmail: recoveryEmail.trim() || undefined,
      });

      if (user) {
        confetti({ particleCount: 110, spread: 80, origin: { y: 0.6 } });
        setStep(8);
      } else {
        const storeErr = useAuthStore.getState().error;
        setError(storeErr || 'Failed to create account. Try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to create account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateProgress = () => {
    return Math.round((step / 8) * 100);
  };

  const getFormattedDobString = () => {
    const monthObj = MONTHS.find((m) => m.value === dobMonth);
    return `${monthObj?.label || ''} ${dobDay}, ${dobYear}`;
  };

  return (
    <MexoAuthShell stepProgress={calculateProgress()} leftBrandSubtitle="Create your new MEXO Mail identity.">
      {/* STEP 1: Enter Name */}
      {step === 1 && (
        <form onSubmit={handleStep1Next} className="w-full">
          <div>
            <h2 className="text-2xl md:text-[32px] font-normal text-slate-900 dark:text-slate-100 tracking-tight">
              Create your MEXO Account
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-400 mt-2 font-normal">
              Enter your name
            </p>
          </div>

          <div className="mt-7 grid grid-cols-1 md:grid-cols-2 gap-4">
            <AuthTextField
              label="First name"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                if (error) setError('');
              }}
              required
              autoFocus
            />

            <AuthTextField
              label="Last name"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                if (error) setError('');
              }}
              required
            />
          </div>

          <div className="flex items-center justify-between pt-9">
            <Link
              to="/signin"
              className="text-sm font-bold text-[#0878e8] dark:text-blue-400 hover:underline"
            >
              Sign in
            </Link>

            <MexoButton type="submit" size="lg" className="px-8 h-12 rounded-lg font-semibold text-sm">
              Next
            </MexoButton>
          </div>
        </form>
      )}

      {/* STEP 2: Date of Birth & Gender */}
      {step === 2 && (
        <form onSubmit={handleStep2Next} className="w-full">
          <div>
            <h2 className="text-2xl md:text-[32px] font-normal text-slate-900 dark:text-slate-100 tracking-tight flex items-center">
              <Calendar className="w-7 h-7 text-mexo-600 mr-2.5" />
              Basic information
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-400 mt-2 font-normal">
              Enter your birthday and gender
            </p>
          </div>

          <div className="mt-7 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Date of Birth
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <select
                    value={dobMonth}
                    onChange={(e) => setDobMonth(e.target.value)}
                    required
                    className="w-full h-12 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium focus:ring-2 focus:ring-mexo-500"
                  >
                    <option value="" disabled hidden>Month</option>
                    {MONTHS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="Day"
                    value={dobDay}
                    onChange={(e) => setDobDay(e.target.value)}
                    required
                    className="w-full h-12 px-3.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium"
                  />
                </div>

                <div>
                  <input
                    type="number"
                    min="1920"
                    max={new Date().getFullYear()}
                    placeholder="Year"
                    value={dobYear}
                    onChange={(e) => setDobYear(e.target.value)}
                    required
                    className="w-full h-12 px-3.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                required
                className="w-full h-12 px-3.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium"
              >
                <option value="" disabled hidden>Select Gender</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-9">
            <button type="button" onClick={() => setStep(1)} className="text-sm font-bold text-mexo-600">Back</button>
            <MexoButton type="submit" size="lg" className="px-8 h-12 rounded-lg font-semibold text-sm">Next</MexoButton>
          </div>
        </form>
      )}

      {/* STEP 3: Choose MEXO Address */}
      {step === 3 && (
        <form onSubmit={handleStep3Next} className="w-full">
          <div>
            <h2 className="text-2xl md:text-[32px] font-normal text-slate-900 dark:text-slate-100 tracking-tight">
              Choose your MEXO address
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-400 mt-2 font-normal">
              Enter Register No or preferred username.
            </p>
          </div>

          <div className="mt-7 space-y-3">
            <MexoAddressInput
              label="Username or Register No"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />

            {username.trim() && (
              <div className="text-xs pt-1">
                {isCheckingUsername ? (
                  <p className="text-slate-400 font-medium animate-pulse">Checking address availability...</p>
                ) : usernameStatus.available ? (
                  <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-semibold">
                    <Check className="w-4 h-4 mr-1" />
                    <span>✓ {username.toLowerCase()}@mexo.com is available</span>
                  </div>
                ) : (
                  <div className="flex items-center text-rose-600 dark:text-rose-400 font-semibold">
                    <X className="w-4 h-4 mr-1" />
                    <span>{usernameStatus.reason || 'That address is already taken.'}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-9">
            <button type="button" onClick={() => setStep(2)} className="text-sm font-bold text-mexo-600">Back</button>
            <MexoButton type="submit" disabled={!usernameStatus.available} size="lg" className="px-8 h-12 rounded-lg font-semibold text-sm">Next</MexoButton>
          </div>
        </form>
      )}

      {/* STEP 4: Password Creation */}
      {step === 4 && (
        <form onSubmit={handleStep4Next} className="w-full">
          <div>
            <h2 className="text-2xl md:text-[32px] font-normal text-slate-900 dark:text-slate-100 tracking-tight">
              Create a strong password
            </h2>
          </div>

          <div className="mt-6 space-y-4">
            <AuthPasswordField
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
            />

            <AuthPasswordField
              label="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={confirmPassword && password !== confirmPassword ? 'Passwords do not match' : undefined}
              required
            />

            <PasswordStrengthIndicator password={password} />
          </div>

          <div className="flex items-center justify-between pt-8">
            <button type="button" onClick={() => setStep(3)} className="text-sm font-bold text-mexo-600">Back</button>
            <MexoButton type="submit" disabled={password.length < 8 || password !== confirmPassword} size="lg" className="px-8 h-12 rounded-lg font-semibold text-sm">Next</MexoButton>
          </div>
        </form>
      )}

      {/* STEP 5: Avatar Selection */}
      {step === 5 && (
        <form onSubmit={handleStep5Next} className="w-full">
          <div>
            <h2 className="text-2xl md:text-[32px] font-normal text-slate-900 dark:text-slate-100 tracking-tight">
              Choose profile picture
            </h2>
          </div>

          <div className="mt-6">
            <AvatarPicker selectedAvatar={avatarUrl} name={`${firstName} ${lastName}`} onSelectAvatar={(url) => setAvatarUrl(url)} />
          </div>

          <div className="flex items-center justify-between pt-8">
            <button type="button" onClick={() => setStep(4)} className="text-sm font-bold text-mexo-600">Back</button>
            <MexoButton type="submit" size="lg" className="px-8 h-12 rounded-lg font-semibold text-sm">Next</MexoButton>
          </div>
        </form>
      )}

      {/* STEP 6: Recovery Email */}
      {step === 6 && (
        <form onSubmit={handleStep6Next} className="w-full">
          <div>
            <h2 className="text-2xl md:text-[32px] font-normal text-slate-900 dark:text-slate-100 tracking-tight">
              Add recovery email
            </h2>
          </div>

          <div className="mt-7 space-y-2">
            <AuthTextField label="Recovery email" type="email" placeholder="name@example.com" value={recoveryEmail} onChange={(e) => setRecoveryEmail(e.target.value)} />
          </div>

          <div className="flex items-center justify-between pt-9">
            <button type="button" onClick={() => setStep(5)} className="text-sm font-bold text-mexo-600">Back</button>
            <MexoButton type="submit" size="lg" className="px-8 h-12 rounded-lg font-semibold text-sm">Next</MexoButton>
          </div>
        </form>
      )}

      {/* STEP 7: Review Account */}
      {step === 7 && (
        <form onSubmit={handleCreateAccountFinal} className="w-full">
          <div>
            <h2 className="text-2xl md:text-[32px] font-normal text-slate-900 dark:text-slate-100 tracking-tight">
              Review your MEXO Account
            </h2>
          </div>

          <div className="mt-6 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center space-x-4">
              <MexoAvatar name={`${firstName} ${lastName}`} src={avatarUrl} size="lg" />
              <div>
                <p className="font-bold text-lg text-slate-900 dark:text-slate-100">{firstName} {lastName}</p>
                <p className="text-sm font-mono font-bold text-mexo-600">{username.toLowerCase()}@mexo.com</p>
              </div>
            </div>
            {error && <p className="text-xs text-rose-600 font-bold">{error}</p>}
          </div>

          <div className="flex items-center justify-between pt-8">
            <button type="button" onClick={() => setStep(6)} className="text-sm font-bold text-mexo-600">Back</button>
            <MexoButton type="submit" isLoading={isSubmitting} variant="primary" size="lg" className="px-8 h-12 rounded-lg font-semibold text-sm">Create account</MexoButton>
          </div>
        </form>
      )}

      {/* STEP 8: Celebration */}
      {step === 8 && (
        <div className="w-full text-center py-4 space-y-6">
          <div>
            <h2 className="text-2xl md:text-[32px] font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Welcome to MEXO, {firstName}!
            </h2>
            <p className="text-base font-bold text-mexo-600 dark:text-mexo-400 mt-1 font-mono">{username.toLowerCase()}@mexo.com</p>
          </div>
          <MexoButton onClick={() => navigate('/mail/inbox')} size="lg" className="w-full h-13 rounded-lg font-semibold text-base py-3" rightIcon={<ArrowRight className="w-4 h-4" />}>
            Open MEXO Mail
          </MexoButton>
        </div>
      )}
    </MexoAuthShell>
  );
};
