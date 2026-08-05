import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MexoAuthShell } from '../../components/auth/MexoAuthShell';
import { AuthTextField } from '../../components/auth/AuthTextField';
import { AuthOtpInput } from '../../components/auth/AuthOtpInput';
import { AuthPasswordField } from '../../components/auth/AuthPasswordField';
import { MexoButton } from '../../components/common/MexoButton';
export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [emailInput, setEmailInput] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setError('Enter your MEXO Mail address');
      return;
    }
    setIsLoading(true);
    setError('');
    setTimeout(() => {
      setIsLoading(false);
      setStep(2);
    }, 400);
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.trim().length !== 6) {
      setError('Verification code must be 6 digits');
      return;
    }
    setIsLoading(true);
    setError('');
    setTimeout(() => {
      setIsLoading(false);
      setStep(3);
    }, 400);
  };

  const handleStep3Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate('/signin');
    }, 400);
  };

  return (
    <MexoAuthShell leftBrandSubtitle="Secure password recovery system.">
      {step === 1 && (
        <form onSubmit={handleStep1Submit} className="w-full">
          <div>
            <h2 className="text-2xl md:text-[32px] font-normal text-slate-900 dark:text-slate-100 tracking-tight">
              Forgot password?
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-400 mt-2 font-normal">
              Enter your MEXO Mail address to send a verification code to your recovery option.
            </p>
          </div>

          <div className="mt-7">
            <AuthTextField
              label="MEXO address"
              placeholder="manikandan@mexo.com"
              value={emailInput}
              error={error}
              onChange={(e) => {
                setEmailInput(e.target.value);
                if (error) setError('');
              }}
              autoFocus
              required
            />
          </div>

          <div className="flex items-center justify-between pt-9">
            <Link
              to="/signin"
              className="text-sm font-bold text-[#0878e8] dark:text-blue-400 hover:underline"
            >
              Back to Sign in
            </Link>

            <MexoButton type="submit" isLoading={isLoading} size="lg" className="px-8 h-12 rounded-lg font-semibold text-sm">
              Next
            </MexoButton>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleStep2Submit} className="w-full">
          <div>
            <h2 className="text-2xl md:text-[32px] font-normal text-slate-900 dark:text-slate-100 tracking-tight">
              Verification Code
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-400 mt-2 font-normal">
              We sent a 6-digit verification code to your recovery contact. (Demo code: <strong>123456</strong>)
            </p>
          </div>

          <div className="mt-7">
            <AuthOtpInput
              value={otpCode}
              onChange={(code) => {
                setOtpCode(code);
                if (error) setError('');
              }}
              error={error}
            />
          </div>

          <div className="flex items-center justify-between pt-9">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-sm font-bold text-[#7C3AED] dark:text-indigo-400 hover:underline"
            >
              Back
            </button>

            <MexoButton type="submit" isLoading={isLoading} size="lg" className="px-8 h-12 rounded-lg font-semibold text-sm">
              Verify
            </MexoButton>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleStep3Submit} className="w-full">
          <div>
            <h2 className="text-2xl md:text-[32px] font-normal text-slate-900 dark:text-slate-100 tracking-tight">
              Create a new password
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-400 mt-2 font-normal">
              Set a strong new password for your MEXO account.
            </p>
          </div>

          <div className="mt-7">
            <AuthPasswordField
              label="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="flex items-center justify-end pt-9">
            <MexoButton type="submit" isLoading={isLoading} size="lg" className="px-8 h-12 rounded-lg font-semibold text-sm">
              Update password & Sign in
            </MexoButton>
          </div>
        </form>
      )}
    </MexoAuthShell>
  );
};
