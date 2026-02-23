import { useContext } from 'react';

import { AuthContext } from 'lib/auth/auth.browser';

export const useAuth = () => useContext(AuthContext);
