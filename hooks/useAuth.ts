import { useContext } from 'react';

import type { Credentials } from 'lib/auth/auth.browser';
import { AuthContext } from 'lib/auth/auth.browser';

export type { Credentials };

export const useAuth = () => useContext(AuthContext);
