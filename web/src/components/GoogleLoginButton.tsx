'use client';

import { createClient } from '@/utils/supabase/client';
import Button from '@/components/ui/Button';

export default function GoogleLoginButton() {
  const handleClick = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <Button type="button" variant="secondary" onClick={handleClick} className="w-full">
      Continuar con Google
    </Button>
  );
}
