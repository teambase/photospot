import { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

export function LoginScreen({ deniedEmail }: { deniedEmail?: string }) {
  const [error, setError] = useState<string | undefined>();

  const handleSignIn = async () => {
    setError(undefined);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      setError(`${e.code ?? ''} ${e.message ?? String(err)}`.trim());
    }
  };

  return (
    <div className="centered">
      <h1>포토스팟 어드민</h1>
      {deniedEmail && (
        <p className="error">
          {deniedEmail} 계정은 관리자로 등록되어 있지 않습니다. 다른 계정으로 시도하세요.
        </p>
      )}
      {error && <p className="error">로그인 실패: {error}</p>}
      <button onClick={handleSignIn}>구글 계정으로 로그인</button>
    </div>
  );
}
